import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import PendingSignup from "../models/PendingSignup.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import { sendMail } from "../utils/mailer.js";
import { buildOtpEmail } from "../utils/emailTemplates.js";
import {
  normalizePhone,
  isValidEmail,
  isAdminEmail,
} from "../utils/phone.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // OTP validity
const PENDING_TTL_MS = 30 * 60 * 1000; // abandon signup after 30 min
const RESEND_COOLDOWN_SEC = 60;
const SALT_ROUNDS = 10;

const generateToken = (id) => signAccessToken(id);
const generateRefreshToken = (id) => signRefreshToken(id);

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const generateOtpCode = () => {
  const max = 10 ** OTP_LENGTH;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(OTP_LENGTH, "0");
};

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isVerified: user.isVerified,
  addresses: user.addresses || [],
});

const sendTokenResponse = (user, statusCode, res, message = "Login successful") => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie("refreshToken", refreshToken, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
    // Cross-site (Vercel frontend → Render API) needs SameSite=None
    sameSite: "none",
  });

  return res.status(statusCode).json({
    success: true,
    message,
    data: {
      token,
      user: publicUser(user),
    },
  });
};

const resendWaitSeconds = (lastOtpSentAt) => {
  if (!lastOtpSentAt) return 0;
  const elapsed = Math.floor(
    (Date.now() - new Date(lastOtpSentAt).getTime()) / 1000,
  );
  return Math.max(0, RESEND_COOLDOWN_SEC - elapsed);
};

const deliverOtpEmail = async ({ name, email, otp }) => {
  if (!email) {
    return {
      delivered: false,
      channel: "email",
      otp: process.env.NODE_ENV !== "production" ? otp : null,
      warning: "No email on account to send OTP",
      resendAfterSeconds: RESEND_COOLDOWN_SEC,
    };
  }

  const { subject, html } = buildOtpEmail({
    name,
    otp,
    expiresMinutes: 10,
  });

  const mailResult = await sendMail({
    to: email,
    subject,
    html,
    text: `PARIWESH verification code: ${otp}. Valid for 10 minutes.`,
    type: "otp",
    meta: { name },
  });

  if (mailResult.ok) {
    return {
      delivered: true,
      channel: "email",
      otp: null,
      resendAfterSeconds: RESEND_COOLDOWN_SEC,
    };
  }

  console.warn(
    `[OTP EMAIL FAIL] email=${email} otp=${otp} reason=${mailResult.error}`,
  );
  const timedOut = /timed out|ETIMEDOUT|timeout/i.test(
    mailResult.error || "",
  );
  const warning = timedOut
    ? "Email provider unreachable (often Render free blocking SMTP). Set RESEND_API_KEY on the server."
    : mailResult.error || "Failed to send OTP email";
  return {
    delivered: false,
    channel: "email",
    otp: process.env.NODE_ENV !== "production" ? otp : null,
    warning,
    resendAfterSeconds: RESEND_COOLDOWN_SEC,
  };
};

/** OTP for pending signup (no User row yet). */
const issueAndSendPendingOtp = async (pending) => {
  const otp = generateOtpCode();
  pending.otp = {
    hash: hashOtp(otp),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  };
  pending.lastOtpSentAt = new Date();
  pending.expiresAt = new Date(Date.now() + PENDING_TTL_MS);
  await pending.save();
  return deliverOtpEmail({ name: pending.name, email: pending.email, otp });
};

/** OTP for existing User (legacy unverified login path). */
const issueAndSendOtp = async (user) => {
  const otp = generateOtpCode();
  user.otp = {
    hash: hashOtp(otp),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  };
  await user.save();
  return deliverOtpEmail({ name: user.name, email: user.email, otp });
};

const validatePassword = (password) => {
  if (!password || String(password).length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};

// @desc    Register → stash pending signup + email OTP (User created only after verify)
// @route   POST /api/v1/users/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return sendError(res, "Please provide a valid 10-digit phone number", 400);
    }

    if (!name || !String(name).trim()) {
      return sendError(res, "Name is required", 400);
    }
    if (String(name).trim().length > 40) {
      return sendError(res, "Name must be maximum 40 characters", 400);
    }

    if (!email || !isValidEmail(email)) {
      return sendError(res, "Please provide a valid email address", 400);
    }

    const passwordError = validatePassword(password);
    if (passwordError) return sendError(res, passwordError, 400);

    const emailNorm = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const role = isAdminEmail(emailNorm) ? "admin" : "customer";

    // Block if a verified account already owns email or phone
    const existingVerified = await User.findOne({
      $or: [{ email: emailNorm }, { phone: cleanPhone }],
      isVerified: true,
    });
    if (existingVerified) {
      if (existingVerified.email === emailNorm) {
        return sendError(
          res,
          "Account already exists. Please login with email and password.",
          400,
        );
      }
      return sendError(
        res,
        "This phone number is already linked to another account.",
        400,
      );
    }

    // Drop leftover unverified User rows (old flow) for this email/phone
    await User.deleteMany({
      $or: [{ email: emailNorm }, { phone: cleanPhone }],
      isVerified: false,
    });

    // Replace any prior pending signup for this email/phone — User is created only after OTP
    await PendingSignup.deleteMany({
      $or: [{ email: emailNorm }, { phone: cleanPhone }],
    });

    const pending = new PendingSignup({
      name: name.trim(),
      email: emailNorm,
      phone: cleanPhone,
      password: hashedPassword,
      role,
      expiresAt: new Date(Date.now() + PENDING_TTL_MS),
    });

    const otpResult = await issueAndSendPendingOtp(pending);

    return sendSuccess(
      res,
      otpResult.delivered
        ? "OTP sent to your email. Verify to create your account."
        : "OTP generated. Email could not be delivered — use Dev OTP in development.",
      {
        phone: cleanPhone,
        email: emailNorm,
        otpRequired: true,
        otpChannel: "email",
        pendingSignup: true,
        resendAfterSeconds: otpResult.resendAfterSeconds ?? RESEND_COOLDOWN_SEC,
        ...(otpResult.otp ? { devOtp: otpResult.otp } : {}),
        ...(otpResult.warning ? { warning: otpResult.warning } : {}),
      },
      201,
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Login with email + password (OTP only if not yet verified — legacy)
// @route   POST /api/v1/users/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      return sendError(res, "Please provide a valid email address", 400);
    }
    if (!password) {
      return sendError(res, "Password is required", 400);
    }

    const emailNorm = email.trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm }).select("+password");
    if (!user) {
      // Incomplete signup still pending OTP — point them to finish verify / re-signup
      const pending = await PendingSignup.findOne({ email: emailNorm });
      if (pending) {
        return sendError(
          res,
          "Signup not completed. Please sign up again and verify the OTP sent to your email.",
          400,
        );
      }
      return sendError(
        res,
        "No account found with this email. Please sign up first.",
        404,
      );
    }

    if (user.status === "suspended") {
      return sendError(
        res,
        "Your account has been suspended. Please contact support.",
        403,
      );
    }

    if (!user.password) {
      return sendError(
        res,
        "This account has no password yet. Please sign up again to set one.",
        400,
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return sendError(res, "Invalid email or password", 401);
    }

    // Legacy unverified accounts must complete email OTP first
    if (!user.isVerified) {
      const otpResult = await issueAndSendOtp(user);
      return sendSuccess(
        res,
        otpResult.delivered
          ? "Account not verified yet. OTP sent to your email."
          : "Account not verified yet. OTP email failed — check server logs in development.",
        {
          phone: user.phone,
          email: user.email,
          otpRequired: true,
          otpChannel: "email",
          pendingSignup: false,
          resendAfterSeconds: otpResult.resendAfterSeconds ?? RESEND_COOLDOWN_SEC,
          ...(otpResult.otp ? { devOtp: otpResult.otp } : {}),
          ...(otpResult.warning ? { warning: otpResult.warning } : {}),
        },
      );
    }

    return sendTokenResponse(user, 200, res, "Login successful");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Verify OTP → create User (from pending) or activate legacy user → JWT
// @route   POST /api/v1/users/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  try {
    const { phone, email, otp } = req.body;

    if (!otp) {
      return sendError(res, "OTP is required", 400);
    }

    const emailNorm =
      email && isValidEmail(email) ? email.trim().toLowerCase() : null;
    const cleanPhone = phone ? normalizePhone(phone) : null;

    // 1) Pending signup path — create User only when OTP matches
    let pending = null;
    if (emailNorm) {
      pending = await PendingSignup.findOne({ email: emailNorm });
    } else if (cleanPhone) {
      pending = await PendingSignup.findOne({ phone: cleanPhone });
    }

    if (pending) {
      if (!pending.otp?.hash || !pending.otp?.expiresAt) {
        return sendError(
          res,
          "No OTP pending. Please sign up again.",
          400,
        );
      }
      if (new Date(pending.otp.expiresAt).getTime() < Date.now()) {
        pending.otp = { hash: null, expiresAt: null };
        await pending.save();
        return sendError(res, "OTP has expired. Please request a new one.", 400);
      }
      if (hashOtp(otp) !== pending.otp.hash) {
        return sendError(res, "Invalid OTP code", 400);
      }

      // Final uniqueness check before insert
      const clash = await User.findOne({
        $or: [{ email: pending.email }, { phone: pending.phone }],
      });
      if (clash) {
        await PendingSignup.deleteOne({ _id: pending._id });
        return sendError(
          res,
          "Account already exists. Please login with email and password.",
          400,
        );
      }

      const user = await User.create({
        name: pending.name,
        email: pending.email,
        phone: pending.phone,
        password: pending.password,
        role: pending.role,
        isVerified: true,
        addresses: [],
        otp: { hash: null, expiresAt: null },
      });

      await PendingSignup.deleteOne({ _id: pending._id });
      return sendTokenResponse(user, 200, res, "Account created successfully");
    }

    // 2) Legacy unverified User path
    let user = null;
    if (emailNorm) {
      user = await User.findOne({ email: emailNorm }).select("+password");
    } else if (cleanPhone) {
      user = await User.findOne({ phone: cleanPhone }).select("+password");
    }

    if (!user) {
      return sendError(
        res,
        "No pending signup found. Please sign up again.",
        404,
      );
    }

    if (user.status === "suspended") {
      return sendError(res, "Account suspended by administration", 403);
    }

    if (!user.otp?.hash || !user.otp?.expiresAt) {
      return sendError(res, "No OTP pending. Please login or sign up again.", 400);
    }

    if (new Date(user.otp.expiresAt).getTime() < Date.now()) {
      user.otp = { hash: null, expiresAt: null };
      await user.save();
      return sendError(res, "OTP has expired. Please request a new one.", 400);
    }

    if (hashOtp(otp) !== user.otp.hash) {
      return sendError(res, "Invalid OTP code", 400);
    }

    user.isVerified = true;
    user.otp = { hash: null, expiresAt: null };
    await user.save();

    return sendTokenResponse(user, 200, res, "Verification successful");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Resend OTP (pending signup or legacy user) — 60s cooldown
// @route   POST /api/v1/users/resend-otp
// @access  Public
export const resendOtp = async (req, res) => {
  try {
    const { phone, email } = req.body;

    const emailNorm =
      email && isValidEmail(email) ? email.trim().toLowerCase() : null;
    const cleanPhone = phone ? normalizePhone(phone) : null;

    let pending = null;
    if (emailNorm) {
      pending = await PendingSignup.findOne({ email: emailNorm });
    } else if (cleanPhone) {
      pending = await PendingSignup.findOne({ phone: cleanPhone });
    }

    if (pending) {
      const wait = resendWaitSeconds(pending.lastOtpSentAt);
      if (wait > 0) {
        return sendError(
          res,
          `Please wait ${wait}s before requesting another OTP.`,
          429,
          { resendAfterSeconds: wait },
        );
      }

      const otpResult = await issueAndSendPendingOtp(pending);
      return sendSuccess(
        res,
        otpResult.delivered
          ? "OTP resent to your email."
          : "OTP generated but email delivery failed.",
        {
          phone: pending.phone,
          email: pending.email,
          otpRequired: true,
          otpChannel: "email",
          pendingSignup: true,
          resendAfterSeconds:
            otpResult.resendAfterSeconds ?? RESEND_COOLDOWN_SEC,
          ...(otpResult.otp ? { devOtp: otpResult.otp } : {}),
          ...(otpResult.warning ? { warning: otpResult.warning } : {}),
        },
      );
    }

    let user = null;
    if (emailNorm) {
      user = await User.findOne({ email: emailNorm });
    } else if (cleanPhone) {
      user = await User.findOne({ phone: cleanPhone });
    }

    if (!user) {
      return sendError(res, "No pending signup found. Please sign up again.", 404);
    }

    if (user.status === "suspended") {
      return sendError(res, "Account suspended", 403);
    }

    const otpResult = await issueAndSendOtp(user);

    return sendSuccess(
      res,
      otpResult.delivered
        ? "OTP resent to your email."
        : "OTP generated but email delivery failed.",
      {
        phone: user.phone,
        email: user.email,
        otpRequired: true,
        otpChannel: "email",
        pendingSignup: false,
        resendAfterSeconds: otpResult.resendAfterSeconds ?? RESEND_COOLDOWN_SEC,
        ...(otpResult.otp ? { devOtp: otpResult.otp } : {}),
        ...(otpResult.warning ? { warning: otpResult.warning } : {}),
      },
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get current user profile details
// @route   GET /api/v1/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, "User profile not found", 404);
    }
    return sendSuccess(res, "User profile retrieved successfully", user);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Update user profile settings
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, "User profile not found", 404);
    }

    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return sendError(
          res,
          "Email address is already in use by another user",
          400,
        );
      }
      user.email = req.body.email;
    }

    user.name = req.body.name || user.name;
    if (req.body.addresses) {
      user.addresses = req.body.addresses;
    }

    if (req.body.password) {
      const passwordError = validatePassword(req.body.password);
      if (passwordError) return sendError(res, passwordError, 400);
      user.password = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    }

    const updatedUser = await user.save();

    return sendSuccess(
      res,
      "Profile settings updated successfully",
      publicUser(updatedUser),
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/v1/users
// @access  Private/Admin
export const getCustomers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return sendSuccess(res, "Users retrieved successfully", users);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Update user details (Admin)
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
export const adminUpdateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.email !== undefined) user.email = req.body.email;
    if (req.body.role !== undefined) user.role = req.body.role;
    if (req.body.status !== undefined) user.status = req.body.status;
    if (req.body.isVerified !== undefined) user.isVerified = req.body.isVerified;
    const updated = await user.save();
    return sendSuccess(res, "User updated successfully", updated);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Delete user profile (Admin)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }
    await User.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "User deleted successfully", null);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Refresh Access Token
// @route   POST /api/v1/users/refresh
// @access  Public
export const refreshAccessToken = async (req, res) => {
  try {
    const cookies = {};
    if (req.headers.cookie) {
      req.headers.cookie.split(";").forEach((cookie) => {
        const parts = cookie.split("=");
        cookies[parts[0].trim()] = parts.slice(1).join("=");
      });
    }

    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      return sendError(res, "Refresh token not found", 401);
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.id);
      if (!user) {
        return sendError(res, "User not found", 401);
      }
      if (user.status === "suspended") {
        return sendError(res, "Account suspended by administration", 403);
      }

      return sendSuccess(res, "Token refreshed successfully", {
        token: generateToken(user._id),
      });
    } catch {
      return sendError(res, "Invalid or expired refresh token", 401);
    }
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Logout User / Clear Cookie
// @route   POST /api/v1/users/logout
// @access  Public
export const logoutUser = async (req, res) => {
  try {
    res.cookie("refreshToken", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    return sendSuccess(res, "Logged out successfully", {});
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

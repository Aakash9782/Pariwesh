import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";

// Helper to generate Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "default_jwt_secret_key_12345",
    {
      expiresIn: "30d",
    },
  );
};

// @desc    Register or Login User via Phone
// @route   POST /api/v1/users/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return sendError(res, "Please provide a valid phone number", 400);
    }

    // Clean phone number (strip all non-digits)
    let cleanPhone = phone.replace(/\D/g, "");

    // Normalize Indian phone numbers: strip leading "91" if total digit count exceeds 10.
    if (cleanPhone.startsWith("91") && cleanPhone.length > 10) {
      cleanPhone = cleanPhone.substring(2);
    }
    // Also handle "+91" check if leading + was somehow parsed
    if (cleanPhone.length > 10 && cleanPhone.startsWith("+")) {
      cleanPhone = cleanPhone.replace("+", "");
      if (cleanPhone.startsWith("91") && cleanPhone.length > 10) {
        cleanPhone = cleanPhone.substring(2);
      }
    }
    // Ensure we slice it to exactly the last 10 digits as a final safety measure
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10);
    }

    // Check if user is one of the admin numbers
    const isAdminNumber =
      cleanPhone === "9782681155" ||
      cleanPhone === "9876543210" ||
      cleanPhone === "9999999999";

    let user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      if (isAdminNumber) {
        // Create Admin
        user = await User.create({
          name: "Pariwesh Admin Desk",
          email: "admin@pariwesh.com",
          phone: cleanPhone,
          role: "admin",
          addresses: [],
        });
      } else {
        // Create Customer with placeholder details
        const suffix = cleanPhone.slice(-4);
        user = await User.create({
          name: `User_${suffix}`,
          email: `user_${suffix}@pariwesh.com`,
          phone: cleanPhone,
          role: "customer",
          addresses: [],
        });
      }
    }

    const token = generateToken(user._id);

    return sendSuccess(res, "Login verification successful", {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses || [],
      },
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get current user profile details
// @route   GET /api/v1/users/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
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
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, "User profile not found", 404);
    }

    // Handle existing email validation check to prevent duplicates
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

    const updatedUser = await user.save();

    return sendSuccess(res, "Profile settings updated successfully", {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      addresses: updatedUser.addresses || [],
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get all users / custom roster list (Admin)
// @route   GET /api/v1/users
// @access  Private/Admin
export const getCustomers = async (req, res, next) => {
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
export const adminUpdateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    const updated = await user.save();
    return sendSuccess(res, "User updated successfully", updated);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Delete user profile (Admin)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
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

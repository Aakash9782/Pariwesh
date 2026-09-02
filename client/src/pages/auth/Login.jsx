import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  RiSmartphoneLine,
  RiShieldKeyholeLine,
  RiMailSendLine,
  RiLockPasswordLine,
  RiUserLine,
  RiEyeLine,
  RiEyeOffLine,
  RiArrowLeftLine,
  RiCheckLine,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/form/Input.jsx";
import { authSuccess } from "../../redux/slices/authSlice.js";
import API from "../../services/api.js";
import { trackCompleteRegistration } from "../../services/metaPixel.js";
import SEO from "../../components/common/SEO.jsx";
import { useAlert } from "../../contexts/AlertContext.jsx";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

const Login = ({ initialMode }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const alertCtx = useAlert();
  const addToast = alertCtx?.addToast;

  const queryParams = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const redirectPath = queryParams.get("redirect");

  // Mode: "login" | "signup" | "forgot"
  const [mode, setMode] = useState(() => {
    if (initialMode) return initialMode;
    const qMode = queryParams.get("mode");
    if (qMode === "signup" || qMode === "forgot") return qMode;
    return "login";
  });

  // Forgot password sub-stages: "email" | "otp" | "password"
  const [forgotStage, setForgotStage] = useState("email");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [focused, setFocused] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
      if (initialMode === "forgot") {
        setForgotStage("email");
      }
    }
  }, [initialMode]);

  const clearResendTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startResendTimer = (seconds = RESEND_COOLDOWN_SEC) => {
    clearResendTimer();
    const start = Math.max(0, Number(seconds) || RESEND_COOLDOWN_SEC);
    setResendSeconds(start);
    if (start <= 0) return;

    timerRef.current = setInterval(() => {
      setResendSeconds((prev) => {
        if (prev <= 1) {
          clearResendTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearResendTimer(), []);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 450);
  };

  const resolveRedirect = (user) => {
    if (user.role === "admin") {
      navigate("/admin");
      return;
    }
    if (redirectPath === "cart") {
      navigate("/cart?checkout=true");
      return;
    }
    if (redirectPath === "orders" || redirectPath === "profile") {
      navigate("/profile");
      return;
    }
    if (redirectPath && redirectPath.startsWith("/")) {
      navigate(redirectPath);
      return;
    }
    navigate("/profile");
  };

  const showOtpInfo = (data, fallbackMsg) => {
    if (data?.devOtp) {
      setInfo(
        `Email delivery failed (${data.warning || "SMTP error"}). Use this Dev OTP: ${data.devOtp}`,
      );
    } else if (data?.warning) {
      setInfo(`${fallbackMsg} (${data.warning})`);
    } else {
      setInfo(fallbackMsg);
    }
  };

  const resetToLogin = () => {
    setMode("login");
    setForgotStage("email");
    setError("");
    setInfo("");
    setOtpSent(false);
    setOtpCode("");
    clearResendTimer();
    setResendSeconds(0);
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // --- Login / Signup Submission ---
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (!email.trim() || !emailRegex.test(email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!phoneNumber || phoneNumber.length !== 10) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
    } else {
      if (!email.trim() || !emailRegex.test(email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === "signup" ? "/users/register" : "/users/login";
      const payload =
        mode === "signup"
          ? {
              name: name.trim(),
              email: email.trim().toLowerCase(),
              phone: phoneNumber,
              password,
            }
          : {
              email: email.trim().toLowerCase(),
              password,
            };

      const res = await API.post(endpoint, payload);
      if (!res.data?.success) {
        setError(res.data?.message || "Request failed");
        return;
      }

      const data = res.data.data || {};

      if (data.token && data.user) {
        dispatch(authSuccess({ user: data.user, token: data.token }));
        resolveRedirect(data.user);
        return;
      }

      if (data.phone) {
        setPhoneNumber(data.phone);
      }
      setOtpSent(true);
      setOtpCode("");
      showOtpInfo(data, res.data.message || "OTP sent to your email.");
      startResendTimer(data.resendAfterSeconds ?? RESEND_COOLDOWN_SEC);
    } catch (err) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message;
      if (apiMsg) {
        setError(apiMsg);
      } else if (err.code === "ECONNABORTED") {
        setError(
          "Server took too long (often cold start or email). Please try again.",
        );
      } else if (!err.response) {
        setError(
          "Could not reach API. Check connection or try again in a minute.",
        );
      } else {
        setError(
          `Request failed${status ? ` (${status})` : ""}. Please try again.`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Registration / Login OTP Verify ---
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otpCode.length !== OTP_LENGTH) {
      setError(`OTP must be exactly ${OTP_LENGTH} digits.`);
      triggerShake();
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/users/verify-otp", {
        email: email.trim().toLowerCase(),
        phone: phoneNumber || undefined,
        otp: otpCode,
      });
      if (res.data?.success) {
        const { token, user } = res.data.data;
        clearResendTimer();
        if (mode === "signup") {
          trackCompleteRegistration(user);
        }
        dispatch(authSuccess({ user, token }));
        resolveRedirect(user);
      } else {
        setError(res.data?.message || "Verification failed");
        triggerShake();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // --- Resend OTP for Registration / Login ---
  const handleResendOtp = async () => {
    if (resendSeconds > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/users/resend-otp", {
        email: email.trim().toLowerCase(),
        phone: phoneNumber || undefined,
      });
      if (res.data?.success) {
        const data = res.data.data || {};
        showOtpInfo(data, res.data.message || "OTP resent to your email.");
        setOtpCode("");
        startResendTimer(data.resendAfterSeconds ?? RESEND_COOLDOWN_SEC);
      }
    } catch (err) {
      const wait = err.response?.data?.data?.resendAfterSeconds;
      if (err.response?.status === 429 && wait) {
        startResendTimer(wait);
        setError(err.response?.data?.message || `Wait ${wait}s to resend.`);
      } else {
        setError(err.response?.data?.message || "Could not resend OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password Flow Handlers ---
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/users/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      if (res.data?.success) {
        setForgotStage("otp");
        setOtpCode("");
        showOtpInfo(
          res.data.data,
          res.data.message || "Password reset code sent to your email.",
        );
        startResendTimer(
          res.data.data?.resendAfterSeconds ?? RESEND_COOLDOWN_SEC,
        );
      } else {
        setError(res.data?.message || "Failed to send reset code.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not send reset code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length !== OTP_LENGTH) {
      setError(`OTP must be exactly ${OTP_LENGTH} digits.`);
      triggerShake();
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/users/verify-reset-otp", {
        email: email.trim().toLowerCase(),
        otp: otpCode,
      });
      if (res.data?.success) {
        setResetToken(res.data.data.resetToken);
        setForgotStage("password");
        clearResendTimer();
        setResendSeconds(0);
        setOtpCode("");
        setInfo("Code verified! Now create your new password.");
      } else {
        setError(res.data?.message || "Verification failed");
        triggerShake();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid or expired verification code.",
      );
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (resendSeconds > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/users/resend-reset-otp", {
        email: email.trim().toLowerCase(),
      });
      if (res.data?.success) {
        const data = res.data.data || {};
        showOtpInfo(
          data,
          res.data.message || "Reset code resent to your email.",
        );
        setOtpCode("");
        startResendTimer(data.resendAfterSeconds ?? RESEND_COOLDOWN_SEC);
      }
    } catch (err) {
      const wait = err.response?.data?.data?.resendAfterSeconds;
      if (err.response?.status === 429 && wait) {
        startResendTimer(wait);
        setError(err.response?.data?.message || `Wait ${wait}s to resend.`);
      } else {
        setError(err.response?.data?.message || "Could not resend code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/users/reset-password", {
        email: email.trim().toLowerCase(),
        resetToken,
        newPassword,
      });
      if (res.data?.success) {
        const { token, user } = res.data.data;
        if (addToast) {
          addToast("Password reset successfully! Welcome back.", "success");
        }
        if (token && user) {
          dispatch(authSuccess({ user, token }));
          resolveRedirect(user);
        } else {
          resetToLogin();
          setInfo(
            "Password updated successfully. Please login with your new password.",
          );
        }
      } else {
        setError(res.data?.message || "Failed to update password.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update password. Your reset session may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // Compute Page Titles
  const getPageTitle = () => {
    if (mode === "forgot") {
      if (forgotStage === "otp") return "Verify Reset Code";
      if (forgotStage === "password") return "Set New Password";
      return "Reset Password";
    }
    if (otpSent) return "Verify OTP";
    if (mode === "signup") return "Create account";
    return "Member login";
  };

  const getPageSubtitle = () => {
    if (mode === "forgot") {
      if (forgotStage === "otp") {
        return `Enter the ${OTP_LENGTH}-digit code sent to ${email || "your email"}`;
      }
      if (forgotStage === "password") {
        return "Create a new strong password for your PARIWESH account.";
      }
      return "Enter your registered email address and we will send a 6-digit OTP to reset your password.";
    }
    if (otpSent) {
      return `Enter the ${OTP_LENGTH}-digit code sent to ${email || "your email"}`;
    }
    if (mode === "signup") {
      return "Sign up with name, email, phone & password. Account is created only after OTP verification.";
    }
    return "Login with your unique email and password.";
  };

  return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-4 py-16 overflow-hidden">
      <SEO
        title={
          mode === "forgot"
            ? "Reset Password"
            : otpSent
              ? "Verify OTP"
              : mode === "signup"
                ? "Member Registration"
                : "Member Login"
        }
        noindex={true}
      />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent-gold/10 dark:bg-accent-gold/5 rounded-full blur-3xl pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-gold/5 dark:bg-primary/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 translate-y-1/2"></div>

      <div className="relative w-full max-w-md bg-primary border border-borderLight p-8 md:p-10 rounded-sm shadow-xl premium-card-shadow space-y-7 z-10 transition-all duration-300 hover:border-accent-gold/40">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-accent-gold"></div>

        {/* Top bar for Forgot mode */}
        {mode === "forgot" && (
          <div className="flex items-center justify-between pb-1 border-b border-borderLight/60">
            <button
              type="button"
              onClick={resetToLogin}
              className="inline-flex items-center gap-1.5 text-xs text-textSecondary hover:text-accent-gold transition-colors font-medium cursor-pointer"
            >
              <RiArrowLeftLine size={15} />
              <span>Back to Login</span>
            </button>
            <span className="text-[10px] uppercase tracking-widest text-accent-gold font-bold">
              Account Recovery
            </span>
          </div>
        )}

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-textPrimary">
            {getPageTitle()}
          </h2>
          <p className="text-xs text-textSecondary leading-relaxed">
            {getPageSubtitle()}
          </p>
        </div>

        {/* Tab switch only for normal login / signup */}
        {mode !== "forgot" && !otpSent && (
          <div className="flex border border-borderLight rounded-sm overflow-hidden text-xs font-semibold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setInfo("");
              }}
              className={`flex-1 py-2.5 transition-colors ${
                mode === "login"
                  ? "bg-accent-gold text-white"
                  : "bg-transparent text-textSecondary hover:text-textPrimary"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
                setInfo("");
              }}
              className={`flex-1 py-2.5 transition-colors ${
                mode === "signup"
                  ? "bg-accent-gold text-white"
                  : "bg-transparent text-textSecondary hover:text-textPrimary"
              }`}
            >
              Sign up
            </button>
          </div>
        )}

        {error && (
          <div className="bg-danger/10 text-danger border border-danger/25 p-3 text-xs text-center font-medium rounded-sm">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="bg-accent-gold/10 text-textPrimary border border-accent-gold/30 p-3 text-xs text-center font-medium rounded-sm">
            {info}
          </div>
        )}

        {/* ============================================================ */}
        {/* CASE 1: FORGOT PASSWORD - STAGE 1 (EMAIL ENTRY)              */}
        {/* ============================================================ */}
        {mode === "forgot" && forgotStage === "email" && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
            <div className="relative space-y-1">
              <Input
                label="Registered Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                helperText="We'll send a 6-digit verification code to this email."
                autoFocus
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full space-x-2"
              loading={loading}
            >
              <RiMailSendLine size={16} />
              <span>Send Verification Code</span>
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={resetToLogin}
                className="text-xs text-textSecondary hover:text-accent-gold transition-colors font-medium"
              >
                Remember your password?{" "}
                <span className="text-accent-gold underline font-semibold">
                  Login
                </span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* CASE 2: FORGOT PASSWORD - STAGE 2 (OTP VERIFY)               */}
        {/* ============================================================ */}
        {mode === "forgot" && forgotStage === "otp" && (
          <form onSubmit={handleVerifyResetOtp} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider text-center">
                Enter 6-Digit Reset Code
              </label>

              <div className="relative flex justify-center py-2">
                <div
                  className={`flex justify-center gap-2 sm:gap-3 h-14 items-center relative w-full ${
                    shaking ? "animate-otp-shake" : ""
                  }`}
                >
                  {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                    const digit = otpCode[i] || "";
                    const isBoxActive = focused && otpCode.length === i;
                    const isBoxFilledOrPassed = i < otpCode.length;

                    let borderClass = "border-borderLight";
                    let shadowClass = "shadow-none";
                    let textClass = "text-textPrimary";

                    if (error) {
                      borderClass = "border-danger";
                      shadowClass =
                        "shadow-[0_0_0_1px_rgba(211,47,47,0.3),_0_0_15px_rgba(211,47,47,0.25)]";
                      textClass = "text-danger";
                    } else if (isBoxActive) {
                      borderClass = "border-accent-gold";
                      shadowClass =
                        "shadow-[0_0_0_1px_var(--accent-gold),_0_0_15px_rgba(197,168,128,0.35)]";
                    } else if (isBoxFilledOrPassed) {
                      borderClass = "border-accent-gold/60";
                    }

                    return (
                      <div
                        key={i}
                        className={`w-10 h-12 sm:w-11 sm:h-13 rounded-[10px] border-[1.5px] bg-primary flex items-center justify-center text-lg font-bold font-mono transition-all duration-300 relative ${borderClass} ${shadowClass} ${textClass}`}
                      >
                        <span>{digit}</span>
                        {isBoxActive && (
                          <div className="absolute w-[2px] h-[18px] bg-accent-gold animate-cursor-blink" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <input
                  type="text"
                  pattern="\d*"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, OTP_LENGTH);
                    setOtpCode(val);
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20 text-base"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full space-x-2"
              loading={loading}
            >
              <RiShieldKeyholeLine size={16} />
              <span>Verify Code & Continue</span>
            </Button>

            <div className="flex flex-col items-center gap-2 pt-1">
              {resendSeconds > 0 ? (
                <p className="text-xs text-textSecondary font-mono tracking-wider">
                  Resend code in{" "}
                  <span className="text-accent-gold font-bold">
                    {formatTimer(resendSeconds)}
                  </span>
                </p>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendForgotOtp}
                  loading={loading}
                  className="block w-full text-center text-xs font-semibold text-accent-gold hover:underline !bg-transparent border-none shadow-none uppercase text-[10px]"
                >
                  Resend Code
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setForgotStage("email");
                  setError("");
                  setInfo("");
                  setOtpCode("");
                }}
                className="block w-full text-center text-xs font-semibold text-textSecondary hover:underline !bg-transparent border-none shadow-none uppercase text-[10px]"
              >
                Change Email Address
              </Button>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* CASE 3: FORGOT PASSWORD - STAGE 3 (SET NEW PASSWORD)         */}
        {/* ============================================================ */}
        {mode === "forgot" && forgotStage === "password" && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
            <div className="relative">
              <Input
                label="New Password"
                type={showNewPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                helperText="Must be at least 6 characters long."
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute top-9 right-3.5 text-gray-400 hover:text-accent-gold transition-colors focus:outline-none cursor-pointer"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <RiEyeOffLine size={18} />
                ) : (
                  <RiEyeLine size={18} />
                )}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-9 right-3.5 text-gray-400 hover:text-accent-gold transition-colors focus:outline-none cursor-pointer"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <RiEyeOffLine size={18} />
                ) : (
                  <RiEyeLine size={18} />
                )}
              </button>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full space-x-2"
              loading={loading}
            >
              <RiCheckLine size={16} />
              <span>Update Password & Sign In</span>
            </Button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={resetToLogin}
                className="text-xs text-textSecondary hover:text-accent-gold transition-colors font-medium cursor-pointer"
              >
                Cancel and return to{" "}
                <span className="text-accent-gold underline font-semibold">
                  Login
                </span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* CASE 4: REGULAR LOGIN / SIGNUP (CREDENTIALS FORM)            */}
        {/* ============================================================ */}
        {mode !== "forgot" && !otpSent && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            {mode === "signup" && (
              <div className="relative space-y-1">
                <Input
                  label="Full Name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={40}
                />
                <span className="absolute top-9 right-3.5 text-gray-400">
                  <RiUserLine size={18} />
                </span>
              </div>
            )}

            <div className="relative space-y-1">
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                helperText={
                  mode === "login"
                    ? "Use the email you registered with (unique per account)."
                    : "Each account must use a unique email."
                }
              />
            </div>

            {mode === "signup" && (
              <div className="relative">
                <Input
                  label="Mobile Number"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => {
                    let cleaned = e.target.value.replace(/\D/g, "");
                    if (cleaned.startsWith("91") && cleaned.length > 10) {
                      cleaned = cleaned.substring(2);
                    }
                    setPhoneNumber(cleaned.slice(0, 10));
                  }}
                  placeholder="Enter 10-digit number"
                  helperText="Used for delivery. OTP goes to your email (no SMS cost)."
                />
                <span className="absolute top-9 right-3.5 text-gray-400">
                  <RiSmartphoneLine size={18} />
                </span>
              </div>
            )}

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-9 right-3.5 text-gray-400 hover:text-accent-gold transition-colors focus:outline-none cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <RiEyeOffLine size={18} />
                ) : (
                  <RiEyeLine size={18} />
                )}
              </button>
            </div>

            {/* Forgot Password Link in Login Mode */}
            {mode === "login" && (
              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setForgotStage("email");
                    setError("");
                    setInfo("");
                    clearResendTimer();
                  }}
                  className="text-xs text-textSecondary hover:text-accent-gold transition-colors font-medium tracking-wide cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full space-x-2"
              loading={loading}
            >
              {mode === "signup" ? (
                <>
                  <RiMailSendLine size={15} />
                  <span>Sign up & Send OTP</span>
                </>
              ) : (
                <>
                  <RiLockPasswordLine size={15} />
                  <span>Login</span>
                </>
              )}
            </Button>
          </form>
        )}

        {/* ============================================================ */}
        {/* CASE 5: REGULAR REGISTRATION / LOGIN OTP VERIFY              */}
        {/* ============================================================ */}
        {mode !== "forgot" && otpSent && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider text-center">
                Enter Verification OTP
              </label>

              <div className="relative flex justify-center py-4">
                <div
                  className={`flex justify-center gap-2 sm:gap-3 h-14 items-center relative w-full ${
                    shaking ? "animate-otp-shake" : ""
                  }`}
                >
                  {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                    const digit = otpCode[i] || "";
                    const isBoxActive = focused && otpCode.length === i;
                    const isBoxFilledOrPassed = i < otpCode.length;

                    let borderClass = "border-borderLight";
                    let shadowClass = "shadow-none";
                    let textClass = "text-textPrimary";

                    if (error) {
                      borderClass = "border-danger";
                      shadowClass =
                        "shadow-[0_0_0_1px_rgba(211,47,47,0.3),_0_0_15px_rgba(211,47,47,0.25)]";
                      textClass = "text-danger";
                    } else if (isBoxActive) {
                      borderClass = "border-accent-gold";
                      shadowClass =
                        "shadow-[0_0_0_1px_var(--accent-gold),_0_0_15px_rgba(197,168,128,0.35)]";
                    } else if (isBoxFilledOrPassed) {
                      borderClass = "border-accent-gold/60";
                    }

                    return (
                      <div
                        key={i}
                        className={`w-10 h-12 sm:w-11 sm:h-13 rounded-[10px] border-[1.5px] bg-primary flex items-center justify-center text-lg font-bold font-mono transition-all duration-300 relative ${borderClass} ${shadowClass} ${textClass}`}
                      >
                        <span>{digit}</span>
                        {isBoxActive && (
                          <div className="absolute w-[2px] h-[18px] bg-accent-gold animate-cursor-blink" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <input
                  type="text"
                  pattern="\d*"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, OTP_LENGTH);
                    setOtpCode(val);
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20 text-base"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full space-x-2"
              loading={loading}
            >
              <RiShieldKeyholeLine size={15} />
              <span>Verify & Continue</span>
            </Button>

            <div className="flex flex-col items-center gap-2">
              {resendSeconds > 0 ? (
                <p className="text-xs text-textSecondary font-mono tracking-wider">
                  Resend OTP in{" "}
                  <span className="text-accent-gold font-bold">
                    {formatTimer(resendSeconds)}
                  </span>
                </p>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  loading={loading}
                  className="block w-full text-center text-xs font-semibold text-accent-gold hover:underline !bg-transparent border-none shadow-none uppercase text-[10px]"
                >
                  Resend OTP
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearResendTimer();
                  setResendSeconds(0);
                  setOtpSent(false);
                  setError("");
                  setInfo("");
                  setOtpCode("");
                }}
                className="block w-full text-center text-xs font-semibold text-textSecondary hover:underline !bg-transparent border-none shadow-none uppercase text-[10px]"
              >
                Back to {mode === "signup" ? "Sign up" : "Login"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-cursor-blink {
          animation: cursorBlink 0.9s step-end infinite;
        }
        @keyframes otpShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-otp-shake {
          animation: otpShake 0.45s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;

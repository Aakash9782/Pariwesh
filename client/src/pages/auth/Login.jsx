import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  RiSmartphoneLine,
  RiShieldKeyholeLine,
  RiMailSendLine,
  RiLockPasswordLine,
  RiUserLine,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/form/Input.jsx";
import { authSuccess } from "../../redux/slices/authSlice.js";
import API from "../../services/api.js";
import SEO from "../../components/common/SEO.jsx";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const redirectPath = queryParams.get("redirect");

  const [mode, setMode] = useState("login"); // login | signup
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [focused, setFocused] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const timerRef = useRef(null);

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

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-4 py-16 overflow-hidden">
      <SEO
        title={
          otpSent
            ? "Verify OTP"
            : mode === "signup"
              ? "Member Registration"
              : "Member Login"
        }
        noindex={true}
      />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent-gold/10 dark:bg-accent-gold/5 rounded-full blur-3xl pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-gold/5 dark:bg-primary/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 translate-y-1/2"></div>

      <div className="relative w-full max-w-md bg-primary border border-borderLight p-8 md:p-10 rounded-sm shadow-xl premium-card-shadow space-y-8 z-10 transition-all duration-300 hover:border-accent-gold/40">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-accent-gold"></div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-textPrimary">
            {otpSent
              ? "Verify OTP"
              : mode === "signup"
                ? "Create account"
                : "Member login"}
          </h2>
          <p className="text-xs text-textSecondary">
            {otpSent
              ? `Enter the ${OTP_LENGTH}-digit code sent to ${email || "your email"}`
              : mode === "signup"
                ? "Sign up with name, email, phone & password. Account is created only after OTP verification."
                : "Login with your unique email and password."}
          </p>
        </div>

        {!otpSent && (
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

        {!otpSent ? (
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
              />
              <span className="absolute top-9 right-3.5 text-gray-400">
                <RiLockPasswordLine size={18} />
              </span>
            </div>

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
        ) : (
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

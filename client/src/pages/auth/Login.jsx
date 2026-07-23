import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  RiSmartphoneLine,
  RiShieldKeyholeLine,
  RiMailSendLine,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/form/Input.jsx";
import { authSuccess } from "../../redux/slices/authSlice.js";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Auth state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setLoading(true);

    // Simulate API call for sending SMS OTP
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
    }, 800);
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (otpCode.length !== 4) {
      setError("OTP must be exactly 4 digits.");
      return;
    }
    setError("");
    setLoading(true);

    // Simulate OTP validation
    setTimeout(() => {
      setLoading(false);

      const mockUser = {
        _id: "usr_abc123",
        name: "Priyanjali Sen",
        email: "priyanjali.sen@priwesh.com",
        phone: phoneNumber,
        role: "customer",
      };
      const mockToken = "mock_jwt_access_token_jwt_signature";

      // Update credentials inside redux
      dispatch(authSuccess({ user: mockUser, token: mockToken }));

      // Navigate to profile page
      navigate("/profile");
    }, 800);
  };

  return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* Background radial spotlight blurs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent-gold/10 dark:bg-accent-gold/5 rounded-full blur-3xl pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-gold/5 dark:bg-primary/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 translate-y-1/2"></div>

      <div className="relative w-full max-w-md bg-primary border border-borderLight p-8 md:p-10 rounded-sm shadow-xl premium-card-shadow space-y-8 z-10 transition-all duration-300 hover:border-accent-gold/40">
        {/* Decorative top stripe */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-accent-gold"></div>

        {/* Title area */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-textPrimary">
            Member login
          </h2>
          <p className="text-xs text-textSecondary">
            Sign in with phone verification to track orders and save wishlists.
          </p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger border border-danger/25 p-3 text-xs text-center font-medium rounded-sm">
            {error}
          </div>
        )}

        {!otpSent ? (
          /* STEP 1: Enter phone number */
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="relative">
              <Input
                label="Mobile Contact Number"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="Enter 10-digit number"
                className="pl-2"
                helperText="We will send a non-expiry mock verification OTP to this number."
              />
              <span className="absolute top-10 right-3.5 text-gray-400">
                <RiSmartphoneLine size={18} />
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full space-x-2"
              loading={loading}
            >
              <RiMailSendLine size={15} />
              <span>Send SMS OTP</span>
            </Button>
          </form>
        ) : (
          /* STEP 2: Input OTP code */
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="relative">
              <Input
                label="Enter Verification OTP"
                type="text"
                required
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="4-digit code (e.g. 1234)"
                helperText={`Verification code has been dispatched to +91 ${phoneNumber}`}
              />
              <span className="absolute top-10 right-3.5 text-gray-400">
                <RiShieldKeyholeLine size={18} />
              </span>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
              loading={loading}
            >
              Verify & Connect
            </Button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="block w-full text-center text-xs font-semibold text-accent-gold hover:underline pt-2"
            >
              Modify Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;

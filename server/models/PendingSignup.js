import mongoose from "mongoose";

/**
 * Temporary signup stash — User document is created only after OTP matches.
 * Auto-expires via TTL so abandoned signups do not linger.
 */
const pendingSignupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    otp: {
      hash: { type: String, default: null },
      expiresAt: { type: Date, default: null },
    },
    lastOtpSentAt: { type: Date, default: null },
    /** Mongo TTL — document removed after this time */
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

const PendingSignup = mongoose.model("PendingSignup", pendingSignupSchema);
export default PendingSignup;

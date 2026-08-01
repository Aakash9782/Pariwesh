import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  type: { type: String, default: "Home" },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    // Required for new signups; optional for legacy accounts until they re-register
    password: { type: String, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    isVerified: { type: Boolean, default: false },
    otp: {
      hash: { type: String, default: null },
      expiresAt: { type: Date, default: null },
    },
    addresses: [addressSchema],
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;

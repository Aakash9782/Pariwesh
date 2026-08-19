import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

console.log("Direct simple script started!");
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log(
  "RAZORPAY_KEY_SECRET:",
  process.env.RAZORPAY_KEY_SECRET
    ? "Exists (starts with " +
        process.env.RAZORPAY_KEY_SECRET.substring(0, 4) +
        ")"
    : "Missing",
);

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const razorpayOrderId = "order_123";
const razorpayPaymentId = "pay_456";
const body = `${razorpayOrderId}|${razorpayPaymentId}`;

const razorpaySignature = crypto
  .createHmac("sha256", KEY_SECRET)
  .update(body)
  .digest("hex");

console.log("Generated signature:", razorpaySignature);

const expected = crypto
  .createHmac("sha256", KEY_SECRET)
  .update(body)
  .digest("hex");

console.log("Verification match:", expected === razorpaySignature);
console.log("TEST_PASSED");

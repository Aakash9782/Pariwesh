import dotenv from "dotenv";
dotenv.config();

import {
  isRazorpayConfigured,
  verifyRazorpaySignature,
} from "./utils/razorpay.js";
import assert from "assert";
import crypto from "crypto";

console.log("Starting Razorpay check...");
console.log("Key ID in env:", process.env.RAZORPAY_KEY_ID);

try {
  const configured = isRazorpayConfigured();
  assert.strictEqual(configured, true, "Razorpay should be configured");
  console.log("✔ isRazorpayConfigured passes successfully!");

  // Test signature verification
  const razorpayOrderId = "order_123";
  const razorpayPaymentId = "pay_456";
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;

  const razorpaySignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const isValid = verifyRazorpaySignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  assert.strictEqual(isValid, true, "Signature verification should pass");
  console.log("✔ verifyRazorpaySignature passes successfully!");

  console.log("All Razorpay configuration tests passed!");
  process.exit(0);
} catch (err) {
  console.error("❌ Test failed:", err.message);
  process.exit(1);
}

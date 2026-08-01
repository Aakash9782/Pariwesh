import Razorpay from "razorpay";
import crypto from "crypto";

export const isRazorpayConfigured = () => {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!keyId || !keySecret) return false;
  if (keyId.startsWith("dummy") || keySecret.startsWith("dummy")) return false;
  // Secret must NOT be another Key ID (common mistake)
  if (keySecret.startsWith("rzp_test_") || keySecret.startsWith("rzp_live_")) {
    console.warn(
      "[Razorpay] RAZORPAY_KEY_SECRET looks like a Key ID. Paste the Key Secret (long random string) from Dashboard → API Keys.",
    );
    return false;
  }
  return true;
};

export const getRazorpayClient = () => {
  if (!isRazorpayConfigured()) {
    const err = new Error(
      "Razorpay is not configured. Set real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env (Dashboard → API Keys).",
    );
    err.code = "RAZORPAY_NOT_CONFIGURED";
    throw err;
  }
  const key_id = process.env.RAZORPAY_KEY_ID.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET.trim();
  return new Razorpay({ key_id, key_secret });
};

export const createRazorpayOrder = async ({ amountInr, receipt, notes }) => {
  const client = getRazorpayClient();
  const amountPaise = Math.round(Number(amountInr) * 100);
  if (!amountPaise || amountPaise < 100) {
    throw new Error("Order amount must be at least ₹1");
  }
  try {
    return await client.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: String(receipt).slice(0, 40),
      notes: notes || {},
    });
  } catch (err) {
    // Normalize Razorpay SDK error shape for controllers
    const description =
      err?.error?.description ||
      err?.description ||
      err?.message ||
      "Razorpay request failed";
    const wrapped = new Error(description);
    wrapped.statusCode = err?.statusCode;
    wrapped.error = err?.error || { description };
    throw wrapped;
  }
};

export const verifyRazorpaySignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expected === razorpaySignature;
};

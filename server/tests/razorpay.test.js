import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  verifyRazorpaySignature,
  isRazorpayConfigured,
} from "../utils/razorpay.js";

describe("razorpay utils", () => {
  before(() => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_ci_key";
    process.env.RAZORPAY_KEY_SECRET = "ci_razorpay_secret_value";
  });

  it("detects configured keys", () => {
    assert.equal(isRazorpayConfigured(), true);
  });

  it("rejects Key ID used as secret", () => {
    const prev = process.env.RAZORPAY_KEY_SECRET;
    process.env.RAZORPAY_KEY_SECRET = "rzp_test_oops";
    assert.equal(isRazorpayConfigured(), false);
    process.env.RAZORPAY_KEY_SECRET = prev;
  });

  it("verifies a valid payment signature", () => {
    const razorpayOrderId = "order_abc";
    const razorpayPaymentId = "pay_xyz";
    const razorpaySignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    assert.equal(
      verifyRazorpaySignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      }),
      true,
    );
  });

  it("rejects invalid signature", () => {
    assert.equal(
      verifyRazorpaySignature({
        razorpayOrderId: "order_abc",
        razorpayPaymentId: "pay_xyz",
        razorpaySignature: "deadbeef",
      }),
      false,
    );
  });
});

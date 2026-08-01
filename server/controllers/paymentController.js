import Order from "../models/Order.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import {
  isRazorpayConfigured,
  createRazorpayOrder,
  verifyRazorpaySignature,
} from "../utils/razorpay.js";
import {
  emailPaymentSuccess,
  emailPaymentFailed,
} from "../utils/orderEmails.js";

const assertOrderOwner = (order, user) => {
  if (user.role === "admin") return true;
  return order.customer?.userId === user._id.toString();
};

// @desc    Create / refresh Razorpay order for a Pending ONLINE order
// @route   POST /api/v1/payments/razorpay/create
// @access  Private
export const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return sendError(res, "orderId is required", 400);
    }

    if (!isRazorpayConfigured()) {
      return sendError(
        res,
        "Razorpay keys missing or still set to dummy. Add test/live keys in server/.env",
        503,
      );
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return sendError(res, "Order not found", 404);
    }
    if (!assertOrderOwner(order, req.user)) {
      return sendError(res, "Not authorized for this order", 403);
    }
    if (order.paymentMethod !== "ONLINE") {
      return sendError(res, "This order is not an ONLINE payment order", 400);
    }
    if (order.paymentStatus === "Paid") {
      return sendError(res, "Order is already paid", 400);
    }

    const rpOrder = await createRazorpayOrder({
      amountInr: order.pricing.grandTotal,
      receipt: order.orderId,
      notes: {
        orderId: order.orderId,
        mongoId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    order.razorpayOrderId = rpOrder.id;
    order.paymentStatus = "Pending";
    await order.save();

    return sendSuccess(res, "Razorpay order created", {
      key: process.env.RAZORPAY_KEY_ID,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      razorpayOrderId: rpOrder.id,
      orderId: order.orderId,
      name: "PARIWESH",
      description: `Order ${order.orderId}`,
      prefill: {
        name: order.customer?.name || req.user.name || "",
        email: order.customer?.email || req.user.email || "",
        contact: order.customer?.phone || req.user.phone || "",
      },
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Verify Razorpay payment signature and mark order Paid
// @route   POST /api/v1/payments/razorpay/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return sendError(res, "Missing payment verification fields", 400);
    }

    if (!isRazorpayConfigured()) {
      return sendError(res, "Razorpay is not configured", 503);
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return sendError(res, "Order not found", 404);
    }
    if (!assertOrderOwner(order, req.user)) {
      return sendError(res, "Not authorized for this order", 403);
    }

    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
      return sendError(res, "Razorpay order mismatch", 400);
    }

    const valid = verifyRazorpaySignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!valid) {
      order.paymentStatus = "Failed";
      await order.save();
      emailPaymentFailed(
        order.toObject(),
        "Payment signature verification failed",
      ).catch((err) => console.error("[Mail] payment failed email:", err));
      return sendError(res, "Invalid payment signature", 400);
    }

    order.paymentStatus = "Paid";
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    emailPaymentSuccess(order.toObject()).catch((err) =>
      console.error("[Mail] payment success email:", err),
    );

    return sendSuccess(res, "Payment verified successfully", {
      orderId: order.orderId,
      paymentStatus: order.paymentStatus,
      razorpayPaymentId: order.razorpayPaymentId,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Mark ONLINE payment as failed/cancelled (user closed Razorpay)
// @route   POST /api/v1/payments/razorpay/failed
// @access  Private
export const markPaymentFailed = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    if (!orderId) {
      return sendError(res, "orderId is required", 400);
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return sendError(res, "Order not found", 404);
    }
    if (!assertOrderOwner(order, req.user)) {
      return sendError(res, "Not authorized for this order", 403);
    }
    if (order.paymentStatus === "Paid") {
      return sendError(res, "Order is already paid", 400);
    }

    order.paymentStatus = "Failed";
    await order.save();

    emailPaymentFailed(
      order.toObject(),
      reason || "Payment cancelled or failed at checkout",
    ).catch((err) => console.error("[Mail] payment failed email:", err));

    return sendSuccess(res, "Payment marked as failed", {
      orderId: order.orderId,
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

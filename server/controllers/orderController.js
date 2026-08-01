import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import Product from "../models/Product.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import { logActivity } from "../utils/logger.js";
import {
  isRazorpayConfigured,
  createRazorpayOrder,
} from "../utils/razorpay.js";
import { emailOrderPlaced, emailOrderShipped } from "../utils/orderEmails.js";

// @desc    Get orders (Admin views all, Customer views their own)
// @route   GET /api/v1/orders
// @access  Private
export const getOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role !== "admin") {
      filter["customer.userId"] = req.user._id.toString();
    } else {
      const { userId } = req.query;
      if (userId) {
        filter["customer.userId"] = userId;
      }
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, "Orders retrieved successfully", orders);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Create new order booking
// @route   POST /api/v1/orders
// @access  Private (logged-in user required)
export const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      pricing,
      paymentMethod,
      customer,
    } = req.body;

    if (!req.user?._id) {
      return sendError(res, "Please login to place an order", 401);
    }

    if (!items || items.length === 0 || !shippingAddress) {
      return sendError(res, "Missing order items or shipping details", 400);
    }

    const method = paymentMethod === "ONLINE" ? "ONLINE" : "COD";
    // Never trust client paymentStatus — ONLINE stays Pending until gateway verifies (Razorpay)
    const safePaymentStatus = "Pending";

    // 1. Validate existence and stock for all items
    for (const item of items) {
      const product = await Product.findById(item.productId || item._id);
      if (!product) {
        return sendError(res, `Product not found: ${item.name}`, 404);
      }
      const size = item.size || "M";
      const available =
        product.sizesStock && product.get(`sizesStock.${size}`) !== undefined
          ? Number(product.get(`sizesStock.${size}`))
          : 0;
      if (available < Number(item.quantity)) {
        return sendError(
          res,
          `Insufficient stock for ${product.name} (Size: ${size}). Available: ${available}, Requested: ${item.quantity}`,
          400,
        );
      }
    }

    // 2. Validate coupon validity if applied
    let couponInstance = null;
    if (pricing && pricing.appliedCoupon) {
      couponInstance = await Coupon.findOne({
        code: pricing.appliedCoupon.toUpperCase(),
      });
      if (!couponInstance) {
        return sendError(res, "Invalid coupon code applied to order", 400);
      }
      if (couponInstance.status !== "Active") {
        return sendError(res, "This coupon is currently inactive", 400);
      }
      if (
        couponInstance.expiryDate &&
        new Date(couponInstance.expiryDate) < new Date()
      ) {
        return sendError(res, "This coupon code has expired", 400);
      }
      if (
        couponInstance.usageLimit &&
        couponInstance.ordersUsed >= couponInstance.usageLimit
      ) {
        return sendError(
          res,
          "This coupon's usage limit has been reached",
          400,
        );
      }
      const phone =
        req.user.phone || customer?.phone || shippingAddress?.phone;
      if (phone) {
        const userUsage = couponInstance.usedBy?.find((u) => u.phone === phone);
        if (
          userUsage &&
          couponInstance.userLimit &&
          userUsage.usageCount >= couponInstance.userLimit
        ) {
          return sendError(
            res,
            `You have reached the usage limit for this coupon (${couponInstance.userLimit} time(s))`,
            400,
          );
        }
      }
    }

    // Auto-generate human readable Order ID
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = `PRW-${new Date().getFullYear()}-${randomNum}`;

    // Bind customer to authenticated user — ignore forged client userId
    const boundCustomer = {
      userId: req.user._id.toString(),
      name:
        shippingAddress.fullName ||
        customer?.name ||
        req.user.name ||
        "Customer",
      phone: shippingAddress.phone || customer?.phone || req.user.phone || "",
      email: shippingAddress.email || customer?.email || req.user.email || "",
    };

    // 3. Create the Order document first to guarantee customer's order is NOT lost on subsequent stock/coupon errors
    const newOrder = await Order.create({
      orderId,
      customer: boundCustomer,
      items,
      shippingAddress,
      pricing,
      paymentMethod: method,
      paymentStatus: safePaymentStatus,
      orderStatus: "Placed",
    });

    // 4. Decrement sizesStock for each item (Non-blocking: don't fail order if stock save errors out)
    try {
      for (const item of items) {
        const product = await Product.findById(item.productId || item._id);
        if (product) {
          const size = item.size || "M";
          if (
            product.sizesStock &&
            product.get(`sizesStock.${size}`) !== undefined
          ) {
            const currentStock = Number(product.get(`sizesStock.${size}`)) || 0;
            product.set(
              `sizesStock.${size}`,
              Math.max(0, currentStock - Number(item.quantity)),
            );
            await product.save(); // Triggers product custom pre-validate hooks
          }
        }
      }
    } catch (stockErr) {
      console.error(
        "Non-blocking error during stock auto-decrement:",
        stockErr,
      );
    }

    // 5. Update dynamic coupon limit logs in DB if applied
    if (couponInstance) {
      try {
        couponInstance.ordersUsed = (couponInstance.ordersUsed || 0) + 1;
        const phone = boundCustomer.phone || shippingAddress?.phone;
        if (phone) {
          const usedIndex = couponInstance.usedBy.findIndex(
            (u) => u.phone === phone,
          );
          if (usedIndex > -1) {
            couponInstance.usedBy[usedIndex].usageCount += 1;
          } else {
            couponInstance.usedBy.push({ phone, usageCount: 1 });
          }
        }
        await couponInstance.save();
      } catch (couponSaveErr) {
        console.error(
          "Non-blocking error during coupon logs update:",
          couponSaveErr,
        );
      }
    }

    // 6. ONLINE → Razorpay must succeed, otherwise cancel this order
    let razorpayCheckout = null;
    if (method === "ONLINE") {
      const rollbackOnlineOrder = async () => {
        try {
          // Restore stock
          for (const item of items) {
            const product = await Product.findById(item.productId || item._id);
            if (
              product?.sizesStock &&
              product.get(`sizesStock.${item.size || "M"}`) !== undefined
            ) {
              const size = item.size || "M";
              const current =
                Number(product.get(`sizesStock.${size}`)) || 0;
              product.set(
                `sizesStock.${size}`,
                current + Number(item.quantity),
              );
              await product.save();
            }
          }
        } catch (stockRestoreErr) {
          console.error("Stock restore after Razorpay fail:", stockRestoreErr);
        }
        try {
          if (couponInstance) {
            couponInstance.ordersUsed = Math.max(
              0,
              (couponInstance.ordersUsed || 1) - 1,
            );
            await couponInstance.save();
          }
        } catch (couponRestoreErr) {
          console.error(
            "Coupon restore after Razorpay fail:",
            couponRestoreErr,
          );
        }
        await Order.findByIdAndDelete(newOrder._id);
      };

      if (!isRazorpayConfigured()) {
        await rollbackOnlineOrder();
        return sendError(
          res,
          "Online payment unavailable. Set real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env (Key Secret is NOT rzp_test_...).",
          503,
        );
      }

      try {
        const rpOrder = await createRazorpayOrder({
          amountInr: pricing.grandTotal,
          receipt: orderId,
          notes: {
            orderId,
            mongoId: newOrder._id.toString(),
            userId: req.user._id.toString(),
          },
        });
        newOrder.razorpayOrderId = rpOrder.id;
        await newOrder.save();
        razorpayCheckout = {
          key: process.env.RAZORPAY_KEY_ID,
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          razorpayOrderId: rpOrder.id,
          orderId: newOrder.orderId,
          name: "PARIWESH",
          description: `Order ${newOrder.orderId}`,
          prefill: {
            name: boundCustomer.name,
            email: boundCustomer.email,
            contact: boundCustomer.phone,
          },
        };
      } catch (rpErr) {
        console.error("Razorpay order create failed:", rpErr);
        await rollbackOnlineOrder();
        const desc =
          rpErr?.error?.description ||
          rpErr?.message ||
          "Razorpay authentication/create failed";
        return sendError(
          res,
          `Online payment failed: ${desc}. Order was NOT placed. Check RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET (Secret should look like a long random string, not rzp_test_...).`,
          502,
        );
      }
    }

    // Non-blocking order confirmation email
    emailOrderPlaced(newOrder.toObject ? newOrder.toObject() : newOrder).catch(
      (err) => console.error("[Mail] order placed email error:", err),
    );

    return sendSuccess(
      res,
      method === "ONLINE"
        ? "Order placed. Complete Razorpay payment to confirm."
        : "Order placed successfully",
      {
        ...newOrder.toObject(),
        razorpayCheckout,
        razorpayConfigured: method === "ONLINE" ? true : undefined,
      },
      201,
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Update order status / assign shipping details
// @route   PUT /api/v1/orders/:id/status
// @access  Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      orderStatus,
      trackingId,
      shippingProvider,
      paymentStatus,
      customerNotes,
      internalNotes,
    } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    const previousStatus = order.orderStatus;

    if (trackingId !== undefined) {
      order.trackingId = String(trackingId).trim();
    }
    if (shippingProvider !== undefined) {
      order.shippingProvider = String(shippingProvider).trim();
    }
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
    if (customerNotes !== undefined) order.customerNotes = customerNotes;
    if (internalNotes !== undefined) order.internalNotes = internalNotes;

    if (orderStatus) {
      // Real AWB required — no mock courier codes
      if (orderStatus === "Shipped") {
        if (!order.trackingId) {
          return sendError(
            res,
            "AWB / tracking ID is required to mark order as Shipped",
            400,
          );
        }
        if (!order.shippingProvider) {
          return sendError(
            res,
            "Courier / shipping provider is required to mark order as Shipped",
            400,
          );
        }
      }

      order.orderStatus = orderStatus;
      if (orderStatus === "Delivered") {
        order.deliveredAt = Date.now();
      }
    }

    await order.save();

    if (
      order.orderStatus === "Shipped" &&
      previousStatus !== "Shipped" &&
      order.trackingId
    ) {
      emailOrderShipped(order).catch((err) =>
        console.error("[Mail] shipped email failed:", err.message),
      );
    }

    await logActivity(
      req,
      `Order Status Updated: ${order.orderId} (${orderStatus || order.orderStatus})${
        order.trackingId ? ` AWB=${order.trackingId}` : ""
      }`,
    );

    return sendSuccess(
      res,
      `Order status updated to ${order.orderStatus}`,
      order,
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Delete order (Admin)
// @route   DELETE /api/v1/orders/:id
// @access  Public
export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    await logActivity(req, `Order Deleted: ${order.orderId}`);

    return sendSuccess(res, "Order deleted from queue");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import Product from "../models/Product.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import { logActivity } from "../utils/logger.js";
import {
  isRazorpayConfigured,
  createRazorpayOrder,
} from "../utils/razorpay.js";
import {
  emailOrderPlaced,
  emailOrderShipped,
  emailOrderStatusUpdate,
} from "../utils/orderEmails.js";
import {
  createShiprocketOrder,
  getCourierRecommendations,
  assignShiprocketAWB,
  generateShiprocketLabel,
  generateShiprocketInvoice,
  generateShiprocketManifest,
  requestShiprocketPickup,
} from "../utils/shiprocket.js";

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
    const { items, shippingAddress, pricing, paymentMethod, customer } =
      req.body;

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
      const phone = req.user.phone || customer?.phone || shippingAddress?.phone;
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
              const current = Number(product.get(`sizesStock.${size}`)) || 0;
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

    // Shiprocket automated courier sequence when Order is set to "Ready to Ship"
    if (order.orderStatus === "Ready to Ship") {
      const email = process.env.SHIPROCKET_EMAIL;
      const password = process.env.SHIPROCKET_PASSWORD;
      if (!email || !password) {
        console.warn(
          "[Shiprocket Flow] Missing credentials in environment. Skipping Shiprocket flow.",
        );
        const timestamp = new Date().toISOString();
        order.internalNotes =
          `${order.internalNotes || ""}\n[${timestamp}] Shiprocket flow skipped: credentials not configured.`.trim();
      } else {
        try {
          console.log(
            `[Shiprocket Flow] Triggering courier routing flow for order ID: ${order.orderId}`,
          );

          // Step 1: Create Order
          if (!order.shiprocketOrderId) {
            console.log(
              `[Shiprocket Flow] Step 1: Registering adhoc order with Shiprocket`,
            );
            const flowOrder = await createShiprocketOrder(order);
            if (
              !flowOrder ||
              !flowOrder.shiprocketOrderId ||
              !flowOrder.shiprocketShipmentId
            ) {
              throw new Error(
                "Shiprocket Order Creation response is missing required order_id or shipment_id fields.",
              );
            }
            order.shiprocketOrderId = flowOrder.shiprocketOrderId;
            order.shiprocketShipmentId = flowOrder.shiprocketShipmentId;
            await order.save();
          }

          // Step 2: Serviceability & AWB Assignment
          if (!order.shiprocketOrderId || !order.shiprocketShipmentId) {
            throw new Error(
              "Missing prerequisite: Shiprocket Order ID / Shipment ID. Cannot assign AWB.",
            );
          }
          if (!order.awbCode) {
            console.log(
              `[Shiprocket Flow] Step 2: Querying best courier recommendations from Serviceability API`,
            );
            const recommendation = await getCourierRecommendations(
              order.shiprocketShipmentId,
            );
            if (!recommendation || !recommendation.courier_company_id) {
              throw new Error(
                "Courier Serviceability check returned no available courier company ID.",
              );
            }
            console.log(
              `[Shiprocket Flow] Selected courier partner: ${recommendation.courier_name} (ID: ${recommendation.courier_company_id})`,
            );

            console.log(
              `[Shiprocket Flow] Step 2b: Calling AWB Assignment API for shipment: ${order.shiprocketShipmentId}`,
            );
            const awbDetails = await assignShiprocketAWB(
              order.shiprocketShipmentId,
              recommendation.courier_company_id,
            );
            if (!awbDetails || !awbDetails.awbCode || !awbDetails.courierName) {
              throw new Error(
                "AWB assignment response is missing required awb_code or courier_name.",
              );
            }
            order.awbCode = awbDetails.awbCode;
            order.courierName = awbDetails.courierName;
            order.courierId = awbDetails.courierId;
            // Map tracking fields for standard order compatibility
            order.trackingId = awbDetails.awbCode;
            order.shippingProvider = awbDetails.courierName;
            await order.save();
          }

          // Step 3: Generate Shipping Label PDF
          if (!order.awbCode) {
            throw new Error(
              "Missing prerequisite: AWB Code. Cannot generate label.",
            );
          }
          if (!order.shippingLabelUrl) {
            console.log(
              `[Shiprocket Flow] Step 3: Fetching shipping label URL`,
            );
            const labelUrl = await generateShiprocketLabel(
              order.shiprocketShipmentId,
            );
            if (!labelUrl) {
              throw new Error(
                "Label URL generation returned an empty or invalid URL.",
              );
            }
            order.shippingLabelUrl = labelUrl;
            await order.save();
          }

          // Step 4: Generate Invoice PDF
          if (!order.shippingLabelUrl) {
            throw new Error(
              "Missing prerequisite: Shipping Label URL. Cannot generate invoice.",
            );
          }
          if (!order.shippingInvoiceUrl) {
            console.log(
              `[Shiprocket Flow] Step 4: Fetching shipping invoice URL`,
            );
            const invoiceUrl = await generateShiprocketInvoice(
              order.shiprocketOrderId,
            );
            if (!invoiceUrl) {
              throw new Error(
                "Invoice URL generation returned an empty or invalid URL.",
              );
            }
            order.shippingInvoiceUrl = invoiceUrl;
            await order.save();
          }

          // Step 5: Request Courier Pickup Collection (Non-blocking)
          if (order.shippingInvoiceUrl && !order.pickupToken) {
            console.log(
              `[Shiprocket Flow] Step 5 (Non-blocking): Triggering manifest pickup request`,
            );
            try {
              const pickupDetails = await requestShiprocketPickup(
                order.shiprocketShipmentId,
              );
              if (pickupDetails && pickupDetails.pickupToken) {
                order.pickupToken = pickupDetails.pickupToken;
                order.pickupScheduledAt = pickupDetails.pickupScheduledAt;
                await order.save();
                console.log(
                  `[Shiprocket Flow] Pickup requested successfully: ${order.pickupToken}`,
                );
              } else {
                console.warn(
                  "[Shiprocket Flow] Pickup response missing pickupToken details.",
                );
              }
            } catch (pickupErr) {
              console.error(
                `[Shiprocket Flow] Pickup request encountered error (Non-blocking):`,
                pickupErr.message,
              );
              const timestamp = new Date().toISOString();
              order.internalNotes =
                `${order.internalNotes || ""}\n[${timestamp}] Non-blocking Pickup failed: ${pickupErr.message}`.trim();
              await order.save();
            }
          }

          // Step 6: Generate + Print Manifest (Non-blocking)
          if (order.pickupToken && !order.manifestUrl) {
            console.log(
              `[Shiprocket Flow] Step 6 (Non-blocking): Fetching manifest URL`,
            );
            try {
              const manifestUrl = await generateShiprocketManifest(
                order.shiprocketShipmentId,
              );
              if (manifestUrl) {
                order.manifestUrl = manifestUrl;
                await order.save();
                console.log(
                  `[Shiprocket Flow] Manifest generated successfully: ${order.manifestUrl}`,
                );
              } else {
                console.warn(
                  "[Shiprocket Flow] Manifest response returned empty URL.",
                );
              }
            } catch (manifestErr) {
              console.error(
                `[Shiprocket Flow] Manifest generation encountered error (Non-blocking):`,
                manifestErr.message,
              );
              const timestamp = new Date().toISOString();
              order.internalNotes =
                `${order.internalNotes || ""}\n[${timestamp}] Non-blocking Manifest failed: ${manifestErr.message}`.trim();
              await order.save();
            }
          }

          console.log(
            `[Shiprocket Flow] Process completed successfully for order ${order.orderId}`,
          );
        } catch (flowError) {
          console.error(
            `[Shiprocket Flow] Courier sequence encountered transient error (Failure-Isolated):`,
            flowError.message,
          );
          const timestamp = new Date().toISOString();
          order.internalNotes =
            `${order.internalNotes || ""}\n[${timestamp}] Shiprocket flow failed: ${flowError.message}`.trim();
          await order.save();
          // We intentionally do NOT throw this error out. Rest of controller logic must succeed.
        }
      }
    }

    await order.save();

    if (orderStatus && order.orderStatus !== previousStatus) {
      emailOrderStatusUpdate(order).catch((err) =>
        console.error("[Mail] order status update email failed:", err.message),
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

// @desc    Retry Shiprocket Label Generation
// @route   POST /api/v1/orders/:id/retry-label
// @access  Admin
export const retryShiprocketLabel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }
    if (!order.shiprocketShipmentId) {
      return sendError(res, "Order not registered with Shiprocket yet", 400);
    }
    if (!order.awbCode) {
      return sendError(res, "AWB code not assigned yet", 400);
    }

    console.log(
      `[Shiprocket Flow] Retrying label generation for order: ${order.orderId}`,
    );
    const labelUrl = await generateShiprocketLabel(order.shiprocketShipmentId);
    if (!labelUrl) {
      return sendError(res, "Label URL generation returned empty value", 500);
    }

    order.shippingLabelUrl = labelUrl;
    await order.save();

    await logActivity(req, `Retry Shiprocket Label Success: ${order.orderId}`);
    return sendSuccess(res, "Shipping label generated successfully", {
      shippingLabelUrl: labelUrl,
    });
  } catch (error) {
    console.error("[Shiprocket Retry] Label generation failed:", error.message);
    return sendError(res, `Label generation failed: ${error.message}`, 505);
  }
};

// @desc    Retry Shiprocket Invoice Generation
// @route   POST /api/v1/orders/:id/retry-invoice
// @access  Admin
export const retryShiprocketInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }
    if (!order.shiprocketOrderId) {
      return sendError(res, "Order not registered with Shiprocket yet", 400);
    }

    console.log(
      `[Shiprocket Flow] Retrying invoice generation for order: ${order.orderId}`,
    );
    const invoiceUrl = await generateShiprocketInvoice(order.shiprocketOrderId);
    if (!invoiceUrl) {
      return sendError(res, "Invoice URL generation returned empty value", 500);
    }

    order.shippingInvoiceUrl = invoiceUrl;
    await order.save();

    await logActivity(
      req,
      `Retry Shiprocket Invoice Success: ${order.orderId}`,
    );
    return sendSuccess(res, "Order invoice printed successfully", {
      shippingInvoiceUrl: invoiceUrl,
    });
  } catch (error) {
    console.error(
      "[Shiprocket Retry] Invoice generation failed:",
      error.message,
    );
    return sendError(res, `Invoice generation failed: ${error.message}`, 505);
  }
};

// @desc    Retry Shiprocket Pickup Request
// @route   POST /api/v1/orders/:id/retry-pickup
// @access  Admin
export const retryShiprocketPickup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }
    if (!order.shiprocketShipmentId) {
      return sendError(res, "Order not registered with Shiprocket yet", 400);
    }
    if (!order.awbCode) {
      return sendError(res, "AWB code not assigned yet", 400);
    }

    console.log(
      `[Shiprocket Flow] Retrying courier pickup request for order: ${order.orderId}`,
    );
    const pickupDetails = await requestShiprocketPickup(
      order.shiprocketShipmentId,
    );
    if (!pickupDetails || !pickupDetails.pickupToken) {
      return sendError(
        res,
        "Pickup request response is missing required pickup token",
        500,
      );
    }

    order.pickupToken = pickupDetails.pickupToken;
    order.pickupScheduledAt = pickupDetails.pickupScheduledAt;
    await order.save();

    await logActivity(req, `Retry Shiprocket Pickup Success: ${order.orderId}`);
    return sendSuccess(res, "Courier pickup requested successfully", {
      pickupToken: order.pickupToken,
      pickupScheduledAt: order.pickupScheduledAt,
    });
  } catch (error) {
    console.error("[Shiprocket Retry] Pickup request failed:", error.message);
    return sendError(
      res,
      `Courier pickup scheduling failed: ${error.message}`,
      505,
    );
  }
};

// @desc    Retry Shiprocket Manifest Generation
// @route   POST /api/v1/orders/:id/retry-manifest
// @access  Admin
export const retryShiprocketManifest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }
    if (!order.shiprocketShipmentId) {
      return sendError(res, "Order not registered with Shiprocket yet", 400);
    }
    if (!order.pickupToken) {
      return sendError(
        res,
        "Pickup has not been scheduled yet (pickupToken is missing)",
        400,
      );
    }

    console.log(
      `[Shiprocket Flow] Retrying manifest generation for order: ${order.orderId}`,
    );
    const manifestUrl = await generateShiprocketManifest(
      order.shiprocketShipmentId,
    );
    if (!manifestUrl) {
      return sendError(
        res,
        "Manifest URL generation returned empty value",
        500,
      );
    }

    order.manifestUrl = manifestUrl;
    await order.save();

    await logActivity(
      req,
      `Retry Shiprocket Manifest Success: ${order.orderId}`,
    );
    return sendSuccess(res, "Print manifest sheet generated successfully", {
      manifestUrl,
    });
  } catch (error) {
    console.error(
      "[Shiprocket Retry] Manifest generation failed:",
      error.message,
    );
    return sendError(res, `Manifest generation failed: ${error.message}`, 505);
  }
};

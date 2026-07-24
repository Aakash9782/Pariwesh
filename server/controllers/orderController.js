import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";

// @desc    Get all orders (Admin views)
// @route   GET /api/v1/orders
// @access  Public (Admin restricted conceptually)
export const getOrders = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const filter = {};
    if (userId) {
      filter["customer.userId"] = userId;
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, "Orders retrieved successfully", orders);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Create new order booking
// @route   POST /api/v1/orders
// @access  Public
export const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      pricing,
      paymentMethod,
      paymentStatus,
      customer,
    } = req.body;

    if (!items || items.length === 0 || !shippingAddress) {
      return sendError(res, "Missing order items or shipping details", 400);
    }

    // Auto-generate human readable Order ID
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = `PRW-${new Date().getFullYear()}-${randomNum}`;

    const newOrder = await Order.create({
      orderId,
      customer: customer || {
        name: shippingAddress.fullName,
        phone: shippingAddress.phone,
        email: shippingAddress.email || "",
      },
      items,
      shippingAddress,
      pricing,
      paymentMethod: paymentMethod || "COD",
      paymentStatus:
        paymentStatus || (paymentMethod === "ONLINE" ? "Paid" : "Pending"),
      orderStatus: "Placed",
    });

    // Update dynamic coupon limit logs in DB if applied
    if (pricing && pricing.appliedCoupon) {
      const coupon = await Coupon.findOne({
        code: pricing.appliedCoupon.toUpperCase(),
      });
      if (coupon) {
        coupon.ordersUsed = (coupon.ordersUsed || 0) + 1;
        const phone = customer?.phone || shippingAddress?.phone;
        if (phone) {
          const usedIndex = coupon.usedBy.findIndex(
            (item) => item.phone === phone,
          );
          if (usedIndex > -1) {
            coupon.usedBy[usedIndex].usageCount += 1;
          } else {
            coupon.usedBy.push({ phone, usageCount: 1 });
          }
        }
        await coupon.save();
      }
    }

    return sendSuccess(res, "Order placed successfully", newOrder, 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Update order status / assign shipping details
// @route   PUT /api/v1/orders/:id/status
// @access  Public
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus, trackingId, shippingProvider, paymentStatus } =
      req.body;

    const order = await Order.findById(id);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;

      // Simulate Courier API Label Generator (Delhivery / Shiprocket / Amazon Logistics)
      // When order goes to "Shipped", we automatically assign courier details if not provided
      if (orderStatus === "Shipped") {
        if (!order.trackingId && !trackingId) {
          const mockAWB =
            "AWB" + Math.floor(100000000 + Math.random() * 900000000);
          order.trackingId = mockAWB;
        }
        if (!order.shippingProvider && !shippingProvider) {
          const providers = [
            "Delhivery",
            "Shiprocket",
            "BlueDart",
            "Xpressbees",
          ];
          order.shippingProvider =
            providers[Math.floor(Math.random() * providers.length)];
        }
      }
    }

    if (trackingId !== undefined) order.trackingId = trackingId;
    if (shippingProvider !== undefined)
      order.shippingProvider = shippingProvider;
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;

    await order.save();
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
    return sendSuccess(res, "Order deleted from queue");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

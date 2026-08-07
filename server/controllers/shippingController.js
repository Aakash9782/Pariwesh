import Order from "../models/Order.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import { emailOrderStatusUpdate } from "../utils/orderEmails.js";

/**
 * Maps Shiprocket statuses to local Order enums
 */
const mapShiprocketStatusToLocal = (srStatus, statusId) => {
  if (!srStatus && !statusId) return null;
  const status = String(srStatus || "")
    .toLowerCase()
    .trim();
  const id = String(statusId || "").trim();

  // Shiprocket status numerical codes
  if (id === "6") return "Shipped";
  if (id === "7") return "Out for Delivery";
  if (id === "8") return "Delivered";
  if (id === "13") return "Cancelled";
  if (id === "16") return "Pickup Scheduled";
  if (id === "17") return "RTO Initiated";
  if (id === "18") return "RTO Delivered";

  // Shiprocket string codes
  if (status.includes("out for delivery")) return "Out for Delivery";
  if (status === "delivered") return "Delivered";
  if (status === "shipped") return "Shipped";
  if (status.includes("transit") || status.includes("in transit"))
    return "In Transit";
  if (status === "pickup scheduled") return "Pickup Scheduled";
  if (status === "pickup generated") return "Pickup Generated";
  if (status === "pickup completed" || status.includes("picked up"))
    return "Pickup Completed";
  if (status === "rto initiated" || status.includes("rto started"))
    return "RTO Initiated";
  if (status === "rto delivered") return "RTO Delivered";
  if (status === "lost") return "Lost";
  if (status === "damaged") return "Damaged";
  if (status === "undelivered") return "Undelivered";
  if (status === "exception") return "Exception";
  if (status === "returned") return "Returned";
  if (status === "cancelled" || status === "canceled") return "Cancelled";

  return null;
};

/**
 * Handle incoming Shiprocket tracking webhooks.
 * Validates against process.env.SHIPROCKET_WEBHOOK_SECRET if defined.
 */
export const handleShiprocketWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-webhook-token"];
    const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;

    if (secret && signature !== secret) {
      console.warn(
        `[Shiprocket Webhook] Rejecting unauthorized webhook trigger from IP: ${req.ip}`,
      );
      return sendError(res, "Unauthorized webhook source", 401);
    }

    const payload = req.body;
    console.log(`[Shiprocket Webhook] Process event:`, JSON.stringify(payload));

    const { awb, order_id, current_status, current_status_id } = payload;
    if (!order_id) {
      return sendError(
        res,
        "Required parameter order_id is missing in webhook payload",
        400,
      );
    }

    // Lookup order by either orderId (human readable) or Shiprocket absolute order ID
    const order = await Order.findOne({
      $or: [{ orderId: order_id }, { shiprocketOrderId: String(order_id) }],
    });

    if (!order) {
      console.warn(
        `[Shiprocket Webhook] Order match not found for payload id: ${order_id}`,
      );
      return sendError(
        res,
        `Order not found with matching reference: ${order_id}`,
        404,
      );
    }

    const mappedStatus = mapShiprocketStatusToLocal(
      current_status,
      current_status_id,
    );
    if (!mappedStatus) {
      console.log(
        `[Shiprocket Webhook] No local mapping configured for status: ${current_status} (ID: ${current_status_id})`,
      );
      return sendSuccess(res, "Webhook processed: no status transition mapped");
    }

    const previousStatus = order.orderStatus;

    // Safety check: is it already set?
    if (previousStatus === mappedStatus) {
      return sendSuccess(
        res,
        `Order status is already up-to-date: ${mappedStatus}`,
      );
    }

    // Apply updates
    order.orderStatus = mappedStatus;
    if (awb && !order.awbCode) {
      order.awbCode = String(awb);
      order.trackingId = String(awb);
    }
    if (mappedStatus === "Delivered") {
      order.deliveredAt = Date.now();
    }

    await order.save();
    console.log(
      `[Shiprocket Webhook] Updated order ${order.orderId} status from '${previousStatus}' to '${mappedStatus}'`,
    );

    // Notify customer on status update (failure-isolated)
    emailOrderStatusUpdate(order).catch((err) =>
      console.error(
        "[Mail] order status update email failed during webhook handling:",
        err.message,
      ),
    );

    return sendSuccess(res, "Webhook processed successfully", {
      orderId: order.orderId,
      status: order.orderStatus,
    });
  } catch (error) {
    console.error(
      "[Shiprocket Webhook] Internal execution error:",
      error.message,
    );
    return sendError(
      res,
      "Internal server error processing webhook status updates",
      500,
    );
  }
};

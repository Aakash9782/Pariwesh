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
  if (
    status === "pickup generated" ||
    status === "manifest generated" ||
    status === "manifest_generated"
  )
    return "Pickup Generated";
  if (
    status === "pickup completed" ||
    status.includes("picked up") ||
    status === "picked up"
  )
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
 * Validates against process.env.SHIPROCKET_WEBHOOK_SECRET using x-api-key or x-webhook-token.
 */
export const handleShiprocketWebhook = async (req, res, next) => {
  try {
    const signature =
      req.headers["x-api-key"] || req.headers["x-webhook-token"];
    const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;

    if (secret && signature !== secret) {
      console.warn(
        `[Shiprocket Webhook] Rejecting unauthorized webhook trigger from IP: ${req.ip}`,
      );
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized webhook source" });
    }

    const payload = req.body;
    console.log(
      `[Shiprocket Webhook] Payload received:`,
      JSON.stringify(payload),
    );

    const {
      awb,
      order_id,
      shipment_id,
      current_status,
      current_status_id,
      courier_name,
      etd,
      scans,
    } = payload;

    if (!order_id && !shipment_id && !awb) {
      console.warn(
        "[Shiprocket Webhook] Webhook skipped: Missing matching fields (order_id, shipment_id, awb).",
      );
      return res.status(200).json({
        success: true,
        message: "Webhook skipped: No identifiers provided.",
      });
    }

    // Find the order using shiprocketOrderId, shiprocketShipmentId, trackingId (AWB), or orderId (human code)
    const order = await Order.findOne({
      $or: [
        { orderId: String(order_id || "") },
        { shiprocketOrderId: String(order_id || "") },
        { shiprocketShipmentId: String(shipment_id || "") },
        { trackingId: String(awb || "") },
        { awbCode: String(awb || "") },
      ].filter((q) => Object.values(q)[0]),
    });

    if (!order) {
      console.warn(
        `[Shiprocket Webhook] Match not found for payload identifiers: order_id=${order_id}, shipment_id=${shipment_id}, awb=${awb}`,
      );
      return res.status(200).json({
        success: true,
        message: "Webhook acknowledged: Order not found.",
      });
    }

    const mappedStatus = mapShiprocketStatusToLocal(
      current_status,
      current_status_id,
    );
    const previousStatus = order.orderStatus;

    // Update tracking attributes
    if (awb) {
      order.awbCode = String(awb);
      order.trackingId = String(awb);
    }
    if (courier_name) {
      order.shippingProvider = String(courier_name);
      order.courierName = String(courier_name);
    }
    if (current_status) {
      order.currentTrackingStatus = String(current_status);
    }
    order.currentTrackingTimestamp = new Date();
    if (etd) {
      order.estimatedDeliveryDate = new Date(etd);
    }
    order.lastWebhookReceivedAt = new Date();

    if (mappedStatus && mappedStatus !== previousStatus) {
      order.orderStatus = mappedStatus;
      if (mappedStatus === "Delivered") {
        order.deliveredAt = new Date();
      }
      console.log(
        `[Shiprocket Webhook] Status transitioned: ${previousStatus} -> ${mappedStatus} (Order ${order.orderId})`,
      );
    }

    // Append new events from scans[] history ensuring idempotency (no duplicates)
    if (Array.isArray(scans)) {
      if (!order.deliveryHistory) {
        order.deliveryHistory = [];
      }
      for (const scan of scans) {
        const scanStatus = scan.status || "";
        const scanActivity = scan.activity || "";
        const scanLocation = scan.location || "";
        const scanTimestamp = scan.date ? new Date(scan.date) : new Date();

        const isDuplicate = order.deliveryHistory.some((historyEntry) => {
          const historyTimestamp = historyEntry.timestamp
            ? new Date(historyEntry.timestamp).getTime()
            : 0;
          return (
            historyEntry.status === scanStatus &&
            historyEntry.activity === scanActivity &&
            Math.abs(historyTimestamp - scanTimestamp.getTime()) < 1000 // Compare within 1 second tolerance
          );
        });

        if (!isDuplicate) {
          order.deliveryHistory.push({
            status: scanStatus,
            activity: scanActivity,
            location: scanLocation,
            timestamp: scanTimestamp,
          });
        }
      }
    }

    await order.save();
    console.log(
      `[Shiprocket Webhook] Successfully processed and saved order: ${order.orderId}`,
    );

    // Send customer notification email ONLY when the mapped local status transitions to a NEW value
    if (mappedStatus && mappedStatus !== previousStatus) {
      emailOrderStatusUpdate(order).catch((err) => {
        console.error(
          `[Mail] Status update email trigger failed for order ${order.orderId}:`,
          err.message,
        );
      });
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      orderId: order.orderId,
      status: order.orderStatus,
    });
  } catch (error) {
    // Failure isolation: Never crash the main thread, always return 200 HTTP to stop webhook retries, log internally
    console.error(`[Shiprocket Webhook Controller Error]: ${error.message}`);
    return res.status(200).json({
      success: true,
      message: "Webhook acknowledged: Internal process warning.",
    });
  }
};

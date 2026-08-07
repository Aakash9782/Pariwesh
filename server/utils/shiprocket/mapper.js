/**
 * Maps Shiprocket statuses to local Order enums
 */
export const mapShiprocketStatusToLocal = (srStatus, statusId) => {
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

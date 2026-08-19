import { sendMail } from "./mailer.js";
import {
  buildOrderPlacedEmail,
  buildPaymentSuccessEmail,
  buildPaymentFailedEmail,
  buildOrderShippedEmail,
  buildOrderStatusUpdateEmail,
  buildAdminOrderNotificationEmail,
} from "./emailTemplates.js";
import Setting from "../models/Setting.js";
import { getAdminEmails } from "./phone.js";

const recipientFor = (order) =>
  order?.customer?.email || order?.shippingAddress?.email || "";

export const emailAdminOrderNotification = async (order) => {
  try {
    const adminEmails = getAdminEmails();
    if (!adminEmails || adminEmails.length === 0) {
      console.warn(
        "[Mail] Admin order notification skipped — no admin email configured",
      );
      return;
    }

    const { subject, html } = buildAdminOrderNotificationEmail(order);
    await Promise.all(
      adminEmails.map((email) =>
        sendMail({
          to: email,
          subject,
          html,
          type: "admin_order_notification",
          meta: { orderId: order?.orderId },
        }),
      ),
    );
  } catch (err) {
    console.error("[Mail] admin order notification email error:", err);
  }
};

export const emailOrderPlaced = async (order) => {
  const to = recipientFor(order);
  if (!to) {
    console.warn(
      "[Mail] order placed skipped — no customer email",
      order?.orderId,
    );
    return;
  }
  const { subject, html } = buildOrderPlacedEmail(order);
  await sendMail({
    to,
    subject,
    html,
    type: "order_placed",
    meta: { orderId: order?.orderId },
  });

  // Notify admin for COD order immediately on placement
  if (order?.paymentMethod === "COD") {
    emailAdminOrderNotification(order).catch((err) =>
      console.error("[Mail] admin order notification error for COD:", err),
    );
  }
};

export const emailPaymentSuccess = async (order) => {
  const to = recipientFor(order);
  if (!to) return;
  const { subject, html } = buildPaymentSuccessEmail(order);
  await sendMail({
    to,
    subject,
    html,
    type: "payment_success",
    meta: { orderId: order?.orderId },
  });

  // Notify admin for ONLINE order on payment confirmation/success
  emailAdminOrderNotification(order).catch((err) =>
    console.error("[Mail] admin order notification error for ONLINE:", err),
  );
};

export const emailPaymentFailed = async (order, reason) => {
  const to = recipientFor(order);
  if (!to) return;
  const { subject, html } = buildPaymentFailedEmail(order, reason);
  await sendMail({
    to,
    subject,
    html,
    type: "payment_failed",
    meta: { orderId: order?.orderId, reason },
  });
};

export const emailOrderShipped = async (order) => {
  const to = recipientFor(order);
  if (!to) {
    console.warn("[Mail] shipped skipped — no customer email", order?.orderId);
    return;
  }
  const { subject, html } = buildOrderShippedEmail(order);
  await sendMail({
    to,
    subject,
    html,
    type: "order_shipped",
    meta: { orderId: order?.orderId },
  });
};

export const emailOrderStatusUpdate = async (order) => {
  const to = recipientFor(order);
  if (!to) {
    console.warn(
      "[Mail] order status update skipped — no customer email",
      order?.orderId,
    );
    return;
  }

  let settings = {};
  try {
    const settingsList = await Setting.find({});
    settingsList.forEach((s) => {
      settings[s.key] = s.value;
    });
  } catch (err) {
    console.error(
      "[Mail] Failed to load brand settings, using fallbacks:",
      err.message,
    );
  }

  const { subject, html } = buildOrderStatusUpdateEmail(order, settings);
  await sendMail({
    to,
    subject,
    html,
    type: "other",
    meta: { orderId: order?.orderId, orderStatus: order?.orderStatus },
  });
};

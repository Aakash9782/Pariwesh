import { sendMail } from "./mailer.js";
import {
  buildOrderPlacedEmail,
  buildPaymentSuccessEmail,
  buildPaymentFailedEmail,
  buildOrderShippedEmail,
} from "./emailTemplates.js";

const recipientFor = (order) =>
  order?.customer?.email || order?.shippingAddress?.email || "";

export const emailOrderPlaced = async (order) => {
  const to = recipientFor(order);
  if (!to) {
    console.warn("[Mail] order placed skipped — no customer email", order?.orderId);
    return;
  }
  const { subject, html } = buildOrderPlacedEmail(order);
  await sendMail({ to, subject, html });
};

export const emailPaymentSuccess = async (order) => {
  const to = recipientFor(order);
  if (!to) return;
  const { subject, html } = buildPaymentSuccessEmail(order);
  await sendMail({ to, subject, html });
};

export const emailPaymentFailed = async (order, reason) => {
  const to = recipientFor(order);
  if (!to) return;
  const { subject, html } = buildPaymentFailedEmail(order, reason);
  await sendMail({ to, subject, html });
};

export const emailOrderShipped = async (order) => {
  const to = recipientFor(order);
  if (!to) {
    console.warn("[Mail] shipped skipped — no customer email", order?.orderId);
    return;
  }
  const { subject, html } = buildOrderShippedEmail(order);
  await sendMail({ to, subject, html });
};

import { sendMail } from "./mailer.js";
import {
  buildOrderPlacedEmail,
  buildPaymentSuccessEmail,
  buildPaymentFailedEmail,
  buildOrderShippedEmail,
  buildOrderStatusUpdateEmail,
  buildAdminOrderNotificationEmail,
} from "./emailTemplates.js";
import mongoose from "mongoose";
import Setting from "../models/Setting.js";
import User from "../models/User.js";
import { isValidEmail } from "./phone.js";

const recipientFor = (order) =>
  order?.customer?.email || order?.shippingAddress?.email || "";

/**
 * Dynamically resolves all admin email recipients:
 * 1. All active admin users registered in database (User model where role === 'admin')
 * 2. Admin settings from database (adminNotificationEmail, supportEmail)
 * 3. Environment variable ADMIN_EMAILS (comma-separated)
 */
export const getAdminNotificationEmails = async () => {
  const emails = new Set();

  // Only query database if Mongoose connection is actively open (readyState === 1)
  if (mongoose.connection?.readyState === 1) {
    // 1. From Database: All users with role === 'admin'
    try {
      const adminUsers = await User.find({ role: "admin" }).select("email").lean();
      if (Array.isArray(adminUsers)) {
        adminUsers.forEach((u) => {
          const em = String(u?.email || "").trim().toLowerCase();
          if (isValidEmail(em)) {
            emails.add(em);
          }
        });
      }
    } catch (err) {
      console.warn("[Mail] Failed to load admin users from DB:", err.message);
    }

    // 2. From Database Settings: adminNotificationEmail or supportEmail
    try {
      const settings = await Setting.find({
        key: { $in: ["adminNotificationEmail", "supportEmail"] },
      }).lean();
      if (Array.isArray(settings)) {
        settings.forEach((s) => {
          if (s?.value) {
            String(s.value)
              .split(",")
              .forEach((item) => {
                const em = item.trim().toLowerCase();
                if (isValidEmail(em)) {
                  emails.add(em);
                }
              });
          }
        });
      }
    } catch (err) {
      console.warn("[Mail] Failed to load email settings from DB:", err.message);
    }
  }

  // 3. From Environment variable ADMIN_EMAILS
  const fromEnv = process.env.ADMIN_EMAILS || "";
  fromEnv
    .split(",")
    .forEach((item) => {
      const em = item.trim().toLowerCase();
      if (isValidEmail(em)) {
        emails.add(em);
      }
    });

  return Array.from(emails);
};

export const emailAdminOrderNotification = async (order) => {
  try {
    const adminEmails = await getAdminNotificationEmails();
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
  const emailTasks = [];

  // Always notify all admins for COD order immediately on placement (independent of customer email)
  if (order?.paymentMethod === "COD") {
    emailTasks.push(
      emailAdminOrderNotification(order).catch((err) =>
        console.error("[Mail] admin order notification error for COD:", err),
      ),
    );
  }

  const to = recipientFor(order);
  if (to) {
    const { subject, html } = buildOrderPlacedEmail(order);
    emailTasks.push(
      sendMail({
        to,
        subject,
        html,
        type: "order_placed",
        meta: { orderId: order?.orderId },
      }),
    );
  } else {
    console.warn(
      "[Mail] order placed skipped — no customer email",
      order?.orderId,
    );
  }

  await Promise.allSettled(emailTasks);
};

export const emailPaymentSuccess = async (order) => {
  const emailTasks = [];

  // Always notify all admins for ONLINE order on payment confirmation/success (independent of customer email)
  emailTasks.push(
    emailAdminOrderNotification(order).catch((err) =>
      console.error("[Mail] admin order notification error for ONLINE:", err),
    ),
  );

  const to = recipientFor(order);
  if (to) {
    const { subject, html } = buildPaymentSuccessEmail(order);
    emailTasks.push(
      sendMail({
        to,
        subject,
        html,
        type: "payment_success",
        meta: { orderId: order?.orderId },
      }),
    );
  }

  await Promise.allSettled(emailTasks);
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

import nodemailer from "nodemailer";
import EmailLog from "../models/EmailLog.js";

let transporter = null;

/** Race a promise against a timeout so SMTP hangs never block auth for minutes. */
const withTimeout = (promise, ms, label = "Operation") =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);

const SMTP_SEND_TIMEOUT_MS = Number(process.env.SMTP_SEND_TIMEOUT_MS || 12000);

const getMailAuth = () => {
  const user = (process.env.NODEMAILER_USER || "").trim();
  const pass = (process.env.NODEMAILER_PASS || "").trim();
  if (!user || !pass) return null;
  return { user, pass };
};

const getResendApiKey = () => (process.env.RESEND_API_KEY || "").trim();

const buildTransporter = () => {
  const auth = getMailAuth();
  if (!auth) return null;

  const service = (process.env.NODEMAILER_SERVICE || "").trim().toLowerCase();
  const host = (process.env.NODEMAILER_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.NODEMAILER_PORT || 587);

  const shared = {
    auth,
    connectionTimeout: Math.min(SMTP_SEND_TIMEOUT_MS, 10000),
    greetingTimeout: Math.min(SMTP_SEND_TIMEOUT_MS, 10000),
    socketTimeout: SMTP_SEND_TIMEOUT_MS,
    tls: { minVersion: "TLSv1.2" },
  };

  // Gmail service preset is more reliable than raw host/port on some networks
  if (service === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      ...shared,
    });
  }

  // Port 587 = STARTTLS; 465 = implicit TLS
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    ...shared,
  });
};

const getTransporter = () => {
  if (!transporter) {
    transporter = buildTransporter();
  }
  return transporter;
};

const resetTransporter = () => {
  transporter = null;
};

export const isMailConfigured = () => !!getResendApiKey() || !!getMailAuth();

const persistEmailLog = async (payload) => {
  try {
    await EmailLog.create(payload);
  } catch (err) {
    console.error("[Mail] failed to persist email log:", err.message);
  }
};

const resolveFromAddress = () => {
  const from = (
    process.env.RESEND_FROM ||
    process.env.NODEMAILER_FROM ||
    process.env.NODEMAILER_USER ||
    ""
  ).trim();
  return from;
};

/**
 * Send via Resend HTTP API (port 443).
 * Required on Render free tier — outbound SMTP 25/465/587 is blocked.
 * @see https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports
 */
const sendViaResend = async ({ from, to, subject, html, text }) => {
  const apiKey = getResendApiKey();
  if (!apiKey) return null;

  const res = await withTimeout(
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from || "PARIWESH <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
        text: text || subject,
      }),
    }),
    15000,
    "Resend API",
  );

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      body?.message ||
      body?.error?.message ||
      `Resend HTTP ${res.status}`;
    throw new Error(detail);
  }

  return { messageId: body?.id || "" };
};

/**
 * Send via Nodemailer SMTP. Often hangs on Render free (SMTP ports blocked).
 */
const sendViaSmtp = async ({ from, to, subject, html, text }) => {
  const tx = getTransporter();
  if (!tx) {
    return { skipped: true, error: "Mail not configured" };
  }

  try {
    const info = await withTimeout(
      tx.sendMail({
        from,
        to,
        subject,
        html,
        text: text || subject,
      }),
      SMTP_SEND_TIMEOUT_MS,
      "SMTP send",
    );
    return { messageId: info.messageId || "" };
  } catch (err) {
    resetTransporter();
    throw err;
  }
};

/**
 * Send email. Never throws to callers — logs and returns { ok, error }.
 * Prefers Resend (HTTPS) when RESEND_API_KEY is set; otherwise SMTP.
 * Every attempt (sent / failed / skipped) is stored for the admin Mail inbox.
 */
export const sendMail = async ({
  to,
  subject,
  html,
  text,
  type = "other",
  meta = {},
}) => {
  const from = resolveFromAddress();

  const baseLog = {
    to: to || "",
    from,
    subject: subject || "(no subject)",
    html: html || "",
    text: text || "",
    type,
    meta,
  };

  try {
    if (!to) {
      await persistEmailLog({
        ...baseLog,
        status: "skipped",
        error: "No recipient email",
      });
      return { ok: false, error: "No recipient email" };
    }

    // Prefer Resend — works on Render free (HTTPS). SMTP is blocked there.
    if (getResendApiKey()) {
      const info = await sendViaResend({ from, to, subject, html, text });
      console.log(
        `[Mail] sent via Resend "${subject}" → ${to} id=${info.messageId}`,
      );
      await persistEmailLog({
        ...baseLog,
        status: "sent",
        messageId: info.messageId || "",
        meta: { ...meta, provider: "resend" },
      });
      return { ok: true, messageId: info.messageId };
    }

    const smtp = await sendViaSmtp({ from, to, subject, html, text });
    if (smtp.skipped) {
      console.warn("[Mail] Nodemailer not configured — skipped:", subject);
      await persistEmailLog({
        ...baseLog,
        status: "skipped",
        error: smtp.error,
      });
      return { ok: false, error: smtp.error };
    }

    console.log(`[Mail] sent "${subject}" → ${to} id=${smtp.messageId}`);
    await persistEmailLog({
      ...baseLog,
      status: "sent",
      messageId: smtp.messageId || "",
      meta: { ...meta, provider: "smtp" },
    });
    return { ok: true, messageId: smtp.messageId };
  } catch (err) {
    resetTransporter();
    const msg = err.message || "Mail send failed";
    console.error("[Mail] send failed:", msg);
    await persistEmailLog({
      ...baseLog,
      status: "failed",
      error: msg,
    });
    return { ok: false, error: msg };
  }
};

export default { sendMail, isMailConfigured };

import nodemailer from "nodemailer";

let transporter = null;

const getMailAuth = () => {
  const user = (process.env.NODEMAILER_USER || "").trim();
  const pass = (process.env.NODEMAILER_PASS || "").trim();
  if (!user || !pass) return null;
  return { user, pass };
};

const buildTransporter = () => {
  const auth = getMailAuth();
  if (!auth) return null;

  const service = (process.env.NODEMAILER_SERVICE || "").trim().toLowerCase();
  const host = (process.env.NODEMAILER_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.NODEMAILER_PORT || 587);

  const shared = {
    auth,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
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

export const isMailConfigured = () => !!getMailAuth();

/**
 * Send email. Never throws to callers — logs and returns { ok, error }.
 */
export const sendMail = async ({ to, subject, html, text }) => {
  try {
    if (!to) {
      return { ok: false, error: "No recipient email" };
    }
    const tx = getTransporter();
    if (!tx) {
      console.warn("[Mail] Nodemailer not configured — skipped:", subject);
      return { ok: false, error: "Mail not configured" };
    }

    const from = (
      process.env.NODEMAILER_FROM ||
      process.env.NODEMAILER_USER ||
      ""
    ).trim();

    const info = await tx.sendMail({
      from,
      to,
      subject,
      html,
      text: text || subject,
    });

    console.log(`[Mail] sent "${subject}" → ${to} id=${info.messageId}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    // Drop cached transport so the next attempt rebuilds a fresh connection
    resetTransporter();
    console.error("[Mail] send failed:", err.message);
    return { ok: false, error: err.message };
  }
};

export default { sendMail, isMailConfigured };

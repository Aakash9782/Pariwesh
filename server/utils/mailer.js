import EmailLog from "../models/EmailLog.js";

/**
 * Check if the selected mail provider is configured correctly.
 */
export const isMailConfigured = () => {
  const provider = (process.env.EMAIL_PROVIDER || "brevo").trim().toLowerCase();
  if (provider === "brevo") {
    const key = (process.env.EMAIL_API_KEY || "").trim();
    const fromAddr = (process.env.EMAIL_FROM_ADDRESS || "").trim();
    const apiUrl = (process.env.EMAIL_API_URL || "").trim();
    return !!(key && fromAddr && apiUrl);
  }
  return false;
};

/**
 * Failure-isolated email logging function.
 */
const persistEmailLog = async (payload) => {
  try {
    await EmailLog.create(payload);
  } catch (err) {
    console.error("[Mail] failed to persist email log:", err.message);
  }
};

/**
 * Send email.
 * This public interface MUST NOT CHANGE.
 * Resolves the provider internally using process.env.EMAIL_PROVIDER.
 * Never throws to callers — logs and returns { ok, error, messageId, provider }.
 */
export const sendMail = async ({
  to,
  subject,
  html,
  text,
  type = "other",
  meta = {},
}) => {
  const provider = (process.env.EMAIL_PROVIDER || "brevo").trim().toLowerCase();

  const fromName = process.env.EMAIL_FROM_NAME || "PARIWESH";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "";
  const from = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

  const baseLog = {
    to: to || "",
    from,
    subject: subject || "(no subject)",
    html: html || "",
    text: text || "",
    type,
    meta,
    provider,
  };

  if (type === "otp") {
    baseLog.html = "OTP email content redacted for security";
    baseLog.text = "OTP email content redacted for security";
  }

  // 1. Recipient Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!to || !emailRegex.test(String(to).trim())) {
    const errorMsg = !to ? "No recipient email" : "Malformed recipient email";
    await persistEmailLog({
      ...baseLog,
      status: "skipped",
      error: errorMsg,
    });
    return { ok: false, error: errorMsg, provider };
  }

  // 2. Configuration Validation
  if (!isMailConfigured()) {
    const userFacingError = "Email service is temporarily unavailable.";
    console.warn(
      `[Mail] Service not configured - skipped: "${subject}" to ${to}`,
    );
    await persistEmailLog({
      ...baseLog,
      status: "skipped",
      error: "Mail provider configuration is invalid or missing.",
    });
    return { ok: false, error: userFacingError, provider };
  }

  // 3. Send via Brevo HTTP API
  if (provider === "brevo") {
    const apiKey = (process.env.EMAIL_API_KEY || "").trim();
    const apiUrl = (
      process.env.EMAIL_API_URL || "https://api.brevo.com/v3/smtp/email"
    ).trim();
    const timeoutMs = Number(process.env.EMAIL_TIMEOUT_MS || 10000);

    const maxAttempts = 3;
    let attempt = 0;
    let latencyMs = 0;
    let statusCode = null;
    let errorMsg = null;
    let messageId = null;
    let ok = false;

    while (attempt < maxAttempts) {
      attempt++;
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": apiKey,
          },
          body: JSON.stringify({
            sender: {
              name: fromName,
              email: fromAddress,
            },
            to: [{ email: to.trim() }],
            subject,
            htmlContent: html,
            textContent: text || subject,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        latencyMs += Date.now() - startTime;
        statusCode = response.status;

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          messageId = data.messageId || "";
          ok = true;
          break;
        } else {
          const errorText = await response.text();
          let parsedError = "";
          try {
            const errorData = JSON.parse(errorText);
            parsedError = errorData.message || errorData.code || errorText;
          } catch {
            parsedError = errorText || `HTTP ${response.status}`;
          }
          errorMsg = `Brevo API error: ${parsedError}`;

          // Non-transient errors: do not retry
          if (statusCode === 400 || statusCode === 401) {
            break;
          }

          if (attempt < maxAttempts) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      } catch (err) {
        latencyMs += Date.now() - startTime;
        const isTimeout = err.name === "AbortError";
        errorMsg = isTimeout
          ? "Brevo API request timed out"
          : err.message || String(err);
        statusCode = isTimeout ? 408 : null;

        if (attempt < maxAttempts) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (ok) {
      console.log(
        `[Mail] sent "${subject}" → ${to} id=${messageId} latency=${latencyMs}ms attempts=${attempt}`,
      );
      await persistEmailLog({
        ...baseLog,
        status: "sent",
        messageId: messageId || "",
        statusCode,
        latencyMs,
        retryCount: attempt - 1,
      });
      return { ok: true, messageId, provider };
    } else {
      console.error(
        `[Mail] Brevo send failed: ${errorMsg} latency=${latencyMs}ms attempts=${attempt}`,
      );
      await persistEmailLog({
        ...baseLog,
        status: "failed",
        error: errorMsg,
        statusCode,
        latencyMs,
        retryCount: attempt - 1,
      });
      return {
        ok: false,
        error: "Unable to send verification email. Please try again.",
        provider,
      };
    }
  }

  // Unsupported provider configuration
  const unsupportedMsg = `Unsupported email provider configured: ${provider}`;
  console.error(`[Mail] ${unsupportedMsg}`);
  await persistEmailLog({
    ...baseLog,
    status: "skipped",
    error: unsupportedMsg,
  });
  return {
    ok: false,
    error: "Email service is temporarily unavailable.",
    provider,
  };
};

export default { sendMail, isMailConfigured };

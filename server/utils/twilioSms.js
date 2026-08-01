import twilio from "twilio";

let client = null;

const getClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  if (!client) {
    client = twilio(accountSid, authToken);
  }
  return client;
};

const explainTwilioError = (code, fallback) => {
  const map = {
    21608:
      "Twilio Trial: is number pe SMS nahi ja sakta. Twilio Console → Verified Caller IDs me yeh number add/verify karo (+91...).",
    21614: "Invalid mobile number for SMS (check country code +91).",
    21211: "Invalid 'To' phone number format.",
    21408:
      "SMS to this country is disabled. Twilio Console → Messaging → Geo Permissions me India enable karo.",
    21610: "This number is blocked / unsubscribed from SMS.",
    30003: "Unreachable phone number (carrier issue).",
    30005: "Unknown destination handset.",
    30006: "Landline or unreachable carrier.",
    30007: "Carrier rejected the message (India DLT / content filter).",
  };
  return map[code] || fallback || `Twilio error ${code}`;
};

/**
 * Send SMS via Twilio Messaging Service.
 * @param {string} toE164 - E.164 number e.g. +919876543210
 * @param {string} body - message text
 */
export const sendSms = async (toE164, body) => {
  const twilioClient = getClient();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!twilioClient || !messagingServiceSid) {
    const err = new Error(
      "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MESSAGING_SERVICE_SID in .env",
    );
    err.code = "TWILIO_NOT_CONFIGURED";
    throw err;
  }

  let message;
  try {
    message = await twilioClient.messages.create({
      body,
      messagingServiceSid,
      to: toE164,
    });
  } catch (e) {
    const err = new Error(
      explainTwilioError(e.code, e.message || "Twilio send failed"),
    );
    err.code = e.code || "TWILIO_SEND_FAILED";
    err.twilioStatus = e.status;
    throw err;
  }

  // Trial / geo failures: status may stay "accepted" while errorCode is already set
  await new Promise((r) => setTimeout(r, 2500));
  try {
    const updated = await twilioClient.messages(message.sid).fetch();
    console.log(
      `[Twilio] to=${updated.to} status=${updated.status} errorCode=${updated.errorCode} sid=${updated.sid}`,
    );

    const deliveryFailed =
      updated.status === "failed" ||
      updated.status === "undelivered" ||
      !!updated.errorCode;

    if (deliveryFailed) {
      const err = new Error(
        explainTwilioError(
          updated.errorCode,
          updated.errorMessage || `SMS ${updated.status}`,
        ),
      );
      err.code = updated.errorCode || "TWILIO_DELIVERY_FAILED";
      throw err;
    }
  } catch (e) {
    if (e.code === "TWILIO_NOT_CONFIGURED") throw e;
    // Re-throw our delivery errors (numeric Twilio codes or TWILIO_*)
    if (
      e.code != null &&
      (String(e.code).match(/^\d+$/) || String(e.code).startsWith("TWILIO_"))
    ) {
      throw e;
    }
    console.warn("[Twilio] status fetch skipped:", e.message);
  }

  return message.sid;
};

export default { sendSms };

import crypto from "crypto";
import Setting from "../models/Setting.js";

const KNOWN_PLACEHOLDER_TOKENS = new Set([
  "",
  "123456",
  "YOUR_TOKEN",
  "YOUR_ACCESS_TOKEN",
  "CHANGE_ME",
  "EAAG_PLACEHOLDER",
]);

export const isPlaceholderToken = (token) => {
  if (!token) return true;
  const clean = String(token).trim().toUpperCase();
  if (KNOWN_PLACEHOLDER_TOKENS.has(clean)) return true;
  if (clean === "123456" || clean.startsWith("YOUR_")) return true;
  return false;
};

/**
 * Normalizes and hashes customer data with SHA-256 according to Meta Conversions API specifications.
 * @param {string|number} value - The raw parameter value
 * @returns {string|null} - SHA-256 hex string or null
 */
export const hashData = (value) => {
  if (!value) return null;
  const cleanStr = String(value).trim().toLowerCase();
  if (!cleanStr) return null;
  return crypto.createHash("sha256").update(cleanStr).digest("hex");
};

/**
 * Normalizes and hashes phone numbers to E.164 specification with SHA-256.
 * @param {string|number} phone - Raw phone number
 * @returns {string|null} - SHA-256 hex string
 */
export const hashPhone = (phone) => {
  if (!phone) return null;
  // Remove non-numeric characters
  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;

  // Prefix India +91 if 10 digits provided
  if (digits.length === 10) {
    digits = "91" + digits;
  }
  return crypto.createHash("sha256").update(digits).digest("hex");
};

/**
 * Retrieves Meta Pixel & CAPI settings from MongoDB with fallback to process.env.
 * @returns {Promise<{pixelId: string, capiToken: string, testEventCode: string, isEnabled: boolean}>}
 */
export const getMetaCapiConfig = async () => {
  try {
    const settings = await Setting.find({
      key: {
        $in: [
          "metaPixelId",
          "metaCapiToken",
          "metaTestEventCode",
          "metaTrackingEnabled",
        ],
      },
    });

    const configMap = {};
    settings.forEach((s) => {
      configMap[s.key] = s.value;
    });

    const pixelId =
      configMap.metaPixelId || process.env.META_PIXEL_ID || "";
    const capiToken =
      configMap.metaCapiToken || process.env.META_CAPI_ACCESS_TOKEN || "";
    const testEventCode =
      configMap.metaTestEventCode || process.env.META_TEST_EVENT_CODE || "";
    const isEnabled =
      configMap.metaTrackingEnabled !== undefined
        ? configMap.metaTrackingEnabled === "true" || configMap.metaTrackingEnabled === true
        : process.env.META_TRACKING_ENABLED !== "false";

    const hasValidToken = Boolean(capiToken && !isPlaceholderToken(capiToken));

    return {
      pixelId: pixelId.trim(),
      capiToken: capiToken.trim(),
      testEventCode: testEventCode.trim(),
      isEnabled: Boolean(isEnabled && pixelId && hasValidToken),
    };
  } catch (err) {
    console.error("[Meta CAPI] Error loading settings:", err.message);
    const fallbackPixelId = process.env.META_PIXEL_ID || "";
    const fallbackToken = process.env.META_CAPI_ACCESS_TOKEN || "";
    const hasValidToken = Boolean(fallbackToken && !isPlaceholderToken(fallbackToken));
    return {
      pixelId: fallbackPixelId.trim(),
      capiToken: fallbackToken.trim(),
      testEventCode: (process.env.META_TEST_EVENT_CODE || "").trim(),
      isEnabled: Boolean(fallbackPixelId && hasValidToken),
    };
  }
};

/**
 * Sends a server-side event to Meta Conversions API via Graph API.
 * This is non-blocking (fire-and-forget safe).
 * 
 * @param {Object} params
 * @param {string} params.eventName - Standard event name (e.g. 'Purchase', 'InitiateCheckout', 'CompleteRegistration')
 * @param {string} params.eventId - Deduplication event ID matching the browser Pixel eventID
 * @param {Object} params.userData - Customer data (email, phone, name, city, etc.)
 * @param {Object} params.customData - Event specific payload (value, currency, contents, etc.)
 * @param {Object} [params.req] - Express request object to extract client IP and user agent
 * @param {string} [params.eventSourceUrl] - URL where event took place
 * @returns {Promise<Object>} - API response or null
 */
export const sendMetaCapiEvent = async ({
  eventName,
  eventId,
  userData = {},
  customData = {},
  req = null,
  eventSourceUrl = "https://pariwesh.in",
  pixelId = null,
  capiToken = null,
  testEventCode = null,
}) => {
  try {
    const config = await getMetaCapiConfig();
    const effectivePixelId = (pixelId || config.pixelId || "").trim();
    const effectiveToken = (capiToken || config.capiToken || "").trim();
    const effectiveTestCode =
      testEventCode !== null ? String(testEventCode).trim() : config.testEventCode;

    if (!effectivePixelId || !effectiveToken || isPlaceholderToken(effectiveToken)) {
      if (effectiveToken && isPlaceholderToken(effectiveToken)) {
        console.warn(`[Meta CAPI] Skipping dispatch: detected placeholder access token ("${effectiveToken}"). Configure a real Meta Access Token in Admin Settings.`);
      }
      return null;
    }

    // Extract client IP and user agent
    let clientIp = null;
    let userAgent = null;

    if (req) {
      clientIp =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        null;
      userAgent = req.headers["user-agent"] || null;
    }

    // Format User Data according to Meta specifications
    const formattedUserData = {
      em: userData.email ? [hashData(userData.email)] : undefined,
      ph: userData.phone ? [hashPhone(userData.phone)] : undefined,
      fn: userData.firstName ? [hashData(userData.firstName)] : undefined,
      ln: userData.lastName ? [hashData(userData.lastName)] : undefined,
      ct: userData.city ? [hashData(userData.city)] : undefined,
      st: userData.state ? [hashData(userData.state)] : undefined,
      zp: userData.pincode ? [hashData(userData.pincode)] : undefined,
      country: userData.country ? [hashData(userData.country || "in")] : [hashData("in")],
      client_ip_address: clientIp || userData.clientIp || undefined,
      client_user_agent: userAgent || userData.userAgent || undefined,
      fbp: userData.fbp || (req?.headers ? req.headers["x-fbp"] : undefined) || undefined,
      fbc: userData.fbc || (req?.headers ? req.headers["x-fbc"] : undefined) || undefined,
    };

    // Clean undefined fields from user_data
    Object.keys(formattedUserData).forEach((k) => {
      if (formattedUserData[k] === undefined) {
        delete formattedUserData[k];
      }
    });

    const eventPayload = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: eventSourceUrl,
      action_source: "website",
      user_data: formattedUserData,
      custom_data: {
        currency: "INR",
        ...customData,
      },
    };

    const requestBody = {
      data: [eventPayload],
    };

    if (effectiveTestCode) {
      requestBody.test_event_code = effectiveTestCode;
    }

    const apiUrl = `https://graph.facebook.com/v19.0/${effectivePixelId}/events?access_token=${effectiveToken}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[Meta CAPI] API error response:", responseData);
      return { success: false, error: responseData };
    }

    console.log(`[Meta CAPI] ✅ Sent event "${eventName}" with event_id: "${eventId}" (Events received: ${responseData.events_received})`);
    return { success: true, data: responseData };
  } catch (err) {
    // Non-blocking: catch and log to guarantee host process is never broken
    console.error(`[Meta CAPI] Failed sending event "${eventName}":`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Specialized helper to format & send a Purchase event via CAPI.
 * @param {Object} order - Full order object from MongoDB
 * @param {Object} [req] - Express request object for IP & headers
 * @param {Object} [extraData] - Optional overrides (e.g. fbp, fbc)
 */
export const trackCapiPurchase = async (order, req = null, extraData = {}) => {
  if (!order || !order.orderId) return;

  const customer = order.customer || {};
  const shipping = order.shippingAddress || {};
  const fullName = shipping.fullName || customer.name || "";
  const nameParts = fullName.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const contents = (order.items || []).map((item) => ({
    id: item.sku || item.productId || String(item._id),
    title: item.name,
    quantity: item.quantity || 1,
    item_price: item.price || 0,
  }));

  const numItems = (order.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 1),
    0
  );

  return sendMetaCapiEvent({
    eventName: "Purchase",
    eventId: `order_${order.orderId}`,
    userData: {
      email: customer.email || shipping.email || "",
      phone: customer.phone || shipping.phone || "",
      firstName,
      lastName,
      city: shipping.city || "",
      state: shipping.state || "",
      pincode: shipping.pincode || "",
      country: "in",
      fbp: extraData.fbp || order.metaTracking?.fbp,
      fbc: extraData.fbc || order.metaTracking?.fbc,
    },
    customData: {
      value: order.pricing?.grandTotal || 0,
      currency: "INR",
      content_type: "product",
      contents,
      num_items: numItems,
      order_id: order.orderId,
      payment_method: order.paymentMethod || "COD",
    },
    req,
    eventSourceUrl: "https://pariwesh.in/cart",
  });
};

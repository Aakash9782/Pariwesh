/**
 * Meta Pixel (Facebook Pixel) Client-Side Tracking Service for PARIWESH
 * Supports high-accuracy event dispatching, cookie extraction (_fbp, _fbc),
 * deduplication event IDs, and 3-Layer anti-duplication guards for page refreshes.
 */

let isInitialized = false;
let currentPixelId = null;

/**
 * Extracts a specific cookie value by name from document.cookie
 * @param {string} name - Cookie name (e.g. '_fbp', '_fbc')
 * @returns {string|null}
 */
export const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
};

/**
 * Extracts or generates Meta tracking cookies (_fbp and _fbc).
 * Captures `fbclid` from URL params to populate `_fbc` if available.
 * @returns {{ fbp: string|null, fbc: string|null }}
 */
export const getMetaTrackingCookies = () => {
  if (typeof window === "undefined") return { fbp: null, fbc: null };

  let fbp = getCookie("_fbp");
  let fbc = getCookie("_fbc");

  // If no _fbc cookie yet, check if current URL has fbclid
  if (!fbc && typeof window.location !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get("fbclid");
    if (fbclid) {
      const creationTime = Date.now();
      fbc = `fb.1.${creationTime}.${fbclid}`;
    }
  }

  return { fbp, fbc };
};

/**
 * Dynamically initializes the Meta Pixel script
 * @param {string} pixelId - Meta Pixel ID
 */
export const initMetaPixel = (pixelId) => {
  if (!pixelId || typeof window === "undefined") return;

  if (isInitialized && currentPixelId === pixelId) {
    return;
  }

  currentPixelId = pixelId;

  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js"
  );
  /* eslint-enable */

  window.fbq("init", pixelId);
  isInitialized = true;
  console.log(`[Meta Pixel] Initialized with Pixel ID: ${pixelId}`);
};

/**
 * Dispatches a standard or custom Meta Pixel event
 * @param {string} eventName - Standard event name (e.g. 'PageView', 'Purchase')
 * @param {Object} [params] - Event parameters
 * @param {string} [eventId] - Unique Event ID for Deduplication with CAPI
 */
export const trackPixelEvent = (eventName, params = {}, eventId = null) => {
  if (typeof window === "undefined" || !window.fbq) {
    return;
  }

  try {
    if (eventId) {
      window.fbq("track", eventName, params, { eventID: eventId });
      console.log(`[Meta Pixel] Tracked "${eventName}" with eventID: "${eventId}"`, params);
    } else {
      window.fbq("track", eventName, params);
      console.log(`[Meta Pixel] Tracked "${eventName}"`, params);
    }
  } catch (err) {
    console.warn(`[Meta Pixel] Error tracking "${eventName}":`, err.message);
  }
};

/**
 * Track PageView on SPA route change
 */
export const trackPageView = (path) => {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("track", "PageView");
  } catch (err) {
    console.warn("[Meta Pixel] PageView error:", err.message);
  }
};

/**
 * Track ViewContent when a product details page is viewed
 * @param {Object} product
 */
export const trackViewContent = (product) => {
  if (!product) return;
  trackPixelEvent("ViewContent", {
    content_name: product.name,
    content_ids: [product.sku || product._id || ""],
    content_type: "product",
    content_category: product.category?.name || product.category || "Ethnic Wear",
    value: Number(product.price) || 0,
    currency: "INR",
  });
};

/**
 * Track AddToCart on clicking Add to Bag or Buy Now
 * @param {Object} product
 * @param {number} quantity
 * @param {string} size
 * @param {string} color
 */
export const trackAddToCart = (product, quantity = 1, size = "", color = "") => {
  if (!product) return;
  const price = Number(product.price) || 0;
  trackPixelEvent("AddToCart", {
    content_name: product.name,
    content_ids: [product.sku || product._id || ""],
    content_type: "product",
    value: price * Number(quantity || 1),
    currency: "INR",
    num_items: Number(quantity || 1),
    contents: [
      {
        id: product.sku || product._id || "",
        quantity: Number(quantity || 1),
        item_price: price,
        size,
        color,
      },
    ],
  });
};

/**
 * Track AddToWishlist on clicking wishlist heart
 * @param {Object} product
 */
export const trackAddToWishlist = (product) => {
  if (!product) return;
  trackPixelEvent("AddToWishlist", {
    content_name: product.name,
    content_ids: [product.sku || product._id || ""],
    content_type: "product",
    value: Number(product.price) || 0,
    currency: "INR",
  });
};

/**
 * Track InitiateCheckout when customer proceeds to checkout step
 * @param {Array} cartItems
 * @param {number} totalAmount
 * @param {string} [eventId]
 */
export const trackInitiateCheckout = (cartItems = [], totalAmount = 0, eventId = null) => {
  const contents = (cartItems || []).map((item) => ({
    id: item.sku || item.productId || item._id,
    quantity: Number(item.quantity || 1),
    item_price: Number(item.price || 0),
  }));

  const numItems = (cartItems || []).reduce(
    (sum, item) => sum + Number(item.quantity || 1),
    0
  );

  trackPixelEvent(
    "InitiateCheckout",
    {
      content_type: "product",
      contents,
      num_items: numItems,
      value: Number(totalAmount || 0),
      currency: "INR",
    },
    eventId
  );
};

/**
 * Track AddPaymentInfo when selecting payment method
 * @param {string} paymentMethod - 'COD' or 'ONLINE'
 * @param {number} totalAmount
 */
export const trackAddPaymentInfo = (paymentMethod, totalAmount = 0) => {
  trackPixelEvent("AddPaymentInfo", {
    currency: "INR",
    value: Number(totalAmount || 0),
    payment_method: paymentMethod,
  });
};

/**
 * Track Purchase event on order completion with SessionStorage Guard
 * Prevents duplicate firing on page refreshes or back navigation.
 * 
 * @param {Object} params
 * @param {string} params.orderId - Unique Order ID (e.g. 'PRW-2026-123456')
 * @param {number} params.value - Grand total value
 * @param {Array} params.items - Purchased items array
 * @param {string} params.paymentMethod - COD or ONLINE
 */
export const trackPurchase = ({
  orderId,
  value,
  items = [],
  paymentMethod = "COD",
}) => {
  if (!orderId) return;

  // LAYER 1: Anti-Duplication Refresh Guard
  const storageKey = `meta_purchase_tracked_${orderId}`;
  try {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(storageKey)) {
      console.log(`[Meta Pixel] Purchase event for order ${orderId} was already tracked in this session. Skipping duplicate.`);
      return;
    }
  } catch (e) {
    // Continue if sessionStorage is restricted
  }

  const contents = (items || []).map((item) => ({
    id: item.sku || item.productId || item._id,
    quantity: Number(item.quantity || 1),
    item_price: Number(item.price || 0),
  }));

  const numItems = (items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 1),
    0
  );

  // Use matching event_id: order_{orderId} for 100% CAPI deduplication
  const eventId = `order_${orderId}`;

  trackPixelEvent(
    "Purchase",
    {
      content_type: "product",
      contents,
      num_items: numItems,
      value: Number(value || 0),
      currency: "INR",
      order_id: orderId,
      payment_method: paymentMethod,
    },
    eventId
  );

  // Set deduplication flag in session storage
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(storageKey, "true");
    }
  } catch (e) {
    // Ignore storage quota or disabled storage
  }
};

/**
 * Track Search event
 * @param {string} query
 */
export const trackSearch = (query) => {
  if (!query) return;
  trackPixelEvent("Search", {
    search_string: query,
  });
};

/**
 * Track CompleteRegistration on user signup
 * @param {Object} [user]
 */
export const trackCompleteRegistration = (user = null) => {
  const eventId = user?._id ? `reg_${user._id}` : null;
  trackPixelEvent(
    "CompleteRegistration",
    {
      status: true,
      content_name: "User Signup",
    },
    eventId
  );
};

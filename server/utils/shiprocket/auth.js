import dotenv from "dotenv";
dotenv.config();

let cachedToken = null;
let tokenExpiresAt = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Gets the Shiprocket base URL from env OR defaults to production v2 URL.
 */
export const getApiBase = () => {
  return process.env.SHIPROCKET_API_BASE || "https://apiv2.shiprocket.in";
};

/**
 * Transient error retry wrapper.
 * Retries for 429, 500, 502, 503, 504, network error, or timeout.
 * Max 3 retries, exponential backoff.
 */
export const requestWithRetry = async (
  url,
  options = {},
  retries = 3,
  backoff = 1000,
) => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const response = await globalThis.fetch(url, options);
      const isTransient = [429, 500, 502, 503, 504].includes(response.status);

      if (isTransient && attempt <= retries) {
        console.warn(
          `[Shiprocket API] Transient error ${response.status} on attempt ${attempt}. Retrying in ${backoff}ms...`,
        );
        await delay(backoff);
        backoff *= 2;
        continue;
      }
      return response;
    } catch (error) {
      const isTimeoutOrNetwork =
        error.name === "AbortError" ||
        error.message.includes("fetch") ||
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT";

      if (isTimeoutOrNetwork && attempt <= retries) {
        console.warn(
          `[Shiprocket API] Network/Timeout error on attempt ${attempt}. Retrying in ${backoff}ms...`,
          error.message,
        );
        await delay(backoff);
        backoff *= 2;
        continue;
      }
      throw error;
    }
  }
};

/**
 * Ensures clean retrieval and in-memory caching of JWT token.
 * Cache is set to 9 days to ensure non-expired reuse.
 */
export const getShiprocketToken = async () => {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  const bufferSeconds =
    Number(process.env.SHIPROCKET_TOKEN_REFRESH_BUFFER) || 300;

  if (!email || !password) {
    throw new Error(
      "Shiprocket credentials (email/password) are not configured in environment.",
    );
  }

  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - bufferSeconds * 1000) {
    return cachedToken;
  }

  console.log("[Shiprocket API] Authenticating to get fresh JWT token...");
  const base = getApiBase();
  const url = `${base}/v1/external/auth/login`;

  try {
    const res = await requestWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Auth failed with status ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    if (!data.token) {
      throw new Error("Token field missing in Shiprocket auth response.");
    }

    cachedToken = data.token;
    tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
    return cachedToken;
  } catch (error) {
    console.error(
      "[Shiprocket API] Failed to fetch auth token:",
      error.message,
    );
    throw error;
  }
};

/**
 * Resets authentication caches. Useful for test suites isolation.
 */
export const clearAuthCache = () => {
  cachedToken = null;
  tokenExpiresAt = 0;
};

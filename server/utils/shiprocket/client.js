import { getShiprocketToken, getApiBase, requestWithRetry } from "./auth.js";

export { getApiBase, requestWithRetry };

/**
 * Shared method to perform authenticated Shiprocket API calls.
 */
export const authorizedRequest = async (endpoint, options = {}) => {
  const token = await getShiprocketToken();
  const base = getApiBase();
  const url = `${base}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  return requestWithRetry(url, { ...options, headers });
};

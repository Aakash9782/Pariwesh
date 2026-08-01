import jwt from "jsonwebtoken";

/**
 * JWT helpers — secrets and expiry must come from env (no hardcoded fallbacks).
 */

export const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || !String(secret).trim()) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }
  return String(secret).trim();
};

export const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret || !String(secret).trim()) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }
  return String(secret).trim();
};

export const getAccessExpiry = () => {
  const expiry = process.env.JWT_ACCESS_EXPIRY;
  if (!expiry || !String(expiry).trim()) {
    throw new Error("JWT_ACCESS_EXPIRY is not configured");
  }
  return String(expiry).trim();
};

export const getRefreshExpiry = () => {
  const expiry = process.env.JWT_REFRESH_EXPIRY;
  if (!expiry || !String(expiry).trim()) {
    throw new Error("JWT_REFRESH_EXPIRY is not configured");
  }
  return String(expiry).trim();
};

export const signAccessToken = (id) =>
  jwt.sign({ id }, getAccessSecret(), { expiresIn: getAccessExpiry() });

export const signRefreshToken = (id) =>
  jwt.sign({ id }, getRefreshSecret(), { expiresIn: getRefreshExpiry() });

export const verifyAccessToken = (token) =>
  jwt.verify(token, getAccessSecret());

export const verifyRefreshToken = (token) =>
  jwt.verify(token, getRefreshSecret());

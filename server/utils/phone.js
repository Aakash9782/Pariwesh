/**
 * Normalize Indian mobile numbers to 10 digits.
 */
export const normalizePhone = (phone) => {
  if (!phone) return "";
  let cleanPhone = String(phone).replace(/\D/g, "");

  if (cleanPhone.startsWith("91") && cleanPhone.length > 10) {
    cleanPhone = cleanPhone.substring(2);
  }
  if (cleanPhone.length > 10) {
    cleanPhone = cleanPhone.slice(-10);
  }
  return cleanPhone;
};

/**
 * Build E.164 for Twilio (default India +91).
 */
export const toE164 = (tenDigitPhone) => {
  const country = (process.env.TWILIO_DEFAULT_COUNTRY_CODE || "91").replace(
    /^\+/,
    "",
  );
  return `+${country}${tenDigitPhone}`;
};

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

export const getAdminPhones = () => {
  const fromEnv = process.env.ADMIN_PHONES || "";
  const list = fromEnv
    .split(",")
    .map((p) => normalizePhone(p.trim()))
    .filter(Boolean);
  return list;
};

export const isAdminPhone = (phone) =>
  getAdminPhones().includes(normalizePhone(phone));

/** Explicit admin emails only (comma-separated in ADMIN_EMAILS). */
export const getAdminEmails = () => {
  const fromEnv = process.env.ADMIN_EMAILS || "";
  return fromEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
};

export const isAdminEmail = (email) =>
  getAdminEmails().includes(String(email || "").trim().toLowerCase());

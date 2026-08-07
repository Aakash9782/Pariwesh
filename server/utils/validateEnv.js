/**
 * Fail fast on missing required env (B4 / B8).
 * Call after dotenv.config() and before app.listen().
 */
export const validateRequiredEnv = () => {
  const required = [
    "MONGO_URI",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_ACCESS_EXPIRY",
    "JWT_REFRESH_EXPIRY",
  ];

  const missing = required.filter((key) => {
    const val = process.env[key];
    return !val || !String(val).trim();
  });

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`,
    );
    console.error(
      "   Copy Pariwesh/.env.example → server/.env and fill in values.",
    );
    process.exit(1);
  }

  // Soft warnings for production-ish misconfig
  if (process.env.JWT_SECRET) {
    console.warn(
      "[Env] JWT_SECRET is ignored — use JWT_ACCESS_SECRET / JWT_REFRESH_SECRET only.",
    );
  }

  // Shiprocket soft validation
  const shiprocketRequired = [
    "SHIPROCKET_EMAIL",
    "SHIPROCKET_PASSWORD",
    "SHIPROCKET_PICKUP_LOCATION",
  ];
  const missingShiprocket = shiprocketRequired.filter((key) => {
    const val = process.env[key];
    return !val || !String(val).trim();
  });
  if (missingShiprocket.length > 0) {
    console.warn(
      `⚠️  [Shiprocket] Missing environment variables: ${missingShiprocket.join(", ")}`,
    );
    console.warn(
      "   Shiprocket automation features will log failures and bypass API actions until configured.",
    );
  }
};

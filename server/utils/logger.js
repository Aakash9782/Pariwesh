import ActivityLog from "../models/ActivityLog.js";

/**
 * Reusable utility to log admin activity in the database.
 * Captures name, action, timestamp, IP, and client agent device information.
 */
export const logAdminActivity = async (req, action) => {
  try {
    const adminName = req.user?.name || "System Admin";
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.ip ||
      req.socket?.remoteAddress ||
      "127.0.0.1";
    const device = req.headers["user-agent"] || "Chrome / Windows";

    await ActivityLog.create({
      adminName,
      action,
      ipAddress,
      device,
    });
  } catch (error) {
    console.error("Failed writing activity log:", error);
  }
};

// Also support logActivity alias for existing references
export const logActivity = logAdminActivity;

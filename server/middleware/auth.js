import User from "../models/User.js";
import { sendError } from "../utils/responseFormatter.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = verifyAccessToken(token);
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return sendError(res, "User not found with this token", 401);
      }
      if (req.user.status === "suspended") {
        return sendError(
          res,
          "Your account has been suspended by administration. Please contact support.",
          403,
        );
      }
      next();
    } catch (error) {
      if (error.message?.includes("JWT_ACCESS_SECRET")) {
        return sendError(res, "Server auth is misconfigured", 500);
      }
      return sendError(res, "Not authorized, token validation failed", 401);
    }
  }

  if (!token) {
    return sendError(res, "Not authorized, no token provided", 401);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(
        res,
        `User role (${req.user?.role || "none"}) is not authorized to access this route`,
        403,
      );
    }
    next();
  };
};

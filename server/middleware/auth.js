import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendError } from "../utils/responseFormatter.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET ||
          process.env.JWT_SECRET ||
          "super_secret_access_leher_fashion_2026_dev_key",
      );
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return sendError(res, "User not found with this token", 401);
      }
      next();
    } catch (error) {
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

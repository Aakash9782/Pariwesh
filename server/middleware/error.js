import ErrorResponse from "../utils/errorHandler.js";
import { sendResponse } from "../utils/responseFormatter.js";

const errorHandlerMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev environment
  if (process.env.NODE_ENV === "development") {
    console.error("🔥 Error caught inside middleware:", err);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === "CastError") {
    const message = `Resource not found with code/id: ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key (11000 code)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate entered for ${field} field. Value: ${err.keyValue[field]} must be unique.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new ErrorResponse(message, 400);
  }

  // JWT validation errors
  if (err.name === "JsonWebTokenError") {
    error = new ErrorResponse(
      "Invalid signature. Authentication token is invalid",
      401,
    );
  }

  if (err.name === "TokenExpiredError") {
    error = new ErrorResponse(
      "Signature expired. Session expired, please login again.",
      401,
    );
  }

  // Response structure formatting
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  return sendResponse(res, statusCode, false, message);
};

export default errorHandlerMiddleware;

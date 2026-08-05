import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import errorHandlerMiddleware from "./middleware/error.js";
import { sendSuccess } from "./utils/responseFormatter.js";
import ErrorResponse from "./utils/errorHandler.js";
import { isMailConfigured } from "./utils/mailer.js";

import settingRouter from "./routes/settingRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import productRouter from "./routes/productRoutes.js";
import couponRouter from "./routes/couponRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import userRouter from "./routes/userRoutes.js";
import logRouter from "./routes/logRoutes.js";
import returnRouter from "./routes/returnRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import collectionRouter from "./routes/collectionRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import wishlistRouter from "./routes/wishlistRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import brandRouter from "./routes/brandRoutes.js";
import emailRouter from "./routes/emailRoutes.js";
import seoRouter from "./routes/seoRoutes.js";

const app = express();

// Render / reverse proxies set X-Forwarded-For. Required for express-rate-limit
// to identify clients correctly (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR).
app.set("trust proxy", 1);

// 1. SECURITY MIDDLEWARES
app.use(
  helmet({
    contentSecurityPolicy: false, // Ensure CSP doesn't block local dev tools or assets
    crossOriginEmbedderPolicy: false,
    // Allow Vercel (and other frontends) to read API responses cross-origin
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS config — Vercel + custom domains
const whitelist = [
  "https://pariwesh.com",
  "https://www.pariwesh.com",
  "https://pariwesh.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

if (process.env.FRONTEND_URL) {
  whitelist.push(String(process.env.FRONTEND_URL).trim().replace(/\/$/, ""));
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without Origin headers (postman, fetch calls in dev)
    if (!origin) return callback(null, true);

    const normalized = origin.trim().replace(/\/$/, "");
    const isDomainAllowed =
      whitelist.some((domain) => normalized === domain) ||
      normalized.endsWith(".vercel.app");

    if (isDomainAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] blocked origin: ${origin}`);
      callback(
        new Error(
          "CORS rejection: Origin unauthorized for PARIWESH API access",
        ),
      );
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));
// Express 4 + cors: ensure preflight is handled for all routes
app.options("*", cors(corsOptions));

// 2. LOGGING MIDDLEWARE
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// 3. OPTIMIZATION MIDDLEWARES
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. RATE LIMITING
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 10000 : 100, // Use a very high limit in dev mode
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP. Please try again after 15 minutes.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 10000 : 10, // Max 10 login attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many authentication requests from this IP. Please try again after 15 minutes.",
  },
});

app.use("/api/", apiLimiter);
app.use("/api/v1/users/login", authLimiter);
app.use("/api/v1/users/register", authLimiter);
app.use("/api/v1/users/verify-otp", authLimiter);
app.use("/api/v1/users/resend-otp", authLimiter);

// 5. TEST/HEALTH ROUTE
app.get("/api/v1/health", (req, res) => {
  return sendSuccess(res, "PARIWESH API Server is healthy and running.", {
    status: "UP",
    uptime: process.uptime(),
    nodeEnv: process.env.NODE_ENV,
  });
});

app.get("/api/v1/email/health", (req, res) => {
  const provider = process.env.EMAIL_PROVIDER || "smtp";
  const isValid = isMailConfigured();
  return res.status(200).json({
    success: true,
    provider,
    configured: isValid,
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pariwesh API is Running 🚀",
  });
});

// 6. ROUTE REGISTRATIONS
app.use("/api/v1/settings", settingRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/logs", logRouter);
app.use("/api/v1/returns", returnRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/collections", collectionRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/emails", emailRouter);
app.use("/api/v1/seo", seoRouter);

// 7. 404 HANDLER
app.use("*", (req, res, next) => {
  next(new ErrorResponse(`Endpoint not found: ${req.originalUrl}`, 404));
});

// 8. ERROR HANDLER MIDDLEWARE
app.use(errorHandlerMiddleware);

export default app;

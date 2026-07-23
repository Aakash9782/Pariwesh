import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import errorHandlerMiddleware from "./middleware/error.js";
import { sendSuccess } from "./utils/responseFormatter.js";
import ErrorResponse from "./utils/errorHandler.js";

import settingRouter from "./routes/settingRoutes.js";

const app = express();

// 1. SECURITY MIDDLEWARES
app.use(helmet());

// CORS config
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));

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
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP. Please try again after 15 minutes.",
  },
});
app.use("/api/", apiLimiter);

// 5. TEST/HEALTH ROUTE
app.get("/api/v1/health", (req, res) => {
  return sendSuccess(res, "PRIWESH API Server is healthy and running.", {
    status: "UP",
    uptime: process.uptime(),
    nodeEnv: process.env.NODE_ENV,
  });
});

// 6. ROUTE REGISTRATIONS
app.use("/api/v1/settings", settingRouter);
// app.use('/api/v1/auth', authRouter);
// app.use('/api/v1/products', productRouter);
// app.use('/api/v1/orders', orderRouter);

// 7. 404 HANDLER
app.use("*", (req, res, next) => {
  next(new ErrorResponse(`Endpoint not found: ${req.originalUrl}`, 404));
});

// 8. ERROR HANDLER MIDDLEWARE
app.use(errorHandlerMiddleware);

export default app;

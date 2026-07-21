import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

// Setup environment settings
dotenv.config();

// Connect database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
});

// Capture unexpected system exceptions to run clean shutdowns
process.on("unhandledRejection", (err, promise) => {
  console.error(`🔥 Unhandled Rejection Error: ${err.message}`);
  // Gracefully close server & exit process
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error(`🔥 Uncaught Exception Error: ${err.message}`);
  // Gracefull exit
  process.exit(1);
});

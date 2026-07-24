import dotenv from "dotenv";
import { exec } from "child_process";
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

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `⚠️ Port ${PORT} is already in use. Automatically freeing port...`,
    );
    exec(`netstat -aon | findstr :${PORT}`, (netstatErr, stdout) => {
      if (netstatErr || !stdout) {
        console.error(
          "❌ Failed to query conflicting process. Please clear it manually.",
        );
        process.exit(1);
      }

      const lines = stdout.split("\n");
      const pids = new Set();
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          if (/^\d+$/.test(pid) && pid !== "0") {
            pids.add(pid);
          }
        }
      });

      if (pids.size === 0) {
        console.error("❌ No active process ID found using the port.");
        process.exit(1);
      }

      let killedCount = 0;
      pids.forEach((pid) => {
        exec(`taskkill /f /pid ${pid}`, (killErr) => {
          killedCount++;
          if (killErr) {
            console.error(`❌ Failed to kill process ${pid}.`);
          } else {
            console.log(
              `✅ Successfully terminated process ${pid} utilizing port ${PORT}.`,
            );
          }
          if (killedCount === pids.size) {
            console.log(
              `✅ All conflicting processes terminated. Nodemon will auto-restart.`,
            );
            process.exit(0);
          }
        });
      });
    });
  } else {
    console.error("🔥 Server Error:", err);
  }
});

// Capture unexpected system exceptions to run clean shutdowns
process.on("unhandledRejection", (err, promise) => {
  console.error(`🔥 Unhandled Rejection Error:`, err);
  // Log the error but do not exit process so Render server stays online.
});

process.on("uncaughtException", (err) => {
  console.error(`🔥 Uncaught Exception Error:`, err);
  // Log the error but do not exit process so Render server stays online.
});

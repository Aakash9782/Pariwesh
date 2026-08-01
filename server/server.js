import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import app from "./app.js";
import connectDB from "./config/db.js";
import { validateRequiredEnv } from "./utils/validateEnv.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Root .env first, then server/.env (overrides)
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

validateRequiredEnv();

// Connect database
connectDB();

const PORT = process.env.PORT || 5001;

const killPortOccupant = (port) => {
  const isWin = process.platform === "win32";
  if (isWin) {
    exec(`netstat -aon | findstr :${port}`, (netstatErr, stdout) => {
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
              `✅ Successfully terminated process ${pid} utilizing port ${port}.`,
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
    return;
  }

  // macOS / Linux
  exec(`lsof -ti tcp:${port}`, (err, stdout) => {
    if (err || !stdout.trim()) {
      console.error(
        `❌ Failed to find process on port. Clear it manually (lsof -i :${port}).`,
      );
      process.exit(1);
    }
    const pids = [
      ...new Set(
        stdout
          .split("\n")
          .map((p) => p.trim())
          .filter(Boolean),
      ),
    ];
    let done = 0;
    pids.forEach((pid) => {
      exec(`kill -9 ${pid}`, (killErr) => {
        done++;
        if (killErr) {
          console.error(`❌ Failed to kill process ${pid}.`);
        } else {
          console.log(`✅ Terminated process ${pid} on port ${port}.`);
        }
        if (done === pids.length) {
          console.log(
            "✅ Port freed. Nodemon will auto-restart if watching.",
          );
          process.exit(0);
        }
      });
    });
  });
};

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
    killPortOccupant(PORT);
  } else {
    console.error("🔥 Server Error:", err);
  }
});

process.on("unhandledRejection", (err) => {
  console.error(`🔥 Unhandled Rejection Error:`, err);
});

process.on("uncaughtException", (err) => {
  console.error(`🔥 Uncaught Exception Error:`, err);
});

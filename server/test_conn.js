import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

console.log("📡 Attempting check to MONGO_URI in .env...");
if (!process.env.MONGO_URI) {
  console.log("❌ MONGO_URI is missing");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("✅ Success! Database connected.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Failed database connection:", err.message);
    process.exit(1);
  });

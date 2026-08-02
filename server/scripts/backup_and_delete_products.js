import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Setting from "../models/Setting.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env"), override: true });

const backupAndDelete = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not defined in environment");
    }

    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Database Connected.");

    // 1. Export Products backup to JSON file
    console.log("📁 Fetching products for backup...");
    const products = await Product.find({});
    console.log(`🔍 Found ${products.length} products.`);

    const backupPath = path.join(__dirname, "../products_backup.json");
    fs.writeFileSync(backupPath, JSON.stringify(products, null, 2), "utf8");
    console.log(`💾 Backup saved to ${backupPath}`);

    // 2. Clean Product collection
    console.log("🧹 Deleting all products from Product collection...");
    const result = await Product.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} products.`);

    // 3. Set seeded_products flag in Settings collection to true if not already set
    console.log("⚙️ Setting 'seeded_products' flag in Settings...");
    await Setting.findOneAndUpdate(
      { key: "seeded_products" },
      { key: "seeded_products", value: "true" },
      { upsert: true, new: true },
    );
    console.log(
      "✅ Flag set to true. Server will not auto-seed on clean start.",
    );

    console.log("\n🚀 DATABASE CLEANING COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Action failed with error:", error);
    process.exit(1);
  }
};

backupAndDelete();

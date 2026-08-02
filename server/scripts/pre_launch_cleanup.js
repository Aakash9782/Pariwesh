import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import mongoose from "mongoose";

// Import models
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Wishlist from "../models/Wishlist.js";
import Cart from "../models/Cart.js";
import ReturnRequest from "../models/ReturnRequest.js";
import Coupon from "../models/Coupon.js";
import Setting from "../models/Setting.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env"), override: true });

const preLaunchCleanup = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not defined in environment");
    }

    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Database Connected.");

    const backupsDir = path.join(__dirname, "../backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
      console.log(`📁 Created backups directory at: ${backupsDir}`);
    }

    const helperBackup = async (model, query, fileName) => {
      console.log(`📁 Fetching records for ${fileName} backup...`);
      const data = await model.find(query);
      console.log(`🔍 Found ${data.length} records.`);

      const filePath = path.join(backupsDir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      console.log(`💾 Saved backup to ${filePath}`);
      return data.length;
    };

    // 1. BACKUPS
    await helperBackup(Product, {}, "products_backup.json");
    await helperBackup(Order, {}, "orders_backup.json");
    await helperBackup(User, { role: "customer" }, "customers_backup.json");
    await helperBackup(Wishlist, {}, "wishlists_backup.json");
    await helperBackup(Cart, {}, "carts_backup.json");
    await helperBackup(ReturnRequest, {}, "returns_backup.json");
    await helperBackup(Coupon, {}, "coupons_backup.json");

    console.log("\n----------------------------------------");
    console.log("🧹 COMMENCING DETAILED CLEANUP...");
    console.log("----------------------------------------");

    // 2. DELETION
    // A. Products
    const delProducts = await Product.deleteMany({});
    console.log(`🗑️ Deleted ${delProducts.deletedCount} products.`);

    // B. Orders
    const delOrders = await Order.deleteMany({});
    console.log(`🗑️ Deleted ${delOrders.deletedCount} orders.`);

    // C. Customers (only role: "customer")
    const delCustomers = await User.deleteMany({ role: "customer" });
    console.log(
      `🗑️ Deleted ${delCustomers.deletedCount} customer user accounts.`,
    );

    // D. Carts
    const delCarts = await Cart.deleteMany({});
    console.log(`🗑️ Deleted ${delCarts.deletedCount} carts.`);

    // E. Wishlists
    const delWishlists = await Wishlist.deleteMany({});
    console.log(`🗑️ Deleted ${delWishlists.deletedCount} wishlists.`);

    // F. Returns
    const delReturns = await ReturnRequest.deleteMany({});
    console.log(`🗑️ Deleted ${delReturns.deletedCount} return requests.`);

    // G. Coupons
    const delCoupons = await Coupon.deleteMany({});
    console.log(`🗑️ Deleted ${delCoupons.deletedCount} coupons.`);

    // H. Setup Settings flags so that auto-seeder doesn't trigger
    console.log(
      "\n⚙️ Setting 'seeded_products' and 'seeded_coupons' flags to prevent automatic seeding...",
    );
    await Setting.findOneAndUpdate(
      { key: "seeded_products" },
      { key: "seeded_products", value: "true" },
      { upsert: true, new: true },
    );
    await Setting.findOneAndUpdate(
      { key: "seeded_coupons" },
      { key: "seeded_coupons", value: "true" },
      { upsert: true, new: true },
    );
    console.log("✅ Flags set to 'true'. Seeder bypassed for production.");

    console.log("\n🚀 PRE-LAUNCH CLEANUP COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Pre-launch cleanup script failed:", error);
    process.exit(1);
  }
};

preLaunchCleanup();

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load Environment Configuration
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Mongoose Models
import User from "./models/User.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import ActivityLog from "./models/ActivityLog.js";
import Notification from "./models/Notification.js";
import Brand from "./models/Brand.js";
import Cart from "./models/Cart.js";
import Category from "./models/Category.js";
import Collection from "./models/Collection.js";
import Coupon from "./models/Coupon.js";
import EmailLog from "./models/EmailLog.js";
import PendingSignup from "./models/PendingSignup.js";
import ReturnRequest from "./models/ReturnRequest.js";
import Setting from "./models/Setting.js";
import Wishlist from "./models/Wishlist.js";

const backupDir = path.join(__dirname, "backups");
const logFilePath = path.join(__dirname, "production_cleanup_log.txt");

// Log Utility that writes to both console and logFilePath
fs.writeFileSync(
  logFilePath,
  `=== production_cleanup.js started at ${new Date().toISOString()} ===\n`,
  "utf8",
);
const logInfo = (msg) => {
  console.log(msg);
  fs.appendFileSync(logFilePath, msg + "\n", "utf8");
};

const runCleanup = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not found in environment settings");
    }

    logInfo("📡 Connecting to MongoDB database...");
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    logInfo("✅ MongoDB Connected.");

    // Create backup directory if not exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Step 1: Backup all collections
    const collectionsToBackup = [
      { name: "users", model: User },
      { name: "products", model: Product },
      { name: "orders", model: Order },
      { name: "activity_logs", model: ActivityLog },
      { name: "notifications", model: Notification },
      { name: "brands", model: Brand },
      { name: "carts", model: Cart },
      { name: "categories", model: Category },
      { name: "collections", model: Collection },
      { name: "coupons", model: Coupon },
      { name: "email_logs", model: EmailLog },
      { name: "pending_signups", model: PendingSignup },
      { name: "return_requests", model: ReturnRequest },
      { name: "settings", model: Setting },
      { name: "wishlists", model: Wishlist },
    ];

    logInfo("💾 Starting dataset backup operation...");
    for (const entry of collectionsToBackup) {
      logInfo(`- Fetching documents from collection: ${entry.name}`);
      const data = await entry.model.find({});
      const filePath = path.join(backupDir, `${entry.name}_backup.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      logInfo(`  Saved ${data.length} documents to ${entry.name}_backup.json`);
    }
    logInfo("✅ Backup successfully compiled.");

    // Step 2: Clear dynamic/transactional logs
    logInfo(
      "🧹 Commencing database purge (ONLY deleting target transactional/test data)...",
    );

    // Collections to clear completely
    const tablesToClear = [
      { name: "Orders", model: Order },
      { name: "Carts", model: Cart },
      { name: "Wishlists", model: Wishlist },
      { name: "Notifications", model: Notification },
      { name: "Email Logs", model: EmailLog },
      { name: "Activity Logs", model: ActivityLog },
      { name: "Return Requests", model: ReturnRequest },
      { name: "Pending Signups", model: PendingSignup },
    ];

    const deletionStats = {};

    for (const table of tablesToClear) {
      const result = await table.model.deleteMany({});
      deletionStats[table.name] = result.deletedCount;
      logInfo(
        `- Cleared ${table.name} collection. Documents deleted: ${result.deletedCount}`,
      );
    }

    // Purge user collection (KEEP Admins, REMOVE Customers)
    const originalCustomersCount = await User.countDocuments({
      role: { $ne: "admin" },
    });
    const userDeleteResult = await User.deleteMany({ role: { $ne: "admin" } });
    deletionStats["Users (Non-admin customers)"] =
      userDeleteResult.deletedCount;
    logInfo(
      `- Cleared non-admin customers from Users collection. Deleted: ${userDeleteResult.deletedCount}`,
    );

    // Reset Coupons statistics
    const couponResetResult = await Coupon.updateMany(
      {},
      { $set: { ordersUsed: 0, usedBy: [] } },
    );
    logInfo(
      `- Reset Coupon usage statistics for all coupons. Matched/modified: ${couponResetResult.matchedCount}/${couponResetResult.modifiedCount}`,
    );

    // Step 3: Verify Master Data Preservation
    logInfo("🔍 Verifying master datasets & launch integrity...");

    const remainingAdmins = await User.countDocuments({ role: "admin" });
    const remainingProducts = await Product.countDocuments({});
    const remainingSettings = await Setting.countDocuments({});
    const remainingCategories = await Category.countDocuments({});
    const remainingBrands = await Brand.countDocuments({});
    const remainingCollections = await Collection.countDocuments({});
    const remainingCoupons = await Coupon.countDocuments({});

    logInfo("\n📊 Launch Verification Status:");
    logInfo(`✓ Admin User count: ${remainingAdmins}`);
    logInfo(`✓ Products count: ${remainingProducts}`);
    logInfo(`✓ Setting records count: ${remainingSettings}`);
    logInfo(`✓ Categories count: ${remainingCategories}`);
    logInfo(`✓ Brands count: ${remainingBrands}`);
    logInfo(`✓ Collections count: ${remainingCollections}`);
    logInfo(`✓ Coupons count: ${remainingCoupons}`);

    // Asserts
    if (remainingAdmins < 1) {
      throw new Error("Integrity Failure: Admin account was deleted!");
    }
    if (remainingProducts < 1) {
      throw new Error("Integrity Failure: Product catalog was deleted!");
    }
    if (remainingSettings < 1) {
      throw new Error("Integrity Failure: Settings collection is empty!");
    }

    logInfo(
      "\n✅ Production launch database cleanup finalized successfully without regressions.",
    );
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logInfo(`❌ Cleanup operation failed with fatal error: ${error.message}`);
    mongoose.connection.close();
    process.exit(1);
  }
};

runCleanup();

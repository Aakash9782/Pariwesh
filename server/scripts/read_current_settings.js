import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import Setting from "../models/Setting.js";

// Robust loading of environment variables
const envPaths = [
  path.resolve("server/.env"),
  path.resolve(".env"),
  path.resolve("../.env"),
];

let loaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded environment variables from: ${envPath}`);
    loaded = true;
    break;
  }
}

if (!loaded) {
  dotenv.config();
}

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI is not defined.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected! Fetching settings...");

    const targetKeys = [
      "homeCampaignBanners",
      "festiveBannerSettings",
      "slideImg_campaign_tablet",
      "slideImg_campaign_desktop",
    ];
    for (const key of targetKeys) {
      const doc = await Setting.findOne({ key });
      if (doc) {
        console.log(`\n🔑 Key: ${key}`);
        console.log(`Doc ID: ${doc._id}`);
        console.log(`Length: ${doc.value?.length || 0}`);
        console.log(
          `Value : ${doc.value ? doc.value.substring(0, 500) : "EMPTY"}`,
        );
      } else {
        console.log(`\n❌ Key not found: ${key}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error("Database connection/query error:", err);
    process.exit(1);
  }
};

run();

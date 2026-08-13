import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import Setting from "../models/Setting.js";
import { uploadBase64Image } from "../utils/cloudinaryUploader.js";

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
  console.warn(
    "⚠️ Warning: No .env file found in expected paths. Falling back to default process.env.",
  );
  dotenv.config();
}

const run = async () => {
  const isDryRun = process.argv.includes("--dry-run");
  if (isDryRun) {
    console.log(
      "ℹ️ Running in DRY-RUN mode. No changes will be saved to the database.",
    );
  } else {
    console.log(
      "⚠️ Running in LIVE execution mode. Changes will be saved to the database.",
    );
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error(
      "❌ Error: MONGO_URI is not defined in environment variables.",
    );
    process.exit(1);
  }

  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log("Connected successfully!");

    // Locate ONLY slideImg_campaign_tablet
    const targetKey = "slideImg_campaign_tablet";
    const settingDoc = await Setting.findOne({ key: targetKey });

    if (!settingDoc) {
      console.log(
        `❌ Target setting '${targetKey}' not found in the database.`,
      );
      process.exit(0);
    }

    console.log("\n==================================================");
    console.log(`Target Document ID: ${settingDoc._id}`);
    console.log(`Setting Key       : ${settingDoc.key}`);

    const value = settingDoc.value || "";
    const isBase64 = value.startsWith("data:image/");
    const length = value.length;

    console.log(`Value is Base64?  : ${isBase64 ? "YES" : "NO"}`);
    console.log(
      `Approximate Size  : ${(length / 1024 / 1024).toFixed(2)} MB (${length} characters)`,
    );
    console.log("==================================================\n");

    if (!isBase64) {
      if (value.startsWith("http://") || value.startsWith("https://")) {
        console.log(
          `✅ A valid Cloudinary or external URL already exists: ${value}`,
        );
      } else {
        console.log(`⚠️ Setting contains non-base64 text/value: ${value}`);
      }
      process.exit(0);
    }

    if (isDryRun) {
      console.log(
        "ℹ️ Dry-run completed. No database updates or Cloudinary uploads performed.",
      );
      process.exit(0);
    }

    // Capture the existing value for rollback safety
    console.log("🔄 Backup of existing value captured in memory.");
    const originalValue = value;

    console.log("Uploading Base64 image to Cloudinary...");
    const uploadedUrl = await uploadBase64Image(value, "pariwesh/branding");

    if (!uploadedUrl) {
      console.error("❌ Error: Cloudinary upload returned an empty result.");
      console.log(
        "Safety Check: Preserving the existing value. Database was NOT modified.",
      );
      process.exit(1);
    }

    if (uploadedUrl.startsWith("data:image/")) {
      console.error(
        "❌ Error: Cloudinary upload failed and fell back to Base64.",
      );
      console.log(
        "Safety Check: Preserving the existing value. Database was NOT modified.",
      );
      process.exit(1);
    }

    if (
      !uploadedUrl.startsWith("http://") &&
      !uploadedUrl.startsWith("https://")
    ) {
      console.error(
        `❌ Error: Cloudinary upload returned an invalid URL: ${uploadedUrl}`,
      );
      console.log(
        "Safety Check: Preserving the existing value. Database was NOT modified.",
      );
      process.exit(1);
    }

    console.log(`🎉 Cloudinary upload succeeded! URL: ${uploadedUrl}`);
    console.log("Updating document in database...");

    settingDoc.value = uploadedUrl;
    await settingDoc.save();

    console.log("✅ Setting updated successfully in MongoDB!");

    // Double check database value after saving
    const verifyDoc = await Setting.findOne({ key: targetKey });
    console.log("\n==================================================");
    console.log("DATABASE VERIFICATION AFTER WRITE:");
    console.log(`Expected URL  : ${uploadedUrl}`);
    console.log(`Saved URL     : ${verifyDoc.value}`);
    console.log(
      `Success?      : ${verifyDoc.value === uploadedUrl ? "YES" : "NO"}`,
    );
    console.log("==================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Unexpected Error:", err);
    process.exit(1);
  }
};

run();

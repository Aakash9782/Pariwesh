import fs from "fs";
import path from "path";
import Setting from "../models/Setting.js";
import Product from "../models/Product.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import { uploadBase64Image } from "../utils/cloudinaryUploader.js";
import { logActivity } from "../utils/logger.js";

// @desc    Get all settings
// @route   GET /api/v1/settings
// @access  Public
export const getSettings = async (req, res, next) => {
  try {
    // 1. Copy hero image to public on request
    try {
      const srcPath = path.resolve("client/src/assets/hero.png");
      const destPath = path.resolve("client/public/hero.png");
      if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log("✅ Auto-copied hero.png to public assets");
      }
    } catch (copyErr) {
      console.error("Auto-copy of hero image failed:", copyErr.message);
    }

    // 2. Prune DB Unsplash URLs from settings & products
    try {
      const settingsList = await Setting.find({});
      for (let set of settingsList) {
        if (
          typeof set.value === "string" &&
          set.value.includes("unsplash.com")
        ) {
          let val = set.value;
          val = val.replace(
            /https:\/\/images\.unsplash\.com\/[a-zA-Z0-9\-\_\.\?\&\=\%\/]+/g,
            "/hero.png",
          );
          set.value = val;
          await set.save();
        }
      }

      const productsList = await Product.find({});
      for (let prod of productsList) {
        let changed = false;
        const newImages = prod.images.map((img) => {
          if (typeof img === "string" && img.includes("unsplash.com")) {
            changed = true;
            return "/hero.png";
          }
          return img;
        });
        if (changed) {
          prod.images = newImages;
          await prod.save();
        }
      }
    } catch (cleanupErr) {
      console.error("Database unsplash cleanup error:", cleanupErr.message);
    }

    const settingsList = await Setting.find({});
    const settings = {};
    settingsList.forEach((set) => {
      if (set.value === "true") {
        settings[set.key] = true;
      } else if (set.value === "false") {
        settings[set.key] = false;
      } else {
        settings[set.key] = set.value;
      }
    });
    return sendSuccess(res, "Settings retrieved successfully", settings);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Update or create a setting
// @route   POST /api/v1/settings
// @access  Public
export const updateSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return sendError(res, "Key/Value parameters are required", 400);
    }

    let finalValue = value;
    if (
      (key === "brandLogoUrl" ||
        key.startsWith("slideImg") ||
        key === "homeStoryImage") &&
      value &&
      value.startsWith("data:image")
    ) {
      finalValue = await uploadBase64Image(value, "pariwesh/branding");
    } else if (key === "festiveBannerSettings" && value) {
      try {
        let parsed = typeof value === "object" ? value : JSON.parse(value);
        if (parsed.bannerImage && parsed.bannerImage.startsWith("data:image")) {
          parsed.bannerImage = await uploadBase64Image(
            parsed.bannerImage,
            "pariwesh/branding",
          );
        }
        if (
          parsed.desktopImage &&
          parsed.desktopImage.startsWith("data:image")
        ) {
          parsed.desktopImage = await uploadBase64Image(
            parsed.desktopImage,
            "pariwesh/branding",
          );
        }
        if (parsed.tabletImage && parsed.tabletImage.startsWith("data:image")) {
          parsed.tabletImage = await uploadBase64Image(
            parsed.tabletImage,
            "pariwesh/branding",
          );
        }
        if (parsed.mobileImage && parsed.mobileImage.startsWith("data:image")) {
          parsed.mobileImage = await uploadBase64Image(
            parsed.mobileImage,
            "pariwesh/branding",
          );
        }
        if (parsed.slides && Array.isArray(parsed.slides)) {
          for (let i = 0; i < parsed.slides.length; i++) {
            let slide = parsed.slides[i];
            if (
              slide.desktopImage &&
              slide.desktopImage.startsWith("data:image")
            ) {
              slide.desktopImage = await uploadBase64Image(
                slide.desktopImage,
                "pariwesh/branding",
              );
            }
            if (
              slide.tabletImage &&
              slide.tabletImage.startsWith("data:image")
            ) {
              slide.tabletImage = await uploadBase64Image(
                slide.tabletImage,
                "pariwesh/branding",
              );
            }
            if (
              slide.mobileImage &&
              slide.mobileImage.startsWith("data:image")
            ) {
              slide.mobileImage = await uploadBase64Image(
                slide.mobileImage,
                "pariwesh/branding",
              );
            }
          }
        }
        finalValue = JSON.stringify(parsed);
      } catch (e) {
        console.error(
          "Failed to parse festiveBannerSettings inside settingController:",
          e,
        );
        finalValue = typeof value === "object" ? JSON.stringify(value) : value;
      }
    } else if (key === "homeCategories" && value) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          for (let i = 0; i < parsed.length; i++) {
            if (parsed[i].image && parsed[i].image.startsWith("data:image")) {
              parsed[i].image = await uploadBase64Image(
                parsed[i].image,
                "pariwesh/branding",
              );
            }
          }
          finalValue = JSON.stringify(parsed);
        }
      } catch (e) {
        console.error(
          "Failed to parse homeCategories inside settingController:",
          e,
        );
      }
    } else if (key === "homeVibeMoods" && value) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          for (let i = 0; i < parsed.length; i++) {
            if (parsed[i].bgImg && parsed[i].bgImg.startsWith("data:image")) {
              parsed[i].bgImg = await uploadBase64Image(
                parsed[i].bgImg,
                "pariwesh/branding",
              );
            }
            if (
              parsed[i].insetImg &&
              parsed[i].insetImg.startsWith("data:image")
            ) {
              parsed[i].insetImg = await uploadBase64Image(
                parsed[i].insetImg,
                "pariwesh/branding",
              );
            }
          }
          finalValue = JSON.stringify(parsed);
        }
      } catch (e) {
        console.error(
          "Failed to parse homeVibeMoods inside settingController:",
          e,
        );
      }
    }

    let setting = await Setting.findOne({ key });
    if (setting) {
      setting.value = finalValue || "";
      await setting.save();
    } else {
      setting = await Setting.create({ key, value: finalValue || "" });
    }

    await logActivity(req, `Settings Changed: ${key}`);

    return sendSuccess(res, `Setting ${key} updated successfully`, {
      key,
      value: finalValue,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

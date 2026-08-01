import Setting from "../models/Setting.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import { uploadBase64Image } from "../utils/cloudinaryUploader.js";
import { logActivity } from "../utils/logger.js";

// @desc    Get all settings
// @route   GET /api/v1/settings
// @access  Public
export const getSettings = async (req, res, next) => {
  try {
    const settingsList = await Setting.find({});
    const settings = {};
    settingsList.forEach((set) => {
      settings[set.key] = set.value;
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
      (key === "brandLogoUrl" || key.startsWith("slideImg")) &&
      value &&
      value.startsWith("data:image")
    ) {
      finalValue = await uploadBase64Image(value, "pariwesh/branding");
    } else if (key === "festiveBannerSettings" && value) {
      try {
        const parsed = JSON.parse(value);
        if (parsed.bannerImage && parsed.bannerImage.startsWith("data:image")) {
          const cloudinaryUrl = await uploadBase64Image(
            parsed.bannerImage,
            "pariwesh/branding",
          );
          parsed.bannerImage = cloudinaryUrl;
          finalValue = JSON.stringify(parsed);
        }
      } catch (e) {
        console.error(
          "Failed to parse festiveBannerSettings inside settingController:",
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

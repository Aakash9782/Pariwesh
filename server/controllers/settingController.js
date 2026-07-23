import Setting from "../models/Setting.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";

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

    let setting = await Setting.findOne({ key });
    if (setting) {
      setting.value = value || "";
      await setting.save();
    } else {
      setting = await Setting.create({ key, value: value || "" });
    }

    return sendSuccess(res, `Setting ${key} updated successfully`, {
      key,
      value,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

import express from "express";
import {
  getSettings,
  updateSetting,
} from "../controllers/settingController.js";

const router = express.Router();

router.route("/").get(getSettings).post(updateSetting);

export default router;

import express from "express";
import {
  getSettings,
  updateSetting,
} from "../controllers/settingController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router
  .route("/")
  .get(getSettings)
  .post(protect, authorize("admin"), updateSetting);

export default router;

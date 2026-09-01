import express from "express";
import {
  getSettings,
  updateSetting,
  testMetaCapiConnection,
} from "../controllers/settingController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router
  .route("/")
  .get(getSettings)
  .post(protect, authorize("admin"), updateSetting);

router.post("/test-meta-capi", protect, authorize("admin"), testMetaCapiConnection);

export default router;

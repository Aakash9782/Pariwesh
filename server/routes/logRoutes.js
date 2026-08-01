import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import ActivityLog from "../models/ActivityLog.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";

const router = express.Router();

router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(100);
    return sendSuccess(res, "Activity logs retrieved successfully", logs);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
});

export default router;

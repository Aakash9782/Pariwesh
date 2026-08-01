import express from "express";
import {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("admin"), getNotifications)
  .post(createNotification);

router
  .route("/:id/read")
  .put(protect, authorize("admin"), markNotificationAsRead);

router.route("/:id").delete(protect, authorize("admin"), deleteNotification);

export default router;

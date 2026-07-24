import express from "express";
import {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.route("/").get(getNotifications).post(createNotification);
router.route("/:id/read").put(markNotificationAsRead);
router.route("/:id").delete(deleteNotification);

export default router;

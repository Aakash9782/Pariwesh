import Notification from "../models/Notification.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";

// @desc    Get all notifications (Admin)
// @route   GET /api/v1/notifications
// @access  Public
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({}).sort({ createdAt: -1 });
    return sendSuccess(
      res,
      "Notifications retrieved successfully",
      notifications,
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Create new notification/alert
// @route   POST /api/v1/notifications
// @access  Public
export const createNotification = async (req, res, next) => {
  try {
    const { message, productId, productName, size, type } = req.body;

    if (!message) {
      return sendError(res, "Message content is required", 400);
    }

    const notification = await Notification.create({
      message,
      productId,
      productName,
      size,
      type: type || "stock_alert",
      read: false,
    });

    return sendSuccess(
      res,
      "Notification logged successfully",
      notification,
      201,
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Public
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === "all") {
      await Notification.updateMany({ read: false }, { read: true });
      return sendSuccess(res, "All alerts marked as read");
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true },
    );

    if (!notification) {
      return sendError(res, "Notification not found", 404);
    }

    return sendSuccess(res, "Alert marked as read", notification);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Clear notifications (Admin)
// @route   DELETE /api/v1/notifications/:id
// @access  Public
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === "all") {
      await Notification.deleteMany({});
      return sendSuccess(res, "All notifications cleared");
    }

    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, "Notification not found", 404);
    }

    return sendSuccess(res, "Notification deleted");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

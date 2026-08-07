import express from "express";
import {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  retryShiprocketLabel,
  retryShiprocketInvoice,
  retryShiprocketPickup,
  retryShiprocketManifest,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.route("/").get(protect, getOrders).post(protect, createOrder);

router.route("/:id/status").put(protect, authorize("admin"), updateOrderStatus);
router.route("/:id").delete(protect, authorize("admin"), deleteOrder);

// Shiprocket Isolated Retry Operations
router.post(
  "/:id/retry-label",
  protect,
  authorize("admin"),
  retryShiprocketLabel,
);
router.post(
  "/:id/retry-invoice",
  protect,
  authorize("admin"),
  retryShiprocketInvoice,
);
router.post(
  "/:id/retry-pickup",
  protect,
  authorize("admin"),
  retryShiprocketPickup,
);
router.post(
  "/:id/retry-manifest",
  protect,
  authorize("admin"),
  retryShiprocketManifest,
);

export default router;

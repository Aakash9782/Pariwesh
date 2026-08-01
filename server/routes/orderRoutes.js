import express from "express";
import {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.route("/").get(protect, getOrders).post(protect, createOrder);

router.route("/:id/status").put(protect, authorize("admin"), updateOrderStatus);
router.route("/:id").delete(protect, authorize("admin"), deleteOrder);

export default router;

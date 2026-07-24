import express from "express";
import {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.route("/").get(getOrders).post(createOrder);

router.route("/:id/status").put(updateOrderStatus);
router.route("/:id").delete(deleteOrder);

export default router;

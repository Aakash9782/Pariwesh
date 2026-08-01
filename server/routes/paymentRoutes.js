import express from "express";
import {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/razorpay/create", protect, createPaymentOrder);
router.post("/razorpay/verify", protect, verifyPayment);
router.post("/razorpay/failed", protect, markPaymentFailed);

export default router;

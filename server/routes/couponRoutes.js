import express from "express";
import {
  getCoupons,
  validateCoupon,
  createCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("admin"), getCoupons)
  .post(protect, authorize("admin"), createCoupon);

router.route("/validate").post(validateCoupon);

router.route("/:code").delete(protect, authorize("admin"), deleteCoupon);

export default router;

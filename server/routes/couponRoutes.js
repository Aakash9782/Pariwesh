import express from "express";
import {
  getCoupons,
  validateCoupon,
  createCoupon,
  deleteCoupon,
  getActiveOffers,
  updateCoupon,
} from "../controllers/couponController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("admin"), getCoupons)
  .post(protect, authorize("admin"), createCoupon);

router.route("/validate").post(validateCoupon);
router.route("/active-offers").get(getActiveOffers);

router
  .route("/:code")
  .put(protect, authorize("admin"), updateCoupon)
  .delete(protect, authorize("admin"), deleteCoupon);

export default router;

import express from "express";
import {
  getCoupons,
  validateCoupon,
  createCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";

const router = express.Router();

router.route("/").get(getCoupons).post(createCoupon);

router.route("/validate").post(validateCoupon);

router.route("/:code").delete(deleteCoupon);

export default router;

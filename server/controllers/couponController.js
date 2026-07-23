import Coupon from "../models/Coupon.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";

const SEED_COUPONS = [
  {
    code: "PARIWESHGOLD",
    discountType: "Percentage",
    value: 15,
    status: "Active",
    ordersUsed: 0,
  },
  {
    code: "LHRGOLD",
    discountType: "Percentage",
    value: 15,
    status: "Active",
    ordersUsed: 0,
  },
];

// @desc    Get all coupons (Seeds default coupons if empty)
// @route   GET /api/v1/coupons
// @access  Public
export const getCoupons = async (req, res, next) => {
  try {
    let coupons = await Coupon.find({}).sort({ createdAt: -1 });

    if (coupons.length === 0) {
      await Coupon.insertMany(SEED_COUPONS);
      coupons = await Coupon.find({}).sort({ createdAt: -1 });
    }

    return sendSuccess(res, "Coupons retrieved successfully", coupons);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Check & validate promo coupon code
// @route   POST /api/v1/coupons/validate
// @access  Public
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return sendError(res, "Please provide a coupon code to validate", 400);
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return sendError(res, "Invalid coupon code!", 404);
    }

    if (coupon.status !== "Active") {
      return sendError(res, "This coupon has expired or is deactivated", 400);
    }

    // Calculate details
    let discountAmount = 0;
    if (coupon.discountType === "Percentage") {
      discountAmount = Math.round(Number(subtotal) * (coupon.value / 100));
    } else {
      discountAmount = Math.min(coupon.value, Number(subtotal));
    }

    return sendSuccess(res, "Coupon validated successfully", {
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      discountAmount,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Add new promo coupon card (Admin)
// @route   POST /api/v1/coupons
// @access  Public
export const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, value } = req.body;

    if (!code || !value) {
      return sendError(res, "Please fill in all mandatory coupon details", 400);
    }

    const newCoupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType: discountType || "Percentage",
      value: Number(value),
      status: "Active",
      ordersUsed: 0,
    });

    return sendSuccess(
      res,
      "Promo Coupon registered successfully",
      newCoupon,
      201,
    );
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, "Coupon code already exists", 400);
    }
    return sendError(res, error.message, 500);
  }
};

// @desc    Delete coupon by code (Admin)
// @route   DELETE /api/v1/coupons/:code
// @access  Public
export const deleteCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;
    const deleted = await Coupon.findOneAndDelete({ code: code.toUpperCase() });

    if (!deleted) {
      return sendError(res, "Coupon not found", 404);
    }

    return sendSuccess(res, `Coupon ${code} deleted parsed`);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

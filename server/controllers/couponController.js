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
    const { code, subtotal, phone } = req.body;

    if (!code) {
      return sendError(res, "Please provide a coupon code to validate", 400);
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return sendError(res, "Invalid coupon code!", 404);
    }

    if (coupon.status !== "Active") {
      return sendError(res, "This coupon is currently inactive", 400);
    }

    // 1. Expiry Date validation check
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return sendError(res, "This coupon code has expired", 400);
    }

    // 2. Global Coupon usage limit check
    if (coupon.usageLimit && coupon.ordersUsed >= coupon.usageLimit) {
      return sendError(res, "This coupon's usage limit has been reached", 400);
    }

    // 3. User usage limit validation check
    if (phone) {
      const userUsage = coupon.usedBy?.find((item) => item.phone === phone);
      if (
        userUsage &&
        coupon.userLimit &&
        userUsage.usageCount >= coupon.userLimit
      ) {
        return sendError(
          res,
          `You have reached the usage limit for this coupon (${coupon.userLimit} time(s))`,
          400,
        );
      }
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
    const { code, discountType, value, usageLimit, userLimit, expiryDate } =
      req.body;

    if (!code || !value) {
      return sendError(res, "Please fill in all mandatory coupon details", 400);
    }

    const newCoupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType: discountType || "Percentage",
      value: Number(value),
      status: "Active",
      ordersUsed: 0,
      usageLimit: usageLimit !== undefined ? Number(usageLimit) : 9999,
      userLimit: userLimit !== undefined ? Number(userLimit) : 1,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
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

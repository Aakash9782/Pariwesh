import Coupon from "../models/Coupon.js";
import Setting from "../models/Setting.js";
import Product from "../models/Product.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import { logActivity } from "../utils/logger.js";

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

// Helper to seed special offers dynamically
export const seedSpecialOffers = async () => {
  const defaultOffers = [
    {
      code: "SUMMER10",
      discountType: "Percentage",
      value: 10,
      name: "Buy 2 & Get 10% OFF",
      description: "Buy any 2 eligible items and save 10%",
      minQuantity: 2,
      isSpecialOffer: true,
      offerType: "BUY_X_GET_Y",
      priority: 2,
      status: "Active",
    },
    {
      code: "PREPAID5",
      discountType: "Percentage",
      value: 5,
      name: "Pay Online & Get 5% OFF",
      description: "Save 5% instantly on prepaid orders.",
      isSpecialOffer: true,
      offerType: "PREPAID",
      priority: 1,
      status: "Active",
    },
    {
      code: "NAIRA15",
      discountType: "Percentage",
      value: 15,
      name: "Buy 5 & Get 15% OFF",
      description: "Purchase 5 items and save 15%",
      minQuantity: 5,
      isSpecialOffer: true,
      offerType: "BUY_X_GET_Y",
      priority: 3,
      status: "Active",
    },
    {
      code: "GIFT5000",
      discountType: "Flat",
      value: 0,
      name: "SURPRISE GIFT",
      description: "Shop for ₹5,000+ and unlock a surprise gift worth ₹2,000",
      minAmount: 5000,
      giftValue: 2000,
      isSpecialOffer: true,
      offerType: "SURPRISE_GIFT",
      priority: 4,
      status: "Active",
    },
  ];

  for (const offer of defaultOffers) {
    const exists = await Coupon.findOne({ code: offer.code });
    if (!exists) {
      await Coupon.create(offer);
    }
  }
};

// @desc    Get all coupons (Seeds default coupons if empty)
// @route   GET /api/v1/coupons
// @access  Public
export const getCoupons = async (req, res, next) => {
  try {
    await seedSpecialOffers();
    let coupons = await Coupon.find({}).sort({
      isSpecialOffer: -1,
      priority: 1,
      createdAt: -1,
    });

    if (coupons.length === 0) {
      const seeded = await Setting.findOne({ key: "seeded_coupons" });
      if (!seeded) {
        await Coupon.insertMany(SEED_COUPONS);
        await Setting.create({ key: "seeded_coupons", value: "true" });
        coupons = await Coupon.find({}).sort({
          isSpecialOffer: -1,
          priority: 1,
          createdAt: -1,
        });
      }
    }

    return sendSuccess(res, "Coupons retrieved successfully", coupons);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get all active coupons and special offers (Public)
// @route   GET /api/v1/coupons/active-offers
// @access  Public
export const getActiveOffers = async (req, res, next) => {
  try {
    await seedSpecialOffers();
    const now = new Date();

    const query = {
      status: "Active",
      $and: [
        {
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: null },
            { expiryDate: { $gte: now } },
          ],
        },
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
      ],
    };

    const offers = await Coupon.find(query)
      .select("-usedBy")
      .sort({ priority: 1, createdAt: -1 });

    return sendSuccess(res, "Active offers retrieved successfully", offers);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Check & validate promo coupon code
// @route   POST /api/v1/coupons/validate
// @access  Public
export const validateCoupon = async (req, res, next) => {
  try {
    const {
      code,
      subtotal: clientSubtotal,
      phone,
      items,
      paymentMethod,
    } = req.body;

    if (!code) {
      return sendError(res, "Please provide a coupon code to validate", 400);
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return sendError(res, "Invalid coupon code!", 404);
    }

    if (coupon.status !== "Active") {
      return sendError(res, "This coupon is currently inactive", 400);
    }

    // 1. Expiry/Start Date validation check
    const now = new Date();
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      return sendError(res, "This coupon code has expired", 400);
    }
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return sendError(res, "This coupon code is not active yet", 400);
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

    // 4. Calculate subtotal and quantity securely from database
    let subtotal = Number(clientSubtotal || 0);
    let totalQty = Number(req.body.quantity || 1);

    if (items && Array.isArray(items) && items.length > 0) {
      let calculatedSubtotal = 0;
      let calculatedQty = 0;
      for (const item of items) {
        const product = await Product.findById(item.productId || item._id);
        if (!product) {
          return sendError(
            res,
            `Product not found: ${item.name || item.productId}`,
            404,
          );
        }
        calculatedSubtotal += product.price * Number(item.quantity);
        calculatedQty += Number(item.quantity);
      }
      subtotal = calculatedSubtotal;
      totalQty = calculatedQty;
    }

    // 5. Quantity validation
    if (coupon.minQuantity && totalQty < coupon.minQuantity) {
      return sendError(
        res,
        `This coupon requires a minimum of ${coupon.minQuantity} items`,
        400,
      );
    }

    // 6. Subtotal validation
    if (coupon.minAmount && subtotal < coupon.minAmount) {
      return sendError(
        res,
        `This coupon requires a minimum order amount of ₹${coupon.minAmount}`,
        400,
      );
    }

    // 7. Payment method validation for prepaid offer
    if (
      coupon.offerType === "PREPAID" &&
      paymentMethod &&
      paymentMethod !== "ONLINE"
    ) {
      return sendError(
        res,
        "This coupon is only eligible for online payments",
        400,
      );
    }

    // Calculate details
    let discountAmount = 0;
    if (coupon.discountType === "Percentage") {
      discountAmount = Math.round(Number(subtotal) * (coupon.value / 100));
      if (coupon.maxDiscount && coupon.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = Math.min(coupon.value, Number(subtotal));
    }

    // Check if surprise gift is also eligible
    let surpriseGift = null;
    const giftCoupon = await Coupon.findOne({
      offerType: "SURPRISE_GIFT",
      status: "Active",
    });
    if (giftCoupon && subtotal >= giftCoupon.minAmount) {
      surpriseGift = {
        name: giftCoupon.name,
        description: giftCoupon.description,
        giftValue: giftCoupon.giftValue,
      };
    }

    return sendSuccess(res, "Coupon validated successfully", {
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      discountAmount,
      isSpecialOffer: coupon.isSpecialOffer,
      offerType: coupon.offerType,
      giftValue: coupon.giftValue,
      surpriseGift,
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
    const {
      code,
      discountType,
      value,
      usageLimit,
      userLimit,
      expiryDate,
      name,
      description,
      minQuantity,
      minAmount,
      maxDiscount,
      startDate,
      priority,
      canCombine,
      isSpecialOffer,
      offerType,
      giftValue,
      status,
    } = req.body;

    if (!code || value === undefined) {
      return sendError(res, "Please fill in all mandatory coupon details", 400);
    }

    const newCoupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType: discountType || "Percentage",
      value: Number(value),
      status: status || "Active",
      ordersUsed: 0,
      usageLimit: usageLimit !== undefined ? Number(usageLimit) : 9999,
      userLimit: userLimit !== undefined ? Number(userLimit) : 1,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      name,
      description,
      minQuantity: minQuantity !== undefined ? Number(minQuantity) : 0,
      minAmount: minAmount !== undefined ? Number(minAmount) : 0,
      maxDiscount:
        maxDiscount !== undefined && maxDiscount !== ""
          ? Number(maxDiscount)
          : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      priority: priority !== undefined ? Number(priority) : 1,
      canCombine: canCombine !== undefined ? Boolean(canCombine) : false,
      isSpecialOffer:
        isSpecialOffer !== undefined ? Boolean(isSpecialOffer) : false,
      offerType: offerType || "STANDARD",
      giftValue: giftValue !== undefined ? Number(giftValue) : 0,
    });

    await logActivity(
      req,
      `Coupon Created: ${newCoupon.code} (${newCoupon.value}% / Flat discount)`,
    );

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

// @desc    Update a coupon by code (Admin)
// @route   PUT /api/v1/coupons/:code
// @access  Public
export const updateCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;
    const updateData = { ...req.body };

    // Prevent modifying read-only/immutable MongoDB/Mongoose fields
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase().trim();
    }

    const coupon = await Coupon.findOneAndUpdate(
      { code: code.toUpperCase() },
      updateData,
      { new: true, runValidators: true },
    );

    if (!coupon) {
      return sendError(res, "Coupon not found", 404);
    }

    await logActivity(req, `Coupon Updated: ${coupon.code}`);
    return sendSuccess(res, "Coupon updated successfully", coupon);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, "Coupon code already exists", 400);
    }
    if (error.name === "ValidationError") {
      return sendError(res, error.message, 400);
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

    await logActivity(req, `Coupon Deleted: ${code.toUpperCase()}`);

    return sendSuccess(res, `Coupon ${code} deleted parsed`);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

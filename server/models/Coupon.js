import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["Percentage", "Flat"],
      default: "Percentage",
    },
    value: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    minQuantity: {
      type: Number,
      default: 0,
    },
    minAmount: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
    },
    startDate: {
      type: Date,
    },
    priority: {
      type: Number,
      default: 1,
    },
    canCombine: {
      type: Boolean,
      default: false,
    },
    isSpecialOffer: {
      type: Boolean,
      default: false,
    },
    offerType: {
      type: String,
      enum: ["BUY_X_GET_Y", "PREPAID", "SURPRISE_GIFT", "STANDARD"],
      default: "STANDARD",
    },
    giftValue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    ordersUsed: {
      type: Number,
      default: 0,
    },
    usageLimit: {
      type: Number,
      default: 9999,
    },
    userLimit: {
      type: Number,
      default: 1,
    },
    expiryDate: {
      type: Date,
    },
    usedBy: [
      {
        phone: String,
        usageCount: {
          type: Number,
          default: 1,
        },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Coupon", CouponSchema);

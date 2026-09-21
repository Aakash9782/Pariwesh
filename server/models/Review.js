import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    verifiedPurchase: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
      index: true,
    },
    source: {
      type: String,
      enum: ["customer", "seed", "admin_import"],
      default: "customer",
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

ReviewSchema.index({ product: 1, status: 1, createdAt: -1 });

// Helper to recalculate average rating and review count for a product
ReviewSchema.statics.recalculateProductRating = async function (productId) {
  try {
    const Product = mongoose.model("Product");
    const stats = await this.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), status: "approved" } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      const roundedAvg = Math.round(stats[0].avgRating * 10) / 10;
      await Product.findByIdAndUpdate(productId, {
        rating: roundedAvg,
        reviewsCount: stats[0].totalReviews,
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        reviewsCount: 0,
      });
    }
  } catch (err) {
    console.error("[Review] recalculateProductRating error:", err.message);
  }
};

ReviewSchema.post("save", async function () {
  await this.constructor.recalculateProductRating(this.product);
});

ReviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc?.product) {
    await doc.constructor.recalculateProductRating(doc.product);
  }
});

export default mongoose.model("Review", ReviewSchema);

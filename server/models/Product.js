import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      default: "suits",
    },
    fabric: {
      type: String,
      default: "Pure Cotton",
    },
    washCare: {
      type: String,
      default: "Gentle Hand Wash",
    },
    colorGroup: {
      type: String,
      trim: true,
      index: true,
    },
    color: {
      type: String,
      trim: true,
      default: "Ivory",
    },
    colorHex: {
      type: String,
      trim: true,
      default: "#FAFAFA",
    },
    sizes: {
      type: [String],
      enum: ["S", "M", "L", "XL", "XXL"],
      default: ["S", "M", "L", "XL"],
    },
    sizesStock: {
      S: { type: Number, default: 10 },
      M: { type: Number, default: 10 },
      L: { type: Number, default: 10 },
      XL: { type: Number, default: 10 },
      XXL: { type: Number, default: 10 },
    },
    mrp: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      default: 15,
    },
    subCategory: {
      type: String,
      default: "",
    },
    brand: {
      type: String,
      default: "Pariwesh",
    },
    gst: {
      type: Number,
      default: 0,
    },
    hsnCode: {
      type: String,
      default: "",
    },
    material: {
      type: String,
      default: "",
    },
    weight: {
      type: String,
      default: "",
    },
    fit: {
      type: String,
      default: "",
    },
    pattern: {
      type: String,
      default: "",
    },
    neckline: {
      type: String,
      default: "",
    },
    sleeveLength: {
      type: String,
      default: "",
    },
    occasion: {
      type: String,
      default: "",
    },
    bottomType: {
      type: String,
      default: "",
    },
    setContents: {
      type: [String],
      default: [],
    },
    countryOfOrigin: {
      type: String,
      default: "India",
    },
    shippingWeight: {
      type: String,
      default: "",
    },
    returnDays: {
      type: Number,
      default: 7,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    trending: {
      type: Boolean,
      default: false,
    },
    bestSeller: {
      type: Boolean,
      default: false,
    },
    newArrival: {
      type: Boolean,
      default: false,
    },
    recommended: {
      type: Boolean,
      default: false,
    },
    seoTitle: {
      type: String,
      default: "",
    },
    seoDescription: {
      type: String,
      default: "",
    },
    metaKeywords: {
      type: String,
      default: "",
    },
    canonicalUrl: {
      type: String,
      default: "",
    },
    ogImage: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      required: true,
    },
    video: {
      type: String,
      default: "",
    },
    tag: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    reviewsCount: {
      type: Number,
      default: 12,
    },
    description: {
      type: String,
      default:
        "Premium ethnic wear ensemble designed for high quality luxury styles.",
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "active",
    },
  },
  { timestamps: true },
);

// Pre-save hook to populate slug from name and auto-calculate stock from sizesStock
ProductSchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  try {
    if (this.sizesStock) {
      let totalStock = 0;
      const sizes = ["S", "M", "L", "XL", "XXL"];
      sizes.forEach((sz) => {
        const val = this.get(`sizesStock.${sz}`);
        if (val !== undefined) {
          totalStock += Number(val) || 0;
        }
      });
      this.stock = totalStock;
    }
  } catch (err) {
    console.error("Product pre-validate stock sync error:", err);
  }
  next();
});

export default mongoose.model("Product", ProductSchema);

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
      enum: ["kurtis", "suits", "ethnic"],
      lowercase: true,
    },
    fabric: {
      type: String,
      default: "Pure Cotton",
    },
    washCare: {
      type: String,
      default: "Gentle Hand Wash",
    },
    color: {
      type: String,
      default: "Ivory",
    },
    colorHex: {
      type: String,
      default: "#FAFAFA",
    },
    sizes: {
      type: [String],
      enum: ["S", "M", "L", "XL", "XXL"],
      default: ["S", "M", "L", "XL"],
    },
    mrp: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      default: 15,
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
  },
  { timestamps: true },
);

// Pre-save hook to populate slug from name if not provided
ProductSchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

export default mongoose.model("Product", ProductSchema);

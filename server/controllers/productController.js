import Product from "../models/Product.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";

// Safe seed catalog matching original website contents
const SEED_PRODUCTS = [
  {
    name: "Elysian Gold Chanderi Suit",
    sku: "LHR-CH-001",
    category: "suits",
    fabric: "Chanderi Silk",
    washCare: "Dry Clean Only",
    color: "Gold",
    colorHex: "#D4AF37",
    sizes: ["S", "M", "L", "XL"],
    mrp: 3499,
    price: 2499,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=650&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?q=80&w=650&auto=format&fit=crop",
    ],
    tag: "Best Seller",
    rating: 4.8,
    reviewsCount: 24,
    description:
      "Bespoke elegance crafted from pure Banarasi Chanderi silk yarn. Features double zari checks, floral embroidery lines, soft mulmul linings, and matching raw-silk straight trousers. Perfect for seasonal weddings and luxury festive environments.",
  },
  {
    name: "Scarlet Floral Rayon Kurti",
    sku: "LHR-RY-002",
    category: "kurtis",
    fabric: "Premium Rayon",
    washCare: "Gentle Machine Wash",
    color: "Red",
    colorHex: "#C62828",
    sizes: ["M", "L", "XL"],
    mrp: 1799,
    price: 1199,
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=650&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1561365264-412c31e6f145?q=80&w=650&auto=format&fit=crop",
    ],
    tag: "New Arrival",
    rating: 4.5,
    reviewsCount: 12,
    description:
      "Delightfully casual and soft. Adorned with beautiful hand-blocked floral patterns, double-stitch seams, and flared hems. Woven from high-tenacity Viscose Rayon to promise breathability and all-day comfort.",
  },
  {
    name: "Ivory Zari Premium Anarkali Set",
    sku: "LHR-AK-003",
    category: "ethnic",
    fabric: "Georgette Silk",
    washCare: "Dry Clean Only",
    color: "Ivory",
    colorHex: "#F5F5F0",
    sizes: ["S", "M", "L"],
    mrp: 5999,
    price: 3999,
    images: [
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=650&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=650&auto=format&fit=crop",
    ],
    tag: "Exclusive",
    rating: 4.9,
    reviewsCount: 38,
    description:
      "An elegant floor-length Ivory Anarkali gown detailed with luxurious zari threads, a heavy border, and a matching sheer organza dupatta. Crafted directly by local weavers, ensuring high precision craftsmanship.",
  },
  {
    name: "Chocolate Brown & Olive Suit Set",
    sku: "LHR-GG-004",
    category: "suits",
    fabric: "High Georgette",
    washCare: "Dry Clean Only",
    color: "Brown",
    colorHex: "#78350F",
    sizes: ["S", "M", "L", "XL"],
    mrp: 3999,
    price: 1799,
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Sale",
    rating: 4.7,
    reviewsCount: 14,
    description:
      "High elegance combined georgette suit paired with contrasting soft olive fabric details and elegant dupattas.",
  },
  {
    name: "Indigo Block Printed Cotton Kurta",
    sku: "LHR-CT-005",
    category: "kurtis",
    fabric: "Organic Cotton",
    washCare: "Gentle Machine Wash",
    color: "Blue",
    colorHex: "#1E3A8A",
    sizes: ["M", "L", "XL"],
    mrp: 2999,
    price: 1399,
    images: [
      "https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Summer Special",
    rating: 4.6,
    reviewsCount: 22,
    description:
      "Hand-printed natural indigo colors on premium quality organic cotton base. Durable, cool, and highly breathable.",
  },
];

// @desc    Get all products (Optionally seeds database if empty)
// @route   GET /api/v1/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    let products = await Product.find({}).sort({ createdAt: -1 });

    // Auto-seeding check: If database collection is empty, load mock catalog
    if (products.length === 0) {
      await Product.insertMany(SEED_PRODUCTS);
      products = await Product.find({}).sort({ createdAt: -1 });
    }

    return sendSuccess(res, "Products retrieved successfully", products);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get single product by Slug
// @route   GET /api/v1/products/:slug
// @access  Public
export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug: slug.toLowerCase() });

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    return sendSuccess(res, "Product details retrieved", product);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Create new catalog product (Admin)
// @route   POST /api/v1/products
// @access  Public
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      fabric,
      washCare,
      color,
      colorHex,
      sizes,
      mrp,
      price,
      image, // Accept single base64 image or string url
      images,
      video,
      tag,
      description,
    } = req.body;

    if (!name || !sku || !mrp || !price) {
      return sendError(res, "Please fill in all mandatory product fields", 400);
    }

    // Prepare images array
    const productImages =
      images && images.length > 0
        ? images
        : [
            image ||
              "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop",
          ];

    const newProduct = await Product.create({
      name,
      sku,
      category: category || "suits",
      fabric: fabric || "Pure Cotton",
      washCare: washCare || "Dry Clean Preferred",
      color: color || "Multicolor",
      colorHex: colorHex || "#D4AF37",
      sizes: sizes || ["S", "M", "L", "XL"],
      mrp,
      price,
      images: productImages,
      video: video || "",
      tag: tag || "Regular",
      description:
        description || "Premium selection fashion apparel custom crafted.",
    });

    return sendSuccess(
      res,
      "Product added to catalog successfully",
      newProduct,
      201,
    );
  } catch (error) {
    if (error.code === 11000) {
      return sendError(
        res,
        "Product with this Name or SKU already exists",
        400,
      );
    }
    return sendError(res, error.message, 500);
  }
};

// @desc    Delete catalog product (Admin)
// @route   DELETE /api/v1/products/:id
// @access  Public
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    return sendSuccess(res, "Product deleted from catalog");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

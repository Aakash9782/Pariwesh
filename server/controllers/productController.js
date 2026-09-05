import Product from "../models/Product.js";
import Collection from "../models/Collection.js";
import Setting from "../models/Setting.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import {
  uploadBase64Image,
  uploadBase64Video,
} from "../utils/cloudinaryUploader.js";
import { logActivity } from "../utils/logger.js";

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
    sizes: ["M", "L", "XL", "XXL"],
    mrp: 3499,
    price: 2499,
    images: ["/hero.png", "/hero.png"],
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
    sizes: ["M", "L", "XL", "XXL"],
    mrp: 1799,
    price: 1199,
    images: ["/hero.png", "/hero.png"],
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
    sizes: ["M", "L", "XL", "XXL"],
    mrp: 5999,
    price: 3999,
    images: ["/hero.png", "/hero.png"],
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
    sizes: ["M", "L", "XL", "XXL"],
    mrp: 3999,
    price: 1799,
    images: ["/hero.png"],
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
    sizes: ["M", "L", "XL", "XXL"],
    mrp: 2999,
    price: 1399,
    images: ["/hero.png"],
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
    let products = await Product.find({})
      .select("-description")
      .sort({ createdAt: -1 });

    // Auto-seeding check: If database collection is empty, load mock catalog
    if (products.length === 0) {
      const seeded = await Setting.findOne({ key: "seeded_products" });
      if (!seeded) {
        await Product.insertMany(SEED_PRODUCTS);
        await Setting.create({ key: "seeded_products", value: "true" });
        products = await Product.find({}).sort({ createdAt: -1 });
      }
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

    const productObj = product.toObject();
    if (product.colorGroup) {
      const variants = await Product.find({
        colorGroup: product.colorGroup,
        status: "active",
      }).select("name slug color colorHex images");

      productObj.colorVariants = variants.map((v) => ({
        name: v.name,
        slug: v.slug,
        color: v.color,
        colorHex: v.colorHex,
        image: v.images?.[0] || "",
      }));
    } else {
      productObj.colorVariants = [];
    }

    return sendSuccess(res, "Product details retrieved", productObj);
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
      colorGroup,
      color,
      colorHex,
      sizes,
      sizesStock,
      mrp,
      price,
      image, // Accept single base64 image or string url
      images,
      video,
      videos,
      tag,
      description,
      discount,
      // Advanced Enterprise Fields
      subCategory,
      brand,
      gst,
      hsnCode,
      material,
      weight,
      countryOfOrigin,
      shippingWeight,
      returnDays,
      featured,
      trending,
      bestSeller,
      newArrival,
      recommended,
      seoTitle,
      seoDescription,
      metaKeywords,
      canonicalUrl,
      ogImage,
      status,
      // New clothing specs
      fit,
      pattern,
      neckline,
      sleeveLength,
      occasion,
      bottomType,
      setContents,
    } = req.body;

    if (!name || !sku || !mrp || !price) {
      return sendError(res, "Please fill in all mandatory product fields", 400);
    }

    // Auto-generate stable and immutable colorGroup if not supplied
    const stableColorGroup =
      colorGroup ||
      `cg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare images array
    let productImages = [];
    if (images && images.length > 0) {
      for (const img of images) {
        if (img.startsWith("data:image")) {
          const uploadedUrl = await uploadBase64Image(img, "pariwesh/products");
          productImages.push(uploadedUrl);
        } else {
          productImages.push(img);
        }
      }
    } else if (image) {
      if (image.startsWith("data:image")) {
        const uploadedUrl = await uploadBase64Image(image, "pariwesh/products");
        productImages.push(uploadedUrl);
      } else {
        productImages.push(image);
      }
    } else {
      productImages.push("/hero.png");
    }

    // Prepare video upload
    let productVideos = [];
    const rawVideos =
      videos && Array.isArray(videos)
        ? videos
        : video
        ? [video]
        : [];
    for (const v of rawVideos) {
      if (typeof v === "string" && v.startsWith("data:video")) {
        const uploadedUrl = await uploadBase64Video(v, "pariwesh/videos");
        productVideos.push(uploadedUrl);
      } else if (typeof v === "string" && v.trim()) {
        productVideos.push(v.trim());
      }
    }
    const productVideo = productVideos[0] || "";

    const newProduct = await Product.create({
      name,
      sku,
      category: category || "suits",
      fabric: fabric || "Pure Cotton",
      washCare: washCare || "Dry Clean Preferred",
      colorGroup: stableColorGroup,
      color: color || "Multicolor",
      colorHex: colorHex || "#D4AF37",
      sizes: sizes || ["M", "L", "XL", "XXL"],
      sizesStock: sizesStock || { M: 10, L: 10, XL: 10, XXL: 10 },
      mrp,
      price,
      discount: discount || 0,
      images: productImages,
      video: productVideo,
      videos: productVideos,
      tag: tag || "Regular",
      description:
        description || "Premium selection fashion apparel custom crafted.",
      // Advanced Enterprise Fields
      subCategory: subCategory || "",
      brand: brand || "Pariwesh",
      gst: gst !== undefined ? Number(gst) : 0,
      hsnCode: hsnCode || "",
      material: material || "",
      weight: weight || "",
      countryOfOrigin: countryOfOrigin || "India",
      shippingWeight: shippingWeight || "",
      returnDays: returnDays !== undefined ? Number(returnDays) : 7,
      featured: featured === true || featured === "true",
      trending: trending === true || trending === "true",
      bestSeller: bestSeller === true || bestSeller === "true",
      newArrival: newArrival === true || newArrival === "true",
      recommended: recommended === true || recommended === "true",
      seoTitle: seoTitle || "",
      seoDescription: seoDescription || "",
      metaKeywords: metaKeywords || "",
      canonicalUrl: canonicalUrl || "",
      ogImage: ogImage || "",
      status: status || "active",
      // New Clothing spec fields
      fit: fit || "",
      pattern: pattern || "",
      neckline: neckline || "",
      sleeveLength: sleeveLength || "",
      occasion: occasion || "",
      bottomType: bottomType || "",
      setContents: setContents || [],
    });

    await logActivity(
      req,
      `Product Added: ${newProduct.name} (SKU: ${newProduct.sku})`,
    );

    // Auto-link new product into matching collections (Model C Auto-Freshness)
    try {
      const matchSlugs = [
        newProduct.category,
        "new-arrivals",
        ...(newProduct.bestSeller ? ["best-sellers"] : []),
      ];
      await Collection.updateMany(
        { slug: { $in: matchSlugs } },
        { $addToSet: { products: newProduct._id } },
      );
    } catch (colErr) {
      console.warn("Could not auto-link product to collection:", colErr.message);
    }

    return sendSuccess(
      res,
      "Product added to catalog successfully",
      newProduct,
      201,
    );
  } catch (error) {
    console.error("createProduct error:", error);
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

    await logActivity(
      req,
      `Product Deleted: ${product.name} (SKU: ${product.sku})`,
    );

    // Unlink deleted product from collections
    try {
      await Collection.updateMany(
        { products: id },
        { $pull: { products: id } },
      );
    } catch (colErr) {
      console.warn("Could not unlink product from collections:", colErr.message);
    }

    return sendSuccess(res, "Product deleted from catalog");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Update catalog product (Admin)
// @route   PUT /api/v1/products/id/:id
// @access  Public
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      category,
      fabric,
      washCare,
      colorGroup,
      color,
      colorHex,
      sizes,
      sizesStock,
      mrp,
      price,
      stock,
      image,
      images,
      video,
      videos,
      tag,
      description,
      discount,
      // Advanced Enterprise Fields
      subCategory,
      brand,
      gst,
      hsnCode,
      material,
      weight,
      countryOfOrigin,
      shippingWeight,
      returnDays,
      featured,
      trending,
      bestSeller,
      newArrival,
      recommended,
      seoTitle,
      seoDescription,
      metaKeywords,
      canonicalUrl,
      ogImage,
      status,
      // New clothing specs
      fit,
      pattern,
      neckline,
      sleeveLength,
      occasion,
      bottomType,
      setContents,
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    // Process new images/image if present and base64
    let productImages = product.images || [];
    if (images && images.length > 0) {
      const processedImages = [];
      for (const img of images) {
        if (img.startsWith("data:image")) {
          const uploadedUrl = await uploadBase64Image(img, "pariwesh/products");
          processedImages.push(uploadedUrl);
        } else {
          processedImages.push(img);
        }
      }
      productImages = processedImages;
    } else if (image) {
      if (image.startsWith("data:image")) {
        const uploadedUrl = await uploadBase64Image(image, "pariwesh/products");
        productImages = [uploadedUrl];
      } else {
        productImages = [image];
      }
    }

    // Process video / videos if present
    if (videos !== undefined || video !== undefined) {
      const rawVideos = Array.isArray(videos)
        ? videos
        : video !== undefined
        ? video
          ? [video]
          : []
        : product.videos || (product.video ? [product.video] : []);

      let processedVideos = [];
      for (const v of rawVideos) {
        if (typeof v === "string" && v.startsWith("data:video")) {
          const uploadedUrl = await uploadBase64Video(v, "pariwesh/videos");
          processedVideos.push(uploadedUrl);
        } else if (typeof v === "string" && v.trim()) {
          processedVideos.push(v.trim());
        }
      }
      product.videos = processedVideos;
      product.video = processedVideos[0] || "";
    }

    product.name = name !== undefined ? name : product.name;
    product.sku = sku !== undefined ? sku : product.sku;
    product.category = category !== undefined ? category : product.category;
    product.fabric = fabric !== undefined ? fabric : product.fabric;
    product.washCare = washCare !== undefined ? washCare : product.washCare;
    // Stable colorGroup immutability: do not mutate if it exists. If empty (legacy), initialize.
    product.colorGroup =
      product.colorGroup ||
      colorGroup ||
      `cg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    product.color = color !== undefined ? color : product.color;
    product.colorHex = colorHex !== undefined ? colorHex : product.colorHex;
    product.sizes = sizes !== undefined ? sizes : product.sizes;
    if (sizesStock !== undefined) {
      product.sizesStock = sizesStock;
      product.markModified("sizesStock");
    }
    product.mrp = mrp !== undefined ? Number(mrp) : product.mrp;
    product.price = price !== undefined ? Number(price) : product.price;
    product.discount =
      discount !== undefined ? Number(discount) : product.discount;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.images = productImages;
    product.tag = tag !== undefined ? tag : product.tag;
    product.description =
      description !== undefined ? description : product.description;

    // Advanced Enterprise Updates
    if (subCategory !== undefined) product.subCategory = subCategory;
    if (brand !== undefined) product.brand = brand;
    if (gst !== undefined) product.gst = Number(gst);
    if (hsnCode !== undefined) product.hsnCode = hsnCode;
    if (material !== undefined) product.material = material;
    if (weight !== undefined) product.weight = weight;
    if (countryOfOrigin !== undefined)
      product.countryOfOrigin = countryOfOrigin;
    if (shippingWeight !== undefined) product.shippingWeight = shippingWeight;
    if (returnDays !== undefined) product.returnDays = Number(returnDays);
    if (featured !== undefined)
      product.featured = featured === true || featured === "true";
    if (trending !== undefined)
      product.trending = trending === true || trending === "true";
    if (bestSeller !== undefined)
      product.bestSeller = bestSeller === true || bestSeller === "true";
    if (newArrival !== undefined)
      product.newArrival = newArrival === true || newArrival === "true";
    if (recommended !== undefined)
      product.recommended = recommended === true || recommended === "true";
    if (seoTitle !== undefined) product.seoTitle = seoTitle;
    if (seoDescription !== undefined) product.seoDescription = seoDescription;
    if (metaKeywords !== undefined) product.metaKeywords = metaKeywords;
    if (canonicalUrl !== undefined) product.canonicalUrl = canonicalUrl;
    if (ogImage !== undefined) product.ogImage = ogImage;

    // Subeffect spec updates
    if (fit !== undefined) product.fit = fit;
    if (pattern !== undefined) product.pattern = pattern;
    if (neckline !== undefined) product.neckline = neckline;
    if (sleeveLength !== undefined) product.sleeveLength = sleeveLength;
    if (occasion !== undefined) product.occasion = occasion;
    if (bottomType !== undefined) product.bottomType = bottomType;
    if (setContents !== undefined) product.setContents = setContents;
    if (status !== undefined) product.status = status;

    if (name) {
      product.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    const updatedProduct = await product.save();

    await logActivity(
      req,
      `Product Updated: ${updatedProduct.name} (SKU: ${updatedProduct.sku})`,
    );

    return sendSuccess(
      res,
      "Product updated in catalog successfully",
      updatedProduct,
    );
  } catch (error) {
    console.error("updateProduct error:", error);
    if (error.code === 11000) {
      return sendError(
        res,
        "Product with this Name, Slug, or SKU already exists",
        400,
      );
    }
    return sendError(res, error.message, 500);
  }
};

// @desc    Get products by color group
// @route   GET /api/v1/products/color-group/:groupId
// @access  Public
export const getProductsByColorGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const products = await Product.find({ colorGroup: groupId });
    return sendSuccess(
      res,
      "Sibling variants retrieved successfully",
      products,
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

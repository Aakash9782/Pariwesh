import Collection from "../models/Collection.js";
import Product from "../models/Product.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import { logActivity } from "../utils/logger.js";

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const DEFAULTS = [
  {
    name: "Kurtis",
    slug: "kurtis",
    description: "Everyday elegance in breathable silhouettes.",
    sortOrder: 1,
    match: (p) => p.category === "kurtis",
  },
  {
    name: "Suit Sets",
    slug: "suits",
    description: "Coordinated sets for festive and formal wear.",
    sortOrder: 2,
    match: (p) => p.category === "suits",
  },
  {
    name: "Ethnic Wear",
    slug: "ethnic",
    description: "Heritage craftsmanship for celebrations.",
    sortOrder: 3,
    match: (p) => p.category === "ethnic",
  },
  {
    name: "Best Sellers",
    slug: "best-sellers",
    description: "Most loved pieces from the Pariwesh atelier.",
    sortOrder: 4,
    match: (p) => p.bestSeller || /best/i.test(p.tag || ""),
  },
  {
    name: "New Arrivals",
    slug: "new-arrivals",
    description: "Fresh drops for the new season.",
    sortOrder: 5,
    match: (p) => p.newArrival || /new/i.test(p.tag || ""),
  },
];

export const ensureDefaultCollections = async () => {
  const count = await Collection.countDocuments();
  if (count > 0) return;

  const products = await Product.find({}).select(
    "_id category tag bestSeller newArrival featured trending images",
  );

  for (const def of DEFAULTS) {
    const matched = products.filter(def.match).map((p) => p._id);
    const banner =
      products.find(def.match)?.images?.[0] ||
      products[0]?.images?.[0] ||
      "";
    await Collection.create({
      name: def.name,
      slug: def.slug,
      description: def.description,
      bannerUrl: banner,
      products: matched,
      isActive: true,
      sortOrder: def.sortOrder,
    });
  }
};

// @desc    List active collections (storefront)
// @route   GET /api/v1/collections
export const getCollections = async (req, res) => {
  try {
    await ensureDefaultCollections();
    const collections = await Collection.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .populate({
        path: "products",
        select: "name slug price mrp images category tag",
      });

    const data = collections.map((c) => {
      const all = c.products || [];
      return {
        _id: c._id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        bannerUrl: c.bannerUrl || all[0]?.images?.[0] || "",
        productCount: all.length,
        products: all.slice(0, 4),
      };
    });

    return sendSuccess(res, "Collections retrieved", data);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Admin list — all collections incl. inactive
// @route   GET /api/v1/collections/manage
export const getCollectionsAdmin = async (req, res) => {
  try {
    await ensureDefaultCollections();
    const collections = await Collection.find({})
      .sort({ sortOrder: 1, name: 1 })
      .populate({
        path: "products",
        select: "name slug price images category sku",
      });

    const data = collections.map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      bannerUrl: c.bannerUrl || "",
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      products: c.products || [],
      productIds: (c.products || []).map((p) => String(p._id || p)),
      productCount: (c.products || []).length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return sendSuccess(res, "Collections retrieved for admin", data);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get one collection by slug (full products)
// @route   GET /api/v1/collections/:slug
export const getCollectionBySlug = async (req, res) => {
  try {
    await ensureDefaultCollections();
    const collection = await Collection.findOne({
      slug: req.params.slug.toLowerCase(),
      isActive: true,
    }).populate({
      path: "products",
      select:
        "name slug price mrp images category tag color sizes sizesStock sku fabric",
    });

    if (!collection) {
      return sendError(res, "Collection not found", 404);
    }

    return sendSuccess(res, "Collection retrieved", collection);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Create collection (admin)
// @route   POST /api/v1/collections
export const createCollection = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      bannerUrl,
      isActive,
      sortOrder,
      products,
    } = req.body;
    if (!name?.trim()) return sendError(res, "Name is required", 400);

    const finalSlug = slugify(slug || name);
    const exists = await Collection.findOne({
      $or: [{ slug: finalSlug }, { name: name.trim() }],
    });
    if (exists) return sendError(res, "Collection already exists", 400);

    const productIds = Array.isArray(products)
      ? products.filter(Boolean)
      : [];

    const collection = await Collection.create({
      name: name.trim(),
      slug: finalSlug,
      description: description || "",
      bannerUrl: bannerUrl || "",
      isActive: isActive !== false,
      sortOrder: Number(sortOrder) || 0,
      products: productIds,
    });

    await logActivity(req, `Created collection: ${collection.name}`);
    return sendSuccess(res, "Collection created", collection, 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Update collection (admin)
// @route   PUT /api/v1/collections/id/:id
export const updateCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return sendError(res, "Collection not found", 404);

    if (req.body.name !== undefined) collection.name = req.body.name.trim();
    if (req.body.slug !== undefined) collection.slug = slugify(req.body.slug);
    if (req.body.description !== undefined)
      collection.description = req.body.description;
    if (req.body.bannerUrl !== undefined)
      collection.bannerUrl = req.body.bannerUrl;
    if (req.body.isActive !== undefined)
      collection.isActive = !!req.body.isActive;
    if (req.body.sortOrder !== undefined)
      collection.sortOrder = Number(req.body.sortOrder) || 0;
    if (req.body.products !== undefined) {
      collection.products = Array.isArray(req.body.products)
        ? req.body.products.filter(Boolean)
        : [];
    }

    await collection.save();
    await logActivity(req, `Updated collection: ${collection.name}`);
    return sendSuccess(res, "Collection updated", collection);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Delete collection (admin)
// @route   DELETE /api/v1/collections/id/:id
export const deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return sendError(res, "Collection not found", 404);
    await Collection.findByIdAndDelete(req.params.id);
    await logActivity(req, `Deleted collection: ${collection.name}`);
    return sendSuccess(res, "Collection deleted", null);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

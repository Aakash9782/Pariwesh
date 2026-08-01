import Collection from "../models/Collection.js";
import Product from "../models/Product.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";

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

// @desc    List active collections
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

import Category from "../models/Category.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import { logActivity } from "../utils/logger.js";

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const ensureDefaultCategories = async () => {
  const count = await Category.countDocuments();
  if (count > 0) return;
  const defaults = [
    {
      name: "Kurtis",
      slug: "kurtis",
      description: "Everyday kurtis and tunics",
      sortOrder: 1,
    },
    {
      name: "Suit Sets",
      slug: "suits",
      description: "Coordinated suit sets",
      sortOrder: 2,
    },
    {
      name: "Ethnic Wear",
      slug: "ethnic",
      description: "Festive and ethnic ensembles",
      sortOrder: 3,
    },
  ];
  await Category.insertMany(defaults);
};

// GET /api/v1/categories
export const getCategories = async (req, res) => {
  try {
    await ensureDefaultCategories();
    const filter = {};
    if (req.query.active === "true") filter.isActive = true;
    const categories = await Category.find(filter).sort({
      sortOrder: 1,
      name: 1,
    });
    return sendSuccess(res, "Categories retrieved", categories);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// POST /api/v1/categories (admin)
export const createCategory = async (req, res) => {
  try {
    const { name, description, imageUrl, isActive, sortOrder, slug } = req.body;
    if (!name?.trim()) return sendError(res, "Name is required", 400);
    const finalSlug = slugify(slug || name);
    const exists = await Category.findOne({
      $or: [{ slug: finalSlug }, { name: name.trim() }],
    });
    if (exists) return sendError(res, "Category already exists", 400);

    const category = await Category.create({
      name: name.trim(),
      slug: finalSlug,
      description: description || "",
      imageUrl: imageUrl || "",
      isActive: isActive !== false,
      sortOrder: Number(sortOrder) || 0,
    });
    await logActivity(req, `Created category: ${category.name}`);
    return sendSuccess(res, "Category created", category, 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// PUT /api/v1/categories/:id (admin)
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return sendError(res, "Category not found", 404);

    if (req.body.name !== undefined) category.name = req.body.name.trim();
    if (req.body.slug !== undefined) category.slug = slugify(req.body.slug);
    if (req.body.description !== undefined)
      category.description = req.body.description;
    if (req.body.imageUrl !== undefined) category.imageUrl = req.body.imageUrl;
    if (req.body.isActive !== undefined) category.isActive = !!req.body.isActive;
    if (req.body.sortOrder !== undefined)
      category.sortOrder = Number(req.body.sortOrder) || 0;

    await category.save();
    await logActivity(req, `Updated category: ${category.name}`);
    return sendSuccess(res, "Category updated", category);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// DELETE /api/v1/categories/:id (admin)
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return sendError(res, "Category not found", 404);
    await Category.findByIdAndDelete(req.params.id);
    await logActivity(req, `Deleted category: ${category.name}`);
    return sendSuccess(res, "Category deleted", null);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

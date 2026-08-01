import Brand from "../models/Brand.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import { logActivity } from "../utils/logger.js";

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const ensureDefaultBrands = async () => {
  const count = await Brand.countDocuments();
  if (count > 0) return;
  await Brand.create({
    name: "Pariwesh",
    slug: "pariwesh",
    description: "House brand — premium ethnic wear",
    isActive: true,
  });
};

// GET /api/v1/brands
export const getBrands = async (req, res) => {
  try {
    await ensureDefaultBrands();
    const filter = {};
    if (req.query.active === "true") filter.isActive = true;
    const brands = await Brand.find(filter).sort({ name: 1 });
    return sendSuccess(res, "Brands retrieved", brands);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// POST /api/v1/brands (admin)
export const createBrand = async (req, res) => {
  try {
    const { name, description, logoUrl, isActive, slug } = req.body;
    if (!name?.trim()) return sendError(res, "Name is required", 400);
    const finalSlug = slugify(slug || name);
    const exists = await Brand.findOne({
      $or: [{ slug: finalSlug }, { name: name.trim() }],
    });
    if (exists) return sendError(res, "Brand already exists", 400);

    const brand = await Brand.create({
      name: name.trim(),
      slug: finalSlug,
      description: description || "",
      logoUrl: logoUrl || "",
      isActive: isActive !== false,
    });
    await logActivity(req, `Created brand: ${brand.name}`);
    return sendSuccess(res, "Brand created", brand, 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// PUT /api/v1/brands/:id (admin)
export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return sendError(res, "Brand not found", 404);

    if (req.body.name !== undefined) brand.name = req.body.name.trim();
    if (req.body.slug !== undefined) brand.slug = slugify(req.body.slug);
    if (req.body.description !== undefined)
      brand.description = req.body.description;
    if (req.body.logoUrl !== undefined) brand.logoUrl = req.body.logoUrl;
    if (req.body.isActive !== undefined) brand.isActive = !!req.body.isActive;

    await brand.save();
    await logActivity(req, `Updated brand: ${brand.name}`);
    return sendSuccess(res, "Brand updated", brand);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// DELETE /api/v1/brands/:id (admin)
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return sendError(res, "Brand not found", 404);
    await Brand.findByIdAndDelete(req.params.id);
    await logActivity(req, `Deleted brand: ${brand.name}`);
    return sendSuccess(res, "Brand deleted", null);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

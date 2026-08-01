import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";

const populateWishlist = (query) =>
  query.populate({
    path: "products",
    select:
      "name slug price mrp images category color sizes sizesStock sku tag",
  });

// GET /api/v1/wishlist
export const getWishlist = async (req, res) => {
  try {
    let list = await populateWishlist(Wishlist.findOne({ user: req.user._id }));
    if (!list) {
      list = await Wishlist.create({ user: req.user._id, products: [] });
    }
    return sendSuccess(res, "Wishlist retrieved", list.products || []);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// PUT /api/v1/wishlist — replace full list
export const putWishlist = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds)) {
      return sendError(res, "productIds must be an array", 400);
    }

    const valid = [];
    for (const id of productIds) {
      const exists = await Product.findById(id).select("_id");
      if (exists) valid.push(id);
    }

    const list = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { products: valid },
      { upsert: true, new: true },
    );
    const populated = await populateWishlist(Wishlist.findById(list._id));
    return sendSuccess(res, "Wishlist saved", populated.products || []);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

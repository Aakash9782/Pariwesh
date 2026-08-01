import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";

const populateCart = (query) =>
  query.populate({
    path: "items.product",
    select:
      "name slug price mrp images category color sizes sizesStock sku tag",
  });

const toClientItems = (cart) => {
  if (!cart?.items?.length) return [];
  return cart.items
    .filter((i) => i.product)
    .map((i) => ({
      product: i.product,
      quantity: i.quantity,
      variant: {
        size: i.size || "M",
        color: i.color || i.product.color || "Default",
      },
    }));
};

// GET /api/v1/cart
export const getCart = async (req, res) => {
  try {
    let cart = await populateCart(Cart.findOne({ user: req.user._id }));
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    return sendSuccess(res, "Cart retrieved", toClientItems(cart));
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// PUT /api/v1/cart — replace full cart (sync from client)
export const putCart = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return sendError(res, "items must be an array", 400);
    }

    const normalized = [];
    for (const item of items) {
      const productId = item.productId || item.product?._id || item.product;
      if (!productId) continue;
      const exists = await Product.findById(productId).select("_id");
      if (!exists) continue;
      normalized.push({
        product: productId,
        quantity: Math.max(1, Number(item.quantity) || 1),
        size: item.variant?.size || item.size || "M",
        color: item.variant?.color || item.color || "Default",
      });
    }

    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: normalized },
      { upsert: true, new: true },
    );
    const populated = await populateCart(Cart.findById(cart._id));
    return sendSuccess(res, "Cart saved", toClientItems(populated));
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

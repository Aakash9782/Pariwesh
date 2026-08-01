import API from "./api.js";

export const persistCart = async (items) => {
  try {
    await API.put("/cart", {
      items: (items || []).map((item) => ({
        productId: item.product?._id || item.product,
        quantity: item.quantity,
        size: item.variant?.size,
        color: item.variant?.color,
      })),
    });
  } catch (err) {
    console.error("Cart sync failed:", err?.response?.data?.message || err.message);
  }
};

export const persistWishlist = async (products) => {
  try {
    await API.put("/wishlist", {
      productIds: (products || []).map((p) => p._id || p).filter(Boolean),
    });
  } catch (err) {
    console.error(
      "Wishlist sync failed:",
      err?.response?.data?.message || err.message,
    );
  }
};

export const fetchRemoteCart = async () => {
  const res = await API.get("/cart");
  return res.data?.success ? res.data.data || [] : [];
};

export const fetchRemoteWishlist = async () => {
  const res = await API.get("/wishlist");
  return res.data?.success ? res.data.data || [] : [];
};

/** Merge guest cart into server cart (by product+size+color), then return merged. */
export const mergeCartItems = (localItems = [], remoteItems = []) => {
  const map = new Map();
  const keyOf = (item) =>
    `${item.product?._id || item.product}|${item.variant?.size}|${item.variant?.color}`;

  for (const item of remoteItems) {
    if (!item.product) continue;
    map.set(keyOf(item), { ...item });
  }
  for (const item of localItems) {
    if (!item.product) continue;
    const k = keyOf(item);
    if (map.has(k)) {
      map.get(k).quantity = Math.max(map.get(k).quantity, item.quantity);
    } else {
      map.set(k, { ...item });
    }
  }
  return Array.from(map.values());
};

export const mergeWishlistProducts = (local = [], remote = []) => {
  const map = new Map();
  for (const p of remote) {
    if (p?._id) map.set(String(p._id), p);
  }
  for (const p of local) {
    if (p?._id) map.set(String(p._id), p);
  }
  return Array.from(map.values());
};

import API from "./api.js";

export const persistCart = async (items) => {
  try {
    const payload = (items || []).map((item) => ({
      productId: String(item.product?._id || item.product || ""),
      quantity: Math.max(1, Number(item.quantity) || 1),
      size: item.variant?.size || item.size || "M",
      color: item.variant?.color || item.color || "Default",
    }));
    await API.put("/cart", { items: payload });
  } catch (err) {
    console.warn("Cart sync notice:", err?.response?.data?.message || err.message);
  }
};

export const persistWishlist = async (products) => {
  try {
    const payload = (products || [])
      .map((p) => String(p?._id || p || ""))
      .filter(Boolean);
    await API.put("/wishlist", { productIds: payload });
  } catch (err) {
    console.warn(
      "Wishlist sync notice:",
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
  if (!localItems || localItems.length === 0) {
    return remoteItems || [];
  }
  if (!remoteItems || remoteItems.length === 0) {
    return localItems || [];
  }

  const map = new Map();
  const keyOf = (item) => {
    const pId = String(item.product?._id || item.product || "");
    const size = item.variant?.size || item.size || "M";
    const color = item.variant?.color || item.color || "Default";
    return `${pId}|${size}|${color}`;
  };

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
  if (!local || local.length === 0) {
    return remote || [];
  }
  if (!remote || remote.length === 0) {
    return local || [];
  }

  const map = new Map();
  for (const p of remote) {
    const id = String(p?._id || p || "");
    if (id) map.set(id, p);
  }
  for (const p of local) {
    const id = String(p?._id || p || "");
    if (id && !map.has(id)) {
      map.set(id, p);
    }
  }
  return Array.from(map.values());
};

import { setCart } from "../redux/slices/cartSlice.js";
import { setWishlist } from "../redux/slices/wishlistSlice.js";
import { store } from "../redux/store.js";
import {
  fetchRemoteCart,
  fetchRemoteWishlist,
  mergeCartItems,
  mergeWishlistProducts,
  persistCart,
  persistWishlist,
} from "./commerceSync.js";

export const hydrateCommerce = async (forceGuestMerge = false) => {
  const state = store.getState();
  if (!state.auth.isAuthenticated) return;

  const isGuestMergePending =
    forceGuestMerge ||
    localStorage.getItem("guest_commerce_pending") === "true";

  try {
    const [remoteCart, remoteWish] = await Promise.all([
      fetchRemoteCart(),
      fetchRemoteWishlist(),
    ]);

    if (isGuestMergePending) {
      // ONLY on guest-to-account login transition:
      // Merge temporary guest items with remote account items, then persist once
      localStorage.removeItem("guest_commerce_pending");
      const localCart = state.cart.items || [];
      const localWish = state.wishlist.products || [];

      const mergedCart = mergeCartItems(localCart, remoteCart);
      const mergedWish = mergeWishlistProducts(localWish, remoteWish);

      store.dispatch(setCart(mergedCart));
      store.dispatch(setWishlist(mergedWish));

      await Promise.all([
        persistCart(mergedCart),
        persistWishlist(mergedWish),
      ]);
      return;
    }

    // Normal hydration (app startup, opening next day, tab focus, or 15m token refresh):
    // Server is the single source of truth for logged-in user.
    // - Kept items stay in the bag / wishlist.
    // - Deleted items stay permanently deleted (never resurrected).
    if (Array.isArray(remoteCart)) {
      store.dispatch(setCart(remoteCart));
    }
    if (Array.isArray(remoteWish)) {
      store.dispatch(setWishlist(remoteWish));
    }
  } catch (err) {
    console.error("Commerce hydrate failed:", err?.message || err);
  }
};

export const syncCartNow = async () => {
  const state = store.getState();
  if (!state.auth.isAuthenticated) return;
  await persistCart(state.cart.items);
};

export const syncWishlistNow = async () => {
  const state = store.getState();
  if (!state.auth.isAuthenticated) return;
  await persistWishlist(state.wishlist.products);
};

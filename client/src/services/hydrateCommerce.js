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

export const hydrateCommerce = async () => {
  const state = store.getState();
  if (!state.auth.isAuthenticated) return;

  try {
    const [remoteCart, remoteWish] = await Promise.all([
      fetchRemoteCart(),
      fetchRemoteWishlist(),
    ]);
    const mergedCart = mergeCartItems(state.cart.items, remoteCart);
    const mergedWish = mergeWishlistProducts(
      state.wishlist.products,
      remoteWish,
    );
    store.dispatch(setCart(mergedCart));
    store.dispatch(setWishlist(mergedWish));
    await Promise.all([
      persistCart(mergedCart),
      persistWishlist(mergedWish),
    ]);
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

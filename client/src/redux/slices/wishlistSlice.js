import { createSlice } from "@reduxjs/toolkit";
import { logoutSuccess } from "./authSlice.js";

const savedWishlist = localStorage.getItem("wishlist")
  ? JSON.parse(localStorage.getItem("wishlist"))
  : [];

const initialState = {
  products: savedWishlist,
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlist: (state, action) => {
      state.products = action.payload;
      localStorage.setItem("wishlist", JSON.stringify(state.products));
    },
    toggleWishlistProduct: (state, action) => {
      const product = action.payload;
      const targetId = String(product?._id || product || "");
      const exists = state.products.find(
        (p) => String(p?._id || p || "") === targetId,
      );
      if (exists) {
        state.products = state.products.filter(
          (p) => String(p?._id || p || "") !== targetId,
        );
      } else {
        state.products.push(product);
      }
      localStorage.setItem("wishlist", JSON.stringify(state.products));
    },
    clearWishlist: (state) => {
      state.products = [];
      localStorage.removeItem("wishlist");
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutSuccess, (state) => {
      state.products = [];
      localStorage.removeItem("wishlist");
    });
  },
});

export const { setWishlist, toggleWishlistProduct, clearWishlist } =
  wishlistSlice.actions;
export default wishlistSlice.reducer;

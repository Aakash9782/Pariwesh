import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlist: (state, action) => {
      state.products = action.payload;
    },
    toggleWishlistProduct: (state, action) => {
      const product = action.payload;
      const exists = state.products.find((p) => p._id === product._id);
      if (exists) {
        state.products = state.products.filter((p) => p._id !== product._id);
      } else {
        state.products.push(product);
      }
    },
    clearWishlist: (state) => {
      state.products = [];
    },
  },
});

export const { setWishlist, toggleWishlistProduct, clearWishlist } =
  wishlistSlice.actions;
export default wishlistSlice.reducer;

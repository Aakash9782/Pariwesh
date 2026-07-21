import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [], // { product, quantity, variant: { color, size } }
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart: (state, action) => {
      state.items = action.payload;
    },
    addToCart: (state, action) => {
      const { product, quantity, variant } = action.payload;
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.product._id === product._id &&
          item.variant.color === variant.color &&
          item.variant.size === variant.size,
      );

      if (existingItemIndex > -1) {
        state.items[existingItemIndex].quantity += quantity;
      } else {
        state.items.push({ product, quantity, variant });
      }
    },
    updateQuantityInCart: (state, action) => {
      const { productId, variant, quantity } = action.payload;
      const itemIndex = state.items.findIndex(
        (item) =>
          item.product._id === productId &&
          item.variant.color === variant.color &&
          item.variant.size === variant.size,
      );
      if (itemIndex > -1) {
        state.items[itemIndex].quantity = quantity;
      }
    },
    removeFromCart: (state, action) => {
      const { productId, variant } = action.payload;
      state.items = state.items.filter(
        (item) =>
          !(
            item.product._id === productId &&
            item.variant.color === variant.color &&
            item.variant.size === variant.size
          ),
      );
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const {
  setCart,
  addToCart,
  updateQuantityInCart,
  removeFromCart,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;

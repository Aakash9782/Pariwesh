import { createSlice } from "@reduxjs/toolkit";

const savedCart = localStorage.getItem("cart")
  ? JSON.parse(localStorage.getItem("cart"))
  : [];

const initialState = {
  items: savedCart, // { product, quantity, variant: { color, size } }
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart: (state, action) => {
      state.items = action.payload;
      localStorage.setItem("cart", JSON.stringify(state.items));
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
      localStorage.setItem("cart", JSON.stringify(state.items));
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
      localStorage.setItem("cart", JSON.stringify(state.items));
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
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem("cart");
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

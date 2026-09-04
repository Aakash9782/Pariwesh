import { createSlice } from "@reduxjs/toolkit";
import { logoutSuccess } from "./authSlice.js";

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
      const targetId = String(product?._id || product || "");
      const existingItemIndex = state.items.findIndex((item) => {
        const itemId = String(item.product?._id || item.product || "");
        return (
          itemId === targetId &&
          (item.variant?.color || "Default") === (variant?.color || "Default") &&
          (item.variant?.size || "M") === (variant?.size || "M")
        );
      });

      if (existingItemIndex > -1) {
        state.items[existingItemIndex].quantity += quantity;
      } else {
        state.items.push({ product, quantity, variant });
      }
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
    updateQuantityInCart: (state, action) => {
      const { productId, variant, quantity } = action.payload;
      const targetId = String(productId?._id || productId || "");
      const itemIndex = state.items.findIndex((item) => {
        const itemId = String(item.product?._id || item.product || "");
        return (
          itemId === targetId &&
          (item.variant?.color || "Default") === (variant?.color || "Default") &&
          (item.variant?.size || "M") === (variant?.size || "M")
        );
      });
      if (itemIndex > -1) {
        state.items[itemIndex].quantity = quantity;
      }
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
    removeFromCart: (state, action) => {
      const { productId, variant } = action.payload;
      const targetId = String(productId?._id || productId || "");
      state.items = state.items.filter((item) => {
        const itemId = String(item.product?._id || item.product || "");
        const matches =
          itemId === targetId &&
          (item.variant?.color || "Default") === (variant?.color || "Default") &&
          (item.variant?.size || "M") === (variant?.size || "M");
        return !matches;
      });
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem("cart");
    },
    removePurchasedItems: (state, action) => {
      const purchasedItems = action.payload; // array of { productId, size, color, quantity }
      purchasedItems.forEach((purchased) => {
        const pId = String(
          purchased.productId || purchased.product?._id || purchased.product || "",
        );
        const pSize = purchased.size || purchased.variant?.size || "M";
        const pColor = purchased.color || purchased.variant?.color || "Default";
        const itemIndex = state.items.findIndex((item) => {
          const itemId = String(item.product?._id || item.product || "");
          return (
            itemId === pId &&
            (item.variant?.color || "Default") === pColor &&
            (item.variant?.size || "M") === pSize
          );
        });
        if (itemIndex > -1) {
          const remainingQty =
            state.items[itemIndex].quantity - (purchased.quantity || 1);
          if (remainingQty <= 0) {
            state.items.splice(itemIndex, 1);
          } else {
            state.items[itemIndex].quantity = remainingQty;
          }
        }
      });
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutSuccess, (state) => {
      state.items = [];
      localStorage.removeItem("cart");
    });
  },
});

export const {
  setCart,
  addToCart,
  updateQuantityInCart,
  removeFromCart,
  clearCart,
  removePurchasedItems,
} = cartSlice.actions;
export default cartSlice.reducer;

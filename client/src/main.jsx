import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./redux/store.js";
import MainLayout from "./layouts/MainLayout.jsx";
import Home from "./pages/Home.jsx";
import ShopListings from "./pages/shop/ShopListings.jsx";
import ProductDetails from "./pages/shop/ProductDetails.jsx";
import Cart from "./pages/shop/Cart.jsx";
import Wishlist from "./pages/shop/Wishlist.jsx";
import Login from "./pages/auth/Login.jsx";
import Profile from "./pages/profile/Profile.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import "./index.css";

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Setup mock details elements for pending features
const PlaceholderPage = ({ title }) => (
  <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
    <h2 className="text-3xl font-display font-medium text-textPrimary">
      {title}
    </h2>
    <p className="text-sm text-textSecondary">
      This page is scheduled for initialization in future roadmap steps.
    </p>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<ShopListings />} />
              <Route path="product/:slug" element={<ProductDetails />} />
              <Route
                path="collections"
                element={<PlaceholderPage title="Curated Collections" />}
              />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="cart" element={<Cart />} />
              <Route path="login" element={<Login />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<AdminDashboard />} />
            </Route>
            <Route
              path="*"
              element={<PlaceholderPage title="404 Page Not Found" />}
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);

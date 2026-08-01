import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./redux/store.js";
import MainLayout from "./layouts/MainLayout.jsx";
import Home from "./pages/Home.jsx";
import ShopListings from "./pages/shop/ShopListings.jsx";
import ProductDetails from "./pages/shop/ProductDetails.jsx";
import Collections from "./pages/shop/Collections.jsx";
import CollectionDetail from "./pages/shop/CollectionDetail.jsx";
import Cart from "./pages/shop/Cart.jsx";
import Wishlist from "./pages/shop/Wishlist.jsx";
import Login from "./pages/auth/Login.jsx";
import Profile from "./pages/profile/Profile.jsx";
import { AlertProvider } from "./contexts/AlertContext.jsx";
import ScrollToTop from "./components/common/ScrollToTop.jsx";
import Loader from "./components/common/Loader.jsx";
import "./index.css";

// Lazy Loaded Layouts & Components
const AdminLayout = lazy(() => import("./layouts/AdminLayout.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard.jsx"));
const AdminProducts = lazy(() => import("./pages/admin/Products.jsx"));
const AdminCatalog = lazy(() => import("./pages/admin/Catalog.jsx"));
const AdminOrders = lazy(() => import("./pages/admin/Orders.jsx"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers.jsx"));
const AdminInventory = lazy(() => import("./pages/admin/Inventory.jsx"));
const AdminMarketing = lazy(() => import("./pages/admin/Marketing.jsx"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics.jsx"));
const AdminSettings = lazy(() => import("./pages/admin/Settings.jsx"));
const AdminReturns = lazy(() => import("./pages/admin/Returns.jsx"));

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1050, // 5 minutes
    },
  },
});

import PlaceholderPage from "./components/common/PlaceholderPage.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AlertProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<ShopListings />} />
                <Route path="product/:slug" element={<ProductDetails />} />
                <Route path="collections" element={<Collections />} />
                <Route
                  path="collections/:slug"
                  element={<CollectionDetail />}
                />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="cart" element={<Cart />} />
                <Route path="login" element={<Login />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Secure Admin Control Panel Section */}
              <Route
                path="/admin"
                element={
                  <Suspense fallback={<Loader fullscreen />}>
                    <AdminLayout />
                  </Suspense>
                }
              >
                <Route
                  index
                  element={<Navigate to="/admin/dashboard" replace />}
                />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="catalog" element={<AdminCatalog />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="marketing" element={<AdminMarketing />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="returns" element={<AdminReturns />} />
              </Route>

              <Route
                path="*"
                element={<PlaceholderPage title="404 Page Not Found" />}
              />
            </Routes>
          </BrowserRouter>
        </AlertProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);

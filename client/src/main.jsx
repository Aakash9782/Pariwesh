import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { store } from "./redux/store.js";
import MainLayout from "./layouts/MainLayout.jsx";
import Home from "./pages/Home.jsx";
const ShopListings = lazy(() => import("./pages/shop/ShopListings.jsx"));
const ProductDetails = lazy(() => import("./pages/shop/ProductDetails.jsx"));
const Collections = lazy(() => import("./pages/shop/Collections.jsx"));
const CollectionDetail = lazy(
  () => import("./pages/shop/CollectionDetail.jsx"),
);
const Cart = lazy(() => import("./pages/shop/Cart.jsx"));
const Wishlist = lazy(() => import("./pages/shop/Wishlist.jsx"));
const Login = lazy(() => import("./pages/auth/Login.jsx"));
const Profile = lazy(() => import("./pages/profile/Profile.jsx"));
import {
  About,
  Contact,
  PrivacyPolicy,
  Terms,
  ShippingPolicy,
  ReturnPolicy,
  CancellationPolicy,
} from "./pages/static/StaticPages.jsx";
import { AlertProvider } from "./contexts/AlertContext.jsx";
import ScrollToTop from "./components/common/ScrollToTop.jsx";
import MetaPixelTracker from "./components/common/MetaPixelTracker.jsx";
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
const AdminMail = lazy(() => import("./pages/admin/Mail.jsx"));

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
          <HelmetProvider>
            <BrowserRouter>
              <ScrollToTop />
              <MetaPixelTracker />
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
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="shipping" element={<ShippingPolicy />} />
                  <Route path="returns" element={<ReturnPolicy />} />
                  <Route
                    path="cancellation-policy"
                    element={<CancellationPolicy />}
                  />
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
                  <Route path="mail" element={<AdminMail />} />
                </Route>

                <Route
                  path="*"
                  element={<PlaceholderPage title="404 Page Not Found" />}
                />
              </Routes>
            </BrowserRouter>
          </HelmetProvider>
        </AlertProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);

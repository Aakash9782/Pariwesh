import React, { useState, useEffect } from "react";
import {
  RiFundsBoxLine,
  RiArchiveStackLine,
  RiShoppingBag4Line,
  RiCoupon5Line,
  RiAddCircleLine,
  RiDeleteBinLine,
  RiSparklingLine,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/form/Input.jsx";
import API from "../../services/api.js";

import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const [activeSegment, setActiveSegment] = useState("overview"); // overview, products, coupons

  // Banner ad settings state
  const [bannerActive, setBannerActive] = useState(
    localStorage.getItem("festiveAdActive") === "true",
  );
  const [bannerTitle, setBannerTitle] = useState(
    localStorage.getItem("festiveAdTitle") || "Diwali Festive Dhamaka!",
  );
  const [bannerSubtitle, setBannerSubtitle] = useState(
    localStorage.getItem("festiveAdSubtitle") ||
      "Up to 50% Off on all hand-knit Zari premium anarkalis. Free delivery apply!",
  );
  const [bannerCode, setBannerCode] = useState(
    localStorage.getItem("festiveAdCode") || "FESTIVE50",
  );
  const [bannerLink, setBannerLink] = useState(
    localStorage.getItem("festiveAdLink") || "/shop",
  );
  const [bannerTheme, setBannerTheme] = useState(
    localStorage.getItem("festiveAdTheme") || "royal-gold",
  );

  const handleSaveBanner = (e) => {
    e.preventDefault();
    localStorage.setItem("festiveAdActive", bannerActive ? "true" : "false");
    localStorage.setItem("festiveAdTitle", bannerTitle);
    localStorage.setItem("festiveAdSubtitle", bannerSubtitle);
    localStorage.setItem("festiveAdCode", bannerCode);
    localStorage.setItem("festiveAdLink", bannerLink);
    localStorage.setItem("festiveAdTheme", bannerTheme);
    alert("Festive Campaign Banner updated successfully!");
  };

  // Logo brand state
  const [logoUrl, setLogoUrl] = useState(
    localStorage.getItem("brandLogoUrl") || "",
  );

  useEffect(() => {
    const fetchLogoFromDB = async () => {
      try {
        const res = await API.get("/settings");
        if (res.data && res.data.success && res.data.data) {
          const dbLogo = res.data.data.brandLogoUrl;
          if (dbLogo !== undefined) {
            setLogoUrl(dbLogo);
            if (dbLogo) {
              localStorage.setItem("brandLogoUrl", dbLogo);
            } else {
              localStorage.removeItem("brandLogoUrl");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load logo from DB:", err);
      }
    };
    fetchLogoFromDB();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        alert("Logo file is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Logo = reader.result;
        setLogoUrl(base64Logo);
        localStorage.setItem("brandLogoUrl", base64Logo);

        try {
          await API.post("/settings", {
            key: "brandLogoUrl",
            value: base64Logo,
          });
        } catch (err) {
          console.error("Error saving brand logo to database:", err);
        }

        alert("Brand Logo updated successfully!");
        window.dispatchEvent(new Event("logo-updated"));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = async () => {
    setLogoUrl("");
    localStorage.removeItem("brandLogoUrl");
    try {
      await API.post("/settings", { key: "brandLogoUrl", value: "" });
    } catch (err) {
      console.error("Error resetting brand logo in database:", err);
    }
    alert("Logo reset to default Text Brand Name.");
    window.dispatchEvent(new Event("logo-updated"));
  };

  // Orders management states
  const [ordersList, setOrdersList] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await API.get("/orders");
      if (res.data && res.data.success) {
        setOrdersList(res.data.data);
      }
    } catch (err) {
      console.error("Failed fetching orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await API.put(`/orders/${orderId}/status`, {
        orderStatus: newStatus,
      });
      if (res.data && res.data.success) {
        setOrdersList((prev) =>
          prev.map((o) => (o._id === orderId ? res.data.data : o)),
        );
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(res.data.data);
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed updating order status.");
    }
  };

  const fetchProductsList = async () => {
    try {
      const res = await API.get("/products");
      if (res.data && res.data.success) {
        setProductsList(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  const fetchCouponsList = async () => {
    try {
      const res = await API.get("/coupons");
      if (res.data && res.data.success) {
        setCouponsList(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load coupons:", err);
    }
  };

  useEffect(() => {
    if (activeSegment === "orders") {
      fetchOrders();
    } else if (activeSegment === "products") {
      fetchProductsList();
    } else if (activeSegment === "coupons") {
      fetchCouponsList();
    }
  }, [activeSegment]);

  // Catalogs state
  const [productsList, setProductsList] = useState([]);

  const [couponsList, setCouponsList] = useState([]);

  // Form states to add product
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "",
    tags: "",
  });

  const [productImageFile, setProductImageFile] = useState(null);
  const [productVideoFile, setProductVideoFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const videoElement = document.createElement("video");
      videoElement.preload = "metadata";
      videoElement.src = URL.createObjectURL(file);
      videoElement.onloadedmetadata = () => {
        const duration = videoElement.duration;
        if (duration > 10.5) {
          alert(
            `Selected video length is ${Math.round(duration)} seconds. Please upload a short video of maximum 10 seconds.`,
          );
          e.target.value = ""; // clear input
          setProductVideoFile(null);
          setVideoPreview("");
        } else {
          setProductVideoFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setVideoPreview(reader.result);
          };
          reader.readAsDataURL(file);
        }
      };
    }
  };

  // Form states to add coupon
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    value: "",
    discountType: "Percentage",
  });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku || !newProduct.price) {
      alert("Please fill out Name, SKU and selling price.");
      return;
    }
    try {
      const payload = {
        name: newProduct.name,
        sku: newProduct.sku,
        mrp: Math.round(Number(newProduct.price) * 1.5),
        price: Number(newProduct.price),
        stock: Number(newProduct.stock || 10),
        tag: newProduct.tags || "New",
        image:
          imagePreview ||
          "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop",
        video: videoPreview || "",
      };
      const res = await API.post("/products", payload);
      if (res.data && res.data.success) {
        setProductsList((prev) => [res.data.data, ...prev]);
        setNewProduct({ name: "", sku: "", price: "", stock: "", tags: "" });
        setProductImageFile(null);
        setProductVideoFile(null);
        setImagePreview("");
        setVideoPreview("");
        alert("Product added successfully to the catalog.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add product to catalog.");
    }
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) {
      alert("Please fill out Coupon Code & Discount Value.");
      return;
    }
    try {
      const payload = {
        code: newCoupon.code.toUpperCase(),
        discountType: newCoupon.discountType,
        value: Number(newCoupon.value),
      };
      const res = await API.post("/coupons", payload);
      if (res.data && res.data.success) {
        setCouponsList((prev) => [res.data.data, ...prev]);
        setNewCoupon({ code: "", value: "", discountType: "Percentage" });
        alert("Coupon generated successfully in database!");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add coupon.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product from database?",
      )
    )
      return;
    try {
      const res = await API.delete(`/products/id/${id}`);
      if (res.data && res.data.success) {
        setProductsList((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete product.");
    }
  };

  const handleDeleteCoupon = async (code) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${code}?`))
      return;
    try {
      const res = await API.delete(`/coupons/${code}`);
      if (res.data && res.data.success) {
        setCouponsList((prev) => prev.filter((c) => c.code !== code));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete coupon.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-textPrimary">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-borderLight mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-medium text-textPrimary uppercase tracking-wider">
            Priwesh Admin Portal
          </h1>
          <p className="text-xs text-textSecondary mt-1">
            Management desk for sales tracking, catalog lists, and coupon
            triggers
          </p>
        </div>

        {/* Dashboard quick links */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSegment("overview")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center space-x-2 border transition-all ${
              activeSegment === "overview"
                ? "bg-secondary text-primary border-secondary"
                : "bg-primary text-textPrimary border-borderLight hover:bg-bgLight"
            }`}
          >
            <RiFundsBoxLine />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveSegment("orders")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center space-x-2 border transition-all ${
              activeSegment === "orders"
                ? "bg-secondary text-primary border-secondary"
                : "bg-primary text-textPrimary border-borderLight hover:bg-bgLight"
            }`}
          >
            <RiShoppingBag4Line />
            <span>Orders</span>
          </button>
          <button
            onClick={() => setActiveSegment("products")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center space-x-2 border transition-all ${
              activeSegment === "products"
                ? "bg-secondary text-primary border-secondary"
                : "bg-primary text-textPrimary border-borderLight hover:bg-bgLight"
            }`}
          >
            <RiArchiveStackLine />
            <span>Products</span>
          </button>
          <button
            onClick={() => setActiveSegment("coupons")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center space-x-2 border transition-all ${
              activeSegment === "coupons"
                ? "bg-secondary text-primary border-secondary"
                : "bg-primary text-textPrimary border-borderLight hover:bg-bgLight"
            }`}
          >
            <RiCoupon5Line />
            <span>Coupons</span>
          </button>
          <button
            onClick={() => setActiveSegment("banner-ads")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center space-x-2 border transition-all ${
              activeSegment === "banner-ads"
                ? "bg-secondary text-primary border-secondary"
                : "bg-primary text-textPrimary border-borderLight hover:bg-bgLight"
            }`}
          >
            <RiSparklingLine />
            <span>Offer Banners</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW PANEL */}
      {activeSegment === "overview" && (
        <div className="space-y-8 animate-fade-in">
          {/* Card Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-primary border border-borderLight p-6 rounded-sm shadow-sm">
              <span className="block text-[10px] uppercase font-bold text-textSecondary tracking-wider">
                Month to Date Revenue
              </span>
              <h3 className="text-2xl font-display font-bold text-textPrimary mt-1">
                ₹4,89,600
              </h3>
              <p className="text-[10px] text-green-600 font-semibold mt-2">
                ↑ 24% vs last billing month
              </p>
            </div>
            <div className="bg-primary border border-borderLight p-6 rounded-sm shadow-sm">
              <span className="block text-[10px] uppercase font-bold text-textSecondary tracking-wider">
                Orders Dispatched
              </span>
              <h3 className="text-2xl font-display font-bold text-textPrimary mt-1">
                198 Ensembles
              </h3>
              <p className="text-[10px] text-textSecondary font-semibold mt-2">
                0 orders pending transit dispatch
              </p>
            </div>
            <div className="bg-primary border border-borderLight p-6 rounded-sm shadow-sm">
              <span className="block text-[10px] uppercase font-bold text-textSecondary tracking-wider">
                Items in Catalog
              </span>
              <h3 className="text-2xl font-display font-bold text-textPrimary mt-1">
                {productsList.length} Active
              </h3>
              <p className="text-[10px] text-textSecondary font-semibold mt-2">
                Updated 5 minutes ago
              </p>
            </div>
            <div className="bg-primary border border-borderLight p-6 rounded-sm shadow-sm">
              <span className="block text-[10px] uppercase font-bold text-textSecondary tracking-wider">
                SMS Promo conversions
              </span>
              <h3 className="text-2xl font-display font-bold text-textPrimary mt-1">
                15.4% Rate
              </h3>
              <p className="text-[10px] text-green-600 font-semibold mt-2">
                ↑ 3.2% vs industry indices
              </p>
            </div>
          </div>

          {/* Sales Graphic Curves Simulators */}
          <div className="bg-primary border border-borderLight p-6 rounded-sm shadow-sm">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary pb-4 border-b border-borderLight">
              Sales Trend (6 Months)
            </h3>
            <div className="pt-8 h-48 flex items-end justify-between gap-4">
              {[
                { label: "Jan", val: "h-[30%]" },
                { label: "Feb", val: "h-[50%]" },
                { label: "Mar", val: "h-[40%]" },
                { label: "Apr", val: "h-[75%]" },
                { label: "May", val: "h-[60%]" },
                { label: "Jun", val: "h-[95%]" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex-grow flex flex-col items-center gap-2"
                >
                  <div
                    className={`w-full ${item.val} bg-accent-gold rounded-t-sm shadow-md transition-all hover:bg-secondary duration-500`}
                  />
                  <span className="text-[10px] font-semibold text-textSecondary uppercase">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS MANAGEMENTS */}
      {activeSegment === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Add product Form */}
          <form
            onSubmit={handleAddProduct}
            className="lg:col-span-4 bg-primary border border-borderLight p-6 rounded-sm shadow-sm space-y-6"
          >
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary pb-3 border-b border-borderLight">
              Add New Dress Suit
            </h3>
            <Input
              label="Product Name"
              required
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              placeholder="e.g. Saffron Organza Kurti"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SKU ID"
                required
                value={newProduct.sku}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, sku: e.target.value })
                }
                placeholder="LHR-ORG-008"
              />
              <Input
                label="Catalog Tags"
                value={newProduct.tags}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, tags: e.target.value })
                }
                placeholder="New Arrival"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price (₹)"
                required
                type="number"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
                placeholder="1599"
              />
              <Input
                label="Stock Level"
                type="number"
                value={newProduct.stock}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, stock: e.target.value })
                }
                placeholder="40"
              />
            </div>

            {/* File uploads */}
            <div className="space-y-4 pt-2 border-t border-borderLight">
              <div className="flex flex-col space-y-1.5 text-left">
                <span className="text-[10px] uppercase font-display font-semibold tracking-wider text-textSecondary">
                  Product Image Cover (File)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-xs text-textSecondary file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-bgLight file:text-textPrimary hover:file:bg-borderLight cursor-pointer file:cursor-pointer"
                />
                {imagePreview && (
                  <div className="w-16 h-20 mt-2 rounded border overflow-hidden bg-bgLight">
                    <img
                      src={imagePreview}
                      className="w-full h-full object-cover"
                      alt="preview"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-1.5 text-left">
                <span className="text-[10px] uppercase font-display font-semibold tracking-wider text-textSecondary">
                  Promotional Video (Max 10s file)
                </span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="text-xs text-textSecondary file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-bgLight file:text-textPrimary hover:file:bg-borderLight cursor-pointer file:cursor-pointer"
                />
                {videoPreview && (
                  <div className="w-16 h-20 mt-2 rounded border overflow-hidden bg-bgLight relative">
                    <video
                      src={videoPreview}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" variant="gold" size="md" className="w-full">
              <RiAddCircleLine size={14} className="mr-1.5" />
              <span>Catalog Product</span>
            </Button>
          </form>

          {/* Product grid list */}
          <div className="lg:col-span-8 bg-primary border border-borderLight p-6 rounded-sm shadow-sm">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary pb-3 border-b border-borderLight mb-4 text-left">
              Stock Ledger Catalog
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bgLight text-textSecondary uppercase font-bold text-[9px] border-b border-borderLight">
                    <th className="p-4">Suit Design Name</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4 text-right">Price</th>
                    <th className="p-4 text-right">Stock</th>
                    <th className="p-4 text-center">Tags</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLight">
                  {productsList.map((prod) => (
                    <tr
                      key={prod._id}
                      className="hover:bg-bgLight transition-colors"
                    >
                      <td className="p-4 font-bold text-textPrimary flex items-center space-x-3">
                        <div className="w-10 h-12 bg-bgLight rounded overflow-hidden flex-shrink-0 relative border border-borderLight">
                          {prod.video ? (
                            <div className="absolute inset-0 z-10 bg-black/35 flex items-center justify-center">
                              <span className="text-[7.5px] text-white font-extrabold uppercase bg-black/40 px-1 rounded-sm">
                                Vid
                              </span>
                            </div>
                          ) : null}
                          <img
                            src={
                              prod.image ||
                              (prod.images && prod.images[0]) ||
                              "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop"
                            }
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        </div>
                        <span className="truncate max-w-[150px]">
                          {prod.name}
                        </span>
                      </td>
                      <td className="p-4 font-semibold">{prod.sku}</td>
                      <td className="p-4 text-right font-bold text-textPrimary">
                        ₹{prod.price}
                      </td>
                      <td className="p-4 text-right font-medium">
                        {prod.stock} items
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-secondary text-accent-gold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold">
                          {prod.tags}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteProduct(prod._id)}
                          className="text-textSecondary hover:text-danger p-1 rounded-full hover:bg-danger/10"
                        >
                          <RiDeleteBinLine size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ONLINE COUPONS TRIGGER */}
      {activeSegment === "coupons" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Add coupon form */}
          <form
            onSubmit={handleAddCoupon}
            className="lg:col-span-4 bg-primary border border-borderLight p-6 rounded-sm shadow-sm space-y-6"
          >
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary pb-3 border-b border-borderLight">
              Add Coupon Promo
            </h3>
            <Input
              label="Promo Coupon Code"
              required
              value={newCoupon.code}
              onChange={(e) =>
                setNewCoupon({
                  ...newCoupon,
                  code: e.target.value.toUpperCase(),
                })
              }
              placeholder="e.g. INVENTGOLD"
            />
            <div className="flex flex-col space-y-1.5">
              <span className="text-[10px] uppercase font-display font-semibold tracking-wider text-textSecondary">
                Discount Type
              </span>
              <select
                value={newCoupon.discountType}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, discountType: e.target.value })
                }
                className="w-full bg-primary text-textPrimary border border-borderLight text-xs px-4 py-3 rounded-sm focus:border-accent-gold focus:outline-none"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Flat">Flat Price (₹)</option>
              </select>
            </div>
            <Input
              label="Discount Value"
              required
              type="number"
              value={newCoupon.value}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, value: e.target.value })
              }
              placeholder="e.g. 15 for 15% / 300 for ₹300"
            />
            <Button type="submit" variant="gold" size="md" className="w-full">
              <RiAddCircleLine size={14} className="mr-1.5" />
              <span>Register Coupon Promo</span>
            </Button>
          </form>

          {/* Coupon lists table */}
          <div className="lg:col-span-8 bg-primary border border-borderLight p-6 rounded-sm shadow-sm">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary pb-3 border-b border-borderLight mb-4 text-left">
              Promo Campaign Ledger
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bgLight text-textSecondary uppercase font-bold text-[9px] border-b border-borderLight">
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Discount Type</th>
                    <th className="p-4 text-center">Value</th>
                    <th className="p-4 text-center">Conversions</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLight">
                  {couponsList.map((cpn, cIdx) => (
                    <tr
                      key={cIdx}
                      className="hover:bg-bgLight transition-colors"
                    >
                      <td className="p-4 font-bold text-textPrimary tracking-widest">
                        {cpn.code}
                      </td>
                      <td className="p-4 font-medium">{cpn.discountType}</td>
                      <td className="p-4 text-center font-bold text-textPrimary">
                        {cpn.discountType === "Percentage"
                          ? `${cpn.value}%`
                          : `₹${cpn.value}`}
                      </td>
                      <td className="p-4 text-center font-semibold">
                        {cpn.ordersUsed} orders
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                            cpn.status === "Active"
                              ? "bg-green-55/10 text-green-600"
                              : "bg-amber-55/10 text-amber-600"
                          }`}
                        >
                          {cpn.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteCoupon(cpn.code)}
                          className="text-textSecondary hover:text-danger p-1 rounded-full hover:bg-danger/10"
                        >
                          <RiDeleteBinLine size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BRAND IDENTITY LOGO CUSTOMIZER */}
      {activeSegment === "banner-ads" && (
        <div className="bg-primary border border-borderLight p-8 rounded-sm shadow-sm space-y-6 max-w-3xl mx-auto mb-8 animate-fade-in">
          <div className="border-b border-borderLight pb-4">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-textPrimary text-left">
              Brand Identity Logo Customization
            </h3>
            <p className="text-[11px] text-textSecondary mt-0.5 text-left">
              Upload a PNG/JPG brand image logo to replace the default
              text-based logo on header/navigation
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex flex-col space-y-3 text-left">
              <span className="text-[10px] uppercase font-display font-semibold tracking-wider text-textSecondary">
                Select Logo Image File
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="text-xs text-textSecondary file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-bgLight file:text-textPrimary hover:file:bg-borderLight cursor-pointer file:cursor-pointer"
              />
              <span className="text-[9px] text-textSecondary">
                Format: .png, .jpg, .svg (Transparent recommended, max size 2MB)
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[9px] uppercase font-bold text-textSecondary">
                Current Logo Preview
              </span>
              <div className="h-16 w-48 border border-dashed border-borderLight rounded-sm flex items-center justify-center bg-bgLight p-4 relative overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    className="h-full w-full object-contain"
                    alt="brand logo preview"
                  />
                ) : (
                  <span className="text-xs font-semibold text-textSecondary select-none">
                    Default Brand Template (Text)
                  </span>
                )}
              </div>
              {logoUrl && (
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="text-[10px] text-danger hover:underline font-bold"
                >
                  Reset To Text Logo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OFFER AD BANNER MANAGEMENT */}
      {activeSegment === "banner-ads" && (
        <form
          onSubmit={handleSaveBanner}
          className="bg-primary border border-borderLight p-8 rounded-sm shadow-sm space-y-8 animate-fade-in max-w-3xl mx-auto"
        >
          <div className="border-b border-borderLight pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-textPrimary">
                Festive Campaign Ad Banner
              </h3>
              <p className="text-[11px] text-textSecondary mt-0.5">
                Configure promotional banner ads dynamically displayed on user
                home screen
              </p>
            </div>
            {/* Toggle Status switch */}
            <div className="flex items-center space-x-3 bg-bgLight px-4 py-2 border rounded-sm">
              <span className="text-xs uppercase font-extrabold tracking-wider text-textSecondary">
                Campaign Status
              </span>
              <button
                type="button"
                onClick={() => setBannerActive(!bannerActive)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                  bannerActive ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    bannerActive ? "translate-x-6" : ""
                  }`}
                />
              </button>
              <span
                className={`text-[10px] uppercase font-bold ${
                  bannerActive ? "text-green-600" : "text-textSecondary"
                }`}
              >
                {bannerActive ? "LIVE" : "DISABLED"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Banner Highlight Title"
              required
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              placeholder="e.g. DIWALI DHAMAKA SALE"
            />
            <div className="flex flex-col space-y-1.5">
              <span className="text-[10px] uppercase font-display font-semibold tracking-wider text-textSecondary">
                Festive Decor Theme
              </span>
              <select
                value={bannerTheme}
                onChange={(e) => setBannerTheme(e.target.value)}
                className="w-full bg-primary text-textPrimary border border-borderLight text-xs px-4 py-3 rounded-sm focus:border-accent-gold focus:outline-none"
              >
                <option value="royal-gold">Royal Champagne Gold</option>
                <option value="emerald-green">Emerald Forest Green</option>
                <option value="ruby-red">Ruby Royal Crimson</option>
                <option value="velvet-purple">Luxury Velvet Purple</option>
              </select>
            </div>
          </div>

          <Input
            label="Banner Subtitle / Promotional Details text"
            required
            value={bannerSubtitle}
            onChange={(e) => setBannerSubtitle(e.target.value)}
            placeholder="e.g. Flat 30% Off on all hand-knit organza sets. Code applied automatically!"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Promo Code (Optional)"
              value={bannerCode}
              onChange={(e) => setBannerCode(e.target.value.toUpperCase())}
              placeholder="e.g. FESTIVE30"
            />
            <Input
              label="Target Action Link"
              required
              value={bannerLink}
              onChange={(e) => setBannerLink(e.target.value)}
              placeholder="/shop"
            />
          </div>

          <div className="border-t border-borderLight pt-6 flex justify-end">
            <Button type="submit" variant="gold" size="lg" className="px-10">
              Publish Campaign Banner
            </Button>
          </div>
        </form>
      )}

      {/* ORDERS MANAGEMENT PANEL */}
      {activeSegment === "orders" && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="bg-primary border border-borderLight p-6 rounded-sm shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-borderLight mb-6">
              <div>
                <h3 className="text-sm font-display font-bold uppercase tracking-wider text-textPrimary">
                  Customer Orders Registry
                </h3>
                <p className="text-[11px] text-textSecondary mt-0.5">
                  Track customer sales transactions, order statuses, generate
                  shipping labels & invoices
                </p>
              </div>
              <button
                onClick={fetchOrders}
                className="text-xs font-bold text-accent-gold hover:underline bg-transparent border-0 outline-none cursor-pointer"
              >
                Refresh Queue
              </button>
            </div>

            {loadingOrders ? (
              <div className="py-20 text-center text-xs text-textSecondary">
                Loading database transactions...
              </div>
            ) : ordersList.length === 0 ? (
              <div className="py-20 text-center text-xs text-textSecondary bg-bgLight border border-dashed rounded">
                No orders registered in the database yet. Place orders from the
                cart page to populate this screen.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-bgLight text-textSecondary uppercase font-bold text-[9px] border-b border-borderLight">
                      <th className="p-4">Order ID & Date</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Purchased Items</th>
                      <th className="p-4 text-right">Payment</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Logistics / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLight">
                    {ordersList.map((order) => (
                      <tr
                        key={order._id}
                        className="hover:bg-bgLight/40 transition-colors"
                      >
                        {/* ID & Date */}
                        <td className="p-4 font-bold text-textPrimary leading-normal">
                          <span className="block font-mono tracking-wide text-xs">
                            {order.orderId}
                          </span>
                          <span className="block text-[10px] text-textSecondary font-semibold mt-1">
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="p-4 leading-relaxed font-semibold">
                          <span className="block text-textPrimary">
                            {order.shippingAddress?.fullName}
                          </span>
                          <span className="block text-[10px] text-textSecondary font-mono mt-0.5">
                            {order.shippingAddress?.phone}
                          </span>
                        </td>

                        {/* Ordered Items */}
                        <td className="p-4 max-w-[250px] leading-relaxed">
                          {order.items?.map((item, idx) => (
                            <div
                              key={idx}
                              className="truncate text-[11px] text-textPrimary font-medium"
                            >
                              {item.quantity}x {item.name}{" "}
                              <span className="text-[10px] text-textSecondary font-bold">
                                ({item.size}/{item.color})
                              </span>
                            </div>
                          ))}
                        </td>

                        {/* Payment */}
                        <td className="p-4 text-right leading-relaxed font-bold">
                          <span className="block text-textPrimary">
                            ₹{order.pricing?.grandTotal}
                          </span>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-[3px] text-[8.5px] uppercase font-bold mt-1 ${
                              order.paymentStatus === "Paid"
                                ? "bg-green-600/10 text-green-600"
                                : "bg-amber-600/10 text-amber-600"
                            }`}
                          >
                            {order.paymentMethod} • {order.paymentStatus}
                          </span>
                        </td>

                        {/* Status dropdown */}
                        <td className="p-4 text-center">
                          <select
                            value={order.orderStatus}
                            onChange={(e) =>
                              handleUpdateStatus(order._id, e.target.value)
                            }
                            className={`text-[10px] font-bold uppercase py-1.5 px-2.5 rounded border focus:outline-none cursor-pointer ${
                              order.orderStatus === "Placed"
                                ? "bg-blue-50/10 text-blue-600 border-blue-200"
                                : order.orderStatus === "Processing"
                                  ? "bg-amber-50/10 text-amber-600 border-amber-200"
                                  : order.orderStatus === "Shipped"
                                    ? "bg-purple-50/10 text-purple-600 border-purple-200"
                                    : order.orderStatus === "Delivered"
                                      ? "bg-green-50/10 text-green-600 border-green-200"
                                      : "bg-red-50/10 text-red-600 border-red-200"
                            }`}
                          >
                            <option value="Placed">Placed</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center space-y-1.5">
                          {order.trackingId && (
                            <div className="text-[10px] leading-snug font-semibold text-textSecondary">
                              <span className="block uppercase text-[7.5px] font-extrabold text-accent-gold">
                                {order.shippingProvider}
                              </span>
                              <span className="font-mono text-xs">
                                {order.trackingId}
                              </span>
                            </div>
                          )}
                          <Button
                            onClick={() => setSelectedOrder(order)}
                            variant="gold"
                            size="sm"
                            className="w-full text-[9px] uppercase tracking-wider py-1 font-bold"
                          >
                            Label / Invoice
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE SHIPPING LABEL & INVOICE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          {/* Print Style Injector */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              body > * {
                display: none !important;
              }
              #printable-shipping-label-container {
                display: block !important;
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                height: auto;
                background: white !important;
                z-index: 9999999 !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print-area {
                display: none !important;
              }
            }
          `,
            }}
          />

          <div
            id="printable-shipping-label-container"
            className="bg-primary text-textPrimary border border-borderLight rounded-sm shadow-2xl max-w-2xl w-full p-8 space-y-6 text-left relative animate-fade-in"
          >
            {/* Modal Title Actions (Hidden in Print) */}
            <div className="no-print-area flex justify-between items-center pb-4 border-b border-borderLight">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-textPrimary">
                Print Logistics Manifest & Invoice
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-textSecondary hover:text-textPrimary font-bold text-xs uppercase cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>

            {/* Label Core Design */}
            <div className="border border-black p-6 space-y-6 bg-white text-black font-sans leading-relaxed">
              {/* Header Branding */}
              <div className="flex justify-between items-start border-b-2 border-black pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-widest uppercase">
                    PARIWESH
                    <span className="text-[#D4AF37] font-extrabold">.</span>
                  </h2>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                    Premium Fashion Ensembles
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold uppercase tracking-widest text-[#D4AF37]">
                    TAX INVOICE
                  </p>
                  <p className="font-mono mt-0.5">
                    <span className="font-bold">INV:</span>{" "}
                    {selectedOrder.orderId}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    Date:{" "}
                    {new Date(selectedOrder.createdAt).toLocaleDateString(
                      "en-IN",
                    )}
                  </p>
                </div>
              </div>

              {/* Shipper & Consignee */}
              <div className="grid grid-cols-2 gap-8 text-xs border-b border-black pb-4">
                <div>
                  <h4 className="font-bold text-[9px] uppercase tracking-wider text-gray-400 mb-1">
                    Sender (Shipper)
                  </h4>
                  <p className="font-bold">PARIWESH LOGISTICS HUB</p>
                  <p className="text-gray-600 mt-1">
                    Plot 45-B, Sector 7, Vidhyadhar Nagar
                  </p>
                  <p className="text-gray-600">Jaipur, Rajasthan, 302039</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    Contact: warehouse@priwesh.com
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[9px] uppercase tracking-wider text-gray-400 mb-1">
                    Deliver To (Consignee)
                  </h4>
                  <p className="font-bold uppercase">
                    {selectedOrder.shippingAddress?.fullName}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {selectedOrder.shippingAddress?.street}
                  </p>
                  <p className="text-gray-600">
                    {selectedOrder.shippingAddress?.city},{" "}
                    {selectedOrder.shippingAddress?.state} -{" "}
                    <span className="font-bold">
                      {selectedOrder.shippingAddress?.pincode}
                    </span>
                  </p>
                  <p className="font-bold text-gray-800 mt-1">
                    Mob: {selectedOrder.shippingAddress?.phone}
                  </p>
                </div>
              </div>

              {/* Logistics Routing Barcode */}
              <div className="bg-gray-50 border border-gray-300 p-4 rounded-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <span className="block text-[8px] uppercase tracking-widest font-extrabold text-gray-400">
                    Courier Partner
                  </span>
                  <span className="block text-md font-bold uppercase text-[#D4AF37]">
                    {selectedOrder.shippingProvider || "Self-Shipped / Pending"}
                  </span>
                  <span className="block text-[10px] text-gray-500 font-mono">
                    Routing AWB Tracking:{" "}
                    <span className="font-bold text-black">
                      {selectedOrder.trackingId || "PENDING"}
                    </span>
                  </span>
                </div>
                {/* Visual Barcode mockup */}
                <div className="flex flex-col items-center">
                  <div className="h-10 w-44 flex items-center justify-between border-x border-black bg-white px-1">
                    {[
                      1, 2.5, 1, 1.5, 3, 1, 1, 2, 1.5, 1, 3.5, 1, 2.5, 1, 1, 2,
                      1.5, 1, 3,
                    ].map((w, idx) => (
                      <div
                        key={idx}
                        className="bg-black h-full"
                        style={{ width: `${w}px` }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] mt-1 tracking-[0.25em]">
                    {selectedOrder.trackingId || "0918237912"}
                  </span>
                </div>
              </div>

              {/* Itemized summary */}
              <div>
                <h4 className="font-bold text-[9px] uppercase tracking-wider text-gray-400 mb-2">
                  Itemized Particulars
                </h4>
                <table className="w-full text-xs text-left border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 font-bold border-b border-gray-200">
                      <th className="p-2 border-r border-gray-200">
                        Description
                      </th>
                      <th className="p-2 border-r border-gray-200">SKU</th>
                      <th className="p-2 border-r border-gray-200 text-center">
                        Specs
                      </th>
                      <th className="p-2 border-r border-gray-200 text-right">
                        Price
                      </th>
                      <th className="p-2 border-r border-gray-200 text-center">
                        Qty
                      </th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r border-gray-200 font-semibold">
                          {item.name}
                        </td>
                        <td className="p-2 border-r border-gray-200 font-mono text-[10px]">
                          {item.sku}
                        </td>
                        <td className="p-2 border-r border-gray-200 text-center uppercase text-[10px] font-bold">
                          {item.size} / {item.color}
                        </td>
                        <td className="p-2 border-r border-gray-200 text-right">
                          ₹{item.price}
                        </td>
                        <td className="p-2 border-r border-gray-200 text-center">
                          {item.quantity}
                        </td>
                        <td className="p-2 text-right">
                          ₹{item.price * item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payout & Charges breakdown */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end pt-4 border-t-2 border-dashed border-black">
                {/* Method Alert */}
                <div
                  className={`p-4 border-2 rounded-sm text-center font-bold text-sm tracking-widest uppercase md:max-w-[280px] w-full ${
                    selectedOrder.paymentMethod === "COD"
                      ? "border-red-600 bg-red-50 text-red-700"
                      : "border-green-600 bg-green-50 text-green-700"
                  }`}
                >
                  {selectedOrder.paymentMethod === "COD" ? (
                    <div>
                      <span className="block text-[8px] tracking-wider text-gray-500 font-mono font-semibold">
                        Payment Mode: COD
                      </span>
                      CASH ON DELIVERY
                      <span className="block text-[#D4AF37] font-display text-lg mt-1 font-bold">
                        COLLECT ₹{selectedOrder.pricing?.grandTotal}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="block text-[8px] tracking-wider text-gray-500 font-mono font-semibold">
                        Payment Mode: PREPAID
                      </span>
                      PREPAID ORDER
                      <span className="block text-xs mt-1 text-green-800 font-semibold lowercase italic">
                        do not collect cash
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing Ledger */}
                <div className="w-full md:w-60 text-xs space-y-1.5 font-medium text-right mt-4 md:mt-0">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span>₹{selectedOrder.pricing?.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">GST (12%):</span>
                    <span>₹{selectedOrder.pricing?.gst}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery:</span>
                    <span>
                      {selectedOrder.pricing?.delivery === 0
                        ? "FREE"
                        : `₹${selectedOrder.pricing?.delivery}`}
                    </span>
                  </div>
                  {selectedOrder.pricing?.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-red-500">
                        Discount (
                        {selectedOrder.pricing?.appliedCoupon || "Promo"}):
                      </span>
                      <span>-₹{selectedOrder.pricing?.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-black pt-2 font-bold text-sm">
                    <span>Total Paid/Collectible:</span>
                    <span className="text-[#D4AF37] font-display text-lg">
                      ₹{selectedOrder.pricing?.grandTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Trigger Action Box (Hidden in Print) */}
            <div className="no-print-area flex justify-end gap-3 pt-4 border-t border-borderLight">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 bg-bgLight text-textPrimary hover:bg-borderLight text-xs uppercase font-semibold transition-all rounded-sm cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-8 py-2.5 bg-accent-gold text-secondary hover:bg-accent-goldHover text-xs uppercase font-bold tracking-wider transition-all rounded-sm shadow-md cursor-pointer"
              >
                Print Label & Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

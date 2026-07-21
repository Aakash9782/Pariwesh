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

const Dashboard = () => {
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        alert("Logo file is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setLogoUrl(reader.result);
        localStorage.setItem("brandLogoUrl", reader.result);
        alert("Brand Logo updated successfully!");
        window.dispatchEvent(new Event("logo-updated"));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    setLogoUrl("");
    localStorage.removeItem("brandLogoUrl");
    alert("Logo reset to default Text Brand Name.");
    window.dispatchEvent(new Event("logo-updated"));
  };

  // Catalogs state
  const [productsList, setProductsList] = useState(() => {
    const saved = localStorage.getItem("customProducts");
    if (saved) return JSON.parse(saved);
    return [
      {
        _id: "1",
        name: "Elysian Gold Chanderi Suit",
        sku: "LHR-CH-001",
        price: 2499,
        tags: "Best Seller",
        stock: 45,
        image:
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop",
        video: "",
      },
      {
        _id: "2",
        name: "Scarlet Floral Rayon Kurti",
        sku: "LHR-RY-002",
        price: 1199,
        tags: "New",
        stock: 80,
        image:
          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop",
        video: "",
      },
      {
        _id: "3",
        name: "Ivory Zari Premium Anarkali Set",
        sku: "LHR-AK-003",
        price: 3999,
        tags: "Exclusive",
        stock: 25,
        image:
          "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop",
        video: "",
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem("customProducts", JSON.stringify(productsList));
  }, [productsList]);

  const [couponsList, setCouponsList] = useState([
    {
      code: "PRIWESHGOLD",
      discountType: "Percentage",
      value: "15%",
      status: "Active",
      ordersUsed: 142,
    },
    {
      code: "SUMMERSET",
      discountType: "Flat",
      value: "₹300",
      status: "Scheduled",
      ordersUsed: 0,
    },
  ]);

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
      setImagePreview(URL.createObjectURL(file));
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
          setVideoPreview(URL.createObjectURL(file));
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

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku || !newProduct.price) {
      alert("Please fill out Name, SKU and selling price.");
      return;
    }
    const product = {
      _id: String(Date.now()),
      name: newProduct.name,
      sku: newProduct.sku,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock || 10),
      tags: newProduct.tags || "Regular",
      image:
        imagePreview ||
        "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop",
      video: videoPreview || "",
    };
    setProductsList((prev) => [product, ...prev]);
    setNewProduct({ name: "", sku: "", price: "", stock: "", tags: "" });
    setProductImageFile(null);
    setProductVideoFile(null);
    setImagePreview("");
    setVideoPreview("");
  };

  const handleAddCoupon = (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) {
      alert("Please fill out Coupon Code & Discount Value.");
      return;
    }
    const couponObj = {
      code: newCoupon.code.toUpperCase(),
      discountType: newCoupon.discountType,
      value:
        newCoupon.discountType === "Percentage"
          ? `${newCoupon.value}%`
          : `₹${newCoupon.value}`,
      status: "Active",
      ordersUsed: 0,
    };
    setCouponsList((prev) => [couponObj, ...prev]);
    setNewCoupon({ code: "", value: "", discountType: "Percentage" });
  };

  const handleDeleteProduct = (id) => {
    setProductsList((prev) => prev.filter((p) => p._id !== id));
  };

  const handleDeleteCoupon = (code) => {
    setCouponsList((prev) => prev.filter((c) => c.code !== code));
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
                        {cpn.value}
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
    </div>
  );
};

export default Dashboard;

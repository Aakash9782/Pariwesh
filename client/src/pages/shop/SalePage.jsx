import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import API from "../../services/api.js";
import SEO from "../../components/common/SEO.jsx";
import ProductImageSlider from "../../components/common/ProductImageSlider.jsx";
import { ProductSkeleton } from "../../components/common/Skeleton.jsx";
import { addToCart } from "../../redux/slices/cartSlice.js";
import { toggleWishlistProduct } from "../../redux/slices/wishlistSlice.js";
import {
  syncCartNow,
  syncWishlistNow,
} from "../../services/hydrateCommerce.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";
import {
  RiHeartLine,
  RiHeartFill,
  RiSparklingFill,
  RiShieldCheckLine,
  RiTruckLine,
  RiGiftLine,
  RiFileCopyLine,
  RiCheckLine,
  RiFireLine,
  RiShoppingBagLine,
} from "react-icons/ri";

const SalePage = () => {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const wishlistItems = useSelector((state) => state.wishlist.products || []);

  // Campaign Settings from Admin DB / localStorage
  const [saleSettings, setSaleSettings] = useState({
    saleNavTitle:
      localStorage.getItem("saleNavTitle") || "NAVRATRI SALE IS LIVE",
    saleHeadline: "Royal Festive Edit — Up to 50% Off",
    saleSubtitle:
      "Handcrafted Zari & Cotton Silk Ensembles. Limited Festive Quantities.",
    salePromoCode: "NAVRATRI15",
    saleDiscountText: "EXTRA 15% OFF ON ORDERS ABOVE ₹1,999",
    saleEndDate: "",
    saleMinDiscount: "0",
    saleBannerDesktop: "",
    saleBannerMobile: "",
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDealChip, setSelectedDealChip] = useState("all");
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Live Countdown State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Fetch campaign configuration
  useEffect(() => {
    const fetchCampaignSettings = async () => {
      try {
        const res = await API.get("/settings");
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          setSaleSettings({
            saleNavTitle: d.saleNavTitle || "NAVRATRI SALE IS LIVE",
            saleHeadline:
              d.saleHeadline || "Royal Festive Edit — Up to 50% Off",
            saleSubtitle:
              d.saleSubtitle ||
              "Handcrafted Zari & Cotton Silk Ensembles. Limited Festive Quantities.",
            salePromoCode: d.salePromoCode || "NAVRATRI15",
            saleDiscountText:
              d.saleDiscountText || "EXTRA 15% OFF ON ORDERS ABOVE ₹1,999",
            saleEndDate: d.saleEndDate || "",
            saleMinDiscount: d.saleMinDiscount || "0",
            saleBannerDesktop: d.saleBannerDesktop || "",
            saleBannerMobile: d.saleBannerMobile || "",
          });
        }
      } catch (err) {
        console.error("Failed loading campaign settings:", err);
      }
    };
    fetchCampaignSettings();
  }, []);

  // Fetch store products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await API.get("/products");
        if (res.data?.success) {
          const activeOnly = (res.data.data || []).filter(
            (p) => !p.status || p.status === "active",
          );
          setProducts(activeOnly);
        }
      } catch (err) {
        console.error("Failed loading sale products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Live Urgency Countdown Timer
  useEffect(() => {
    const updateCountdown = () => {
      if (saleSettings.saleEndDate) {
        const target = new Date(saleSettings.saleEndDate).getTime();
        const now = new Date().getTime();
        const diff = target - now;

        if (diff <= 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        } else {
          setTimeLeft({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
          });
        }
      } else {
        // Fallback rolling countdown (ends midnight next day)
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(23, 59, 59, 999);
        const diff = midnight.getTime() - now.getTime();
        setTimeLeft({
          days: 1,
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [saleSettings.saleEndDate]);

  // Copy coupon handler
  const handleCopyCoupon = () => {
    if (!saleSettings.salePromoCode) return;
    navigator.clipboard.writeText(saleSettings.salePromoCode);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  // Quick add to cart
  const handleQuickAddToCart = (product, size) => {
    dispatch(
      addToCart({
        product: {
          _id: product._id,
          name: product.name,
          price: product.price || product.sellingPrice,
          images: product.images,
          sku: product.sku || "",
        },
        quantity: 1,
        variant: { size, color: product.color || "Default" },
      }),
    );
    syncCartNow();
    showAlert(
      `"${product.name}" (Size: ${size}) has been added to your shopping bag!`,
      "Added to Bag",
    );
  };

  // Toggle wishlist
  const handleWishlistToggle = (product) => {
    dispatch(toggleWishlistProduct(product));
    syncWishlistNow();
  };

  // Base qualified sale products (MRP > sellingPrice OR minimum discount threshold)
  const qualifiedProducts = useMemo(() => {
    const minDiscSetting = Number(saleSettings.saleMinDiscount) || 0;
    return products.filter((p) => {
      const mrp = Number(p.mrp) || 0;
      const price = Number(p.price || p.sellingPrice) || 0;
      const discountPercent =
        mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

      // Check if product qualifies by price discount or tag
      const hasDiscount = mrp > price;
      const meetsMinDiscount = discountPercent >= minDiscSetting;
      const hasSaleTag =
        p.tag &&
        (p.tag.toLowerCase().includes("sale") ||
          p.tag.toLowerCase().includes("offer") ||
          p.tag.toLowerCase().includes("festive") ||
          p.tag.toLowerCase().includes("hot"));

      return (hasDiscount && meetsMinDiscount) || hasSaleTag;
    });
  }, [products, saleSettings.saleMinDiscount]);

  // Apply User's Active Deal Filter Chip
  const displayedProducts = useMemo(() => {
    return qualifiedProducts.filter((p) => {
      const price = Number(p.price || p.sellingPrice) || 0;
      const mrp = Number(p.mrp) || 0;
      const discountPercent =
        mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

      if (selectedDealChip === "under-1499") return price <= 1499;
      if (selectedDealChip === "under-1999") return price <= 1999;
      if (selectedDealChip === "under-2499") return price <= 2499;
      if (selectedDealChip === "min-30") return discountPercent >= 30;
      if (selectedDealChip === "min-40") return discountPercent >= 40;
      if (selectedDealChip === "min-50") return discountPercent >= 50;
      return true;
    });
  }, [qualifiedProducts, selectedDealChip]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 pb-20">
      <SEO
        title={`${saleSettings.saleNavTitle} | PARIWESH Luxury Ethnic Wear`}
        description={`Explore exclusive offers in the ${saleSettings.saleNavTitle}. Enjoy handcrafted suits with up to 50% discount and extra savings.`}
        keywords="pariwesh sale, festive offers, navratri sale, kurti offers, designer suit discount"
      />

      {/* ======================================================== */}
      {/* 1. HERO CAMPAIGN BANNER (100% Dynamic & Image-Optimized)  */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#6b140e] via-[#8a1c14] to-[#450a06] text-white">
        {/* Optional Custom Ad Poster Image with Cloudinary Optimization */}
        {saleSettings.saleBannerDesktop && (
          <div className="absolute inset-0 z-0">
            <picture>
              {saleSettings.saleBannerMobile && (
                <source
                  media="(max-width: 767px)"
                  srcSet={optimizeCloudinaryUrl(
                    saleSettings.saleBannerMobile,
                    600,
                  )}
                />
              )}
              <img
                src={optimizeCloudinaryUrl(
                  saleSettings.saleBannerDesktop,
                  1400,
                )}
                alt={saleSettings.saleHeadline}
                className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity"
                loading="eager"
                fetchPriority="high"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          </div>
        )}

        {/* Regal Mehrab Arch Filigree Watermark Overlay */}
        <div className="absolute -right-16 -top-16 w-80 h-80 opacity-15 pointer-events-none text-amber-300">
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
            <path d="M50 0 C60 20 80 40 100 50 C80 60 60 80 50 100 C40 80 20 60 0 50 C20 40 40 20 50 0 Z" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16 text-center space-y-6">
          {/* Top Pill: Event Name */}
          <div className="inline-flex items-center space-x-2 bg-amber-400/20 border border-amber-300/40 px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-amber-200 backdrop-blur-md shadow-sm">
            <span className="text-amber-300">✦</span>
            <span>{saleSettings.saleNavTitle}</span>
            <span className="text-amber-300">✦</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-2 max-w-3xl mx-auto">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight leading-tight drop-shadow-md">
              {saleSettings.saleHeadline}
            </h1>
            <p className="text-xs sm:text-sm text-white/85 font-light tracking-wide max-w-xl mx-auto leading-relaxed">
              {saleSettings.saleSubtitle}
            </p>
          </div>

          {/* Live Countdown Timer Banner */}
          <div className="inline-flex flex-col items-center bg-black/40 backdrop-blur-md border border-amber-400/30 px-6 py-3.5 rounded-2xl shadow-xl space-y-1.5">
            <span className="text-[9px] uppercase tracking-[0.22em] font-extrabold text-amber-300 flex items-center gap-1">
              <RiFireLine className="text-amber-400 animate-pulse" size={12} />
              <span>Offer Closes In</span>
            </span>
            <div className="flex items-center space-x-3 sm:space-x-5 font-mono text-center">
              {timeLeft.days > 0 && (
                <>
                  <div>
                    <span className="text-xl sm:text-2xl font-bold font-serif text-white block">
                      {String(timeLeft.days).padStart(2, "0")}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-white/60">
                      Days
                    </span>
                  </div>
                  <span className="text-amber-300 font-bold">:</span>
                </>
              )}
              <div>
                <span className="text-xl sm:text-2xl font-bold font-serif text-white block">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-white/60">
                  Hours
                </span>
              </div>
              <span className="text-amber-300 font-bold">:</span>
              <div>
                <span className="text-xl sm:text-2xl font-bold font-serif text-white block">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-white/60">
                  Mins
                </span>
              </div>
              <span className="text-amber-300 font-bold">:</span>
              <div>
                <span className="text-xl sm:text-2xl font-bold font-serif text-amber-300 block animate-pulse">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-amber-200">
                  Secs
                </span>
              </div>
            </div>
          </div>

          {/* Instant Copy Coupon Code Chip */}
          {saleSettings.salePromoCode && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleCopyCoupon}
                className="group relative inline-flex items-center space-x-2.5 bg-white text-slate-900 hover:bg-amber-50 px-5 py-2.5 rounded-full border-2 border-dashed border-[#c5a880] shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer active:scale-95"
                title="Click to copy coupon code"
              >
                <RiGiftLine className="text-[#8a1c14] text-base" />
                <span className="text-xs font-mono font-bold tracking-wider text-[#8a1c14]">
                  {saleSettings.salePromoCode}
                </span>
                <span className="text-[10px] text-slate-400">|</span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-700">
                  {copiedCoupon ? "Copied! ✨" : "Tap to Copy"}
                </span>
                {copiedCoupon ? (
                  <RiCheckLine className="text-emerald-600 text-sm" />
                ) : (
                  <RiFileCopyLine className="text-slate-400 group-hover:text-slate-700 text-sm" />
                )}
              </button>
            </div>
          )}

          {saleSettings.saleDiscountText && (
            <p className="text-[10.5px] uppercase tracking-widest text-amber-200/90 font-semibold pt-1">
              ✦ {saleSettings.saleDiscountText} ✦
            </p>
          )}
        </div>

        {/* Trust Badges Strip on Bottom of Banner */}
        <div className="border-t border-white/10 bg-black/30 backdrop-blur-md py-3 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-around text-[10px] sm:text-xs text-white/90 font-medium tracking-wider uppercase gap-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <RiTruckLine className="text-amber-300 text-sm" />
              <span>Free Express Dispatch</span>
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="flex items-center gap-1.5">
              <RiSparklingFill className="text-amber-300 text-sm" />
              <span>100% Artisan Handcrafted</span>
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="flex items-center gap-1.5">
              <RiGiftLine className="text-amber-300 text-sm" />
              <span>Regal Muslin Box Included</span>
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="flex items-center gap-1.5">
              <RiShieldCheckLine className="text-amber-300 text-sm" />
              <span>7-Day Easy Returns</span>
            </span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. DEAL & BUDGET QUICK FILTER CHIPS (1-Tap Experience)   */}
      {/* ======================================================== */}
      <section className="sticky top-20 z-40 bg-white/95 backdrop-blur-xl border-b border-[#c5a880]/30 shadow-xs py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 select-none flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 shrink-0 hidden sm:inline-block">
              Filter Deals:
            </span>

            {[
              { id: "all", label: `All Offers (${qualifiedProducts.length})` },
              { id: "under-1499", label: "Under ₹1,499" },
              { id: "under-1999", label: "Under ₹1,999" },
              { id: "under-2499", label: "Under ₹2,499" },
              { id: "min-30", label: "Min 30% OFF" },
              { id: "min-40", label: "Min 40% OFF" },
              { id: "min-50", label: "Min 50% OFF" },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedDealChip(chip.id)}
                className={`text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-3.5 py-1.5 rounded-full transition-all duration-200 shrink-0 cursor-pointer ${
                  selectedDealChip === chip.id
                    ? "bg-[#8a1c14] text-white shadow-sm ring-1 ring-[#8a1c14]"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-500 font-medium shrink-0">
            <strong>{displayedProducts.length}</strong> styles
          </span>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. CURATED DEALS PRODUCT GRID                            */}
      {/* ======================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 sm:gap-y-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
            <RiShoppingBagLine className="mx-auto text-4xl text-slate-300" />
            <h3 className="text-base font-serif font-bold text-slate-800">
              No Ensembles in this Price/Discount Range
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try switching your filter chip above to explore other festive
              discounts across our handcrafted catalog.
            </p>
            <button
              type="button"
              onClick={() => setSelectedDealChip("all")}
              className="mt-2 inline-block bg-[#8a1c14] text-white text-[11px] font-bold uppercase tracking-wider px-5 py-2 rounded-lg cursor-pointer"
            >
              Show All Festive Deals
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 sm:gap-y-8">
            {displayedProducts.map((product) => {
              const mrp = Number(product.mrp) || 0;
              const price = Number(product.price || product.sellingPrice) || 0;
              const savingRupees = mrp > price ? mrp - price : 0;
              const discountPercent =
                mrp > price && mrp > 0
                  ? Math.round(((mrp - price) / mrp) * 100)
                  : 0;
              const isWishlisted = wishlistItems.some(
                (p) => p._id === product._id,
              );

              return (
                <div
                  key={product._id}
                  className="group relative bg-white/90 hover:bg-white backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/80 hover:border-[#c5a880]/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(197,168,128,0.2)] hover:-translate-y-1 flex flex-col h-full transition-all duration-300"
                >
                  {/* Saving Rupee Highlight Badge */}
                  {savingRupees > 0 && (
                    <div className="absolute top-3 left-3 z-20 pointer-events-none">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gradient-to-r from-[#8a1c14] to-[#6b140e] text-white text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider shadow-md border border-amber-300/30">
                        SAVE ₹{savingRupees.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleWishlistToggle(product);
                    }}
                    className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 shadow-sm border border-white/80 cursor-pointer ${
                      isWishlisted
                        ? "bg-white text-[#8a1c14] scale-105 ring-2 ring-[#8a1c14]/30"
                        : "bg-white/85 hover:bg-white text-slate-700 hover:text-[#8a1c14] hover:scale-110 active:scale-95"
                    }`}
                    aria-label="Wishlist"
                  >
                    {isWishlisted ? (
                      <RiHeartFill size={15} />
                    ) : (
                      <RiHeartLine size={15} />
                    )}
                  </button>

                  {/* Image Container with Mehrab Arch */}
                  <Link
                    to={`/product/${product.slug}`}
                    className="aspect-[3/4] sm:aspect-[4/5] overflow-hidden relative block bg-[#FBF9F5] rounded-t-lg transition-transform duration-500"
                    style={{ clipPath: "url(#mehrab-clip)" }}
                  >
                    <div className="w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out">
                      <ProductImageSlider
                        images={product.images}
                        alt={product.name}
                        autoPlay={false}
                      />
                    </div>

                    {/* Royal Golden Mehrab Arch Filigree Stroke */}
                    <svg
                      viewBox="0 0 100 125"
                      className="absolute inset-0 w-full h-full pointer-events-none fill-none stroke-accent-gold stroke-[1.8px] opacity-85"
                      preserveAspectRatio="none"
                    >
                      <path d="M 0,125 L 0,7.5 C 0,6 8,5.5 12,5.1 C 12,3.8 22,3.2 28,2.5 C 28,1.7 38,1.2 44,0.6 C 47,0.2 49,0 50,0 C 51,0 53,0.2 56,0.6 C 62,1.2 72,1.7 72,2.5 C 78,3.2 88,3.8 88,5.1 C 92,5.5 100,6 100,7.5 L 100,125" />
                    </svg>

                    {/* Quick Buy Slide-Up Frosted Glass Dock (DESKTOP HOVER ONLY) */}
                    <div className="hidden md:block absolute inset-x-0 bottom-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none group-hover:pointer-events-auto">
                      <div className="bg-white/95 backdrop-blur-md px-2 py-2.5 border-t border-accent-gold/40 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] flex flex-col items-center space-y-1.5">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-slate-700 flex items-center space-x-1 select-none">
                          <span className="text-accent-gold text-[8px]">✦</span>
                          <span>Quick Buy Size</span>
                          <span className="text-accent-gold text-[8px]">✦</span>
                        </span>
                        <div className="flex justify-center items-center gap-1.5 w-full px-1">
                          {(product.sizes && product.sizes.length > 0
                            ? product.sizes
                            : ["M", "L", "XL", "XXL"]
                          ).map((size) => {
                            const isOutOfStock =
                              product.sizesStock &&
                              product.sizesStock[size] !== undefined &&
                              product.sizesStock[size] <= 0;
                            return (
                              <button
                                key={size}
                                disabled={isOutOfStock}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleQuickAddToCart(product, size);
                                }}
                                className={`flex-1 h-7 rounded text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center font-sans ${
                                  isOutOfStock
                                    ? "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed line-through"
                                    : "bg-white text-slate-800 border border-slate-200 hover:border-[#8a1c14] hover:bg-[#8a1c14] hover:text-white shadow-xs hover:shadow-sm active:scale-95"
                                }`}
                                title={
                                  isOutOfStock
                                    ? `${size} (Out of Stock)`
                                    : `Add Size ${size} to Bag`
                                }
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Card Info Details */}
                  <div className="pt-3 pb-1 px-1 flex flex-col flex-grow justify-between space-y-2 text-left">
                    <div className="space-y-1">
                      {/* Fabric / Category Tag */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9.5px] text-[#c5a880] uppercase tracking-[0.18em] font-extrabold block truncate">
                          {product.fabric ? `${product.fabric} • ` : ""}
                          {product.category || "Festive Suit"}
                        </span>
                        {product.stock && product.stock <= 5 && (
                          <span className="text-[8.5px] text-red-600 font-extrabold uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                            <RiFireLine size={10} />
                            <span>{product.stock} left</span>
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <h3 className="text-xs sm:text-[13px] font-sans font-medium text-slate-900 leading-snug group-hover:text-[#8a1c14] transition-colors duration-200 line-clamp-2 h-9">
                        <Link to={`/product/${product.slug}`}>
                          {product.name}
                        </Link>
                      </h3>
                    </div>

                    {/* Price & Offer Discount Callout */}
                    <div className="flex items-baseline space-x-2 pt-0.5 font-sans">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                      {mrp > price && (
                        <>
                          <span className="text-[11px] text-slate-400 line-through font-normal">
                            ₹{mrp.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[8.5px] font-extrabold text-[#8a1c14] bg-rose-50 border border-rose-200/70 px-1.5 py-0.2 uppercase tracking-wider rounded">
                            {discountPercent}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    {/* Direct Add to Cart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleQuickAddToCart(product, "M");
                      }}
                      className="w-full bg-gradient-to-b from-[#9b2017] to-[#7a1810] hover:from-[#a8251b] hover:to-[#861c13] text-white font-extrabold text-[11px] uppercase tracking-[0.15em] py-2.5 rounded-xl border border-rose-300/25 shadow-[0_4px_14px_rgba(138,28,20,0.22)] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1.5 mt-1"
                    >
                      <RiShoppingBagLine size={13} />
                      <span>CLAIM DEAL</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SalePage;

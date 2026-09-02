import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  RiShoppingBagLine,
  RiHeartLine,
  RiHeartFill,
  RiRulerLine,
  RiShieldCheckLine,
  RiRefreshLine,
  RiTruckLine,
  RiExchangeLine,
  RiArrowRightSLine,
  RiStarFill,
  RiShirtLine,
  RiScissorsLine,
  RiGlobeLine,
  RiScalesLine,
  RiCheckLine,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import { addToCart } from "../../redux/slices/cartSlice.js";
import { toggleWishlistProduct } from "../../redux/slices/wishlistSlice.js";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import SEO from "../../components/common/SEO.jsx";
import SizeChartModal from "../../components/common/SizeChartModal.jsx";
import {
  syncCartNow,
  syncWishlistNow,
} from "../../services/hydrateCommerce.js";
import {
  trackViewContent,
  trackAddToCart,
  trackAddToWishlist,
} from "../../services/metaPixel.js";

const formatCurrency = (val) => {
  const num = Math.round(Number(val) || 0);
  return `₹${num.toLocaleString("en-IN")}`;
};

const ProductDetails = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { slug } = useParams();
  const dispatch = useDispatch();

  // Select values states
  const wishlist = useSelector((state) => state.wishlist.products);
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [activeVideo, setActiveVideo] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addedPopup, setAddedPopup] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeOffers, setActiveOffers] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodeChecked, setPincodeChecked] = useState(false);

  const checkPincodeDelivery = (val) => {
    if (val && val.length === 6) {
      setPincodeChecked(true);
    } else {
      showAlert("Please enter a valid 6-digit Indian postal code.", "Pincode Required");
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode("");
    }, 2000);
  };

  // Gesture Drag/Swipe Gestures for Product Image Gallery
  const [pointerStart, setPointerStart] = useState(null);

  const handlePointerDown = (e) => {
    setPointerStart(e.clientX);
  };

  const handlePointerUp = (e) => {
    if (pointerStart === null) return;
    const distance = pointerStart - e.clientX;
    const minSwipeDistance = 50;

    if (
      Math.abs(distance) > minSwipeDistance &&
      product?.images &&
      product.images.length > 1
    ) {
      const currentIndex = product.images.indexOf(activeImage);
      if (currentIndex !== -1) {
        if (distance > 0) {
          // Swipe Left -> Next Image
          const nextIndex = (currentIndex + 1) % product.images.length;
          setActiveImage(product.images[nextIndex]);
        } else {
          // Swipe Right -> Previous Image
          const prevIndex =
            (currentIndex - 1 + product.images.length) % product.images.length;
          setActiveImage(product.images[prevIndex]);
        }
      }
    }
    setPointerStart(null);
  };

  const handlePointerLeave = () => {
    setPointerStart(null);
  };

  // Custom UI Expandable States
  const [descExpanded, setDescExpanded] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [returnsOpen, setReturnsOpen] = useState(false);
  const [authenticityOpen, setAuthenticityOpen] = useState(false);
  const [specsOpen, setSpecsOpen] = useState({
    fabric: true,
    material: false,
    washCare: false,
    origin: false,
    packageDetails: false,
  });

  const toggleSpec = (key) => {
    setSpecsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setFetching(true);
        const res = await API.get(`/products/${slug}`);
        if (res.data && res.data.success) {
          const data = res.data.data;
          setProduct(data);
          setActiveImage(data.images?.[0] || "");
          setActiveVideo(null);
          const validSizes = (data.sizes || []).filter((s) => s !== "S");
          setSelectedSize(
            validSizes.length > 0 ? validSizes[0] : data.sizes?.[0] || "",
          );
          trackViewContent(data);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Failed fetching product details:", err);
        setProduct(null);
      } finally {
        setFetching(false);
      }
    };
    const fetchOffers = async () => {
      try {
        const res = await API.get("/coupons/active-offers");
        if (res.data && res.data.success) {
          setActiveOffers(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed fetching active offers:", err);
      }
    };
    fetchProductDetails();
    fetchOffers();
  }, [slug]);

  // Cloudinary image optimization utility
  const getOptimizedImageUrl = (url, width) => {
    if (!url) return "";
    if (url.includes("cloudinary.com")) {
      const resizeParams = width ? `c_limit,w_${width},` : "";
      return url.replace("/upload/", `/upload/${resizeParams}f_auto,q_auto/`);
    }
    return url;
  };

  if (fetching) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start animate-pulse">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            <div className="grid grid-cols-5 gap-3.5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-8 bg-white p-6 border border-slate-200/60 rounded-xl">
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/4 rounded" />
              <Skeleton className="h-8 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-display text-slate-800">
          Product not found
        </h2>
        <p className="text-sm text-slate-500">
          This product is unavailable or the link is invalid.
        </p>
        <Link
          to="/shop"
          className="inline-block text-sm text-accent-gold underline hover:text-yellow-600 transition"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlist.some((p) => p._id === product._id);

  const handleAddToCart = async () => {
    // Check if the selected size is out-of-stock
    const stockVal = product.sizesStock
      ? Number(product.sizesStock[selectedSize])
      : 10;
    if (stockVal <= 0) {
      showAlert(
        `Sorry, Size '${selectedSize}' is currently out of stock. We have notified our admin team to verify physical catalog inventory.`,
        "Size Out of Stock",
      );
      try {
        await API.post("/notifications", {
          message: `Stock Alert: Product '${product.name}' (SKU: ${product.sku}) size '${selectedSize}' requested by customer is OUT OF STOCK. Please check physical inventory.`,
          productId: product._id,
          productName: product.name,
          size: selectedSize,
        });
      } catch (err) {
        console.error("Failed to post stock alert:", err);
      }
      return;
    }

    setLoading(true);
    trackAddToCart(product, quantity, selectedSize, product.color);
    setTimeout(() => {
      dispatch(
        addToCart({
          product,
          quantity,
          variant: { color: product.color, size: selectedSize },
        }),
      );
      syncCartNow();
      setLoading(false);
      setAddedPopup(true);
      setTimeout(() => setAddedPopup(false), 3000);
    }, 500);
  };

  const handleBuyNow = async () => {
    // Check if the selected size is out-of-stock
    const stockVal = product.sizesStock
      ? Number(product.sizesStock[selectedSize])
      : 10;
    if (stockVal <= 0) {
      showAlert(
        `Sorry, Size '${selectedSize}' is currently out of stock. We have notified our admin team to verify physical catalog inventory.`,
        "Size Out of Stock",
      );
      try {
        await API.post("/notifications", {
          message: `Stock Alert: Product '${product.name}' (SKU: ${product.sku}) size '${selectedSize}' requested by customer is OUT OF STOCK. Please check physical inventory.`,
          productId: product._id,
          productName: product.name,
          size: selectedSize,
        });
      } catch (err) {
        console.error("Failed to post stock alert:", err);
      }
      return;
    }

    trackAddToCart(product, quantity, selectedSize, product.color);
    dispatch(
      addToCart({
        product,
        quantity,
        variant: { color: product.color, size: selectedSize },
      }),
    );
    syncCartNow();
    navigate(
      `/cart?checkout=true&buyNow=true&productId=${product._id}&size=${selectedSize}&color=${encodeURIComponent(
        product.color || "Default",
      )}&qty=${quantity}`,
    );
  };

  const handleWishlistToggle = () => {
    trackAddToWishlist(product);
    dispatch(toggleWishlistProduct(product));
    syncWishlistNow();
  };

  const productImageUrl = product?.images?.[0] || product?.image || "";
  const price = product?.price || 0;
  const inStock = product?.sizesStock
    ? Object.values(product.sizesStock).some((qty) => Number(qty) > 0)
    : true;

  const productSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: product.images || [productImageUrl],
        description:
          product.description ||
          `Premium handcrafted ${product.name} from PARIWESH.`,
        sku: product.sku || "",
        category: product.category || "Ethnic Wear",
        offers: {
          "@type": "Offer",
          url:
            typeof window !== "undefined"
              ? `https://pariwesh.in${window.location.pathname}`
              : "",
          priceCurrency: "INR",
          price: price,
          itemCondition: "https://schema.org/NewCondition",
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: "PARIWESH",
          },
        },
      }
    : null;

  const breadcrumbSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://pariwesh.in",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Shop",
            item: "https://pariwesh.in/shop",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.category || "Suits",
            item: `https://pariwesh.in/shop?category=${encodeURIComponent(product.category || "suits")}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: product.name,
            item:
              typeof window !== "undefined"
                ? `https://pariwesh.in${window.location.pathname}`
                : "",
          },
        ],
      }
    : null;

  const seoTitle = product
    ? `${product.name} - Buy Premium Ethnic Wear`
    : "Product Details";
  const seoDesc = product
    ? `Buy ${product.name} at ₹${product.price} online. ${product.description || ""}`.substring(
        0,
        155,
      )
    : "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-slate-800">
      <SEO
        title={seoTitle}
        description={seoDesc}
        ogImage={productImageUrl}
        ogType="product"
        structuredData={[productSchema, breadcrumbSchema].filter(Boolean)}
      />
      {/* Dynamic alert indicator */}
      {addedPopup && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-full shadow-2xl text-xs uppercase tracking-widest font-semibold flex items-center space-x-3.5 border border-accent-gold/40 animate-fade-in animate-slide-up">
          <span className="text-accent-gold">✨</span>
          <span>Successfully Added To Bag!</span>
          <span className="text-slate-400">|</span>
          <Link
            to="/cart"
            className="text-accent-gold underline hover:text-yellow-600 transition"
          >
            View Bag
          </Link>
        </div>
      )}

      {/* Breadcrumbs Banner */}
      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-450 text-slate-400 mb-6 flex items-center space-x-2">
        <Link to="/" className="hover:text-accent-gold transition">
          Home
        </Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-accent-gold transition">
          Shop
        </Link>
        <span>/</span>
        <span className="text-slate-600">{product.category || "Suits"}</span>
      </div>

      {/* Main Grid split: Images vs Info panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* LEFT COLUMN: GALLERIES CONTAINER - Sticky on Desktop */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24 self-start">
          <div
            className="aspect-[3/4] bg-slate-50 overflow-hidden border border-slate-100 rounded-xl relative shadow-sm cursor-grab active:cursor-grabbing touch-pan-y"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
          >
            {activeVideo ? (
              <video
                src={activeVideo}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={getOptimizedImageUrl(activeImage, 1000)}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300 select-none"
                draggable="false"
                fetchPriority="high"
              />
            )}
          </div>

          {/* Thumbnails grid */}
          <div className="grid grid-cols-5 gap-3">
            {/* Video Thumbnail Button if present */}
            {(product.video || (product.videos && product.videos.length > 0)) && (
              <button
                type="button"
                onClick={() => {
                  setActiveVideo(product.video || product.videos[0]);
                }}
                className={`aspect-[3/4] border rounded-lg overflow-hidden transition-all duration-300 relative bg-slate-950 flex flex-col items-center justify-center cursor-pointer ${
                  activeVideo
                    ? "border-[#c5a880] ring-2 ring-[#c5a880]/40 scale-[1.02]"
                    : "border-slate-200 hover:border-[#c5a880]/60 opacity-85 hover:opacity-100"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-white/95 flex items-center justify-center text-[#8a1c14] shadow-md mb-1">
                  <span className="text-[11px] ml-0.5">▶</span>
                </div>
                <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                  Reel
                </span>
              </button>
            )}

            {/* Images Thumbnails */}
            {product.images &&
              product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveVideo(null);
                    setActiveImage(img);
                  }}
                  className={`aspect-[3/4] border rounded-lg overflow-hidden transition-all duration-300 ${
                    !activeVideo && activeImage === img
                      ? "border-accent-gold ring-2 ring-accent-gold/20 scale-[1.02]"
                      : "border-slate-200 hover:border-slate-450 hover:border-slate-400"
                  }`}
                >
                  <img
                    src={getOptimizedImageUrl(img, 250)}
                    alt={`detail thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
          </div>
        </div>

        {/* RIGHT COLUMN: ATTRIBUTE CONTROLS */}
        <div className="lg:col-span-5 space-y-6 bg-white p-6 md:p-8 border border-[#c5a880]/30 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.05)]">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="bg-amber-50 text-amber-900 text-[9.5px] font-extrabold uppercase tracking-[0.22em] px-3 py-1 rounded-full border border-[#c5a880]/35 shadow-2xs inline-flex items-center gap-1.5">
                <span className="text-[#c5a880]">✦</span>
                <span>{product.tag || "Pariwesh Exclusive"}</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif text-slate-900 leading-snug tracking-tight font-normal">
              {product.name}
            </h1>
            <div className="flex items-center space-x-1.5 text-[11.5px] text-slate-600 font-sans">
              <div className="flex items-center space-x-1">
                <RiStarFill className="text-amber-500 mb-0.5" size={13} />
                <span className="text-slate-800 font-bold">
                  {product.rating || "4.8"}
                </span>
                <span className="text-slate-400">
                  ({product.reviewsCount || 12} customer reviews)
                </span>
              </div>
            </div>
          </div>

          {/* PRICING GRID */}
          <div className="border-y border-slate-200/70 py-4 my-2 bg-[#FBF9F5]/70 px-4 rounded-2xl font-sans">
            <div className="flex items-baseline gap-3 font-sans">
              <span className="text-3xl font-sans font-bold text-slate-900 tracking-tight">
                {formatCurrency(product.price)}
              </span>
              {product.mrp > product.price && (
                <>
                  <span className="text-sm font-sans text-slate-400 line-through font-normal">
                    MRP {formatCurrency(product.mrp)}
                  </span>
                  <span className="bg-[#8a1c14]/10 text-[#8a1c14] border border-[#8a1c14]/25 text-[10.5px] font-sans uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                    {Math.round(
                      ((product.mrp - product.price) / product.mrp) * 100,
                    )}
                    % OFF
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1.5 flex items-center space-x-2 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>In Stock • Ready to dispatch</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-normal">Inclusive of all taxes</span>
            </p>
          </div>

          {/* FORM: SIZES & ACTION CONTROLLERS */}
          <div className="space-y-6">
            {/* Color variants selector */}
            {product.colorVariants && product.colorVariants.length > 0 && (
              <div className="space-y-3 pb-2 border-b border-slate-100/70">
                <div className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500">
                  Choose your color:{" "}
                  <span className="text-slate-800 font-bold normal-case ml-1">
                    {product.color || "Default"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.colorVariants.map((v) => {
                    const isActive = v.slug === product.slug;
                    return (
                      <Link
                        key={v.slug}
                        to={`/product/${v.slug}`}
                        title={v.color}
                        className={`group relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all p-0.5 ${
                          isActive
                            ? "border-slate-900 scale-105 shadow-md shadow-slate-950/10"
                            : "border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {v.image ? (
                          <img
                            src={getOptimizedImageUrl(v.image, 150)}
                            alt={v.color}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span
                            className="w-full h-full block rounded-full"
                            style={{ backgroundColor: v.colorHex || "#ccc" }}
                          />
                        )}

                        {/* Tooltip on Hover */}
                        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-205 z-10 shadow-lg">
                          {v.color}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size pick (Strictly M, L, XL, XXL) */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px] uppercase font-extrabold tracking-widest text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <span>Select Size</span>
                    {selectedSize && (
                      <span className="text-[#8a1c14] font-bold tracking-normal font-sans text-[11px]">
                        : {selectedSize}
                      </span>
                    )}
                  </div>
                  {product.sizeChart?.type !== "none" && (
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      className="text-[#8a1c14] hover:text-red-900 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-full border border-[#c5a880]/40 shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all duration-200 focus:outline-none"
                    >
                      <RiRulerLine size={13} />
                      <span className="font-bold tracking-wider">Size Chart</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {product.sizes
                      .filter((sz) => sz !== "S")
                      .map((sz) => {
                        const isOutOfStock = product.sizesStock
                          ? Number(product.sizesStock[sz]) <= 0
                          : false;
                        const isSelected = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className={`min-w-[52px] h-11 px-3.5 rounded-xl text-xs font-bold font-sans tracking-wider transition-all duration-200 relative flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? "bg-gradient-to-b from-[#d2b68e] to-[#a8865a] text-white border-2 border-[#a8865a] shadow-[0_4px_14px_rgba(197,168,128,0.45),inset_0_1px_0_rgba(255,255,255,0.4)] scale-[1.03] font-extrabold ring-2 ring-[#c5a880]/30"
                                : isOutOfStock
                                ? "bg-slate-100/70 text-slate-300 border border-slate-200 cursor-not-allowed relative overflow-hidden after:content-[''] after:absolute after:inset-y-0 after:left-1/2 after:w-[1px] after:bg-slate-300 after:-rotate-45 after:scale-y-[1.4]"
                                : "bg-white hover:bg-amber-50/40 text-slate-800 border border-slate-200/90 shadow-2xs hover:border-[#c5a880] hover:text-[#8a1c14] active:scale-95"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                  </div>
                  {product.sizesStock &&
                    Number(product.sizesStock[selectedSize]) <= 0 && (
                      <p className="text-[11px] text-red-600 font-bold mt-1 text-left animate-pulse">
                        ⚠️ Size {selectedSize} is currently out of stock.
                        Ordering it will alert the admin to check inventory.
                      </p>
                    )}
                </div>
              </div>
            )}

            {/* Qty Selector */}
            <div className="space-y-2.5">
              <span className="block text-[10px] uppercase font-extrabold tracking-widest text-slate-500">
                Quantity
              </span>
              <div className="inline-flex border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-slate-50 text-slate-800 text-sm font-bold transition cursor-pointer"
                >
                  -
                </button>
                <span className="px-5 py-2 text-xs font-bold leading-normal flex items-center text-slate-900 font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-slate-50 text-slate-800 text-sm font-bold transition cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons: Add to Bag & Buy Now */}
            <div className="flex flex-col gap-3 pt-3">
              {/* ADD TO BAG */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={loading}
                className="w-full bg-gradient-to-b from-slate-800 to-slate-950 hover:from-slate-750 hover:to-slate-900 text-white font-extrabold text-xs uppercase tracking-[0.18em] py-4 px-6 rounded-xl border border-white/20 shadow-[0_4px_14px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.26)] transition-all duration-300 flex items-center justify-center space-x-2.5 active:scale-[0.98] active:translate-y-[1px] cursor-pointer disabled:opacity-50"
              >
                <RiShoppingBagLine size={18} />
                <span>{loading ? "Adding to Bag..." : "Add to Bag"}</span>
              </button>

              {/* BUY IT NOW & WISHLIST ROW */}
              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-grow bg-gradient-to-b from-[#d2b68e] to-[#a8865a] hover:from-[#dbbf97] hover:to-[#b39062] text-white font-extrabold text-xs uppercase tracking-[0.18em] py-4 px-6 rounded-xl shadow-[0_4px_18px_rgba(197,168,128,0.38),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.15)] hover:shadow-[0_8px_28px_rgba(197,168,128,0.55)] transition-all duration-300 flex items-center justify-center space-x-2 active:scale-[0.98] active:translate-y-[1px] cursor-pointer border border-amber-200/40"
                >
                  <span>Buy It Now</span>
                  <RiArrowRightSLine size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`w-13 h-13 shrink-0 rounded-xl border flex items-center justify-center transition-all duration-300 active:scale-95 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] cursor-pointer ${
                    isWishlisted
                      ? "border-red-200 bg-red-50 text-red-500 shadow-md ring-2 ring-red-200/50"
                      : "border-slate-200 bg-white hover:bg-amber-50/40 text-slate-700 hover:text-[#8a1c14] hover:border-[#c5a880]/50"
                  }`}
                  title={
                    isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"
                  }
                >
                  {isWishlisted ? (
                    <RiHeartFill size={22} />
                  ) : (
                    <RiHeartLine size={22} />
                  )}
                </button>
              </div>
            </div>

            {/* Pincode Delivery Estimator Widget */}
            <div className="border-t border-slate-100/80 pt-5 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] uppercase font-extrabold tracking-widest text-slate-500">
                <span className="flex items-center space-x-1.5">
                  <RiTruckLine size={15} className="text-accent-gold" />
                  <span>Delivery & Pincode Check</span>
                </span>
                <span className="text-emerald-700 font-bold lowercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-sans">
                  Free Express Shipping
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit Pincode (e.g. 302001)"
                    value={pincodeInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPincodeInput(val);
                      if (val.length === 6) {
                        checkPincodeDelivery(val);
                      } else {
                        setPincodeChecked(false);
                      }
                    }}
                    className="w-full bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:border-accent-gold shadow-2xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => checkPincodeDelivery(pincodeInput)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer active:scale-95 font-sans"
                >
                  Check
                </button>
              </div>
              {pincodeChecked && (
                <div className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1.5 pt-0.5 animate-fade-in font-sans">
                  <RiCheckLine size={15} className="text-emerald-600 shrink-0" />
                  <span>
                    Express delivery available to <strong>{pincodeInput}</strong> (Estimated in 3–5 business days).
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Special Offers Section */}
          {activeOffers && activeOffers.length > 0 && (
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center space-x-2 text-[#c5a880] pb-1">
                <span className="text-xs font-display font-bold uppercase tracking-widest">
                  🎁 Special Offers Available
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {activeOffers
                  .filter((off) => off.status === "Active")
                  .map((off) => {
                    const isGift = off.offerType === "SURPRISE_GIFT";
                    const isPrepaid = off.offerType === "PREPAID";

                    return (
                      <div
                        key={off._id || off.code}
                        className="border border-[#c5a880]/20 p-3.5 bg-slate-50/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800">
                              {isPrepaid ? "💳 " : isGift ? "🎁 " : "🛍 "}
                              {off.name || `${off.offerType} Offer`}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            {off.description ||
                              `Get discount with code ${off.code}`}
                          </p>
                        </div>
                        {off.code &&
                          off.offerType !== "PREPAID" &&
                          off.offerType !== "SURPRISE_GIFT" && (
                            <div className="flex items-center space-x-2 self-end sm:self-auto">
                              <span className="px-2 py-1 bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-700 uppercase rounded tracking-wider">
                                {off.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(off.code)}
                                className="text-[9px] font-extrabold uppercase tracking-wider text-accent-gold hover:text-yellow-600 border border-accent-gold/20 hover:border-yellow-600 bg-white py-1 px-2.5 rounded transition shadow-sm"
                              >
                                {copiedCode === off.code ? "Copied ✓" : "Copy"}
                              </button>
                            </div>
                          )}
                        {isPrepaid && (
                          <div className="self-end sm:self-auto">
                            <span className="text-[8.5px] uppercase font-bold tracking-wider text-slate-500 bg-slate-200/50 px-2 py-1 rounded">
                              Pay Online
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Guarantee Badges */}
          <div className="border-t border-slate-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] text-slate-500 tracking-wider uppercase font-extrabold">
            <span className="flex items-center space-x-2.5">
              <RiShieldCheckLine className="text-accent-gold" size={17} />
              <span>100% Genuine Fabrics Guaranteed</span>
            </span>
            <span className="flex items-center space-x-2.5">
              <RiRefreshLine className="text-accent-gold" size={17} />
              <span>7-Day Return / Exchange Approved</span>
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: SPECS & ACCORDIONS (PREMIUM LUXURY DROPDOWNS) */}
      <div className="mt-16 border-t border-slate-200/80 pt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Product Story & Policies Dropdowns */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-[#c5a880] text-xs">✦</span>
              <h3 className="text-xs font-bold uppercase text-slate-900 tracking-[0.2em]">
                Product Story & Details
              </h3>
            </div>
            <div className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-sans relative">
              <p className={descExpanded ? "" : "line-clamp-3"}>
                {product.description ||
                  "A stylish ready-to-wear premium ethnic ensemble featuring a timeless silhouette, crafted to perfection from Pariwesh signature apparel catalog. Tailored with breathable ease and artistic flair for elevated daily and festive wear."}
              </p>
              {product.description && product.description.length > 150 && (
                <button
                  type="button"
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="text-[10px] font-extrabold text-[#8a1c14] uppercase tracking-wider mt-2 hover:text-red-900 transition block underline cursor-pointer"
                >
                  {descExpanded ? "Read Less" : "Read More"}
                </button>
              )}
            </div>
          </div>

          {/* Left Column Accordions */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            {/* Accordion 1: Shipping & Delivery */}
            <div
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white/95 backdrop-blur-sm ${
                shippingOpen
                  ? "border-[#c5a880]/70 shadow-[0_4px_16px_rgba(197,168,128,0.12)]"
                  : "border-slate-200/90 hover:border-[#c5a880]/40 shadow-xs"
              }`}
            >
              <button
                type="button"
                onClick={() => setShippingOpen(!shippingOpen)}
                className="w-full flex justify-between items-center px-4 py-3.5 text-left text-xs font-bold text-slate-800 hover:bg-[#FBF9F5]/60 transition-colors duration-150 cursor-pointer"
              >
                <span className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 border border-[#c5a880]/30 text-[#8a1c14] flex items-center justify-center shrink-0">
                    <RiTruckLine size={15} />
                  </div>
                  <span className="tracking-wide">Shipping & Delivery Timelines</span>
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
                    shippingOpen
                      ? "rotate-90 bg-amber-100/70 text-[#8a1c14]"
                      : "text-slate-400"
                  }`}
                >
                  <RiArrowRightSLine size={17} />
                </div>
              </button>
              {shippingOpen && (
                <div className="px-5 pb-4 pt-2 text-[11.5px] text-slate-600 leading-relaxed font-sans border-t border-slate-100/70 bg-[#FBF9F5]/35 animate-fade-in space-y-2">
                  <p>
                    Every order is carefully inspected and dispatched from our boutique atelier within <strong>24–48 business hours</strong>.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500">
                    <li>Complimentary Express Delivery across India (3–5 business days).</li>
                    <li>Cash on Delivery (COD) and all major prepaid payment options available.</li>
                    <li>Live doorstep tracking link shared via SMS and WhatsApp.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Accordion 2: Easy Returns & Refunds */}
            <div
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white/95 backdrop-blur-sm ${
                returnsOpen
                  ? "border-[#c5a880]/70 shadow-[0_4px_16px_rgba(197,168,128,0.12)]"
                  : "border-slate-200/90 hover:border-[#c5a880]/40 shadow-xs"
              }`}
            >
              <button
                type="button"
                onClick={() => setReturnsOpen(!returnsOpen)}
                className="w-full flex justify-between items-center px-4 py-3.5 text-left text-xs font-bold text-slate-800 hover:bg-[#FBF9F5]/60 transition-colors duration-150 cursor-pointer"
              >
                <span className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 border border-[#c5a880]/30 text-[#8a1c14] flex items-center justify-center shrink-0">
                    <RiExchangeLine size={15} />
                  </div>
                  <span className="tracking-wide">Easy Returns & Stellar Refund Guarantee</span>
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
                    returnsOpen
                      ? "rotate-90 bg-amber-100/70 text-[#8a1c14]"
                      : "text-slate-400"
                  }`}
                >
                  <RiArrowRightSLine size={17} />
                </div>
              </button>
              {returnsOpen && (
                <div className="px-5 pb-4 pt-2 text-[11.5px] text-slate-600 leading-relaxed font-sans border-t border-slate-100/70 bg-[#FBF9F5]/35 animate-fade-in space-y-2">
                  <p>
                    We maintain a hassle-free <strong>7-Day Return and Exchange window</strong> from the date of delivery.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500">
                    <li>Free doorstep pickup for size exchange or returns.</li>
                    <li>Items must retain original tags and unused packaging.</li>
                    <li>Instant refund credited to your bank account or payment method within 3–5 business days after quality verification.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Accordion 3: Authenticity & Artisanal Guarantee */}
            <div
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white/95 backdrop-blur-sm ${
                authenticityOpen
                  ? "border-[#c5a880]/70 shadow-[0_4px_16px_rgba(197,168,128,0.12)]"
                  : "border-slate-200/90 hover:border-[#c5a880]/40 shadow-xs"
              }`}
            >
              <button
                type="button"
                onClick={() => setAuthenticityOpen(!authenticityOpen)}
                className="w-full flex justify-between items-center px-4 py-3.5 text-left text-xs font-bold text-slate-800 hover:bg-[#FBF9F5]/60 transition-colors duration-150 cursor-pointer"
              >
                <span className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 border border-[#c5a880]/30 text-[#8a1c14] flex items-center justify-center shrink-0">
                    <RiShieldCheckLine size={15} />
                  </div>
                  <span className="tracking-wide">Artisanal Craftsmanship & Authenticity</span>
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
                    authenticityOpen
                      ? "rotate-90 bg-amber-100/70 text-[#8a1c14]"
                      : "text-slate-400"
                  }`}
                >
                  <RiArrowRightSLine size={17} />
                </div>
              </button>
              {authenticityOpen && (
                <div className="px-5 pb-4 pt-2 text-[11.5px] text-slate-600 leading-relaxed font-sans border-t border-slate-100/70 bg-[#FBF9F5]/35 animate-fade-in space-y-2">
                  <p>
                    Every Pariwesh creation is crafted with high-density premium yarns, precise finishing, and colorfast traditional printing techniques tested for durability and luxurious drape.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Technical Specifications Dropdowns */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-[#c5a880] text-xs">✦</span>
            <h3 className="text-xs font-bold uppercase text-slate-900 tracking-[0.2em]">
              Technical Specifications
            </h3>
          </div>

          <div className="space-y-3">
            {/* Accordion: Fabric Type */}
            <div
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white/95 backdrop-blur-sm ${
                specsOpen.fabric
                  ? "border-[#c5a880]/70 shadow-[0_4px_16px_rgba(197,168,128,0.12)]"
                  : "border-slate-200/90 hover:border-[#c5a880]/40 shadow-xs"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSpec("fabric")}
                className="w-full flex justify-between items-center px-4 py-3.5 text-left text-xs font-bold text-slate-800 hover:bg-[#FBF9F5]/60 transition-colors duration-150 cursor-pointer"
              >
                <span className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 border border-[#c5a880]/30 text-[#8a1c14] flex items-center justify-center shrink-0">
                    <RiShirtLine size={15} />
                  </div>
                  <span className="tracking-wide">Fabric Type</span>
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
                    specsOpen.fabric
                      ? "rotate-90 bg-amber-100/70 text-[#8a1c14]"
                      : "text-slate-400"
                  }`}
                >
                  <RiArrowRightSLine size={17} />
                </div>
              </button>
              {specsOpen.fabric && (
                <div className="px-5 pb-4 pt-2 text-[11.5px] text-slate-600 leading-relaxed font-sans border-t border-slate-100/70 bg-[#FBF9F5]/35 animate-fade-in text-left">
                  <strong className="text-slate-800 font-bold block mb-1">
                    {product.fabric || "Premium Rayon"}
                  </strong>
                  Breathable, lightweight, and ultra-soft fabric offering a natural fluid drape and cool comfort throughout the day.
                </div>
              )}
            </div>

            {/* Accordion: Material Composition */}
            <div
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white/95 backdrop-blur-sm ${
                specsOpen.material
                  ? "border-[#c5a880]/70 shadow-[0_4px_16px_rgba(197,168,128,0.12)]"
                  : "border-slate-200/90 hover:border-[#c5a880]/40 shadow-xs"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSpec("material")}
                className="w-full flex justify-between items-center px-4 py-3.5 text-left text-xs font-bold text-slate-800 hover:bg-[#FBF9F5]/60 transition-colors duration-150 cursor-pointer"
              >
                <span className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 border border-[#c5a880]/30 text-[#8a1c14] flex items-center justify-center shrink-0">
                    <RiScissorsLine size={15} />
                  </div>
                  <span className="tracking-wide">Material Composition</span>
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
                    specsOpen.material
                      ? "rotate-90 bg-amber-100/70 text-[#8a1c14]"
                      : "text-slate-400"
                  }`}
                >
                  <RiArrowRightSLine size={17} />
                </div>
              </button>
              {specsOpen.material && (
                <div className="px-5 pb-4 pt-2 text-[11.5px] text-slate-600 leading-relaxed font-sans border-t border-slate-100/70 bg-[#FBF9F5]/35 animate-fade-in text-left">
                  <strong className="text-slate-800 font-bold block mb-1">
                    100% {product.fabric || "Rayon"} with Artisanal Prints
                  </strong>
                  Features traditional contrast floral / geometric prints with durable border embellishments and neat lock-stitch hemming.
                </div>
              )}
            </div>

            {/* Accordion: Wash & Garment Care */}
            <div
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white/95 backdrop-blur-sm ${
                specsOpen.washCare
                  ? "border-[#c5a880]/70 shadow-[0_4px_16px_rgba(197,168,128,0.12)]"
                  : "border-slate-200/90 hover:border-[#c5a880]/40 shadow-xs"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSpec("washCare")}
                className="w-full flex justify-between items-center px-4 py-3.5 text-left text-xs font-bold text-slate-800 hover:bg-[#FBF9F5]/60 transition-colors duration-150 cursor-pointer"
              >
                <span className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 border border-[#c5a880]/30 text-[#8a1c14] flex items-center justify-center shrink-0">
                    <RiRefreshLine size={15} />
                  </div>
                  <span className="tracking-wide">Wash & Garment Care</span>
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
                    specsOpen.washCare
                      ? "rotate-90 bg-amber-100/70 text-[#8a1c14]"
                      : "text-slate-400"
                  }`}
                >
                  <RiArrowRightSLine size={17} />
                </div>
              </button>
              {specsOpen.washCare && (
                <div className="px-5 pb-4 pt-2 text-[11.5px] text-slate-600 leading-relaxed font-sans border-t border-slate-100/70 bg-[#FBF9F5]/35 animate-fade-in text-left">
                  <strong className="text-slate-800 font-bold block mb-1">
                    {product.washCare || "Gentle Hand Wash / Mild Detergent"}
                  </strong>
                  Do not bleach. Dry in shade inside-out to retain vibrant color richness. Low to medium temperature iron on reverse side.
                </div>
              )}
            </div>

            {/* Accordion: Country of Origin */}
            <div
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white/95 backdrop-blur-sm ${
                specsOpen.origin
                  ? "border-[#c5a880]/70 shadow-[0_4px_16px_rgba(197,168,128,0.12)]"
                  : "border-slate-200/90 hover:border-[#c5a880]/40 shadow-xs"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSpec("origin")}
                className="w-full flex justify-between items-center px-4 py-3.5 text-left text-xs font-bold text-slate-800 hover:bg-[#FBF9F5]/60 transition-colors duration-150 cursor-pointer"
              >
                <span className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 border border-[#c5a880]/30 text-[#8a1c14] flex items-center justify-center shrink-0">
                    <RiGlobeLine size={15} />
                  </div>
                  <span className="tracking-wide">Country of Origin</span>
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
                    specsOpen.origin
                      ? "rotate-90 bg-amber-100/70 text-[#8a1c14]"
                      : "text-slate-400"
                  }`}
                >
                  <RiArrowRightSLine size={17} />
                </div>
              </button>
              {specsOpen.origin && (
                <div className="px-5 pb-4 pt-2 text-[11.5px] text-slate-600 leading-relaxed font-sans border-t border-slate-100/70 bg-[#FBF9F5]/35 animate-fade-in text-left">
                  <strong className="text-slate-800 font-bold block mb-1">
                    {product.countryOfOrigin || "India"}
                  </strong>
                  Ethically sourced, precision tailored, and handcrafted by experienced textile artisans in India.
                </div>
              )}
            </div>

            {/* Accordion: Package Details & SKU */}
            <div
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white/95 backdrop-blur-sm ${
                specsOpen.packageDetails
                  ? "border-[#c5a880]/70 shadow-[0_4px_16px_rgba(197,168,128,0.12)]"
                  : "border-slate-200/90 hover:border-[#c5a880]/40 shadow-xs"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSpec("packageDetails")}
                className="w-full flex justify-between items-center px-4 py-3.5 text-left text-xs font-bold text-slate-800 hover:bg-[#FBF9F5]/60 transition-colors duration-150 cursor-pointer"
              >
                <span className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 border border-[#c5a880]/30 text-[#8a1c14] flex items-center justify-center shrink-0">
                    <RiScalesLine size={15} />
                  </div>
                  <span className="tracking-wide">Package Contents & Ensemble</span>
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
                    specsOpen.packageDetails
                      ? "rotate-90 bg-amber-100/70 text-[#8a1c14]"
                      : "text-slate-400"
                  }`}
                >
                  <RiArrowRightSLine size={17} />
                </div>
              </button>
              {specsOpen.packageDetails && (
                <div className="px-5 pb-4 pt-2 text-[11.5px] text-slate-600 leading-relaxed font-sans border-t border-slate-100/70 bg-[#FBF9F5]/35 animate-fade-in text-left">
                  <span className="text-slate-400 font-semibold text-[10.5px] uppercase block mb-1">Net Ensemble Contents:</span>
                  <span className="text-slate-800 font-bold">
                    1 Complete Ensemble ({product.category === "suits" ? "Kurti, Bottom & Dupatta Set" : "Kurti & Bottom Co-ord Set"})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SizeChartModal
        isOpen={showSizeChart}
        onClose={() => setShowSizeChart(false)}
        sizeChart={product?.sizeChart}
        selectedSize={selectedSize}
        onSelectSize={(sz) => setSelectedSize(sz)}
      />

      {/* MOBILE STICKY PURCHASE BAR */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-[0_-4px_25px_rgba(0,0,0,0.1)]">
        <div className="space-y-0.5 text-left">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
            {selectedSize ? `Size: ${selectedSize}` : "Choose Size"}
          </span>
          <span className="text-base font-extrabold text-[#8a1c14] font-sans tracking-tight">
            {formatCurrency(product.price * quantity)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={loading}
            className="rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider border border-slate-300/80 text-slate-800 bg-white/90 backdrop-blur-sm hover:bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] active:scale-95 active:translate-y-[1px] cursor-pointer disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add to Bag"}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="rounded-xl px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-b from-[#d2b68e] to-[#a8865a] hover:from-[#dbbf97] hover:to-[#b39062] text-white shadow-[0_4px_14px_rgba(197,168,128,0.35),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.15)] border border-amber-200/40 active:scale-95 active:translate-y-[1px] cursor-pointer"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

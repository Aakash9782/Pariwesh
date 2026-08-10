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
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import { addToCart } from "../../redux/slices/cartSlice.js";
import { toggleWishlistProduct } from "../../redux/slices/wishlistSlice.js";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import SEO from "../../components/common/SEO.jsx";
import {
  syncCartNow,
  syncWishlistNow,
} from "../../services/hydrateCommerce.js";

const ProductDetails = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { slug } = useParams();
  const dispatch = useDispatch();

  // Select values states
  const wishlist = useSelector((state) => state.wishlist.products);
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addedPopup, setAddedPopup] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Custom UI Expandable States
  const [descExpanded, setDescExpanded] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [returnsOpen, setReturnsOpen] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setFetching(true);
        const res = await API.get(`/products/${slug}`);
        if (res.data && res.data.success) {
          const data = res.data.data;
          setProduct(data);
          setActiveImage(data.images?.[0] || "");
          setSelectedSize(
            data.sizes && data.sizes.length > 0 ? data.sizes[0] : "",
          );
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
    fetchProductDetails();
  }, [slug]);

  // Cloudinary image optimization utility
  const getOptimizedImageUrl = (url) => {
    if (!url) return "";
    if (url.includes("cloudinary.com")) {
      return url.replace("/upload/", "/upload/f_auto,q_auto/");
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

    dispatch(
      addToCart({
        product,
        quantity,
        variant: { color: product.color, size: selectedSize },
      }),
    );
    syncCartNow();
    navigate("/cart?checkout=true");
  };

  const handleWishlistToggle = () => {
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
          <div className="aspect-[3/4] bg-slate-50 overflow-hidden border border-slate-100 rounded-xl relative shadow-sm">
            <img
              src={getOptimizedImageUrl(activeImage)}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
              fetchPriority="high"
            />
          </div>

          {/* Thumbnails grid */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-[3/4] border rounded-lg overflow-hidden transition-all duration-300 ${
                    activeImage === img
                      ? "border-accent-gold ring-2 ring-accent-gold/20 scale-[1.02]"
                      : "border-slate-200 hover:border-slate-450 hover:border-slate-400"
                  }`}
                >
                  <img
                    src={getOptimizedImageUrl(img)}
                    alt={`detail thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ATTRIBUTE CONTROLS */}
        <div className="lg:col-span-5 space-y-7 bg-white p-6 md:p-8 border border-slate-200/60 rounded-2xl shadow-sm">
          <div className="space-y-3">
            {product.tag && (
              <span className="bg-amber-50 text-accent-gold text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded border border-amber-250 border-amber-200/40 inline-block">
                {product.tag}
              </span>
            )}
            <h1 className="text-xl md:text-2xl font-display font-medium text-slate-900 leading-snug">
              {product.name}
            </h1>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-sans">
              <span>
                SKU:{" "}
                <span className="font-mono font-bold text-slate-700">
                  {product.sku}
                </span>
              </span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <RiStarFill className="text-accent-gold mb-0.5" size={13} />
                <span className="text-slate-800 font-bold">
                  {product.rating || "4.8"}
                </span>
                <span className="text-slate-450 text-slate-400">
                  ({product.reviewsCount || 12} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* PRICING GRID */}
          <div className="flex items-baseline space-x-3.5 border-y border-slate-100/80 py-4 my-5">
            <span className="text-2xl font-bold text-slate-900">
              ₹{product.price}
            </span>
            {product.mrp > product.price && (
              <>
                <span className="text-sm text-slate-400 line-through">
                  MRP ₹{product.mrp}
                </span>
                <span className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded font-bold">
                  {Math.round(
                    ((product.mrp - product.price) / product.mrp) * 100,
                  )}
                  % OFF
                </span>
              </>
            )}
          </div>

          {/* FORM: SIZES & ACTION CONTROLLERS */}
          <div className="space-y-6">
            {/* Size pick */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px] uppercase font-extrabold tracking-widest text-slate-500">
                  <span>Select Size</span>
                  <span className="text-accent-gold flex items-center space-x-1.5 cursor-pointer hover:underline">
                    <RiRulerLine size={13} />
                    <span>Size Chart</span>
                  </span>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex flex-wrap gap-2.5">
                    {product.sizes.map((sz) => {
                      const isOutOfStock = product.sizesStock
                        ? Number(product.sizesStock[sz]) <= 0
                        : false;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`w-11 h-11 border text-xs font-bold transition-all relative ${
                            selectedSize === sz
                              ? "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/10"
                              : isOutOfStock
                                ? "border-dashed border-red-200 text-red-405 text-red-400 bg-red-50/20 hover:border-red-300"
                                : "border-slate-200 text-slate-700 hover:border-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {sz}
                          {isOutOfStock && (
                            <span
                              className="absolute -top-0.5 -right-0.5 bg-red-500 w-2 h-2 rounded-full ring-2 ring-white"
                              title="Out of Stock"
                            ></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {product.sizesStock &&
                    Number(product.sizesStock[selectedSize]) <= 0 && (
                      <p className="text-[11px] text-red-656 text-red-600 font-bold mt-1 text-left animate-pulse">
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
              <div className="inline-flex border border-slate-200 rounded-lg bg-slate-50 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-slate-100 text-sm font-bold transition"
                >
                  -
                </button>
                <span className="px-5 py-2 text-xs font-bold leading-normal flex items-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-slate-100 text-sm font-bold transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Submissions */}
            <div className="flex flex-col gap-3.5 pt-4">
              <Button
                onClick={handleAddToCart}
                loading={loading}
                variant="outline"
                size="lg"
                className="w-full rounded-xl py-3.5 text-[11px] uppercase tracking-wider font-extrabold flex items-center justify-center space-x-2 transition-all hover:bg-slate-50 border-slate-250 border-slate-200"
              >
                <RiShoppingBagLine size={16} />
                <span>Add to Bag</span>
              </Button>

              <div className="flex items-center gap-3 w-full">
                <Button
                  onClick={handleBuyNow}
                  variant="gold"
                  size="lg"
                  className="flex-grow font-extrabold rounded-xl py-3.5 text-[11px] uppercase tracking-wider transition-all hover:bg-yellow-500"
                >
                  <span>Buy It Now</span>
                </Button>

                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center transition active:scale-95 shadow-sm ${
                    isWishlisted
                      ? "border-red-200 bg-red-50 text-red-500"
                      : "border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 bg-white"
                  }`}
                  title={
                    isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"
                  }
                >
                  {isWishlisted ? (
                    <RiHeartFill size={18} />
                  ) : (
                    <RiHeartLine size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>

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

      {/* BOTTOM SECTION: SPECS & ACCORDIONS */}
      <div className="mt-16 border-t border-slate-200 pt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Collapsible Description & Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase text-slate-900 tracking-widest">
              Product Story & Details
            </h3>
            <div className="text-xs text-slate-600 leading-relaxed font-sans relative">
              <p className={descExpanded ? "" : "line-clamp-3"}>
                {product.description ||
                  "Premium ethnic ensemble custom tailored to perfection from Pariwesh signature apparel catalog."}
              </p>
              {product.description && product.description.length > 150 && (
                <button
                  type="button"
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="text-[10px] font-extrabold text-accent-gold uppercase tracking-wider mt-2.5 hover:text-yellow-600 transition block underline"
                >
                  {descExpanded ? "Read Less" : "Read More"}
                </button>
              )}
            </div>
          </div>

          {/* Collapsible shipping & returns policies */}
          <div className="border-t border-slate-100 pt-6 space-y-2.5">
            <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setShippingOpen(!shippingOpen)}
                className="w-full flex justify-between items-center px-4 py-3.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 transition duration-150"
              >
                <span className="flex items-center space-x-2.5">
                  <RiTruckLine className="text-accent-gold" size={17} />
                  <span>Shipping & Delivery Timelines</span>
                </span>
                <RiArrowRightSLine
                  className={`text-slate-400 transition duration-200 transform ${
                    shippingOpen ? "rotate-90" : ""
                  }`}
                  size={18}
                />
              </button>
              {shippingOpen && (
                <div className="px-4 pb-4 pt-1.5 text-[11px] text-slate-500 leading-relaxed font-sans border-t border-slate-100/50 animate-fade-in">
                  Every order is carefully dispatched from our flagship boutique
                  within 24-48 business hours. We offer complimentary express
                  delivery across India. Delivery takes roughly 3 to 7 business
                  days under standard circumstances. COD is available.
                </div>
              )}
            </div>

            <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setReturnsOpen(!returnsOpen)}
                className="w-full flex justify-between items-center px-4 py-3.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 transition duration-150"
              >
                <span className="flex items-center space-x-2.5">
                  <RiExchangeLine className="text-accent-gold" size={17} />
                  <span>Easy Returns & Stellar Refund Guarantee</span>
                </span>
                <RiArrowRightSLine
                  className={`text-slate-400 transition duration-200 transform ${
                    returnsOpen ? "rotate-90" : ""
                  }`}
                  size={18}
                />
              </button>
              {returnsOpen && (
                <div className="px-4 pb-4 pt-1.5 text-[11px] text-slate-500 leading-relaxed font-sans border-t border-slate-100/50 animate-fade-in">
                  We maintain a 7-day hassle-free window for returns, sizing
                  replacements, and exchanges. Items must be returned in their
                  original packaging with tags attached. Once Quality Checks are
                  passed, refunds are credited back to your bank account or
                  payment wallet in 3-5 days.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Equal height attributes/spec cards */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-900 tracking-widest mb-4">
            Technical Specifications
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {product.fabric && (
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4.5 flex flex-col justify-between min-h-[96px] hover:bg-slate-50 transition duration-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  Fabric Type
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-2 break-words">
                  {product.fabric}
                </span>
              </div>
            )}
            {product.material && (
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4.5 flex flex-col justify-between min-h-[96px] hover:bg-slate-50 transition duration-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  Material
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-2 break-words">
                  {product.material}
                </span>
              </div>
            )}
            {product.washCare && (
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4.5 flex flex-col justify-between min-h-[96px] hover:bg-slate-50 transition duration-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  Wash Care
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-2 break-words">
                  {product.washCare}
                </span>
              </div>
            )}
            {product.countryOfOrigin && (
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4.5 flex flex-col justify-between min-h-[96px] hover:bg-slate-50 transition duration-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  Country of Origin
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-2 break-words">
                  {product.countryOfOrigin}
                </span>
              </div>
            )}
            {product.shippingWeight && (
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4.5 flex flex-col justify-between min-h-[96px] hover:bg-slate-50 transition duration-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  Shipping Weight
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-2 break-words">
                  {product.shippingWeight}
                </span>
              </div>
            )}
            {product.returnDays && (
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4.5 flex flex-col justify-between min-h-[96px] hover:bg-slate-50 transition duration-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  Return Policy
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-2 break-words">
                  {product.returnDays} Days Returns
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

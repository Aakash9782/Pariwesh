import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";
import {
  RiFilter3Line,
  RiCloseLine,
  RiShoppingBagLine,
  RiHeartLine,
  RiHeartFill,
  RiArrowUpDownLine,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import ProductImageSlider from "../../components/common/ProductImageSlider.jsx";
import { ProductSkeleton } from "../../components/common/Skeleton.jsx";
import { toggleWishlistProduct } from "../../redux/slices/wishlistSlice.js";
import { addToCart } from "../../redux/slices/cartSlice.js";
import API from "../../services/api.js";
import { syncWishlistNow, syncCartNow } from "../../services/hydrateCommerce.js";
import { trackSearch, trackAddToWishlist } from "../../services/metaPixel.js";
import SEO from "../../components/common/SEO.jsx";
import { useAlert } from "../../contexts/AlertContext.jsx";

const formatCurrency = (val) => {
  const num = Math.round(Number(val) || 0);
  return `₹${num.toLocaleString("en-IN")}`;
};

const ShopListings = () => {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const wishlistItems = useSelector((state) => state.wishlist.products);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter variables states
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [selectedColor, setSelectedColor] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [priceRange, setPriceRange] = useState(5000);
  const [sortBy, setSortBy] = useState("latest");
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );

  const [products, setProducts] = useState([]);
  const [isApiLoading, setIsApiLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsApiLoading(true);
        const res = await API.get("/products");
        if (res.data && res.data.success) {
          const activeOnly = (res.data.data || []).filter(
            (p) => !p.status || p.status === "active",
          );
          setProducts(activeOnly);
        }
      } catch (err) {
        console.error("Failed fetching products:", err);
        setProducts([]);
      } finally {
        setIsApiLoading(false);
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Keep track of search strings
  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategory(category);
    }
    const search = searchParams.get("search") || "";
    setSearchQuery(search);
    if (search.trim()) {
      trackSearch(search.trim());
    }
  }, [searchParams]);

  // Simulate loading state transitions on filters
  useEffect(() => {
    setIsLoading(true);
    setCurrentPage(1);
    const delay = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(delay);
  }, [
    selectedCategory,
    selectedColor,
    selectedSize,
    priceRange,
    sortBy,
    searchQuery,
  ]);

  // Filter computation logic
  const filteredProducts = products
    .filter((product) => {
      const catMatch =
        selectedCategory === "all" || product.category === selectedCategory;
      const colorMatch =
        selectedColor === "all" || product.color === selectedColor;
      const sizeMatch =
        selectedSize === "all" || product.sizes.includes(selectedSize);
      const priceMatch = product.price <= priceRange;
      const searchMatch = searchQuery
        ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return catMatch && colorMatch && sizeMatch && priceMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return b._id - a._id; // default latest
    });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Safety effect: reset to page 1 if current page becomes invalid after filters are applied
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredProducts.length, currentPage, totalPages]);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedColor("all");
    setSelectedSize("all");
    setPriceRange(5000);
    setSearchQuery("");
    setSearchParams({});
  };

  const handleQuickAddToCart = (product, size) => {
    dispatch(
      addToCart({
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          images: product.images,
          sku: product.sku || "",
        },
        quantity: 1,
        variant: {
          size: size,
          color: "Default",
        },
      }),
    );
    syncCartNow();
    showAlert(
      `"${product.name}" (Size: ${size}) has been added to your shopping bag!`,
      "Added to Bag",
    );
  };

  const categoriesList = ["all", "kurtis", "suits", "ethnic"];
  const colorsList = ["all", "Gold", "Red", "Ivory", "Green", "Blue", "Pink"];
  const sizesList = ["all", "M", "L", "XL", "XXL"];

  const categoryTitle =
    selectedCategory && selectedCategory !== "all"
      ? `${selectedCategory.trim().charAt(0).toUpperCase() + selectedCategory.slice(1)} Collection`
      : "Shop Premium Ensembles";

  const seoTitle = searchQuery
    ? `Search Results for "${searchQuery}"`
    : categoryTitle;

  const seoDesc = `Explore PARIWESH's premium luxury dress catalog for women. Discover top hand-finished designer ${
    selectedCategory !== "all" ? selectedCategory : "ethnic wear"
  } sets crafted with comfort and elegance.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SEO
        title={seoTitle}
        description={seoDesc}
        keywords={`pariwesh shop, ${selectedCategory}, designer suits, boutique online`}
      />
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-textPrimary uppercase tracking-wider">
            Collections Catalog
          </h1>
          <p className="text-xs text-textSecondary mt-1">
            Showing {filteredProducts.length} premium ensembles tailored for you
          </p>
        </div>

        {/* Dynamic sorters */}
        <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center space-x-2 text-xs font-semibold text-secondary hover:text-accent-gold p-2 bg-primary border border-borderLight rounded-sm"
          >
            <RiFilter3Line />
            <span>Filters</span>
          </button>

          <div className="flex items-center space-x-2 bg-primary border border-borderLight px-3 py-2 rounded-sm">
            <RiArrowUpDownLine size={14} className="text-textSecondary" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-transparent focus:outline-none text-textPrimary"
            >
              <option value="latest">Sort: Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Rating: Highly Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-10 items-start">
        {/* DESKTOP SIDEBAR FILTER */}
        <aside className="hidden md:block w-64 flex-shrink-0 bg-white/70 backdrop-blur-xl border border-white/80 p-6 rounded-2xl space-y-7 sticky top-36 z-30 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center pb-3.5 border-b border-slate-200/60">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <span className="text-accent-gold text-[10px]">✦</span>
              <span>Refine Search</span>
            </h3>
            <button
              onClick={resetFilters}
              className="text-[10px] uppercase font-bold text-accent-gold hover:text-[#8a1c14] transition-colors cursor-pointer"
            >
              Reset All
            </button>
          </div>

          {/* 1. Category selector */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
              Product Type
            </h4>
            <div className="flex flex-col space-y-1.5">
              {categoriesList.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left text-xs capitalize py-1 px-2.5 rounded-md transition-all duration-200 flex items-center justify-between cursor-pointer ${
                      isActive
                        ? "bg-accent-gold/15 text-[#8a1c14] font-bold shadow-2xs"
                        : "text-slate-700 hover:bg-slate-100/70 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <span>{cat === "all" ? "All Styles" : cat}</span>
                    {isActive && <span className="text-accent-gold text-[10px]">●</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Color selection */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
              Color Palette
            </h4>
            <div className="flex flex-wrap gap-2">
              {colorsList.map((color) => {
                const isActive = selectedColor === color;
                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "border border-accent-gold bg-accent-gold text-white font-bold shadow-xs scale-105"
                        : "border border-slate-200/80 bg-white/70 text-slate-700 hover:border-accent-gold/60 hover:bg-white"
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Size selection */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
              Size Variants
            </h4>
            <div className="grid grid-cols-5 gap-1.5">
              {sizesList.map((size) => {
                const isActive = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 text-[10px] text-center rounded-md font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-accent-gold to-yellow-600 text-white shadow-xs scale-105"
                        : "border border-slate-200/80 bg-white/70 text-slate-700 hover:border-accent-gold hover:bg-white"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Price range bar */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
              <span>Max Price</span>
              <span className="text-sm font-bold text-[#8a1c14] font-sans">
                {formatCurrency(priceRange)}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="5000"
              step="500"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-accent-gold cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-sans">
              <span>₹1,000</span>
              <span>₹5,000</span>
            </div>
          </div>
        </aside>

        {/* PRODUCTS GRID / RENDER AREA */}
        <div className="flex-grow">
          {isApiLoading || isLoading ? (
            // Load skeletons in loader state
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {paginatedProducts.map((product) => (
                  <div
                    key={product._id}
                    className="group relative bg-white/80 hover:bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/80 hover:border-[#c5a880]/40 shadow-[0_4px_20px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_12px_32px_rgba(197,168,128,0.18),0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-1 flex flex-col h-full transition-all duration-400"
                  >
                    {/* Product Badge */}
                    {product.tag && (
                      <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-xs bg-gradient-to-r from-[#8a1c14] to-[#6b140e] text-white text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.16em] shadow-md border border-amber-300/30">
                          {product.tag}
                        </span>
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        trackAddToWishlist(product);
                        dispatch(toggleWishlistProduct(product));
                        syncWishlistNow();
                      }}
                      className={`absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-sm border border-white/60 cursor-pointer ${
                        wishlistItems.some((p) => p._id === product._id)
                          ? "bg-white text-[#8a1c14] scale-105 ring-2 ring-[#8a1c14]/30"
                          : "bg-white/85 hover:bg-white text-slate-700 hover:text-[#8a1c14] hover:scale-110 active:scale-95"
                      }`}
                      aria-label="Wishlist"
                    >
                      {wishlistItems.some((p) => p._id === product._id) ? (
                        <RiHeartFill size={15} />
                      ) : (
                        <RiHeartLine size={15} />
                      )}
                    </button>

                    {/* Image / Video Container with Mehrab Arch */}
                    <Link
                      to={`/product/${product.slug}`}
                      className="aspect-[3/4] sm:aspect-[4/5] overflow-hidden relative block bg-[#FBF9F5] rounded-t-lg transition-transform duration-500"
                      style={{ clipPath: "url(#mehrab-clip)" }}
                    >
                      {product.video ? (
                        <video
                          src={product.video}
                          className="w-full h-full object-cover group-hover:scale-105 transform-gpu transition-transform duration-700 ease-out origin-top"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <div className="w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out">
                          <ProductImageSlider
                            images={product.images}
                            alt={product.name}
                          />
                        </div>
                      )}

                      {/* Royal Golden Mehrab Arch Filigree Stroke */}
                      <svg
                        viewBox="0 0 100 125"
                        className="absolute inset-0 w-full h-full pointer-events-none fill-none stroke-accent-gold stroke-[1.8px] opacity-85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                        preserveAspectRatio="none"
                      >
                        <path d="M 0,125 L 0,43.75 C 0,35 8,32.5 12,30 C 12,22.5 22,18.75 28,15 C 28,10 38,7.5 44,3.75 C 47,1.25 49,0 50,0 C 51,0 53,1.25 56,3.75 C 62,7.5 72,10 72,15 C 78,18.75 88,22.5 88,30 C 92,32.5 100,35 100,43.75 L 100,125" />
                      </svg>

                      {/* Floating Rating Badge (Inspired by Reference Design) */}
                      <div className="absolute bottom-2.5 right-2.5 z-10 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10.5px] font-bold text-slate-800 shadow-sm border border-white/90 flex items-center space-x-1 pointer-events-none transition-opacity duration-200 group-hover:opacity-0 sm:group-hover:opacity-0">
                        <span className="text-amber-500 text-[11px]">★</span>
                        <span>{product.rating || "4.8"}</span>
                        <span className="text-slate-400 font-normal">({product.reviewsCount ? `${product.reviewsCount}+` : "120+"})</span>
                      </div>

                      {/* Subtle Gradient Shade at Hem */}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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
                              ? product.sizes.filter((s) => s !== "S")
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

                    {/* Info area */}
                    <div className="pt-3 pb-1 px-1 flex flex-col flex-grow justify-between space-y-2 text-left">
                      <div className="space-y-1">
                        {/* Category & Fabric Tag */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9.5px] text-[#c5a880] uppercase tracking-[0.18em] font-extrabold block truncate">
                            {product.fabric ? `${product.fabric} • ` : ""}{product.category || "Ethnic Wear"}
                          </span>
                          {product.colorVariants && product.colorVariants.length > 1 && (
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
                              {product.colorVariants.length} Colors
                            </span>
                          )}
                        </div>

                        {/* Product Title (1-Tap Navigates Instantly) */}
                        <h3 className="text-xs sm:text-[13px] font-sans font-medium text-slate-900 leading-snug group-hover:text-[#8a1c14] transition-colors duration-200 line-clamp-2 h-9">
                          <Link to={`/product/${product.slug}`}>
                            {product.name}
                          </Link>
                        </h3>

                        {/* Available Sizes Micro-Indicator */}
                        <div className="flex items-center space-x-1.5 pt-0.5 font-sans text-[10px]">
                          <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Sizes:</span>
                          <div className="flex items-center space-x-1">
                            {(product.sizes && product.sizes.length > 0
                              ? product.sizes.filter((s) => s !== "S")
                              : ["M", "L", "XL", "XXL"]
                            ).map((sz) => {
                              const isOut =
                                product.sizesStock &&
                                product.sizesStock[sz] !== undefined &&
                                product.sizesStock[sz] <= 0;
                              return (
                                <span
                                  key={sz}
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                    isOut
                                      ? "text-slate-300 border-slate-200 line-through bg-slate-50"
                                      : "text-slate-700 border-slate-200 bg-white shadow-2xs"
                                  }`}
                                >
                                  {sz}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-baseline space-x-2 pt-0.5 font-sans">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 font-sans tracking-tight">
                          {formatCurrency(product.price)}
                        </span>
                        {product.mrp > product.price && (
                          <>
                            <span className="text-[11px] text-slate-400 line-through font-normal font-sans">
                              {formatCurrency(product.mrp)}
                            </span>
                            <span className="text-[8.5px] font-extrabold text-[#8a1c14] bg-rose-50 border border-rose-200/70 px-1.5 py-0.2 uppercase tracking-wider font-sans rounded">
                              {Math.round(
                                ((product.mrp - product.price) / product.mrp) * 100,
                              )}
                              % OFF
                            </span>
                          </>
                        )}
                      </div>

                      {/* Prominent Full-Width ADD TO CART Button (Subtle 3D Glassy) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleQuickAddToCart(product, "M");
                        }}
                        className="w-full bg-gradient-to-b from-[#9b2017] to-[#7a1810] hover:from-[#a8251b] hover:to-[#861c13] text-white font-extrabold text-[11px] uppercase tracking-[0.15em] py-2.5 rounded-xl border border-rose-300/25 shadow-[0_4px_14px_rgba(138,28,20,0.22),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(138,28,20,0.38),inset_0_1px_0_rgba(255,255,255,0.35)] active:scale-[0.98] active:translate-y-[1px] transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1.5 mt-1"
                      >
                        <span>ADD TO CART</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Luxury Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 pt-10 border-t border-slate-200/60 mt-10">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border rounded-lg transition-all duration-200 ${
                      currentPage === 1
                        ? "border-slate-200 text-slate-300 cursor-not-allowed"
                        : "border-slate-200 bg-white/70 hover:bg-white text-slate-800 hover:text-[#8a1c14] hover:shadow-sm"
                    }`}
                  >
                    Prev
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 text-xs font-semibold rounded-lg transition-all duration-200 ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-accent-gold to-yellow-600 text-white font-bold shadow-md scale-105"
                            : "border border-slate-200 bg-white/70 hover:bg-white text-slate-800 hover:text-accent-gold"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border rounded-lg transition-all duration-200 ${
                      currentPage === totalPages
                        ? "border-slate-200 text-slate-300 cursor-not-allowed"
                        : "border-slate-200 bg-white/70 hover:bg-white text-slate-800 hover:text-[#8a1c14] hover:shadow-sm"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            // Empty view layout
            <div className="text-center py-24 bg-white border border-gray-100 rounded-sm">
              <h3 className="text-lg font-display text-textPrimary font-semibold">
                {products.length === 0
                  ? "No Products Available"
                  : "No Ensembles Match Your Search"}
              </h3>
              <p className="text-xs text-textSecondary mt-2">
                {products.length === 0
                  ? "Our premium catalog is currently being updated. Please check back later."
                  : "Try adjusting your filters, color pallete, or set a larger pricing range."}
              </p>
              {products.length > 0 && (
                <Button
                  onClick={resetFilters}
                  variant="primary"
                  size="sm"
                  className="mt-6"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FULL FILTER SLIDE OVERLAY */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden flex md:hidden">
          {/* Backdrop blur fade */}
          <div
            onClick={() => setMobileFilterOpen(false)}
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity"
          />

          <div className="relative w-full max-w-xs bg-white/95 backdrop-blur-2xl h-full ml-auto flex flex-col z-10 p-6 overflow-y-auto space-y-8 animate-slide-left border-l border-white/60 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                <span className="text-accent-gold text-[10px]">✦</span>
                <span>Refinement Controls</span>
              </h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

            {/* 1. Categories */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                Product Type
              </h4>
              <div className="flex flex-col space-y-1.5">
                {categoriesList.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setMobileFilterOpen(false);
                      }}
                      className={`text-left text-xs capitalize py-1.5 px-3 rounded-lg flex items-center justify-between transition-all ${
                        isActive
                          ? "bg-accent-gold/15 text-[#8a1c14] font-bold"
                          : "text-slate-700 hover:bg-slate-100 font-medium"
                      }`}
                    >
                      <span>{cat === "all" ? "All Styles" : cat}</span>
                      {isActive && <span className="text-accent-gold text-[10px]">●</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Colors */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                Color Palette
              </h4>
              <div className="flex flex-wrap gap-2">
                {colorsList.map((color) => {
                  const isActive = selectedColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        setMobileFilterOpen(false);
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] transition-all ${
                        isActive
                          ? "bg-accent-gold text-white font-bold shadow-xs scale-105"
                          : "border border-slate-200 bg-white/70 text-slate-700 hover:border-accent-gold"
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Sizes */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                Size Variants
              </h4>
              <div className="flex gap-2">
                {sizesList.map((size) => {
                  const isActive = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        setMobileFilterOpen(false);
                      }}
                      className={`w-10 h-10 rounded-lg text-center text-xs flex items-center justify-center font-bold transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-accent-gold to-yellow-600 text-white shadow-xs scale-105"
                          : "border border-slate-200 bg-white/70 text-slate-700 hover:border-accent-gold"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Scroll Price */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-extrabold text-slate-500">
                <span>Max Price</span>
                <span className="text-sm font-bold text-[#8a1c14] font-sans">
                  {formatCurrency(priceRange)}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="5000"
                step="500"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-accent-gold cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-sans">
                <span>₹1,000</span>
                <span>₹5,000</span>
              </div>
            </div>

            <Button
              onClick={() => {
                resetFilters();
                setMobileFilterOpen(false);
              }}
              variant="outline"
              size="sm"
              className="w-full mt-4"
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopListings;

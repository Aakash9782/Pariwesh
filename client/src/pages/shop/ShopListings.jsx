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
  RiCheckLine,
} from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../components/common/Button.jsx";
import ProductImageSlider from "../../components/common/ProductImageSlider.jsx";
import { ProductSkeleton } from "../../components/common/Skeleton.jsx";
import { toggleWishlistProduct } from "../../redux/slices/wishlistSlice.js";
import { addToCart } from "../../redux/slices/cartSlice.js";
import API from "../../services/api.js";
import { syncWishlistNow, syncCartNow } from "../../services/hydrateCommerce.js";
import { trackSearch, trackAddToWishlist, trackAddToCart } from "../../services/metaPixel.js";
import SEO from "../../components/common/SEO.jsx";
import { useAlert } from "../../contexts/AlertContext.jsx";

const formatCurrency = (val) => {
  const num = Math.round(Number(val) || 0);
  return `₹${num.toLocaleString("en-IN")}`;
};

const formatProductTitle = (name) => {
  if (!name) return "";
  return name
    .replace(/\s*-\s*-\s*/g, " - ")
    .replace(/\s*-\s*([a-zA-Z]+)-\s*$/g, " - $1")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const MASTER_COLOR_PALETTE = [
  { id: "all", label: "All Colors", hex: null },
  { id: "red", label: "Red / Maroon", hex: "#8A1C14", keywords: ["red", "maroon", "wine", "crimson", "cherry"] },
  { id: "pink", label: "Pink / Blush", hex: "#EC4899", keywords: ["pink", "fuchsia", "rani", "blush", "rose", "peach"] },
  { id: "blue", label: "Blue / Navy", hex: "#1D4ED8", keywords: ["blue", "navy", "teal", "sky", "ice blue", "indigo"] },
  { id: "green", label: "Green / Mint", hex: "#059669", keywords: ["green", "mint", "olive", "sage", "emerald"] },
  { id: "yellow", label: "Yellow / Mustard", hex: "#EAB308", keywords: ["yellow", "mustard", "lemon", "haldi", "gold"] },
  { id: "white", label: "White / Cream", hex: "#FDFBF7", border: "#D1D5DB", keywords: ["white", "ivory", "cream", "off white", "off-white", "beige"] },
  { id: "black", label: "Black", hex: "#18181B", keywords: ["black"] },
  { id: "brown", label: "Brown / Tan", hex: "#78350F", keywords: ["brown", "tan", "rust", "khaki", "camel"] },
  { id: "multicolor", label: "Multicolor", isMulti: true, keywords: ["multi", "multicolor", "printed"] },
];

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
  const [priceRange, setPriceRange] = useState(10000);
  const [sortBy, setSortBy] = useState("latest");
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [selectedCardSizes, setSelectedCardSizes] = useState({});
  const [quickSizeProduct, setQuickSizeProduct] = useState(null);
  const [addedSuccessId, setAddedSuccessId] = useState(null);

  const [products, setProducts] = useState([]);
  const [isApiLoading, setIsApiLoading] = useState(true);

  // Pagination states (Synced with URL search params for seamless browser back/forward support)
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const ITEMS_PER_PAGE = 12;

  const handlePageChange = (newPage) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
    const nextParams = new URLSearchParams(searchParams);
    if (validPage > 1) {
      nextParams.set("page", String(validPage));
    } else {
      nextParams.delete("page");
    }
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  // Dynamic price ceiling derived from store inventory
  const maxStorePrice = React.useMemo(() => {
    if (!products.length) return 10000;
    const maxP = Math.max(...products.map((p) => Number(p.price) || 0));
    return Math.max(10000, Math.ceil(maxP / 1000) * 1000);
  }, [products]);

  // Adjust price range default when products load
  useEffect(() => {
    if (products.length > 0) {
      setPriceRange((prev) => (prev < maxStorePrice ? maxStorePrice : prev));
    }
  }, [maxStorePrice, products.length]);

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
    const delay = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(delay);
  }, [
    selectedCategory,
    selectedColor,
    selectedSize,
    priceRange,
    sortBy,
    searchQuery,
  ]);

  const isSaleOnly = searchParams.get("sale") === "true";
  const tagParam = searchParams.get("tag");

  // Filter computation logic
  const filteredProducts = products
    .filter((product) => {
      const catMatch =
        selectedCategory === "all" || product.category === selectedCategory;
      const colorMatch = (() => {
        if (!selectedColor || selectedColor === "all") return true;
        if (!product.color) return false;
        const prodColorLower = product.color.toLowerCase();
        const activePalette = MASTER_COLOR_PALETTE.find((c) => c.id === selectedColor);
        if (activePalette && activePalette.keywords) {
          return activePalette.keywords.some((kw) => prodColorLower.includes(kw));
        }
        return prodColorLower.includes(selectedColor.toLowerCase().trim());
      })();
      const sizeMatch =
        selectedSize === "all" || product.sizes.includes(selectedSize);
      const priceMatch = product.price <= priceRange;
      const saleMatch =
        !isSaleOnly ||
        (Number(product.mrp) > Number(product.price || product.sellingPrice) ||
          (product.tag && product.tag.toLowerCase().includes("sale")) ||
          (product.tag && product.tag.toLowerCase().includes("offer")));
      const tagMatch = (() => {
        if (!tagParam) return true;
        const tp = tagParam.toLowerCase().trim();
        if (tp === "best seller" || tp === "best-seller" || tp === "bestseller") {
          return Boolean(product.bestSeller) || (product.tag && product.tag.toLowerCase().includes("best"));
        }
        if (tp === "new arrival" || tp === "new-arrival" || tp === "new" || tp === "new arrivals") {
          return Boolean(product.newArrival) || (product.tag && product.tag.toLowerCase().includes("new"));
        }
        if (tp === "trending") {
          return Boolean(product.trending) || (product.tag && product.tag.toLowerCase().includes("trend"));
        }
        if (tp === "featured") {
          return Boolean(product.featured) || (product.tag && product.tag.toLowerCase().includes("feature"));
        }
        return product.tag && product.tag.toLowerCase() === tp;
      })();

      const searchMatch = searchQuery
        ? (() => {
            const query = searchQuery.trim().toLowerCase();
            return (
              (product.name && product.name.toLowerCase().includes(query)) ||
              (product.sku && product.sku.toLowerCase().includes(query)) ||
              (product.metaKeywords &&
                product.metaKeywords.toLowerCase().includes(query)) ||
              (product.subCategory &&
                product.subCategory.toLowerCase().includes(query)) ||
              (product.fabric &&
                product.fabric.toLowerCase().includes(query)) ||
              (product.tag && product.tag.toLowerCase().includes(query)) ||
              (product.color && product.color.toLowerCase().includes(query)) ||
              (product.category &&
                product.category.toLowerCase().includes(query))
            );
          })()
        : true;
      return (
        catMatch &&
        colorMatch &&
        sizeMatch &&
        priceMatch &&
        searchMatch &&
        saleMatch &&
        tagMatch
      );
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
      handlePageChange(1);
    }
  }, [filteredProducts.length, currentPage, totalPages]);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedColor("all");
    setSelectedSize("all");
    setPriceRange(maxStorePrice);
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
    trackAddToCart(product, 1, size);
    setAddedSuccessId(product._id);
    setTimeout(() => setAddedSuccessId(null), 1800);
    showAlert(
      `"${product.name}" (Size: ${size}) has been added to your shopping bag!`,
      "Added to Bag",
    );
  };

  // Dynamically extract unique categories from actual store products (Zero hardcoding)
  const categoriesList = React.useMemo(() => {
    const cats = new Set(["all"]);
    products.forEach((p) => {
      if (p.category && String(p.category).trim()) {
        cats.add(String(p.category).trim().toLowerCase());
      }
    });
    return Array.from(cats);
  }, [products]);

  const availableColors = React.useMemo(() => {
    return MASTER_COLOR_PALETTE.filter((palette) => {
      if (palette.id === "all") return true;
      return products.some((p) => {
        if (!p.color) return false;
        const cLower = p.color.toLowerCase();
        return palette.keywords.some((kw) => cLower.includes(kw));
      });
    });
  }, [products]);

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
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-900 flex items-center">
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

          {/* 2. Color selection (Luxury Swatch Dots) */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                Color Palette
              </h4>
              {selectedColor !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedColor("all")}
                  className="text-[9.5px] font-bold text-[#8a1c14] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="space-y-1">
              {availableColors.map((palette) => {
                const isActive = selectedColor === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setSelectedColor(palette.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-amber-50/80 text-[#8a1c14] font-bold border border-[#c5a880]/60 shadow-2xs"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {palette.id === "all" ? (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-white flex items-center justify-center text-[7px] text-slate-500 font-bold shrink-0">
                          ALL
                        </span>
                      ) : palette.isMulti ? (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-200 bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 to-sky-500 shadow-2xs shrink-0" />
                      ) : (
                        <span
                          className="w-3.5 h-3.5 rounded-full border shadow-2xs shrink-0"
                          style={{
                            backgroundColor: palette.hex,
                            borderColor: palette.border || "rgba(0,0,0,0.12)",
                          }}
                        />
                      )}
                      <span className="text-[11px] font-medium tracking-wide">
                        {palette.label}
                      </span>
                    </div>
                    {isActive && (
                      <span className="text-[10px] text-[#8a1c14] font-bold">✓</span>
                    )}
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
              min="500"
              max={maxStorePrice}
              step="500"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-accent-gold cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-sans">
              <span>₹500</span>
              <span>{formatCurrency(maxStorePrice)}</span>
            </div>
          </div>
        </aside>

        {/* PRODUCTS GRID / RENDER AREA */}
        <div className="flex-grow">
          {/* Active Filter Chips / Pills */}
          {(selectedCategory !== "all" ||
            selectedColor !== "all" ||
            selectedSize !== "all" ||
            priceRange < maxStorePrice ||
            searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mr-1">
                Active Filters:
              </span>
              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#c5a880]/50 text-[#8a1c14] shadow-2xs">
                  <span>Type: {selectedCategory}</span>
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="hover:text-black cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedColor !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#c5a880]/50 text-[#8a1c14] shadow-2xs">
                  <span>
                    Color: {MASTER_COLOR_PALETTE.find((c) => c.id === selectedColor)?.label || selectedColor}
                  </span>
                  <button
                    onClick={() => setSelectedColor("all")}
                    className="hover:text-black cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedSize !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#c5a880]/50 text-[#8a1c14] shadow-2xs">
                  <span>Size: {selectedSize}</span>
                  <button
                    onClick={() => setSelectedSize("all")}
                    className="hover:text-black cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              )}
              {priceRange < maxStorePrice && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#c5a880]/50 text-[#8a1c14] shadow-2xs">
                  <span>Price: Under {formatCurrency(priceRange)}</span>
                  <button
                    onClick={() => setPriceRange(maxStorePrice)}
                    className="hover:text-black cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#c5a880]/50 text-[#8a1c14] shadow-2xs">
                  <span>Search: "{searchQuery}"</span>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      searchParams.delete("search");
                      setSearchParams(searchParams);
                    }}
                    className="hover:text-black cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-[11px] font-bold text-[#8a1c14] hover:underline uppercase tracking-wider ml-auto cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {isApiLoading || isLoading ? (
            // Load skeletons in loader state
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {[...Array(12)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {paginatedProducts.map((product, pIdx) => {
                  let badgeText = "";
                  if (
                    product.tag &&
                    !["regular", "normal", "standard"].includes(
                      product.tag.trim().toLowerCase(),
                    )
                  ) {
                    badgeText = product.tag;
                  } else if (product.bestSeller) {
                    badgeText = "Best Seller";
                  } else if (product.newArrival) {
                    badgeText = "New Arrival";
                  } else if (product.trending) {
                    badgeText = "Trending";
                  }

                  return (
                    <div
                      key={product._id}
                      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/75 hover:border-[#c5a880]/60 shadow-[0_3px_14px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(138,28,20,0.12)] hover:-translate-y-1 flex flex-col h-full transition-all duration-300"
                    >
                      {/* Media Container: Full Bleed (Edge-to-edge, zero margin, no awkward arch cut) */}
                      <div className="aspect-[3/4] sm:aspect-[4/5] overflow-hidden relative block bg-[#FBF9F5]">
                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            trackAddToWishlist(product);
                            dispatch(toggleWishlistProduct(product));
                            syncWishlistNow();
                          }}
                          className={`absolute top-2.5 right-2.5 z-20 w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 shadow-sm border border-white/60 cursor-pointer ${
                            wishlistItems.some((p) => p._id === product._id)
                              ? "bg-white text-[#8a1c14] scale-105 ring-2 ring-[#8a1c14]/30"
                              : "bg-white/90 hover:bg-white text-slate-700 hover:text-[#8a1c14] active:scale-95"
                          }`}
                          aria-label="Wishlist"
                        >
                          {wishlistItems.some((p) => p._id === product._id) ? (
                            <RiHeartFill size={14} />
                          ) : (
                            <RiHeartLine size={14} />
                          )}
                        </button>

                        {/* Image / Video Link */}
                        <Link
                          to={`/product/${product.slug}`}
                          className="w-full h-full block"
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
                                priority={pIdx < 2}
                              />
                            </div>
                          )}
                        </Link>

                        {/* Floating Rating Badge */}
                        {Number(product.reviewsCount) > 0 && (
                          <div className="absolute bottom-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-800 shadow-xs border border-white/80 flex items-center space-x-1 pointer-events-none">
                            <span className="text-amber-500 text-[10.5px]">★</span>
                            <span>{Number(product.rating || 4.8).toFixed(1)}</span>
                            <span className="text-slate-400 font-normal">({product.reviewsCount})</span>
                          </div>
                        )}

                        {/* Floating Luxury Quick-Add Bag Button (Myntra/Suitswala Style) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (product.sizes && product.sizes.length > 1) {
                              setQuickSizeProduct(product);
                            } else {
                              handleQuickAddToCart(product, product.sizes?.[0] || "M");
                            }
                          }}
                          className={`absolute bottom-2.5 right-2.5 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer active:scale-90 ${
                            addedSuccessId === product._id
                              ? "bg-emerald-600 text-white"
                              : "bg-white/95 hover:bg-[#8a1c14] text-slate-800 hover:text-white border border-white hover:border-[#8a1c14]"
                          }`}
                          title="Quick Add to Bag"
                          aria-label="Add to bag"
                        >
                          {addedSuccessId === product._id ? (
                            <RiCheckLine size={16} className="animate-bounce" />
                          ) : (
                            <RiShoppingBagLine size={15} />
                          )}
                        </button>
                      </div>

                      {/* Info Area - Clean & Balanced Typography */}
                      <div className="p-2.5 sm:p-3 flex flex-col flex-grow justify-between space-y-1.5 text-left bg-white">
                        <div className="space-y-1">
                          {/* Category & Clean Fabric Tag + Badge */}
                          <div className="flex items-center justify-between gap-1.5 min-h-[18px]">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              {badgeText && (
                                <span className="text-[7.5px] sm:text-[8px] bg-[#8a1c14] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 leading-none">
                                  {badgeText
                                    .replace(/Everyday Essential/i, "Essential")
                                    .replace(/New Arrival/i, "New")
                                    .replace(/Best Seller/i, "Bestseller")}
                                </span>
                              )}
                              <span className="text-[9px] sm:text-[9.5px] text-[#c5a880] uppercase tracking-[0.16em] font-extrabold truncate">
                                {product.fabric && product.fabric.length <= 18 ? `${product.fabric} • ` : ""}
                                {(product.category || "Ethnic Wear").replace(/-/g, " ")}
                              </span>
                            </div>
                            {product.colorVariants && product.colorVariants.length > 1 && (
                              <span className="text-[8.5px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
                                {product.colorVariants.length} Colors
                              </span>
                            )}
                          </div>

                          {/* Product Title */}
                          <h3 className="text-xs sm:text-[13px] font-sans font-medium text-slate-900 leading-snug group-hover:text-[#8a1c14] transition-colors duration-200 line-clamp-2 min-h-[2rem]">
                            <Link to={`/product/${product.slug}`}>
                              {formatProductTitle(product.name)}
                            </Link>
                          </h3>

                          {/* Available Sizes Hint */}
                          <div className="flex items-center space-x-1 text-[9px] text-slate-400 font-sans pt-0.5">
                            <span className="font-semibold uppercase text-[8px] tracking-wider text-slate-400">Sizes:</span>
                            <span className="font-medium text-slate-600 truncate">
                              {product.sizes && product.sizes.length > 0
                                ? product.sizes.join(", ")
                                : "M, L, XL, XXL"}
                            </span>
                          </div>
                        </div>

                        {/* Pricing Row - 100% UNTOUCHED */}
                        <div className="flex items-baseline space-x-2 pt-1 font-sans">
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
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Luxury Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 pt-10 border-t border-slate-200/60 mt-10">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border rounded-lg transition-all duration-200 ${
                      currentPage === 1
                        ? "border-slate-200 text-slate-300 cursor-not-allowed"
                        : "border-slate-200 bg-white/70 hover:bg-white text-slate-800 hover:text-[#8a1c14] hover:shadow-sm cursor-pointer"
                    }`}
                  >
                    Prev
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border rounded-lg transition-all duration-200 ${
                      currentPage === totalPages
                        ? "border-slate-200 text-slate-300 cursor-not-allowed"
                        : "border-slate-200 bg-white/70 hover:bg-white text-slate-800 hover:text-[#8a1c14] hover:shadow-sm cursor-pointer"
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
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-900 flex items-center">
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
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left text-xs capitalize py-1.5 px-3 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
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

            {/* 2. Colors (Luxury Swatch Dots) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                  Color Palette
                </h4>
                {selectedColor !== "all" && (
                  <button
                    type="button"
                    onClick={() => setSelectedColor("all")}
                    className="text-[9.5px] font-bold text-[#8a1c14] hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {availableColors.map((palette) => {
                  const isActive = selectedColor === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => setSelectedColor(palette.id)}
                      className={`flex items-center space-x-2 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                        isActive
                          ? "bg-amber-50 text-[#8a1c14] font-bold border border-[#c5a880]/60 shadow-2xs"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {palette.id === "all" ? (
                        <span className="w-3 h-3 rounded-full border border-slate-300 bg-slate-100 shrink-0" />
                      ) : palette.isMulti ? (
                        <span className="w-3 h-3 rounded-full border border-slate-200 bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 to-sky-500 shadow-2xs shrink-0" />
                      ) : (
                        <span
                          className="w-3 h-3 rounded-full border shadow-2xs shrink-0"
                          style={{
                            backgroundColor: palette.hex,
                            borderColor: palette.border || "rgba(0,0,0,0.12)",
                          }}
                        />
                      )}
                      <span className="text-[10.5px] truncate">{palette.label}</span>
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
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`w-10 h-10 rounded-lg text-center text-xs flex items-center justify-center font-bold transition-all cursor-pointer ${
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
                min="500"
                max={maxStorePrice}
                step="500"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-accent-gold cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-sans">
                <span>₹500</span>
                <span>{formatCurrency(maxStorePrice)}</span>
              </div>
            </div>

            {/* Sticky Drawer Footer Actions */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-2 border-t border-slate-200/80 mt-auto flex gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-[2] py-2.5 px-3 rounded-xl bg-[#8a1c14] hover:bg-[#70150e] text-white font-extrabold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SIZE SELECTOR BOTTOM SHEET / DRAWER (Myntra / Zara Style Mobile UX) */}
      <AnimatePresence>
        {quickSizeProduct && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickSizeProduct(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Header: Product Preview & Dismiss */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={optimizeCloudinaryUrl(
                      quickSizeProduct.images?.[0] || quickSizeProduct.image,
                      120,
                    )}
                    alt={quickSizeProduct.name}
                    className="w-12 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {formatProductTitle(quickSizeProduct.name)}
                    </h4>
                    <div className="flex items-baseline space-x-2 mt-0.5">
                      <span className="text-sm font-extrabold text-[#8a1c14]">
                        {formatCurrency(quickSizeProduct.price)}
                      </span>
                      {quickSizeProduct.mrp > quickSizeProduct.price && (
                        <span className="text-[11px] text-slate-400 line-through">
                          {formatCurrency(quickSizeProduct.mrp)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickSizeProduct(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors text-xs font-bold"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Size Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Select Your Size
                  </span>
                  <span className="text-[10px] text-slate-400">Tap to add directly</span>
                </div>

                <div className="grid grid-cols-4 gap-2.5 pt-1 pb-2">
                  {(quickSizeProduct.sizes && quickSizeProduct.sizes.length > 0
                    ? quickSizeProduct.sizes
                    : ["M", "L", "XL", "XXL"]
                  ).map((sz) => {
                    const isOut =
                      quickSizeProduct.sizesStock &&
                      quickSizeProduct.sizesStock[sz] !== undefined &&
                      quickSizeProduct.sizesStock[sz] <= 0;

                    return (
                      <button
                        key={sz}
                        type="button"
                        disabled={isOut}
                        onClick={() => {
                          handleQuickAddToCart(quickSizeProduct, sz);
                          setQuickSizeProduct(null);
                        }}
                        className={`h-12 rounded-xl text-xs uppercase transition-all duration-150 flex items-center justify-center cursor-pointer font-bold ${
                          isOut
                            ? "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed line-through"
                            : "bg-[#FAF7F3] hover:bg-[#8a1c14] hover:text-white text-slate-800 border border-slate-200 active:scale-95 shadow-2xs hover:shadow-xs"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopListings;

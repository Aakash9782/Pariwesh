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
import API from "../../services/api.js";
import { syncWishlistNow } from "../../services/hydrateCommerce.js";
import SEO from "../../components/common/SEO.jsx";

const ShopListings = () => {
  const dispatch = useDispatch();
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

  const categoriesList = ["all", "kurtis", "suits", "ethnic"];
  const colorsList = ["all", "Gold", "Red", "Ivory", "Green", "Blue", "Pink"];
  const sizesList = ["all", "S", "M", "L", "XL"];

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
        <aside className="hidden md:block w-64 flex-shrink-0 bg-primary border border-borderLight p-6 rounded-sm space-y-8 sticky top-36 z-30">
          <div className="flex justify-between items-center pb-4 border-b border-borderLight">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary">
              Refine Search
            </h3>
            <button
              onClick={resetFilters}
              className="text-[10px] uppercase font-bold text-accent-gold hover:text-secondary transition-colors"
            >
              Reset All
            </button>
          </div>

          {/* 1. Category selector */}
          <div className="space-y-3">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-textSecondary">
              Product Type
            </h4>
            <div className="flex flex-col space-y-2">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left text-xs capitalize transition-colors duration-200 ${
                    selectedCategory === cat
                      ? "text-accent-gold font-semibold"
                      : "text-textPrimary hover:text-accent-gold"
                  }`}
                >
                  {cat === "all" ? "All Styles" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Color selection */}
          <div className="space-y-3">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-textSecondary">
              Color palette
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {colorsList.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-3 py-1.5 rounded-full border text-[10px] transition-all duration-200 ${
                    selectedColor === color
                      ? "border-accent-gold bg-accent-gold/10 text-accent-gold font-semibold"
                      : "border-gray-200 text-textPrimary hover:border-accent-gold"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Size selection */}
          <div className="space-y-3">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-textSecondary">
              Size Variants
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {sizesList.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-2 text-[10px] text-center border font-semibold transition-all duration-200 ${
                    selectedSize === size
                      ? "border-accent-gold bg-accent-gold text-white font-bold"
                      : "border-gray-200 text-textPrimary hover:border-accent-gold"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Price range bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-textSecondary">
              <span>Max Price</span>
              <span className="text-secondary font-bold">₹{priceRange}</span>
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
            <div className="flex justify-between text-[9px] text-textSecondary">
              <span>₹1000</span>
              <span>₹5000</span>
            </div>
          </div>
        </aside>

        {/* PRODUCTS GRID / RENDER AREA */}
        <div className="flex-grow">
          {isApiLoading || isLoading ? (
            // Load skeletons in loader state
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {paginatedProducts.map((product) => (
                  <div
                    key={product._id}
                    className="group relative bg-transparent flex flex-col h-full transition-all duration-300"
                  >
                    {/* Badge */}
                    {product.tag && (
                      <span className="absolute top-3 left-3 z-10 bg-secondary text-accent-gold font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 shadow-sm rounded-sm">
                        {product.tag}
                      </span>
                    )}
                    {/* Heart wishlist toggle */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dispatch(toggleWishlistProduct(product));
                        syncWishlistNow();
                      }}
                      className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-sm hover:scale-110 transition-all border border-borderLight/30 bg-primary/80 hover:bg-primary ${
                        wishlistItems.some((p) => p._id === product._id)
                          ? "text-[#8a1c14]"
                          : "text-textPrimary hover:text-[#8a1c14]"
                      }`}
                    >
                      {wishlistItems.some((p) => p._id === product._id) ? (
                        <RiHeartFill size={16} />
                      ) : (
                        <RiHeartLine size={16} />
                      )}
                    </button>

                    <Link
                      to={`/product/${product.slug}`}
                      className="aspect-[4/5] overflow-hidden relative block bg-bgLight"
                      style={{ clipPath: "url(#mehrab-clip)" }}
                    >
                      {product.video ? (
                        <video
                          src={product.video}
                          className="w-full h-full object-cover group-hover:scale-[1.12] transform-gpu transition-all duration-[800ms] ease-out origin-top"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <ProductImageSlider
                          images={product.images}
                          alt={product.name}
                        />
                      )}

                      {/* Arch outline SVG overlay */}
                      <svg
                        viewBox="0 0 100 125"
                        className="absolute inset-0 w-full h-full pointer-events-none fill-none stroke-accent-gold stroke-[2px]"
                        preserveAspectRatio="none"
                      >
                        <path d="M 0,125 L 0,43.75 C 0,35 8,32.5 12,30 C 12,22.5 22,18.75 28,15 C 28,10 38,7.5 44,3.75 C 47,1.25 49,0 50,0 C 51,0 53,1.25 56,3.75 C 62,7.5 72,10 72,15 C 78,18.75 88,22.5 88,30 C 92,32.5 100,35 100,43.75 L 100,125" />
                      </svg>

                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="bg-primary hover:bg-secondary text-secondary hover:text-white px-4 py-2.5 rounded-full flex items-center space-x-2 text-[10px] uppercase font-bold tracking-wide shadow-md transition-all duration-300">
                          <RiShoppingBagLine size={13} />
                          <span>Add To Bag</span>
                        </span>
                      </div>
                    </Link>

                    <div className="py-4 flex flex-col flex-grow justify-between space-y-2 text-left bg-transparent">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-textSecondary uppercase tracking-widest font-bold">
                          <span>{product.category}</span>
                          <span className="text-accent-gold">
                            ★ {product.rating}
                          </span>
                        </div>
                        <h3 className="text-xs font-semibold text-textPrimary leading-snug group-hover:text-accent-gold transition-colors line-clamp-2">
                          <Link to={`/product/${product.slug}`}>
                            {product.name}
                          </Link>
                        </h3>
                      </div>

                      <div className="flex items-center gap-x-2 text-xs">
                        <span className="text-textPrimary font-bold">
                          ₹{product.price}
                        </span>
                        {product.mrp > product.price && (
                          <>
                            <span className="text-textSecondary line-through text-[11px]">
                              ₹{product.mrp}
                            </span>
                            <span className="text-[10px] font-bold text-[#c5a880] uppercase tracking-wider">
                              (
                              {Math.round(
                                ((product.mrp - product.price) / product.mrp) *
                                  105 ||
                                  Math.round(
                                    ((product.mrp - product.price) /
                                      product.mrp) *
                                      100,
                                  ),
                              )}
                              % OFF)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Luxury Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 pt-10 border-t border-gray-100 mt-10">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border rounded-sm transition-colors ${
                      currentPage === 1
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-borderLight text-textPrimary hover:bg-bgLight hover:text-accent-gold"
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
                        className={`w-9 h-9 text-xs font-semibold border rounded-sm transition-all ${
                          currentPage === pageNum
                            ? "bg-secondary border-secondary text-primary font-bold shadow-md"
                            : "border-borderLight text-textPrimary hover:bg-bgLight hover:text-accent-gold"
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
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border rounded-sm transition-colors ${
                      currentPage === totalPages
                        ? "border-gray-200 text-gray-305 cursor-not-allowed"
                        : "border-borderLight text-textPrimary hover:bg-bgLight hover:text-accent-gold"
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

          <div className="relative w-full max-w-xs bg-white h-full ml-auto flex flex-col z-10 p-6 overflow-y-auto space-y-8 animate-slide-left">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary">
                Refinement Controls
              </h3>
              <button onClick={() => setMobileFilterOpen(false)}>
                <RiCloseLine size={24} />
              </button>
            </div>

            {/* 1. Categories */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-wider font-bold text-textSecondary">
                Product Type
              </h4>
              <div className="flex flex-col space-y-2">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setMobileFilterOpen(false);
                    }}
                    className={`text-left text-xs capitalize ${
                      selectedCategory === cat
                        ? "text-accent-gold font-bold"
                        : "text-textPrimary"
                    }`}
                  >
                    {cat === "all" ? "All Styles" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Colors */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-wider font-bold text-textSecondary">
                Color select
              </h4>
              <div className="flex flex-wrap gap-2">
                {colorsList.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setMobileFilterOpen(false);
                    }}
                    className={`px-3 py-1 bg-bgLight rounded text-[10px] ${
                      selectedColor === color
                        ? "bg-secondary text-primary font-bold"
                        : "text-textPrimary"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Sizes */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-wider font-bold text-textSecondary">
                Size Variants
              </h4>
              <div className="flex gap-2">
                {sizesList.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setMobileFilterOpen(false);
                    }}
                    className={`w-10 h-10 border text-center text-xs flex items-center justify-center font-bold ${
                      selectedSize === size
                        ? "border-secondary bg-secondary text-primary"
                        : "border-gray-200 text-textPrimary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Scroll Price */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold text-textSecondary">
                <span>MAX PRICE</span>
                <span className="text-secondary font-bold">₹{priceRange}</span>
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
            </div>

            <Button
              onClick={resetFilters}
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

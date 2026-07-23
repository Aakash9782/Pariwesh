import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  RiFilter3Line,
  RiCloseLine,
  RiShoppingBagLine,
  RiHeartLine,
  RiArrowUpDownLine,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import { ProductSkeleton } from "../../components/common/Skeleton.jsx";
import API from "../../services/api.js";

// Comprehensive mock database for ethnic/women clothing - 24 high-end items
const MOCK_CATALOG = [
  {
    _id: "1",
    name: "Elysian Gold Chanderi Suit",
    slug: "elysian-gold-chanderi-suit",
    sku: "LHR-CH-001",
    category: "suits",
    fabric: "Chanderi Silk",
    color: "Gold",
    colorHex: "#D4AF37",
    sizes: ["S", "M", "L", "XL"],
    mrp: 3999,
    price: 1599,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Best Seller",
    rating: 4.8,
  },
  {
    _id: "2",
    name: "Scarlet Floral Rayon Kurti",
    slug: "scarlet-floral-rayon-kurti",
    sku: "LHR-RY-002",
    category: "kurtis",
    fabric: "Premium Rayon",
    color: "Red",
    colorHex: "#C62828",
    sizes: ["M", "L", "XL"],
    mrp: 3999,
    price: 1699,
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Sale",
    rating: 4.5,
  },
  {
    _id: "3",
    name: "Ivory Zari Premium Anarkali Set",
    slug: "ivory-zari-premium-anarkali-set",
    sku: "LHR-AK-003",
    category: "ethnic",
    fabric: "Georgette Silk",
    color: "Ivory",
    colorHex: "#F5F5F0",
    sizes: ["S", "M", "L"],
    mrp: 3999,
    price: 1599,
    images: [
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Sale",
    rating: 4.9,
  },
  {
    _id: "4",
    name: "Chocolate Brown & Olive Suit Set",
    slug: "chocolate-brown-olive-suit-set",
    sku: "LHR-GG-004",
    category: "suits",
    fabric: "High Georgette",
    color: "Brown",
    colorHex: "#78350F",
    sizes: ["S", "M", "L", "XL"],
    mrp: 3999,
    price: 1799,
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Sale",
    rating: 4.7,
  },
  {
    _id: "5",
    name: "Indigo Block Printed Cotton Kurta",
    slug: "indigo-block-printed-cotton-kurta",
    sku: "LHR-CT-005",
    category: "kurtis",
    fabric: "Organic Cotton",
    color: "Blue",
    colorHex: "#1E3A8A",
    sizes: ["M", "L", "XL"],
    mrp: 2999,
    price: 1399,
    images: [
      "https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Summer Special",
    rating: 4.6,
  },
  {
    _id: "6",
    name: "Dusty Rose Embroidered Palazzo Set",
    slug: "dusty-rose-embroidered-palazzo-set",
    sku: "LHR-PL-006",
    category: "ethnic",
    fabric: "Crepe Silk",
    color: "Pink",
    colorHex: "#EC4899",
    sizes: ["S", "M", "L"],
    mrp: 4499,
    price: 2699,
    images: [
      "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Popular",
    rating: 4.4,
  },
  {
    _id: "7",
    name: "Mustard Yellow Gotta Patti Kurti",
    slug: "mustard-yellow-gotta-patti-kurti",
    sku: "LHR-GY-007",
    category: "kurtis",
    fabric: "Mulmul Cotton",
    color: "Yellow",
    colorHex: "#D97706",
    sizes: ["S", "M", "L", "XL", "XXL"],
    mrp: 2499,
    price: 1199,
    images: [
      "https://images.unsplash.com/photo-1614088685112-0a7db047d4e6?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Best Seller",
    rating: 4.6,
  },
  {
    _id: "8",
    name: "Lavender Dream Organza Salwar",
    slug: "lavender-dream-organza-salwar",
    sku: "LHR-OD-008",
    category: "suits",
    fabric: "Organza Silk",
    color: "Purple",
    colorHex: "#8B5CF6",
    sizes: ["S", "M", "L", "XL"],
    mrp: 4999,
    price: 2499,
    images: [
      "https://images.unsplash.com/photo-1612459284970-e8f027596582?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Exclusive",
    rating: 4.8,
  },
  {
    _id: "9",
    name: "Royal Crimson Bandhani Suit Set",
    slug: "royal-crimson-bandhani-suit-set",
    sku: "LHR-RB-009",
    category: "ethnic",
    fabric: "Banarasi Silk",
    color: "Red",
    colorHex: "#B91C1C",
    sizes: ["M", "L", "XL", "XXL"],
    mrp: 5499,
    price: 2999,
    images: [
      "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Festival Special",
    rating: 4.9,
  },
  {
    _id: "10",
    name: "Sage Green Linen Kurta Set",
    slug: "sage-green-linen-kurta-set",
    sku: "LHR-SL-010",
    category: "kurtis",
    fabric: "Pure Linen",
    color: "Green",
    colorHex: "#15803D",
    sizes: ["S", "M", "L", "XL"],
    mrp: 2999,
    price: 1499,
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "New Arrival",
    rating: 4.5,
  },
  {
    _id: "11",
    name: "Peach Bloom Cotton Palazzo Set",
    slug: "peach-bloom-cotton-palazzo-set",
    sku: "LHR-PC-011",
    category: "ethnic",
    fabric: "Supima Cotton",
    color: "Pink",
    colorHex: "#F472B6",
    sizes: ["S", "M", "L", "XL"],
    mrp: 3299,
    price: 1599,
    images: [
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Limited Edition",
    rating: 4.7,
  },
  {
    _id: "12",
    name: "Sapphire Blue Banarasi Suit Set",
    slug: "sapphire-blue-banarasi-suit-set",
    sku: "LHR-SB-012",
    category: "suits",
    fabric: "Katan Silk",
    color: "Blue",
    colorHex: "#1D4ED8",
    sizes: ["M", "L", "XL", "XXL"],
    mrp: 5999,
    price: 3499,
    images: [
      "https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Royal Collection",
    rating: 4.9,
  },
  {
    _id: "13",
    name: "Crimson Tulip Floral Cord Set",
    slug: "crimson-tulip-floral-cord-set",
    sku: "LHR-FC-013",
    category: "ethnic",
    fabric: "Viscose Rayon",
    color: "Red",
    colorHex: "#BE123C",
    sizes: ["S", "M", "L", "XL"],
    mrp: 2999,
    price: 1299,
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Trending",
    rating: 4.4,
  },
  {
    _id: "14",
    name: "Midnight Onyx Georgette Anarkali",
    slug: "midnight-onyx-georgette-anarkali",
    sku: "LHR-GA-014",
    category: "suits",
    fabric: "Flowy Georgette",
    color: "Ivory",
    colorHex: "#F3F4F6",
    sizes: ["S", "M", "L", "XL", "XXL"],
    mrp: 4999,
    price: 2299,
    images: [
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Exclusive",
    rating: 4.8,
  },
  {
    _id: "15",
    name: "Sunrise Orange Festive Kurti Set",
    slug: "sunrise-orange-festive-kurti-set",
    sku: "LHR-OK-015",
    category: "kurtis",
    fabric: "Cotton Silk",
    color: "Yellow",
    colorHex: "#EA580C",
    sizes: ["M", "L", "XL"],
    mrp: 2799,
    price: 1399,
    images: [
      "https://images.unsplash.com/photo-1614088685112-0a7db047d4e6?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Festival Special",
    rating: 4.6,
  },
  {
    _id: "16",
    name: "Emerald Queen Scallop Suit Set",
    slug: "emerald-queen-scallop-suit-set",
    sku: "LHR-EQ-016",
    category: "ethnic",
    fabric: "Pure Organza",
    color: "Green",
    colorHex: "#047857",
    sizes: ["S", "M", "L", "XL"],
    mrp: 5299,
    price: 2799,
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "New Arrival",
    rating: 4.7,
  },
  {
    _id: "17",
    name: "Teal Zari Border Straight Kurti",
    slug: "teal-zari-border-straight-kurti",
    sku: "LHR-ZK-017",
    category: "kurtis",
    fabric: "Fine Crepe",
    color: "Blue",
    colorHex: "#0369A1",
    sizes: ["S", "M", "L", "XL"],
    mrp: 1999,
    price: 999,
    images: [
      "https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Daily Wear",
    rating: 4.3,
  },
  {
    _id: "18",
    name: "Plum Velvet Winter Kurta Set",
    slug: "plum-velvet-winter-kurta-set",
    sku: "LHR-WK-018",
    category: "ethnic",
    fabric: "Premium Velvet",
    color: "Purple",
    colorHex: "#5B21B6",
    sizes: ["M", "L", "XL", "XXL"],
    mrp: 5999,
    price: 3499,
    images: [
      "https://images.unsplash.com/photo-1612459284970-e8f027596582?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Warm Velvet",
    rating: 4.9,
  },
  {
    _id: "19",
    name: "Lilac Meadow Flared Anarkali Set",
    slug: "lilac-meadow-flared-anarkali-set",
    sku: "LHR-LM-019",
    category: "suits",
    fabric: "Soft Georgette",
    color: "Purple",
    colorHex: "#A78BFA",
    sizes: ["S", "M", "L"],
    mrp: 4699,
    price: 2199,
    images: [
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Popular",
    rating: 4.5,
  },
  {
    _id: "20",
    name: "Lemon Zest Block Printed Set",
    slug: "lemon-zest-block-printed-set",
    sku: "LHR-LZ-020",
    category: "ethnic",
    fabric: "100% Khadi Cotton",
    color: "Yellow",
    colorHex: "#F59E0B",
    sizes: ["S", "M", "L", "XL"],
    mrp: 2799,
    price: 1299,
    images: [
      "https://images.unsplash.com/photo-1614088685112-0a7db047d4e6?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Summer Special",
    rating: 4.6,
  },
  {
    _id: "21",
    name: "Ruby Red Handcrafted Gown",
    slug: "ruby-red-handcrafted-gown",
    sku: "LHR-RG-021",
    category: "suits",
    fabric: "Faux Georgette",
    color: "Red",
    colorHex: "#BE123C",
    sizes: ["S", "M", "L", "XL"],
    mrp: 4999,
    price: 2499,
    images: [
      "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Best Seller",
    rating: 4.8,
  },
  {
    _id: "22",
    name: "Ocean Breeze Cotton Salwar Suit",
    slug: "ocean-breeze-cotton-salwar-suit",
    sku: "LHR-OB-022",
    category: "suits",
    fabric: "Lawn Cotton",
    color: "Blue",
    colorHex: "#2563EB",
    sizes: ["S", "M", "L", "XL"],
    mrp: 2999,
    price: 1399,
    images: [
      "https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Best Value",
    rating: 4.4,
  },
  {
    _id: "23",
    name: "Pearl White Silk Kurti Palazzo Set",
    slug: "pearl-white-silk-kurti-palazzo-set",
    sku: "LHR-PW-023",
    category: "kurtis",
    fabric: "Tussar Silk",
    color: "Ivory",
    colorHex: "#FAFAFA",
    sizes: ["S", "M", "L", "XL"],
    mrp: 3499,
    price: 1799,
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Premium",
    rating: 4.7,
  },
  {
    _id: "24",
    name: "Fuchsia Pink Designer Kurta Set",
    slug: "fuchsia-pink-designer-kurta-set",
    sku: "LHR-FP-024",
    category: "ethnic",
    fabric: "Viscose Chinnon",
    color: "Pink",
    colorHex: "#DB2777",
    sizes: ["S", "M", "L", "XL", "XXL"],
    mrp: 4599,
    price: 2199,
    images: [
      "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=600&auto=format&fit=crop",
    ],
    tag: "Exclusive",
    rating: 4.8,
  },
];

const ShopListings = () => {
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

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await API.get("/products");
        if (res.data && res.data.success) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error(
          "Failed fetching database products, falling back to mock catalog:",
          err,
        );
        setProducts(MOCK_CATALOG);
      } finally {
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
  }, [searchParams]);

  // Simulate loading state transitions on filters
  useEffect(() => {
    setIsLoading(true);
    const delay = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(delay);
  }, [selectedCategory, selectedColor, selectedSize, priceRange, sortBy]);

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
      return catMatch && colorMatch && sizeMatch && priceMatch;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return b._id - a._id; // default latest
    });

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedColor("all");
    setSelectedSize("all");
    setPriceRange(5000);
    setSearchParams({});
  };

  const categoriesList = ["all", "kurtis", "suits", "ethnic"];
  const colorsList = ["all", "Gold", "Red", "Ivory", "Green", "Blue", "Pink"];
  const sizesList = ["all", "S", "M", "L", "XL"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-medium text-textPrimary uppercase tracking-wider">
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
        <aside className="hidden md:block w-64 flex-shrink-0 bg-primary border border-borderLight p-6 rounded-sm space-y-8 sticky top-28">
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
                  className={`text-left text-xs capitalize ${
                    selectedCategory === cat
                      ? "text-accent-gold font-bold"
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
                  className={`px-3 py-1.5 rounded-full border text-[10px] ${
                    selectedColor === color
                      ? "border-accent-gold bg-accent-gold/10 text-accent-gold font-bold"
                      : "border-gray-200 text-textPrimary hover:border-textSecondary"
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
                  className={`py-2 text-[10px] text-center border font-semibold ${
                    selectedSize === size
                      ? "border-secondary bg-secondary text-primary font-bold"
                      : "border-gray-200 text-textPrimary hover:border-textSecondary"
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
          {isLoading ? (
            // Load skeletons in loader state
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="group relative bg-transparent flex flex-col h-full transition-all duration-300"
                >
                  {/* Badge */}
                  {product.tag && (
                    <span className="absolute top-10 left-3 z-10 bg-secondary text-accent-gold font-bold text-[9px] uppercase tracking-wider px-2 py-1 shadow-sm rounded-sm">
                      {product.tag}
                    </span>
                  )}
                  {/* Heart wishlist toggle */}
                  <button className="absolute top-10 right-3 z-10 bg-primary/70 hover:bg-primary text-textPrimary hover:text-danger p-2 rounded-full shadow-sm transition-all">
                    <RiHeartLine size={16} />
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
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-[1.15] transform-gpu transition-transform duration-[800ms] ease-out origin-top"
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

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-textSecondary line-through font-medium">
                        ₹{product.mrp}
                      </span>
                      <span className="text-secondary font-bold">
                        ₹{product.price}
                      </span>
                    </div>

                    <div className="pt-0.5">
                      <span className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-sm font-bold inline-block">
                        {Math.round(
                          ((product.mrp - product.price) / product.mrp) * 100,
                        )}
                        % OFF
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty view layout
            <div className="text-center py-24 bg-white border border-gray-100 rounded-sm">
              <h3 className="text-lg font-display text-textPrimary font-semibold">
                No Ensembles Match Your Search
              </h3>
              <p className="text-xs text-textSecondary mt-2">
                Try adjusting your filters, color pallete, or set a larger
                pricing range.
              </p>
              <Button
                onClick={resetFilters}
                variant="primary"
                size="sm"
                className="mt-6"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FULL FILTER SLIDE OVERLAY */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-100 overflow-hidden flex md:hidden">
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

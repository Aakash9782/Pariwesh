import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  RiShoppingBagLine,
  RiHeartLine,
  RiHeartFill,
  RiRulerLine,
  RiShieldCheckLine,
  RiRefreshLine,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import { addToCart } from "../../redux/slices/cartSlice.js";
import { toggleWishlistProduct } from "../../redux/slices/wishlistSlice.js";
import API from "../../services/api.js";

// Reusable mock database matching ShopListings
const PRODUCT_CATALOG = [
  {
    _id: "1",
    name: "Elysian Gold Chanderi Suit",
    slug: "elysian-gold-chanderi-suit",
    sku: "LHR-CH-001",
    category: "suits",
    fabric: "Chanderi Silk",
    washCare: "Dry Clean Only",
    color: "Gold",
    colorHex: "#D4AF37",
    sizes: ["S", "M", "L", "XL"],
    mrp: 3499,
    price: 2499,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=650&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?q=80&w=650&auto=format&fit=crop",
    ],
    tag: "Best Seller",
    rating: 4.8,
    reviewsCount: 24,
    description:
      "Bespoke elegance crafted from pure Banarasi Chanderi silk yarn. Features double zari checks, floral embroidery lines, soft mulmul linings, and matching raw-silk straight trousers. Perfect for seasonal weddings and luxury festive environments.",
  },
  {
    _id: "2",
    name: "Scarlet Floral Rayon Kurti",
    slug: "scarlet-floral-rayon-kurti",
    sku: "LHR-RY-002",
    category: "kurtis",
    fabric: "Premium Rayon",
    washCare: "Gentle Machine Wash",
    color: "Red",
    colorHex: "#C62828",
    sizes: ["M", "L", "XL"],
    mrp: 1799,
    price: 1199,
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=650&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1561365264-412c31e6f145?q=80&w=650&auto=format&fit=crop",
    ],
    tag: "New Arrival",
    rating: 4.5,
    reviewsCount: 12,
    description:
      "Delightfully casual and soft. Adorned with beautiful hand-blocked floral patterns, double-stitch seams, and flared hems. Woven from high-tenacity Viscose Rayon to promise breathability and all-day comfort.",
  },
  {
    _id: "3",
    name: "Ivory Zari Premium Anarkali Set",
    slug: "ivory-zari-premium-anarkali-set",
    sku: "LHR-AK-003",
    category: "ethnic",
    fabric: "Georgette Silk",
    washCare: "Dry Clean Only",
    color: "Ivory",
    colorHex: "#F5F5F0",
    sizes: ["S", "M", "L"],
    mrp: 5999,
    price: 3999,
    images: [
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=650&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=650&auto=format&fit=crop",
    ],
    tag: "Exclusive",
    rating: 4.9,
    reviewsCount: 38,
    description:
      "An elegant floor-length Ivory Anarkali gown detailed with luxurious zari threads, a heavy border, and a matching sheer organza dupatta. Crafted directly by local weavers, ensuring high precision craftsmanship.",
  },
];

const ProductDetails = () => {
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

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await API.get(`/products/${slug}`);
        if (res.data && res.data.success) {
          const data = res.data.data;
          setProduct(data);
          setActiveImage(data.images?.[0] || "");
          setSelectedSize(data.sizes?.[0] || "M");
        } else {
          throw new Error("No data found");
        }
      } catch (err) {
        console.error(
          "Failed fetching database details, falling back to mock catalog:",
          err,
        );
        const foundProduct =
          PRODUCT_CATALOG.find((p) => p.slug === slug) || PRODUCT_CATALOG[0];
        setProduct(foundProduct);
        if (foundProduct) {
          setActiveImage(foundProduct.images[0]);
          setSelectedSize(foundProduct.sizes[0]);
        }
      }
    };
    fetchProductDetails();
  }, [slug]);

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-textSecondary">
          Loading ensemble details...
        </p>
      </div>
    );
  }

  const isWishlisted = wishlist.some((p) => p._id === product._id);

  const handleAddToCart = () => {
    setLoading(true);
    setTimeout(() => {
      dispatch(
        addToCart({
          product,
          quantity,
          variant: { color: product.color, size: selectedSize },
        }),
      );
      setLoading(false);
      setAddedPopup(true);
      setTimeout(() => setAddedPopup(false), 3000);
    }, 500);
  };

  const handleWishlistToggle = () => {
    dispatch(toggleWishlistProduct(product));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Dynamic alert indicator */}
      {addedPopup && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-secondary text-primary px-6 py-3 rounded shadow-2xl text-xs uppercase tracking-widest font-semibold flex items-center space-x-3 border border-accent-gold">
          <span>✨ Product Successfully Added To Bag!</span>
          <Link to="/cart" className="text-accent-gold underline">
            View Bag
          </Link>
        </div>
      )}

      {/* Main Grid split: Images vs Info panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* LEFT COLUMN: GALLERIES CONTAINER */}
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-bgLight overflow-hidden border border-borderLight rounded-sm">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>
          {/* Thumbnails grid */}
          <div className="grid grid-cols-5 gap-3">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`aspect-[4/5] border rounded-sm overflow-hidden ${
                  activeImage === img
                    ? "border-accent-gold ring-1 ring-accent-gold"
                    : "border-borderLight"
                }`}
              >
                <img
                  src={img}
                  alt="detail thumbnail"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: ATTRIBUTE CONTROLS */}
        <div className="space-y-8 bg-primary p-8 border border-borderLight rounded-sm">
          <div className="space-y-3">
            {product.tag && (
              <span className="bg-secondary text-accent-gold text-[9px] font-bold uppercase tracking-wider px-2.5 py-1">
                {product.tag}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-display font-medium text-textPrimary leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-textSecondary">
              SKU: <span className="font-semibold">{product.sku}</span> |
              Rating:{" "}
              <span className="text-accent-gold font-bold">
                ★ {product.rating}
              </span>{" "}
              ({product.reviewsCount} verified reviews)
            </p>
          </div>

          {/* PRICING GRID */}
          <div className="flex items-center space-x-4 border-y border-borderLight py-4">
            <span className="text-2xl font-bold text-textPrimary">
              ₹{product.price}
            </span>
            <span className="text-sm text-textSecondary line-through font-medium">
              MRP ₹{product.mrp}
            </span>
            <span className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-sm font-bold inline-block">
              {Math.round(((product.mrp - product.price) / product.mrp) * 100)}%
              OFF
            </span>
          </div>

          <p className="text-xs text-textSecondary leading-relaxed">
            {product.description}
          </p>

          {/* ATTRIBUTES LISTS (Fabric, care) */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="border border-borderLight p-3 bg-bgLight">
              <span className="block font-bold text-textSecondary text-[9px] uppercase tracking-wider">
                Fabric Type
              </span>
              <span className="font-semibold text-textPrimary">
                {product.fabric}
              </span>
            </div>
            <div className="border border-borderLight p-3 bg-bgLight">
              <span className="block font-bold text-textSecondary text-[9px] uppercase tracking-wider">
                Wash Care
              </span>
              <span className="font-semibold text-textPrimary">
                {product.washCare}
              </span>
            </div>
          </div>

          {/* FORM: SIZES & ACTION CONTROLLERS */}
          <div className="space-y-6">
            {/* Size pick */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-textSecondary">
                <span>Select Size</span>
                <span className="text-accent-gold flex items-center space-x-1 cursor-pointer hover:underline">
                  <RiRulerLine />
                  <span>Size Chart</span>
                </span>
              </div>
              <div className="flex space-x-3">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`w-11 h-11 border text-xs font-bold transition-all ${
                      selectedSize === sz
                        ? "border-secondary bg-secondary text-primary"
                        : "border-borderLight text-textPrimary hover:border-textSecondary"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty Selector */}
            <div className="space-y-2">
              <span className="block text-[10px] uppercase font-bold tracking-widest text-textSecondary">
                Quantity
              </span>
              <div className="inline-flex border border-borderLight rounded-sm bg-bgLight">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-borderLight/30 text-sm font-bold"
                >
                  -
                </button>
                <span className="px-5 py-2 text-xs font-bold leading-normal">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-borderLight/30 text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Submitions */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleAddToCart}
                loading={loading}
                variant="primary"
                size="lg"
                className="flex-grow space-x-2"
              >
                <RiShoppingBagLine size={16} />
                <span>Add to Shopping Bag</span>
              </Button>

              <button
                onClick={handleWishlistToggle}
                className={`px-5 py-4.5 rounded-sm border flex items-center justify-center transition-colors ${
                  isWishlisted
                    ? "border-danger bg-red-55/10 text-danger"
                    : "border-borderLight hover:border-secondary text-textPrimary"
                }`}
              >
                {isWishlisted ? (
                  <RiHeartFill size={18} />
                ) : (
                  <RiHeartLine size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="border-t border-borderLight pt-6 grid grid-cols-2 gap-4 text-[10px] text-textSecondary font-semibold">
            <span className="flex items-center space-x-2">
              <RiShieldCheckLine className="text-accent-gold" size={16} />
              <span>100% Cotton Handwoven Certified</span>
            </span>
            <span className="flex items-center space-x-2">
              <RiRefreshLine className="text-accent-gold" size={16} />
              <span>7-Day Return / Refund Policy Approved</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

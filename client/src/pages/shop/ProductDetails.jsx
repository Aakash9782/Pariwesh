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
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import { addToCart } from "../../redux/slices/cartSlice.js";
import { toggleWishlistProduct } from "../../redux/slices/wishlistSlice.js";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import {
  syncCartNow,
  syncWishlistNow,
} from "../../services/hydrateCommerce.js";

const ProductDetails = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const alert = (msg) => {
    showAlert(msg);
  };
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

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setFetching(true);
        const res = await API.get(`/products/${slug}`);
        if (res.data && res.data.success) {
          const data = res.data.data;
          setProduct(data);
          setActiveImage(data.images?.[0] || "");
          setSelectedSize(data.sizes?.[0] || "M");
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

  if (fetching) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <Skeleton className="aspect-[4/5] w-full" />
            <div className="grid grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] w-full" />
              ))}
            </div>
          </div>
          <div className="space-y-8 bg-primary p-8 border border-borderLight rounded-sm">
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-display text-textPrimary">
          Product not found
        </h2>
        <p className="text-sm text-textSecondary">
          This product is unavailable or the link is invalid.
        </p>
        <Link
          to="/shop"
          className="inline-block text-sm text-accent-gold underline"
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
                            ? "border-secondary bg-secondary text-primary"
                            : isOutOfStock
                              ? "border-dashed border-red-300 text-red-500 bg-red-50/50 hover:border-red-400"
                              : "border-borderLight text-textPrimary hover:border-textSecondary"
                        }`}
                      >
                        {sz}
                        {isOutOfStock && (
                          <span
                            className="absolute -top-1 -right-1 bg-red-600 w-2.5 h-2.5 rounded-full ring-2 ring-white"
                            title="Out of Stock"
                          ></span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {product.sizesStock &&
                  Number(product.sizesStock[selectedSize]) <= 0 && (
                    <p className="text-[11px] text-red-600 font-bold mt-1 text-left animate-pulse">
                      ⚠️ Size {selectedSize} is currently out of stock. Ordering
                      it will alert the admin to check inventory.
                    </p>
                  )}
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

            {/* Submissions */}
            <div className="flex flex-col gap-3.5 pt-4">
              <Button
                onClick={handleAddToCart}
                loading={loading}
                variant="outline"
                size="lg"
                className="w-full rounded-full py-3 text-xs flex items-center justify-center space-x-2 transition-all"
              >
                <RiShoppingBagLine size={16} />
                <span>Add to Bag</span>
              </Button>

              <div className="flex items-center gap-3 w-full">
                <Button
                  onClick={handleBuyNow}
                  variant="gold"
                  size="lg"
                  className="flex-grow font-bold rounded-full py-3 text-xs transition-all"
                >
                  <span>Buy It Now</span>
                </Button>

                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`w-12 h-12 shrink-0 rounded-full border flex items-center justify-center transition-colors active:scale-95 ${
                    isWishlisted
                      ? "border-danger bg-danger/10 text-danger"
                      : "border-borderLight hover:border-secondary text-textPrimary hover:bg-bgLight"
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

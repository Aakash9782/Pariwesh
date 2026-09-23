import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  RiHeartLine,
  RiShoppingBagLine,
  RiDeleteBin7Line,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import ProductImageSlider from "../../components/common/ProductImageSlider.jsx";
import { addToCart } from "../../redux/slices/cartSlice.js";
import { toggleWishlistProduct } from "../../redux/slices/wishlistSlice.js";
import {
  syncCartNow,
  syncWishlistNow,
} from "../../services/hydrateCommerce.js";
import { useAlert } from "../../contexts/AlertContext.jsx";

const Wishlist = () => {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const wishlistedProducts = useSelector((state) => state.wishlist.products);
  const [selectedSizes, setSelectedSizes] = useState({});

  const handleRemove = (product) => {
    dispatch(toggleWishlistProduct(product));
    syncWishlistNow();
    showAlert("Item removed from your wishlist", "Wishlist");
  };

  const handleAddtoCart = (product) => {
    const chosenSize =
      selectedSizes[product._id] ||
      (product.sizes && product.sizes.length > 0 ? product.sizes[0] : "M");

    dispatch(
      addToCart({
        product,
        quantity: 1,
        variant: { color: product.color || "Gold", size: chosenSize },
      }),
    );
    dispatch(toggleWishlistProduct(product));
    syncCartNow();
    syncWishlistNow();
    showAlert(`"${product.name}" (Size: ${chosenSize}) moved to bag!`, "Added to Bag");
  };

  if (wishlistedProducts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 bg-neutral-100 text-textSecondary rounded-full flex items-center justify-center mx-auto">
          <RiHeartLine size={32} />
        </div>
        <h2 className="text-3xl font-display font-medium text-textPrimary uppercase tracking-wider">
          Your wishlist is empty
        </h2>
        <p className="text-xs text-textSecondary">
          Bookmark items you like to view them here at any time.
        </p>
        <Link to="/shop">
          <Button variant="primary" size="md">
            Explore Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium uppercase tracking-wider text-textPrimary">
            My Wishlist Ensembles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {wishlistedProducts.length} curated {wishlistedProducts.length === 1 ? "piece" : "pieces"} saved
          </p>
        </div>
        <Link
          to="/shop"
          className="text-xs font-bold text-[#8a1c14] hover:underline uppercase tracking-wider"
        >
          Continue Shopping →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 animate-fade-in">
        {wishlistedProducts.map((product) => {
          const availableSizes =
            product.sizes && product.sizes.length > 0
              ? product.sizes
              : ["M", "L", "XL", "XXL"];
          const currentSize = selectedSizes[product._id] || availableSizes[0];

          return (
            <div
              key={product._id}
              className="group relative bg-white/80 hover:bg-white backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-slate-200/70 hover:border-[#c5a880]/50 shadow-xs hover:shadow-lg flex flex-col h-full transition-all duration-300"
            >
              {/* Quick remove from wishlist button - Clean top-right corner placement */}
              <button
                onClick={() => handleRemove(product)}
                className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 hover:bg-red-50 text-slate-500 hover:text-red-600 backdrop-blur-md shadow-xs border border-slate-200/80 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Remove from wishlist"
                aria-label="Remove"
              >
                <RiDeleteBin7Line size={15} />
              </button>

              {/* Thumbnail */}
              <div
                className="aspect-[3/4] sm:aspect-[4/5] bg-bgLight overflow-hidden relative rounded-t-xl"
                style={{ clipPath: "url(#mehrab-clip)" }}
              >
                <Link
                  to={`/product/${product.slug}`}
                  className="block w-full h-full"
                >
                  <ProductImageSlider
                    images={product.images}
                    alt={product.name}
                  />

                  {/* Arch outline SVG overlay */}
                  <svg
                    viewBox="0 0 100 125"
                    className="absolute inset-0 w-full h-full pointer-events-none fill-none stroke-accent-gold stroke-[2px]"
                    preserveAspectRatio="none"
                  >
                    <path d="M 0,125 L 0,7.5 C 0,6 8,5.5 12,5.1 C 12,3.8 22,3.2 28,2.5 C 28,1.7 38,1.2 44,0.6 C 47,0.2 49,0 50,0 C 51,0 53,0.2 56,0.6 C 62,1.2 72,1.7 72,2.5 C 78,3.2 88,3.8 88,5.1 C 92,5.5 100,6 100,7.5 L 100,125" />
                  </svg>
                </Link>
              </div>

              {/* Product stats */}
              <div className="pt-3 pb-1 px-1 flex flex-col flex-grow justify-between space-y-2.5 text-left bg-transparent">
                <div className="space-y-1">
                  <span className="text-[9px] text-[#c5a880] uppercase tracking-widest font-extrabold">
                    {product.category || "Ethnic Ensemble"}
                  </span>
                  <h3 className="text-xs font-semibold text-textPrimary leading-snug group-hover:text-[#8a1c14] transition-colors line-clamp-2">
                    <Link to={`/product/${product.slug}`}>{product.name}</Link>
                  </h3>
                  <div className="flex items-baseline gap-x-2 text-xs pt-1 font-sans">
                    <span className="text-slate-900 font-bold font-sans">
                      ₹{product.price}
                    </span>
                    {product.mrp > product.price && (
                      <>
                        <span className="text-slate-400 line-through text-[11px] font-sans">
                          ₹{product.mrp}
                        </span>
                        <span className="text-[9px] font-extrabold text-[#8a1c14] bg-rose-50 border border-rose-200/60 px-1 rounded uppercase tracking-wider font-sans">
                          {Math.round(
                            ((product.mrp - product.price) / product.mrp) * 100,
                          )}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* Size Selector Strip */}
                  <div className="pt-1.5 space-y-1">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Select Size:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                      {availableSizes.map((sz) => {
                        const isSelected = currentSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() =>
                              setSelectedSizes((prev) => ({
                                ...prev,
                                [product._id]: sz,
                              }))
                            }
                            className={`px-2 py-0.5 text-[9.5px] font-bold rounded cursor-pointer transition-all ${
                              isSelected
                                ? "bg-[#8a1c14] text-white shadow-2xs scale-105"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Move to bag CTA */}
                <button
                  type="button"
                  onClick={() => handleAddtoCart(product)}
                  className="w-full bg-[#8a1c14] hover:bg-[#70150e] text-white font-extrabold text-[11px] uppercase tracking-wider py-2.5 rounded-xl shadow-xs hover:shadow-md active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer mt-1"
                >
                  <RiShoppingBagLine size={14} />
                  <span>Move to bag ({currentSize})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;

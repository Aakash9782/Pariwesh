import React from "react";
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

const Wishlist = () => {
  const dispatch = useDispatch();
  const wishlistedProducts = useSelector((state) => state.wishlist.products);

  const handleRemove = (product) => {
    dispatch(toggleWishlistProduct(product));
    syncWishlistNow();
  };

  const handleAddtoCart = (product) => {
    dispatch(
      addToCart({
        product,
        quantity: 1,
        variant: { color: product.color || "Gold", size: "M" },
      }),
    );
    dispatch(toggleWishlistProduct(product));
    syncCartNow();
    syncWishlistNow();
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
      <h1 className="text-3xl font-serif font-medium uppercase tracking-wider text-textPrimary mb-10">
        My Wishlist Ensembles
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 animate-fade-in">
        {wishlistedProducts.map((product) => (
          <div
            key={product._id}
            className="group relative bg-transparent flex flex-col h-full transition-all duration-300"
          >
            {/* Quick remove from wishlist button */}
            <button
              onClick={() => handleRemove(product)}
              className="absolute top-10 right-3 z-10 bg-primary/80 hover:bg-danger hover:text-white text-textPrimary p-2 rounded-full shadow-sm hover:scale-110 transition-all"
              title="Remove from wishlist"
            >
              <RiDeleteBin7Line size={16} />
            </button>

            {/* Thumbnail */}
            <div
              className="aspect-[4/5] bg-bgLight overflow-hidden relative"
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
            <div className="py-4 flex flex-col flex-grow justify-between space-y-2 text-left bg-transparent">
              <div className="space-y-1">
                <span className="text-[9px] text-textSecondary uppercase tracking-widest font-bold">
                  {product.category}
                </span>
                <h3 className="text-xs font-semibold text-textPrimary leading-snug group-hover:text-accent-gold transition-colors line-clamp-2">
                  <Link to={`/product/${product.slug}`}>{product.name}</Link>
                </h3>
                <div className="flex items-center gap-x-2 text-xs pt-1">
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
                          ((product.mrp - product.price) / product.mrp) * 100,
                        )}
                        % OFF)
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Move to bag CTA */}
              <Button
                onClick={() => handleAddtoCart(product)}
                variant="gold"
                size="sm"
                className="w-full space-x-1.5"
              >
                <RiShoppingBagLine size={12} />
                <span>Move to bag</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;

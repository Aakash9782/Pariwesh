import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  RiHeartLine,
  RiShoppingBagLine,
  RiDeleteBin7Line,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import { addToCart } from "../../redux/slices/cartSlice.js";
import { toggleWishlistProduct } from "../../redux/slices/wishlistSlice.js";

const Wishlist = () => {
  const dispatch = useDispatch();
  const wishlistedProducts = useSelector((state) => state.wishlist.products);

  const handleRemove = (product) => {
    dispatch(toggleWishlistProduct(product));
  };

  const handleAddtoCart = (product) => {
    dispatch(
      addToCart({
        product,
        quantity: 1,
        variant: { color: product.color || "Gold", size: "M" }, // default sizing M
      }),
    );
    // Remove from wishlist after moves to cart
    dispatch(toggleWishlistProduct(product));
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
      <h1 className="text-3xl font-display font-medium uppercase tracking-wider text-textPrimary mb-10">
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
              className="absolute top-10 right-3 z-10 bg-primary/80 hover:bg-danger hover:text-white text-textPrimary p-2 rounded-full shadow-sm hover:scale-108 transition-all"
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
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-[1.15] transform-gpu transition-transform duration-[800ms] ease-out origin-top"
                />

                {/* Arch outline SVG overlay */}
                <svg
                  viewBox="0 0 100 125"
                  className="absolute inset-0 w-full h-full pointer-events-none fill-none stroke-accent-gold stroke-[2px]"
                  preserveAspectRatio="none"
                >
                  <path d="M 0,125 L 0,43.75 C 0,35 8,32.5 12,30 C 12,22.5 22,18.75 28,15 C 28,10 38,7.5 44,3.75 C 47,1.25 49,0 50,0 C 51,0 53,1.25 56,3.75 C 62,7.5 72,10 72,15 C 78,18.75 88,22.5 88,30 C 92,32.5 100,35 100,43.75 L 100,125" />
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
                <div className="flex items-center space-x-2 text-xs pt-1">
                  <span className="text-textSecondary line-through font-medium">
                    ₹{product.mrp}
                  </span>
                  <span className="text-secondary font-bold">
                    ₹{product.price}
                  </span>
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

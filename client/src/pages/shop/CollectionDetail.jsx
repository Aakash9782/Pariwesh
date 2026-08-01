import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RiHeartLine, RiHeartFill, RiShoppingBagLine } from "react-icons/ri";
import API from "../../services/api.js";
import { ProductSkeleton } from "../../components/common/Skeleton.jsx";
import { toggleWishlistProduct } from "../../redux/slices/wishlistSlice.js";
import { syncWishlistNow } from "../../services/hydrateCommerce.js";

const CollectionDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const wishlist = useSelector((s) => s.wishlist.products);
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get(`/collections/${slug}`);
        if (res.data?.success) {
          setCollection(res.data.data);
        } else {
          setError("Collection not found.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load collection.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const handleWishlist = (product) => {
    dispatch(toggleWishlistProduct(product));
    syncWishlistNow();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-display text-textPrimary">
          {error || "Collection not found"}
        </h2>
        <Link to="/collections" className="text-sm text-accent-gold underline">
          Back to collections
        </Link>
      </div>
    );
  }

  const products = collection.products || [];

  return (
    <div className="pb-20">
      <section className="relative min-h-[36vh] flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${collection.bannerUrl || products[0]?.images?.[0] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600&auto=format&fit=crop"})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15" />
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 pt-24">
          <Link
            to="/collections"
            className="text-[10px] uppercase tracking-[0.25em] text-accent-gold"
          >
            ← All collections
          </Link>
          <h1 className="mt-3 text-3xl md:text-4xl font-display text-white uppercase tracking-wide">
            {collection.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            {collection.description}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {products.length === 0 ? (
          <p className="text-center text-sm text-textSecondary py-16">
            No products in this collection yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => {
              const wished = wishlist.some((p) => p._id === product._id);
              return (
                <div key={product._id} className="group space-y-3">
                  <Link
                    to={`/product/${product.slug}`}
                    className="block relative aspect-[3/4] overflow-hidden bg-bgLight border border-borderLight"
                  >
                    <img
                      src={product.images?.[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {product.tag && (
                      <span className="absolute top-2 left-2 text-[9px] uppercase tracking-wider bg-secondary text-primary px-2 py-1">
                        {product.tag}
                      </span>
                    )}
                  </Link>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/product/${product.slug}`}
                        className="block text-xs font-medium text-textPrimary truncate hover:text-accent-gold"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-accent-gold mt-1">
                        ₹{product.price}
                        {product.mrp > product.price && (
                          <span className="ml-2 text-textSecondary line-through">
                            ₹{product.mrp}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleWishlist(product)}
                      className="text-textSecondary hover:text-accent-gold shrink-0"
                      aria-label="Wishlist"
                    >
                      {wished ? (
                        <RiHeartFill className="text-accent-gold" />
                      ) : (
                        <RiHeartLine />
                      )}
                    </button>
                  </div>
                  <Link
                    to={`/product/${product.slug}`}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-textSecondary hover:text-accent-gold"
                  >
                    <RiShoppingBagLine size={12} /> View
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetail;

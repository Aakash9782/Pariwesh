import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RiHeartLine, RiHeartFill, RiShoppingBagLine } from "react-icons/ri";
import API from "../../services/api.js";
import { ProductSkeleton } from "../../components/common/Skeleton.jsx";
import { toggleWishlistProduct } from "../../redux/slices/wishlistSlice.js";
import { syncWishlistNow } from "../../services/hydrateCommerce.js";
import SEO from "../../components/common/SEO.jsx";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";

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

  const breadcrumbSchema = collection
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://pariwesh.in",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Collections",
            item: "https://pariwesh.in/collections",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: collection.name,
            item:
              typeof window !== "undefined"
                ? `https://pariwesh.in${window.location.pathname}`
                : "",
          },
        ],
      }
    : null;

  return (
    <div className="pb-20">
      <SEO
        title={`${collection.name} Edit - Exclusive Traditional Wear`}
        description={
          collection.description ||
          `Browse the exclusive ${collection.name} edit at PARIWESH.`
        }
        keywords={`pariwesh, ${collection.name}, designer collection, luxury ethnic`}
        structuredData={breadcrumbSchema}
      />
      {/* Editorial Luxury Header: Responsive Dual Layout */}
      <section className="relative overflow-hidden bg-[#0d0c0b] border-b border-[#c5a880]/20">
        {/* Soft atmospheric ambient glow */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#c5a880]/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-[#c5a880]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Mobile Lookbook Header (< lg): Senior UI Atelier Design */}
        <div className="relative min-h-[46vh] flex items-end lg:hidden overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-[center_top] transform scale-105 transition-transform duration-1000"
            style={{
              backgroundImage: `url(${optimizeCloudinaryUrl(
                collection.bannerUrl || products[0]?.images?.[0] || "/hero.png",
                900,
              )})`,
            }}
          />
          {/* Multi-layered luxury gradient for seamless readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0b] via-[#0d0c0b]/80 via-black/45 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

          <div className="relative z-10 w-full px-5 pb-8 pt-20 space-y-2.5">
            {/* Navigation pill + Piece count badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/collections"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#c5a880]/30 text-[#c5a880] text-[10px] tracking-wider uppercase font-medium active:scale-95 transition"
              >
                <span>←</span>
                <span>All Collections</span>
              </Link>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-[10px] tracking-widest uppercase font-medium">
                {products.length} Designs
              </span>
            </div>

            {/* Editorial Heading */}
            <h1 className="text-3xl sm:text-4xl font-display text-white tracking-tight leading-[1.15]">
              {collection.name} <span className="font-serif italic font-normal text-[#c5a880]">Edit</span>
            </h1>

            {/* Brand Subtitle */}
            <p className="text-xs text-white/80 font-light leading-relaxed max-w-sm">
              {collection.description || "Discover handcrafted pure fabrics, intricate zari work, and timeless festive ensembles."}
            </p>

            {/* Mobile Micro Trust Indicators */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-white/85 whitespace-nowrap">
                <span className="text-[#c5a880]">✦</span>
                <span className="text-white/70 uppercase tracking-wider text-[9px]">Pure Handloom</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-white/85 whitespace-nowrap">
                <span className="text-[#c5a880]">✈</span>
                <span className="text-white/70 uppercase tracking-wider text-[9px]">Pan-India Dispatch</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-white/85 whitespace-nowrap">
                <span className="text-[#c5a880]">★</span>
                <span className="text-white/70 uppercase tracking-wider text-[9px]">Assured Quality</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Luxury Editorial Split View (lg+) */}
        <div className="hidden lg:block max-w-7xl mx-auto px-8 py-16">
          <div className="grid grid-cols-12 gap-12 items-center">
            {/* Left Content Column (7 cols) */}
            <div className="col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <Link
                  to="/collections"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/15 text-white/80 hover:text-[#c5a880] hover:border-[#c5a880]/40 text-[11px] tracking-wider uppercase transition font-medium"
                >
                  <span>←</span>
                  <span>All Collections</span>
                </Link>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c5a880]/10 border border-[#c5a880]/30 text-[#c5a880] text-[11px] tracking-[0.25em] uppercase font-medium">
                  <span>✦</span>
                  <span>Pariwesh Luxury Atelier</span>
                </div>
              </div>

              <h1 className="text-5xl xl:text-6xl font-display text-white tracking-tight leading-[1.15]">
                {collection.name} <span className="font-serif italic font-normal text-[#c5a880]">Edit</span>
              </h1>
              <p className="text-white/70 text-base leading-relaxed max-w-xl font-light">
                {collection.description || "Immerse yourself in artisanal edits handcrafted for festive splendor and contemporary grace."}
              </p>

              {/* Luxury Atelier Pillars */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/10 max-w-lg">
                <div className="space-y-1">
                  <p className="text-2xl font-display text-[#c5a880]">
                    {String(products.length).padStart(2, "0")}
                  </p>
                  <p className="text-[11px] text-white/60 tracking-wider uppercase font-medium">Curated Pieces</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-display text-[#c5a880]">100%</p>
                  <p className="text-[11px] text-white/60 tracking-wider uppercase font-medium">Pure Handlooms</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-display text-[#c5a880]">Fast</p>
                  <p className="text-[11px] text-white/60 tracking-wider uppercase font-medium">Pan-India Dispatch</p>
                </div>
              </div>
            </div>

            {/* Right Lookbook Column (5 cols) - Uncut Portrait Card */}
            <div className="col-span-5 flex justify-end">
              <div className="relative group max-w-[340px] w-full">
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#c5a880]/40 via-[#c5a880]/10 to-transparent rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition duration-500" />
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[#c5a880]/35 shadow-2xl bg-neutral-900">
                  <img
                    src={optimizeCloudinaryUrl(
                      collection.bannerUrl || products[0]?.images?.[0] || "/hero.png",
                      900,
                    )}
                    alt={collection.name}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 inset-x-4 p-3.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#c5a880] font-semibold">
                        Signature Edit
                      </p>
                      <p className="text-xs font-display text-white truncate max-w-[190px]">
                        {collection.name}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[#c5a880] font-semibold">
                      {products.length} Items
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
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
                      src={optimizeCloudinaryUrl(
                        product.images?.[0] || "/hero.png",
                        600,
                      )}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
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

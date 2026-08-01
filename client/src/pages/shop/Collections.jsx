import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api.js";
import { ProductSkeleton } from "../../components/common/Skeleton.jsx";

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await API.get("/collections");
        if (res.data?.success) {
          setCollections(res.data.data || []);
        } else {
          setError("Could not load collections.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load collections.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="pb-20">
      <section className="relative min-h-[42vh] flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600&auto=format&fit=crop)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 pt-28">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent-gold mb-3">
            Pariwesh Atelier
          </p>
          <h1 className="text-3xl md:text-5xl font-display font-medium text-white tracking-wide uppercase">
            Curated Collections
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/75 leading-relaxed">
            Explore handpicked edits — from everyday kurtis to festive suit sets.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-10">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-sm text-danger py-16">{error}</p>
        )}

        {!loading && !error && collections.length === 0 && (
          <p className="text-center text-sm text-textSecondary py-16">
            No collections yet. Add products in admin to populate edits.
          </p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {collections.map((col) => (
              <Link
                key={col._id || col.slug}
                to={`/collections/${col.slug}`}
                className="group relative block min-h-[320px] overflow-hidden border border-borderLight"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${col.bannerUrl || col.products?.[0]?.images?.[0] || "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=900&auto=format&fit=crop"})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-accent-gold">
                    {col.productCount || 0} pieces
                  </p>
                  <h2 className="text-2xl font-display text-white uppercase tracking-wider">
                    {col.name}
                  </h2>
                  <p className="text-xs text-white/70 line-clamp-2 max-w-md">
                    {col.description}
                  </p>
                  <span className="inline-block pt-2 text-[10px] uppercase tracking-widest text-accent-gold group-hover:underline">
                    View collection →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collections;

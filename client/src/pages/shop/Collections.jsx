import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api.js";
import { ProductSkeleton } from "../../components/common/Skeleton.jsx";
import SEO from "../../components/common/SEO.jsx";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
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

  const heroImage =
    collections.find((c) => c.bannerUrl || c.products?.[0]?.images?.[0])?.bannerUrl ||
    collections[0]?.products?.[0]?.images?.[0] ||
    "/hero.png";

  const filteredCollections =
    selectedCategory === "all"
      ? collections
      : collections.filter((c) => c.slug === selectedCategory);

  return (
    <div className="pb-24">
      <SEO
        title="Curated Collections | Indian Traditional Edits"
        description="Explore luxury curated lookbook edits from PARIWESH. Find designer girls kurtis, embroidered suit sets, and traditional handloom silhouettes."
        keywords="pariwesh collections, lookbook, traditional wear, ethnic suites"
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

        {/* Mobile Lookbook View (< lg): Senior UI Atelier Design */}
        <div className="relative min-h-[48vh] flex items-end lg:hidden overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-[center_top] transform scale-105 transition-transform duration-1000"
            style={{
              backgroundImage: `url(${optimizeCloudinaryUrl(heroImage, 900)})`,
            }}
          />
          {/* Multi-layered luxury gradient for seamless readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0b] via-[#0d0c0b]/80 via-black/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

          <div className="relative z-10 w-full px-5 pb-8 pt-24 space-y-3">
            {/* Atelier Floating Micro-Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#c5a880]/30 text-[#c5a880] text-[10px] tracking-[0.25em] uppercase font-semibold shadow-lg">
              <span>✦</span>
              <span>Pariwesh Luxury Atelier</span>
            </div>

            {/* Editorial Heading */}
            <h1 className="text-3xl sm:text-4xl font-display text-white tracking-tight leading-[1.15]">
              Curated <span className="font-serif italic font-normal text-[#c5a880]">Collections</span>
            </h1>

            {/* Brand Subtitle */}
            <p className="text-xs text-white/80 font-light leading-relaxed max-w-sm">
              Artisanal Indian ensembles handcrafted for festive grandeur and timeless grace.
            </p>

            {/* Mobile Micro Trust Indicators */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-white/85 whitespace-nowrap">
                <span className="text-[#c5a880] font-semibold">{String(collections.length).padStart(2, "0")}</span>
                <span className="text-white/60 uppercase tracking-wider text-[9px]">Edits</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-white/85 whitespace-nowrap">
                <span className="text-[#c5a880]">✦</span>
                <span className="text-white/70 uppercase tracking-wider text-[9px]">Pure Handloom</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-white/85 whitespace-nowrap">
                <span className="text-[#c5a880]">✈</span>
                <span className="text-white/70 uppercase tracking-wider text-[9px]">Pan-India Dispatch</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Luxury Editorial Split View (lg+) */}
        <div className="hidden lg:block max-w-7xl mx-auto px-8 py-16">
          <div className="grid grid-cols-12 gap-12 items-center">
            {/* Left Content Column (7 cols) */}
            <div className="col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c5a880]/10 border border-[#c5a880]/30 text-[#c5a880] text-[11px] tracking-[0.25em] uppercase font-medium">
                <span>✦</span>
                <span>Pariwesh Luxury Atelier</span>
              </div>
              <h1 className="text-5xl xl:text-6xl font-display text-white tracking-tight leading-[1.15]">
                Curated <span className="font-serif italic font-normal text-[#c5a880]">Collections</span>
              </h1>
              <p className="text-white/70 text-base leading-relaxed max-w-xl font-light">
                Immerse yourself in artisanal edits handcrafted for festive splendor and contemporary grace. From royal Chanderi suit ensembles to everyday breathable silhouettes.
              </p>

              {/* Luxury Atelier Pillars */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/10 max-w-lg">
                <div className="space-y-1">
                  <p className="text-2xl font-display text-[#c5a880]">
                    {String(collections.length).padStart(2, "0")}
                  </p>
                  <p className="text-[11px] text-white/60 tracking-wider uppercase font-medium">Signature Edits</p>
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

            {/* Right Lookbook Column (5 cols) - Uncut, Full Portrait Perfection */}
            <div className="col-span-5 flex justify-end">
              <div className="relative group max-w-[340px] w-full">
                {/* Back accent halo glow */}
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#c5a880]/40 via-[#c5a880]/10 to-transparent rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition duration-500" />
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[#c5a880]/35 shadow-2xl bg-neutral-900">
                  <img
                    src={optimizeCloudinaryUrl(heroImage, 900)}
                    alt="Featured Lookbook Edit"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 inset-x-4 p-3.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#c5a880] font-semibold">
                        Signature Look
                      </p>
                      <p className="text-xs font-display text-white truncate max-w-[170px]">
                        {collections[0]?.name || "Festive Edit"}
                      </p>
                    </div>
                    {collections[0]?.slug && (
                      <Link
                        to={`/collections/${collections[0].slug}`}
                        className="text-[10px] uppercase tracking-wider text-[#c5a880] hover:text-white transition font-medium underline"
                      >
                        Explore →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Mobile/Desktop Quick Category Filter Chip Bar */}
      {collections.length > 0 && (
        <div className="sticky top-0 z-20 bg-[#0d0c0b]/95 backdrop-blur-md border-b border-[#c5a880]/15 py-3 px-4 sm:px-6 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs tracking-wider uppercase whitespace-nowrap transition-all duration-300 font-medium ${
                selectedCategory === "all"
                  ? "bg-[#c5a880] text-black shadow-md font-semibold"
                  : "bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-[#c5a880]/40"
              }`}
            >
              All Edits
            </button>
            {collections.map((col) => (
              <button
                key={col._id || col.slug}
                onClick={() => setSelectedCategory(col.slug)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs tracking-wider uppercase whitespace-nowrap transition-all duration-300 font-medium ${
                  selectedCategory === col.slug
                    ? "bg-[#c5a880] text-black shadow-md font-semibold"
                    : "bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-[#c5a880]/40"
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collections Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12 space-y-8">
        {/* Filter status indicator when a specific category is active */}
        {selectedCategory !== "all" && (
          <div className="flex items-center justify-between py-1 border-b border-borderLight text-xs text-textSecondary">
            <span>
              Showing: <strong className="text-textPrimary uppercase font-semibold">{filteredCollections[0]?.name}</strong>
            </span>
            <button
              onClick={() => setSelectedCategory("all")}
              className="text-[#c5a880] hover:underline font-medium"
            >
              View All Edits
            </button>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-sm text-danger py-16">{error}</p>
        )}

        {!loading && !error && filteredCollections.length === 0 && (
          <p className="text-center text-sm text-textSecondary py-16">
            No collections found in this category.
          </p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredCollections.map((col) => (
              <Link
                key={col._id || col.slug}
                to={`/collections/${col.slug}`}
                className="group relative block aspect-[3/4] min-h-[460px] sm:min-h-[480px] md:min-h-[500px] overflow-hidden rounded-2xl border border-[#c5a880]/20 bg-[#161513] shadow-lg hover:shadow-2xl hover:border-[#c5a880]/50 transition-all duration-500 active:scale-[0.98]"
              >
                {/* Image with zoom on hover */}
                <div
                  className="absolute inset-0 bg-cover bg-[center_top] transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${optimizeCloudinaryUrl(
                      col.bannerUrl || col.products?.[0]?.images?.[0] || "/hero.png",
                      900,
                    )})`,
                  }}
                />

                {/* Multi-layered cinematic vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/15" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent opacity-60" />

                {/* Top Floating Badge */}
                <div className="absolute top-4 left-4 pointer-events-none">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[9px] uppercase tracking-[0.2em] text-[#c5a880] font-semibold">
                    ✦ Signature Edit
                  </span>
                </div>

                {/* Bottom Floating Luxury Glass Panel */}
                <div className="absolute inset-x-3 bottom-3 p-4 sm:p-5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 group-hover:border-[#c5a880]/40 transition-colors duration-300 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#c5a880] font-semibold">
                    {col.slug?.replace(/-/g, " ")}
                  </p>
                  <h2 className="text-xl sm:text-2xl font-display text-white uppercase tracking-wide font-medium group-hover:text-[#c5a880] transition-colors line-clamp-1">
                    {col.name}
                  </h2>
                  <p className="text-xs text-white/75 line-clamp-2 font-light leading-relaxed">
                    {col.description || "Discover handcrafted pure fabrics, intricate zari work, and timeless festive ensembles."}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-white/10">
                    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[#c5a880] font-semibold">
                      Explore Collection
                    </span>
                    <span className="w-7 h-7 rounded-full bg-[#c5a880]/15 border border-[#c5a880]/30 flex items-center justify-center text-[#c5a880] group-hover:bg-[#c5a880] group-hover:text-black group-hover:translate-x-0.5 transition-all text-xs">
                      →
                    </span>
                  </div>
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

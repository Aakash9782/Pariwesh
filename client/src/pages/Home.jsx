import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  RiArrowRightLine,
  RiShoppingBagLine,
  RiHeartLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import { motion } from "framer-motion";
import { addToCart } from "../redux/slices/cartSlice.js";
import API from "../services/api.js";

const Home = () => {
  const dispatch = useDispatch();

  // Festive Ad Campaign configuration state
  const [adConfig, setAdConfig] = useState({
    active: false,
    title: "Diwali Festive Dhamaka!",
    subtitle:
      "Up to 50% Off on all hand-knit Zari premium anarkalis. Free delivery apply!",
    code: "FESTIVE50",
    link: "/shop",
    theme: "royal-gold",
  });

  // Dynamic products catalog state
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchPageData = async () => {
      // 1. Fetch Banner Settings from Database
      try {
        const res = await API.get("/settings");
        if (res.data && res.data.success && res.data.data) {
          const settings = res.data.data;
          setAdConfig({
            active:
              settings.festiveAdActive === "true" ||
              settings.festiveAdActive === true,
            title: settings.festiveAdTitle || "Diwali Festive Dhamaka!",
            subtitle:
              settings.festiveAdSubtitle ||
              "Up to 50% Off on all hand-knit Zari premium anarkalis. Free delivery apply!",
            code: settings.festiveAdCode || "FESTIVE50",
            link: settings.festiveAdLink || "/shop",
            theme: settings.festiveAdTheme || "royal-gold",
          });
        } else {
          // Fallback to localStorage if any
          const savedActive =
            localStorage.getItem("festiveAdActive") === "true";
          const savedTitle =
            localStorage.getItem("festiveAdTitle") || "Diwali Festive Dhamaka!";
          const savedSubtitle =
            localStorage.getItem("festiveAdSubtitle") ||
            "Up to 50% Off on all hand-knit Zari premium anarkalis. Free delivery apply!";
          const savedCode =
            localStorage.getItem("festiveAdCode") || "FESTIVE50";
          const savedLink = localStorage.getItem("festiveAdLink") || "/shop";
          const savedTheme =
            localStorage.getItem("festiveAdTheme") || "royal-gold";
          setAdConfig({
            active: savedActive,
            title: savedTitle,
            subtitle: savedSubtitle,
            code: savedCode,
            link: savedLink,
            theme: savedTheme,
          });
        }
      } catch (err) {
        console.error("Error loaded settings:", err);
      }

      // 2. Fetch Catalog Products from Database
      try {
        const res = await API.get("/products");
        if (
          res.data &&
          res.data.success &&
          res.data.data &&
          res.data.data.length > 0
        ) {
          // Format custom products from database
          const dbProducts = res.data.data.map((p) => ({
            _id: p._id,
            name: p.name,
            slug: p.slug || p.name.toLowerCase().replace(/\s+/g, "-"),
            sku: p.sku,
            category: p.category || "suits",
            mrp: p.mrp || Math.round(p.price * 1.5),
            sellingPrice: p.price,
            images: p.images || [p.image] || [
                "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop",
              ],
            video: p.video || "",
            tag: p.tag || p.tags || "",
          }));
          setProducts(dbProducts);
        } else {
          // Fallback if database is empty but connected
          setProducts(mockProducts);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts(mockProducts);
      }
    };

    fetchPageData();
  }, []);

  // 1. Flash Sale Countdown State
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 45,
    seconds: 30,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              // Reset timer for mock infinite running
              hours = 24;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleQuickAddToCart = (product, size) => {
    dispatch(
      addToCart({
        product: {
          _id: product._id,
          name: product.name,
          price: product.sellingPrice,
          images: product.images,
          sku: product.sku || "",
        },
        quantity: 1,
        variant: {
          size: size,
          color: "Default",
        },
      }),
    );
    alert(`"${product.name}" (Size: ${size}) has been added to your cart!`);
  };

  // 2. Demo Premium Products - Curated 8 items preview
  const mockProducts = [
    {
      _id: "1",
      name: "Elysian Gold Chanderi Suit",
      slug: "elysian-gold-chanderi-suit",
      sku: "LHR-CH-001",
      category: "suits",
      mrp: 3999,
      sellingPrice: 1599,
      images: [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop",
      ],
      tag: "Best Seller",
    },
    {
      _id: "2",
      name: "Scarlet Floral Rayon Kurti",
      slug: "scarlet-floral-rayon-kurti",
      sku: "LHR-RY-002",
      category: "kurtis",
      mrp: 3999,
      sellingPrice: 1699,
      images: [
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop",
      ],
      tag: "Sale",
    },
    {
      _id: "3",
      name: "Ivory Zari Premium Anarkali Set",
      slug: "ivory-zari-premium-anarkali-set",
      sku: "LHR-AK-003",
      category: "ethnic",
      mrp: 3999,
      sellingPrice: 1599,
      images: [
        "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop",
      ],
      tag: "Sale",
    },
    {
      _id: "4",
      name: "Chocolate Brown & Olive Suit Set",
      slug: "chocolate-brown-olive-suit-set",
      sku: "LHR-GG-004",
      category: "suits",
      mrp: 3999,
      sellingPrice: 1799,
      images: [
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600&auto=format&fit=crop",
      ],
      tag: "Sale",
    },
    {
      _id: "5",
      name: "Indigo Block Printed Cotton Kurta",
      slug: "indigo-block-printed-cotton-kurta",
      sku: "LHR-CT-005",
      category: "kurtis",
      mrp: 2999,
      sellingPrice: 1399,
      images: [
        "https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=600&auto=format&fit=crop",
      ],
      tag: "Summer Special",
    },
    {
      _id: "6",
      name: "Dusty Rose Embroidered Palazzo Set",
      slug: "dusty-rose-embroidered-palazzo-set",
      sku: "LHR-PL-006",
      category: "ethnic",
      mrp: 4499,
      sellingPrice: 2699,
      images: [
        "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=600&auto=format&fit=crop",
      ],
      tag: "Popular",
    },
    {
      _id: "7",
      name: "Mustard Yellow Gotta Patti Kurti",
      slug: "mustard-yellow-gotta-patti-kurti",
      sku: "LHR-GY-007",
      category: "kurtis",
      mrp: 2499,
      sellingPrice: 1199,
      images: [
        "https://images.unsplash.com/photo-1614088685112-0a7db047d4e6?q=80&w=600&auto=format&fit=crop",
      ],
      tag: "Best Seller",
    },
    {
      _id: "8",
      name: "Lavender Dream Organza Salwar",
      slug: "lavender-dream-organza-salwar",
      sku: "LHR-OD-008",
      category: "suits",
      mrp: 4999,
      sellingPrice: 2499,
      images: [
        "https://images.unsplash.com/photo-1612459284970-e8f027596582?q=80&w=600&auto=format&fit=crop",
      ],
      tag: "Exclusive",
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Dynamic Festive Offer Banner Row */}
      {adConfig.active && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 animate-fade-in">
          <div
            className={`relative overflow-hidden rounded-sm border p-6 md:p-10 shadow-lg ${
              adConfig.theme === "royal-gold"
                ? "bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-950 text-amber-100 border-amber-800"
                : adConfig.theme === "emerald-green"
                  ? "bg-gradient-to-r from-emerald-955 via-green-900 to-emerald-955 text-emerald-100 border-emerald-800"
                  : adConfig.theme === "ruby-red"
                    ? "bg-gradient-to-r from-rose-955 via-red-900 to-rose-955 text-red-100 border-red-900"
                    : "bg-gradient-to-r from-purple-955 via-violet-900 to-purple-955 text-violet-100 border-violet-850"
            }`}
          >
            {/* Background design elements */}
            <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none select-none flex items-center justify-end pr-10">
              <svg
                width="200"
                height="200"
                viewBox="0 0 100 100"
                fill="currentColor"
              >
                <path
                  d="M50 0 L61 35 L97 36 L68 57 L79 93 L50 72 L21 93 L32 57 L3 36 L39 35 Z"
                  fill="#D4AF37"
                />
              </svg>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 text-left">
              <div className="space-y-2 md:max-w-2xl">
                <span className="inline-block text-[9px] uppercase font-extrabold tracking-widest bg-white/20 text-white px-2.5 py-0.5 rounded-sm">
                  ✨ Special Festival Promotion
                </span>
                <h2 className="text-xl md:text-3xl font-display font-bold uppercase tracking-wide drop-shadow-sm text-white">
                  {adConfig.title}
                </h2>
                <p className="text-xs md:text-sm text-white/90 font-medium font-sans">
                  {adConfig.subtitle}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {adConfig.code && (
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-wider text-white/60 font-bold mb-1">
                      Copy Coupon Code
                    </span>
                    <div className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-sm font-mono text-xs tracking-wider font-bold text-white flex items-center gap-1 select-all cursor-pointer">
                      💡 {adConfig.code.toUpperCase()}
                    </div>
                  </div>
                )}

                <Link
                  to={adConfig.link}
                  className="bg-white hover:bg-neutral-100 text-neutral-900 hover:text-black font-extrabold text-[10px] uppercase tracking-wider px-5 py-3 rounded-sm shadow-md transition-all duration-300 flex items-center justify-center self-start sm:self-center"
                >
                  Grab Offer
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 1: HERO SPOTLIGHT SLIDER (Vibrant premium hero layout) */}
      <section className="relative h-[80vh] overflow-hidden bg-secondary w-full">
        {/* Decorative backdrop with slow-zoom animation */}
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.05 }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center"
        ></motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-secondary to-transparent z-1"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-start text-primary z-10 space-y-6 text-left">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.25em] text-accent-gold font-bold"
          >
            Spring / Summer 2026 Collection
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-display font-medium tracking-tight leading-[1.1] max-w-2xl"
          >
            The Radiance of{" "}
            <span className="gold-text-gradient block mt-2 animate-text-shine bg-clip-text text-transparent">
              Indian Heritage
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm md:text-base text-gray-300 max-w-md leading-relaxed"
          >
            Discover our premium selection of Kurtas, Suits, and Ethnic sets
            woven in luxury chanderi and pure cottons.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="pt-4"
          >
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 bg-accent-gold text-secondary font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-sm hover:bg-white hover:text-secondary hover:shadow-lg transition-all duration-300"
            >
              <span>Explore Collection</span>
              <RiArrowRightLine size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* EXQUISITE CATEGORY SELECTION CIRCLES (Boutique Horizontal Navigation) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col space-y-4">
          <div className="text-left space-y-1">
            <span className="text-[10px] text-accent-gold tracking-[0.2em] uppercase font-bold">
              Shop by Category
            </span>
            <h2 className="text-xl font-display font-medium uppercase tracking-wider text-textPrimary">
              Boutique Curations
            </h2>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto pb-4 scrollbar-none snap-x select-none">
            {[
              {
                title: "Designer Suits",
                desc: "Anarkalis & Shararas",
                image:
                  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=250&auto=format&fit=crop",
                path: "/shop?category=ethnic",
              },
              {
                title: "Premium Kurtis",
                desc: "Everyday Tunics",
                image:
                  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=250&auto=format&fit=crop",
                path: "/shop?category=kurtis",
              },
              {
                title: "Co-Ord Sets",
                desc: "Modern Ethnic",
                image:
                  "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=250&auto=format&fit=crop",
                path: "/shop?category=suits",
              },
              {
                title: "Best Sellers",
                desc: "Top Trending",
                image:
                  "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=250&auto=format&fit=crop",
                path: "/shop?tag=Best Seller",
              },
              {
                title: "New Arrivals",
                desc: "Fresh Designs",
                image:
                  "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=250&auto=format&fit=crop",
                path: "/shop?tag=New Arrival",
              },
            ].map((cat, idx) => (
              <Link
                key={idx}
                to={cat.path}
                className="snap-start flex flex-col items-center space-y-3 group min-w-[100px] sm:min-w-[130px] text-center"
              >
                <div className="relative w-18 h-18 sm:w-24 sm:h-24 rounded-full p-[2px] transition-transform duration-300 group-hover:scale-105 border border-accent-gold/40 group-hover:border-accent-gold shadow-md">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-[1.12] transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-secondary/10 group-hover:bg-transparent transition-colors duration-300"></div>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] sm:text-xs font-semibold text-textPrimary uppercase tracking-wider group-hover:text-accent-gold transition-colors">
                    {cat.title}
                  </h4>
                  <span className="text-[9px] text-textSecondary hidden sm:block">
                    {cat.desc}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: FLASH SALE FEATURE WITH COUNTDOWN TIMER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary/50 backdrop-blur-md border border-borderLight rounded-sm shadow-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-left">
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-red-650 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/25">
              Limited Sale Event
            </span>
            <h2 className="text-3xl font-display font-semibold tracking-tight text-textPrimary">
              Hurry! Offer Closes Soon
            </h2>
            <p className="text-xs text-textSecondary max-w-sm leading-relaxed">
              Grab luxury silk ensembles and cotton matching kurtis at discounts
              of up to 40%. Free shipping automatically applied!
            </p>
          </div>

          {/* Countdown Clock Layout */}
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary border border-borderLight text-textPrimary font-display font-semibold text-2xl flex items-center justify-center rounded-sm shadow-md premium-card-shadow relative overflow-hidden group hover:border-accent-gold transition-colors duration-300">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-accent-gold"></div>
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <span className="text-[9px] uppercase tracking-widest mt-2 font-bold text-textSecondary">
                Hours
              </span>
            </div>

            <div className="h-8 w-[1px] bg-borderLight self-center"></div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary border border-borderLight text-textPrimary font-display font-semibold text-2xl flex items-center justify-center rounded-sm shadow-md premium-card-shadow relative overflow-hidden group hover:border-accent-gold transition-colors duration-300">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-accent-gold"></div>
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <span className="text-[9px] uppercase tracking-widest mt-2 font-bold text-textSecondary">
                Mins
              </span>
            </div>

            <div className="h-8 w-[1px] bg-borderLight self-center"></div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary border border-accent-gold text-accent-gold font-display font-semibold text-2xl flex items-center justify-center rounded-sm shadow-md premium-card-shadow relative overflow-hidden group hover:border-accent-gold transition-colors duration-300">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-accent-gold"></div>
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
              <span className="text-[9px] uppercase tracking-widest mt-2 font-bold text-accent-gold animate-pulse">
                Secs
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: TRENDING COLLECTION (Interactive Cards Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs text-accent-gold tracking-widest uppercase font-bold">
            Curated Picks
          </span>
          <h2 className="text-3xl font-display font-bold tracking-tight text-textPrimary">
            Trending Classics
          </h2>
          <p className="text-xs text-textSecondary max-w-md mx-auto">
            Explore styles that are currently high on demand. Exquisite finish,
            luxury detailing.
          </p>
        </div>

        {/* Products Grid */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-8 sm:overflow-visible sm:snap-none sm:pb-0">
          {products.map((product) => (
            <div
              key={product._id}
              className="min-w-[calc(50%-8px)] w-[calc(50%-8px)] flex-shrink-0 snap-start sm:w-auto sm:min-w-0 sm:flex-shrink sm:snap-none group relative bg-transparent flex flex-col h-full transition-all duration-300"
            >
              {/* Product Badge */}
              {product.tag && (
                <span className="absolute top-10 left-3 z-10 bg-secondary text-accent-gold font-bold text-[9px] uppercase tracking-wider px-2 py-1 shadow-sm rounded-sm">
                  {product.tag}
                </span>
              )}

              {/* Product Heart Selector */}
              <button className="absolute top-10 right-3 z-10 bg-primary/70 hover:bg-primary text-textPrimary hover:text-danger p-2 rounded-full shadow-sm hover:scale-115 transition-all">
                <RiHeartLine size={16} />
              </button>

              {/* Image / Video Container with Zoom and clipPath */}
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

                {/* Add to cart hover overlay */}
                <div className="absolute inset-0 bg-secondary/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 space-y-2 z-20 backdrop-blur-[2px]">
                  <span className="text-white text-[9px] uppercase tracking-widest font-bold text-center block">
                    Quick Buy Size
                  </span>
                  <div className="flex justify-center gap-1">
                    {["S", "M", "L", "XL"].map((size) => (
                      <button
                        key={size}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleQuickAddToCart(product, size);
                        }}
                        className="w-8 h-8 rounded-full bg-primary/90 text-textPrimary hover:bg-accent-gold hover:text-secondary text-[10px] font-bold shadow-sm transition-all duration-200"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </Link>

              {/* Info area */}
              <div className="py-4 flex flex-col flex-grow justify-between space-y-2 text-left">
                <div className="space-y-1">
                  <span className="text-[9px] text-textSecondary uppercase tracking-widest font-bold">
                    {product.category}
                  </span>
                  <h3 className="text-xs font-semibold text-textPrimary leading-snug group-hover:text-accent-gold transition-colors line-clamp-2">
                    <Link to={`/product/${product.slug}`}>{product.name}</Link>
                  </h3>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-textSecondary line-through font-medium">
                    ₹{product.mrp}
                  </span>
                  <span className="text-secondary font-bold">
                    ₹{product.sellingPrice}
                  </span>
                </div>

                <div className="pt-0.5">
                  <span className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-sm font-bold inline-block">
                    {Math.round(
                      ((product.mrp - product.sellingPrice) / product.mrp) *
                        100,
                    )}
                    % OFF
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: WHY CHOOSE PARIWESH */}
      <section className="bg-primary py-16 border-y border-borderLight">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-3">
              <RiCheckboxCircleLine size={36} className="text-accent-gold" />
              <h3 className="text-lg font-bold text-textPrimary">
                Premium Curations
              </h3>
              <p className="text-xs text-textSecondary leading-relaxed max-w-xs">
                Handpicked collections designed by seasoned stylists with
                premium zari and block threadings.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <RiCheckboxCircleLine size={36} className="text-accent-gold" />
              <h3 className="text-lg font-bold text-textPrimary">
                Artisanal Tailoring
              </h3>
              <p className="text-xs text-textSecondary leading-relaxed max-w-xs">
                Each suit is custom adjusted, following extreme validation
                methods checking seams, cuffs, and hemlines.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <RiCheckboxCircleLine size={36} className="text-accent-gold" />
              <h3 className="text-lg font-bold text-textPrimary">
                Eco Friendly Shipping
              </h3>
              <p className="text-xs text-textSecondary leading-relaxed max-w-xs">
                All order sets are dispatched in cotton muslin wraps inside
                organic cardboard containers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

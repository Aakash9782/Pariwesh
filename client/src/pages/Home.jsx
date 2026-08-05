import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SEO from "../components/common/SEO.jsx";
import Icon from "../theme/icons.jsx";
import { motion, AnimatePresence } from "framer-motion";
import HeroSlider from "../components/home/HeroSlider.jsx";
import VibeGrid from "../components/home/VibeGrid.jsx";
import { ProductSkeleton } from "../components/common/Skeleton.jsx";
import { addToCart } from "../redux/slices/cartSlice.js";
import { toggleWishlistProduct } from "../redux/slices/wishlistSlice.js";
import API from "../services/api.js";
import { useAlert } from "../contexts/AlertContext.jsx";
import { syncCartNow, syncWishlistNow } from "../services/hydrateCommerce.js";

const Home = () => {
  const { showAlert } = useAlert();
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.products);

  const handleWishlistToggle = (prod) => {
    dispatch(toggleWishlistProduct(prod));
    syncWishlistNow();
    const isCurrentlyWishlisted = wishlistItems.some((p) => p._id === prod._id);
    if (!isCurrentlyWishlisted) {
      showAlert("Added to Wishlist Collection", "Wishlist");
    } else {
      showAlert("Removed from Wishlist Collection", "Wishlist");
    }
  };

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

  const [sliderConfig, setSliderConfig] = useState({
    active: true,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1612459284970-e8f027596582?q=80&w=1200&auto=format&fit=crop",
    ],
  });

  const [activeSlide, setActiveSlide] = useState(0);

  // Dynamic products catalog state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Dynamic Flash Sale Countdown State
  const [countdownConfig, setCountdownConfig] = useState({
    active: true,
    endDate: "",
    title: "Limited Collection Closes In:",
  });

  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 45,
    seconds: 30,
  });

  const handleCopyCode = () => {
    if (adConfig.code) {
      navigator.clipboard.writeText(adConfig.code.trim().toUpperCase());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Products load independently — never blocked by slow /settings
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await API.get("/products");
        if (cancelled) return;

        if (res.data?.success && Array.isArray(res.data.data)) {
          const dbProducts = res.data.data
            .filter((p) => !p.status || p.status === "active")
            .map((p) => {
              const images =
                Array.isArray(p.images) && p.images.length > 0
                  ? p.images
                  : p.image
                    ? [p.image]
                    : [
                        "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop",
                      ];
              return {
                _id: p._id,
                name: p.name,
                slug: p.slug || p.name.toLowerCase().replace(/\s+/g, "-"),
                sku: p.sku,
                category: p.category || "suits",
                mrp: p.mrp || Math.round(p.price * 1.5),
                sellingPrice: p.price,
                images,
                video: p.video || "",
                tag: p.tag || p.tags || "",
              };
            });
          setProducts(dbProducts);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  // Banner + countdown settings in one request
  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      try {
        const res = await API.get("/settings");
        if (cancelled) return;
        if (!res.data?.success || !res.data.data) {
          applyLocalSettingsFallback();
          return;
        }

        const settings = res.data.data;

        let adState = {
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
        };

        if (settings.festiveBannerSettings) {
          try {
            const parsed = JSON.parse(settings.festiveBannerSettings);
            const now = new Date();
            const start = parsed.startDate ? new Date(parsed.startDate) : null;
            const end = parsed.endDate ? new Date(parsed.endDate) : null;
            const isDateValid =
              (!start || now >= start) && (!end || now <= end);

            adState = {
              active:
                (parsed.enabled === true || parsed.enabled === "true") &&
                isDateValid,
              title: parsed.bannerTitle || adState.title,
              subtitle: parsed.subtitle || adState.subtitle,
              code: parsed.discountTag || adState.code,
              link: parsed.link || "/shop",
              theme: parsed.theme || "royal-gold",
              primaryButtonText: parsed.primaryButtonText,
              desktopImage: parsed.desktopImage || parsed.bannerImage || "",
              tabletImage: parsed.tabletImage || "",
              mobileImage: parsed.mobileImage || "",
            };
          } catch (e) {
            console.error("Failed to parse festiveBannerSettings", e);
          }
        }

        if (!cancelled) {
          setAdConfig(adState);

          const fallbackImages = [
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1612459284970-e8f027596582?q=80&w=1200&auto=format&fit=crop",
          ];
          const loadedImages = [
            settings.slideImg1,
            settings.slideImg2,
            settings.slideImg3,
            settings.slideImg4,
            settings.slideImg5,
          ].filter(Boolean);

          setSliderConfig({
            active:
              settings.slideBarActive === undefined
                ? true
                : settings.slideBarActive === "true" ||
                  settings.slideBarActive === true,
            images: loadedImages.length > 0 ? loadedImages : fallbackImages,
          });

          setCountdownConfig({
            active:
              settings.countdownActive === undefined
                ? true
                : settings.countdownActive === "true" ||
                  settings.countdownActive === true,
            endDate: settings.countdownEndDate || "",
            title: settings.countdownTitle || "Limited Collection Closes In:",
          });
        }
      } catch (err) {
        console.error("Error loaded settings:", err);
        if (!cancelled) applyLocalSettingsFallback();
      }
    };

    const applyLocalSettingsFallback = () => {
      setAdConfig({
        active: localStorage.getItem("festiveAdActive") === "true",
        title:
          localStorage.getItem("festiveAdTitle") || "Diwali Festive Dhamaka!",
        subtitle:
          localStorage.getItem("festiveAdSubtitle") ||
          "Up to 50% Off on all hand-knit Zari premium anarkalis. Free delivery apply!",
        code: localStorage.getItem("festiveAdCode") || "FESTIVE50",
        link: localStorage.getItem("festiveAdLink") || "/shop",
        theme: localStorage.getItem("festiveAdTheme") || "royal-gold",
      });

      const fallbackImages = [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1612459284970-e8f027596582?q=80&w=1200&auto=format&fit=crop",
      ];
      const loadedImages = [
        localStorage.getItem("slideImg1"),
        localStorage.getItem("slideImg2"),
        localStorage.getItem("slideImg3"),
        localStorage.getItem("slideImg4"),
        localStorage.getItem("slideImg5"),
      ].filter(Boolean);

      setSliderConfig({
        active:
          localStorage.getItem("slideBarActive") === null
            ? true
            : localStorage.getItem("slideBarActive") === "true",
        images: loadedImages.length > 0 ? loadedImages : fallbackImages,
      });
    };

    fetchSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sliderConfig.active || sliderConfig.images.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sliderConfig.images.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [sliderConfig.active, sliderConfig.images.length]);

  useEffect(() => {
    if (!countdownConfig.active) return;

    const timer = setInterval(() => {
      if (countdownConfig.endDate) {
        // Target date mode
        const target = new Date(countdownConfig.endDate).getTime();
        const now = new Date().getTime();
        const difference = target - now;

        if (difference <= 0) {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
          clearInterval(timer);
        } else {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor(
            (difference % (1000 * 60 * 60)) / (1000 * 60),
          );
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          setTimeLeft({ hours, minutes, seconds });
        }
      } else {
        // Cycling fallback mode (cycles 24 hours continuously)
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
                hours = 24;
              }
            }
          }
          return { hours, minutes, seconds };
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownConfig]);

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
    syncCartNow();
    showAlert(
      `"${product.name}" (Size: ${size}) has been added to your shopping bag!`,
      "Added to Bag",
    );
  };

  const websiteSchema = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Pariwesh",
      url:
        typeof window !== "undefined"
          ? window.location.origin
          : "https://pariwesh.com",
      potentialAction: {
        "@type": "SearchAction",
        target: `${typeof window !== "undefined" ? window.location.origin : "https://pariwesh.com"}/shop?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Pariwesh",
      url:
        typeof window !== "undefined"
          ? window.location.origin
          : "https://pariwesh.com",
      logo:
        typeof window !== "undefined"
          ? `${window.location.origin}/logo.png`
          : "https://pariwesh.com/logo.png",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+918209903441",
        contactType: "customer service",
      },
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      <SEO
        title="PARIWESH | Premium Traditional Ethnic Wear & Kurtas"
        description="Discover premium traditional ethnic suit sets, handcrafted kurtis, and designer wear for women at PARIWESH. Elevated designs crafted with luxury fabrics."
        keywords="Pariwesh, Ethnic Wear, Suit Sets, Kurtis, Traditional Indian Wear, Luxury Crafts, Designer Kurtas"
        structuredData={websiteSchema}
      />
      {/* Dynamic Festive Offer Banner Row */}
      {adConfig.active &&
        (() => {
          const getBannerTheme = () => {
            switch (adConfig.theme) {
              case "royal-gold":
                return {
                  wrapper:
                    "bg-[linear-gradient(135deg,#0a0702_0%,#1c1407_30%,#3d2b0e_50%,#1c1407_70%,#0a0702_100%)] border-amber-500/35 text-amber-100",
                  badge: "bg-amber-500/20 text-amber-250 border-amber-500/35",
                  glow: "from-amber-400/25 to-transparent",
                  mandala: "text-amber-500",
                  btnGrab:
                    "bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.25)]",
                  btnCoupon:
                    "bg-amber-950/40 border-amber-500/30 text-amber-205 hover:border-amber-450 hover:bg-amber-950/60",
                  sparkle: "text-amber-400",
                };
              case "emerald-green":
                return {
                  wrapper:
                    "bg-[linear-gradient(135deg,#010704_0%,#051c11_30%,#0e4226_50%,#051c11_70%,#010704_100%)] border-emerald-500/35 text-emerald-100",
                  badge:
                    "bg-emerald-500/20 text-emerald-250 border-emerald-500/35",
                  glow: "from-emerald-400/25 to-transparent",
                  mandala: "text-emerald-500",
                  btnGrab:
                    "bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.25)]",
                  btnCoupon:
                    "bg-emerald-950/40 border-emerald-500/30 text-emerald-205 hover:border-emerald-450 hover:bg-emerald-950/60",
                  sparkle: "text-emerald-400",
                };
              case "ruby-red":
                return {
                  wrapper:
                    "bg-[linear-gradient(135deg,#0a0104_0%,#240510_30%,#540d23_50%,#240510_70%,#0a0104_100%)] border-rose-500/35 text-rose-100",
                  badge: "bg-rose-500/20 text-rose-250 border-rose-500/35",
                  glow: "from-rose-450/25 to-transparent",
                  mandala: "text-rose-550",
                  btnGrab:
                    "bg-gradient-to-r from-rose-400 to-rose-600 hover:from-rose-300 hover:to-rose-500 text-neutral-950 shadow-[0_0_15px_rgba(244,63,94,0.25)]",
                  btnCoupon:
                    "bg-rose-955/40 border-rose-500/30 text-rose-205 hover:border-rose-450 hover:bg-rose-955/60",
                  sparkle: "text-rose-400",
                };
              default: // velvet-purple
                return {
                  wrapper:
                    "bg-[linear-gradient(135deg,#04010a_0%,#140529_30%,#390e66_50%,#140529_70%,#04010a_100%)] border-purple-500/35 text-purple-100",
                  badge:
                    "bg-purple-500/20 text-purple-250 border-purple-500/35",
                  glow: "from-purple-400/25 to-transparent",
                  mandala: "text-purple-500",
                  btnGrab:
                    "bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-300 hover:to-purple-500 text-neutral-950 shadow-[0_0_15px_rgba(168,85,247,0.25)]",
                  btnCoupon:
                    "bg-purple-955/40 border-purple-500/30 text-purple-205 hover:border-purple-450 hover:bg-purple-955/60",
                  sparkle: "text-purple-400",
                };
            }
          };

          const theme = getBannerTheme();

          const optimizeCloudinaryUrl = (url) => {
            if (!url || typeof url !== "string") return url;
            if (url.includes("res.cloudinary.com")) {
              return url.replace("/upload/", "/upload/f_auto,q_auto/");
            }
            return url;
          };

          const desktopSrc = optimizeCloudinaryUrl(adConfig.desktopImage);
          const tabletSrc =
            optimizeCloudinaryUrl(adConfig.tabletImage) || desktopSrc;
          const mobileSrc =
            optimizeCloudinaryUrl(adConfig.mobileImage) || tabletSrc;

          if (!desktopSrc) {
            return null;
          }

          return (
            <section className="w-full animate-fade-in relative z-10">
              <div className="relative min-h-[300px] md:min-h-[450px] overflow-hidden rounded-none border-x-0 border-y border-slate-800 shadow-2xl flex items-center">
                {/* Media Responsive Picture element */}
                <picture className="absolute inset-0 w-full h-full">
                  {mobileSrc && (
                    <source media="(max-width: 639px)" srcSet={mobileSrc} />
                  )}
                  {tabletSrc && (
                    <source media="(max-width: 1023px)" srcSet={tabletSrc} />
                  )}
                  <img
                    src={desktopSrc}
                    alt={adConfig.title || "Promotional Campaign"}
                    className="w-full h-full object-cover select-none"
                    loading="eager"
                  />
                </picture>

                {/* Dark Shimmer overlay to protect text contrast */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/35 md:from-black/80 md:via-black/45 md:to-transparent z-1 pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 text-left">
                    <div className="space-y-3 lg:max-w-3xl">
                      <span className="inline-flex items-center gap-1.5 text-[9px] uppercase font-black tracking-[0.2em] px-3 py-1 rounded-sm border border-accent-gold/45 text-accent-gold bg-black/60 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-ping"></span>
                        Special Promotion
                      </span>
                      <h2 className="text-2xl md:text-5xl font-display font-extrabold uppercase tracking-wider drop-shadow-md text-white">
                        {adConfig.title}
                      </h2>
                      <p className="text-xs md:text-sm text-slate-200/90 font-medium font-sans leading-relaxed tracking-wide max-w-2xl">
                        {adConfig.subtitle}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 lg:self-center font-sans">
                      {adConfig.code && (
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">
                            Promo Code
                          </span>
                          <button
                            onClick={handleCopyCode}
                            title="Click to copy coupon code"
                            className={`px-4 py-2.5 border rounded-sm font-mono text-xs tracking-widest font-black flex items-center gap-2 overflow-hidden transition-all duration-300 relative ${theme.btnCoupon}`}
                          >
                            {copiedCode ? (
                              <span className="text-green-400 flex items-center gap-1.5 animate-bounce">
                                ✔ COPIED!
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                ✨ {adConfig.code.toUpperCase()}
                              </span>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-[#000000]/0 font-bold mb-1.5 pointer-events-none hidden sm:block">
                          Shop
                        </span>
                        <Link
                          to={adConfig.link}
                          className={`font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 ${theme.btnGrab}`}
                        >
                          {adConfig.primaryButtonText || "Grab Offer"}{" "}
                          <Icon name="ArrowRight" size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

      {/* SECTION 1: HERO SPOTLIGHT SLIDER (Vibrant premium hero layout) */}
      <HeroSlider
        sliderConfig={sliderConfig}
        activeSlide={activeSlide}
        setActiveSlide={setActiveSlide}
      />

      {/* MARQUEE VALUE BANNER */}
      <div className="bg-[#8a1c14] text-white py-3 border-y border-white/10 overflow-hidden select-none">
        <div className="flex whitespace-nowrap animate-[marquee_25s_linear_infinite] text-[10px] uppercase font-bold tracking-[0.25em]">
          {[...Array(8)].map((_, idx) => (
            <span key={idx} className="shrink-0 mr-12">
              Sustainable Fabrics • Handcrafted with Love • Made in India •
              Premium Tailoring • Custom Fit
            </span>
          ))}
        </div>
      </div>

      {/* EXQUISITE CATEGORY SELECTION CIRCLES (Boutique Horizontal Navigation) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 md:pt-4">
        <div className="flex flex-col space-y-4">
          <div className="text-left space-y-1">
            <span className="text-[10px] text-[#8a1c14] tracking-[0.2em] uppercase font-bold">
              Shop by Category
            </span>
            <h2 className="text-2xl font-serif text-textPrimary">
              Boutique Curations
            </h2>
          </div>

          <div className="flex items-center gap-4 md:gap-6 overflow-x-auto pb-4 px-4 sm:px-6 -mx-4 sm:-mx-6 scrollbar-none snap-x select-none">
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
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[2px] transition-transform duration-300 group-hover:scale-105 border border-accent-gold/40 group-hover:border-accent-gold shadow-md">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-[1.12] transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-secondary/10 group-hover:bg-transparent transition-colors duration-300"></div>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] xs:text-[11px] sm:text-xs font-semibold text-textPrimary uppercase tracking-wider group-hover:text-[#8a1c14] transition-colors">
                    {cat.title}
                  </h4>
                  <span className="text-[8px] xs:text-[9px] text-[#8a1c14] italic group-hover:underline">
                    Explore
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: THE PARIWESH EDIT (Comfort meets Couture layout with countdown) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Left card - Premium promotional visual block */}
          <div className="relative overflow-hidden border border-borderLight min-h-[450px] flex flex-col justify-between rounded-none shadow-sm group">
            <img
              src="https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop"
              alt="Atelier Craftsmanship"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30 flex flex-col justify-between p-8 md:p-12 text-white">
              <div className="space-y-2 text-left">
                <span className="text-[9px] text-accent-gold uppercase tracking-[0.3em] font-black block">
                  — Pariwesh Atelier —
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif tracking-wide leading-tight">
                  The Art of <br />
                  Handcrafted Luxury
                </h3>
              </div>
              <div className="space-y-4 text-left">
                <p className="text-[11px] text-white/80 font-sans tracking-wide leading-relaxed max-w-sm">
                  Discover the meticulous craftsmanship behind our signature
                  embroidery, hand-spun Zari, and vintage silhouettes. Every
                  stitch is a tribute to heritage.
                </p>
                <div className="pt-2">
                  <span className="inline-block text-[10px] text-accent-gold group-hover:text-white uppercase tracking-widest font-black border-b border-accent-gold/40 pb-1 transition-all duration-300 cursor-pointer">
                    Read Story
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right card - Soft beige editorial layout */}
          <div className="bg-[#FAF7F3] border border-borderLight p-8 md:p-12 flex flex-col justify-between text-left space-y-8">
            <div className="space-y-4">
              <span className="text-[9px] text-[#8a1c14] font-black uppercase tracking-[0.3em] block">
                — The Pariwesh Edit —
              </span>
              <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-serif text-textPrimary leading-tight">
                Where comfort <br />
                meets{" "}
                <span className="font-script text-[#8a1c14] text-3xl xs:text-4xl sm:text-5xl lowercase tracking-normal">
                  couture.
                </span>
              </h2>
              <p className="text-xs text-textSecondary leading-relaxed max-w-md font-light">
                Every piece is thoughtfully designed for the woman who moves
                through her day with grace - from morning coffee runs to festive
                dinners. Soft textures and custom hand-tailored sizes.
              </p>
            </div>

            {/* Micro stats banner */}
            <div className="grid grid-cols-3 gap-2 xs:gap-4 border-y border-[#8a1c14]/10 py-6">
              <div>
                <h4 className="text-2xl font-serif text-textPrimary font-semibold">
                  150+
                </h4>
                <p className="text-[9px] uppercase tracking-widest text-textSecondary mt-1">
                  Unique Styles
                </p>
              </div>
              <div>
                <h4 className="text-2xl font-serif text-textPrimary font-semibold">
                  4.9★
                </h4>
                <p className="text-[9px] uppercase tracking-widest text-textSecondary mt-1">
                  Loved By You
                </p>
              </div>
              <div>
                <h4 className="text-2xl font-serif text-textPrimary font-semibold">
                  100%
                </h4>
                <p className="text-[9px] uppercase tracking-widest text-textSecondary mt-1">
                  Hand Finished
                </p>
              </div>
            </div>

            {/* Countdown Integration */}
            {countdownConfig.active && (
              <div className="space-y-3 bg-white p-4 border border-borderLight rounded-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#8a1c14] uppercase tracking-wider">
                    {countdownConfig.title}
                  </span>
                  <span className="text-[8px] bg-red-100 text-red-700 px-2 py-0.5 uppercase tracking-widest font-black rounded-none">
                    Live offer
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-center font-mono">
                    <span className="text-xl font-bold font-serif text-textPrimary">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest block text-textSecondary">
                      Hrs
                    </span>
                  </div>
                  <span className="text-textSecondary">:</span>
                  <div className="text-center font-mono">
                    <span className="text-xl font-bold font-serif text-textPrimary">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest block text-textSecondary">
                      Min
                    </span>
                  </div>
                  <span className="text-textSecondary">:</span>
                  <div className="text-center font-mono text-[#8a1c14]">
                    <span className="text-xl font-bold font-serif text-[#8a1c14] animate-pulse">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest block">
                      Sec
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Link
                to="/shop"
                className="inline-block bg-[#8a1c14] text-white font-bold text-xs uppercase tracking-widest px-8 py-4 hover:bg-secondary hover:shadow-lg transition-all duration-300 text-center w-full sm:w-auto"
              >
                Explore Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2.5: PICK YOUR VIBE (4-Column Style Mood Cards) */}
      <VibeGrid />

      {/* SECTION 3: TRENDING COLLECTION (Interactive Cards Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs text-[#8a1c14] tracking-widest uppercase font-bold">
            Curated Picks
          </span>
          <h2 className="text-3xl font-serif text-textPrimary">
            Trending Classics
          </h2>
          <p className="text-xs text-textSecondary max-w-md mx-auto">
            Explore styles that are currently high on demand. Exquisite finish,
            luxury detailing.
          </p>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-accent-gold/30 rounded bg-[#FAF7F3] max-w-7xl mx-auto px-4">
            <p className="text-xs font-semibold text-textSecondary tracking-wider uppercase">
              No products available right now
            </p>
            <p className="text-[11px] text-textSecondary/70 italic mt-1">
              Our catalogue is empty at the moment. Please check back soon for
              new arrivals.
            </p>
            <Link
              to="/shop"
              className="inline-block mt-5 text-[10px] uppercase tracking-widest font-bold text-[#8a1c14] border-b border-[#8a1c14]/40 pb-0.5 hover:text-secondary transition-colors"
            >
              Browse Shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
            {products.map((product) => (
              <div
                key={product._id}
                className="group relative bg-transparent flex flex-col h-full transition-all duration-300"
              >
                {/* Product Badge */}
                {product.tag && (
                  <span className="absolute top-3 left-3 z-10 bg-[#8a1c14] text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 shadow-sm">
                    {product.tag}
                  </span>
                )}

                {/* Product Heart Selector */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleWishlistToggle(product);
                  }}
                  className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-sm hover:scale-110 transition-all border border-borderLight bg-white/80 hover:bg-white ${
                    wishlistItems.some((p) => p._id === product._id)
                      ? "text-[#8a1c14]"
                      : "text-textPrimary hover:text-[#8a1c14]"
                  }`}
                >
                  {wishlistItems.some((p) => p._id === product._id) ? (
                    <Icon name="HeartFill" size={16} />
                  ) : (
                    <Icon name="HeartOutline" size={16} />
                  )}
                </button>

                {/* Image / Video Container with Zoom */}
                <Link
                  to={`/product/${product.slug}`}
                  className="aspect-[4/5] overflow-hidden relative block bg-bgLight border border-borderLight"
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
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-[1.15] transform-gpu transition-transform duration-[800ms] ease-out origin-top"
                    />
                  )}

                  {/* Arch outline SVG overlay */}
                  <svg
                    viewBox="0 0 100 125"
                    className="absolute inset-0 w-full h-full pointer-events-none fill-none stroke-accent-gold stroke-[1.5px] opacity-60"
                    preserveAspectRatio="none"
                  >
                    <path d="M 0,125 L 0,43.75 C 0,35 8,32.5 12,30 C 12,22.5 22,18.75 28,15 C 28,10 38,7.5 44,3.75 C 47,1.25 49,0 50,0 C 51,0 53,1.25 56,3.75 C 62,7.5 72,10 72,15 C 78,18.75 88,22.5 88,30 C 92,32.5 100,35 100,43.75 L 100,125" />
                  </svg>

                  {/* Add to cart hover overlay */}
                  <div className="absolute inset-0 bg-secondary/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 space-y-2 z-20">
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
                          className="w-8 h-8 rounded-full bg-primary/95 text-textPrimary hover:bg-[#8a1c14] hover:text-white text-[10px] font-bold shadow-sm transition-all duration-200"
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
                    <span className="text-[9px] text-[#8a1c14] uppercase tracking-widest font-black block">
                      {product.category}
                    </span>
                    <h3 className="text-xs font-semibold text-textPrimary leading-snug group-hover:text-[#8a1c14] transition-colors line-clamp-2">
                      <Link to={`/product/${product.slug}`}>
                        {product.name}
                      </Link>
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-[#8a1c14] font-bold">
                      ₹{product.sellingPrice}
                    </span>
                    <span className="text-textSecondary line-through font-medium">
                      ₹{product.mrp}
                    </span>
                  </div>

                  <div className="pt-0.5">
                    <span className="bg-[#8a1c14]/10 text-[#8a1c14] border border-[#8a1c14]/20 text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-none font-bold inline-block">
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
        )}
      </section>

      {/* SECTION 4: WHY CHOOSE PARIWESH */}
      <section className="bg-primary py-16 border-t border-borderLight grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full border border-[#8a1c14]/20 bg-[#FAF7F3] flex items-center justify-center text-[#8a1c14] font-script text-xl italic font-bold">
            1
          </div>
          <h3 className="text-sm font-semibold tracking-wide text-textPrimary uppercase">
            handmade with{" "}
            <span className="font-script text-[#8a1c14] text-lg lowercase tracking-normal">
              love.
            </span>
          </h3>
          <p className="text-[11px] text-textSecondary leading-relaxed max-w-xs font-light">
            Handpicked collections designed by seasoned stylists with premium
            zari and block threadings.
          </p>
        </div>
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full border border-[#8a1c14]/20 bg-[#FAF7F3] flex items-center justify-center text-[#8a1c14] font-script text-xl italic font-bold">
            2
          </div>
          <h3 className="text-sm font-semibold tracking-wide text-textPrimary uppercase">
            your{" "}
            <span className="font-script text-[#8a1c14] text-lg lowercase tracking-normal">
              perfect fit.
            </span>
          </h3>
          <p className="text-[11px] text-textSecondary leading-relaxed max-w-xs font-light">
            Each suit is custom adjusted, following extreme validation checks.
          </p>
        </div>
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full border border-[#8a1c14]/20 bg-[#FAF7F3] flex items-center justify-center text-[#8a1c14] font-script text-xl italic font-bold">
            3
          </div>
          <h3 className="text-sm font-semibold tracking-wide text-textPrimary uppercase">
            pure{" "}
            <span className="font-script text-[#8a1c14] text-lg lowercase tracking-normal">
              heritage.
            </span>
          </h3>
          <p className="text-[11px] text-textSecondary leading-relaxed max-w-xs font-light">
            All order sets are dispatched in premium cardboard containers
            wrapped in cotton muslin cloths.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;

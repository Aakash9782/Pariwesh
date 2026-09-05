import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SEO from "../components/common/SEO.jsx";
import ProductImageSlider from "../components/common/ProductImageSlider.jsx";
import Icon from "../theme/icons.jsx";
import { motion, AnimatePresence } from "framer-motion";
import HeroSlider from "../components/home/HeroSlider.jsx";
import CampaignBanners from "../components/home/CampaignBanners.jsx";
import Skeleton, { ProductSkeleton } from "../components/common/Skeleton.jsx";
import { optimizeCloudinaryUrl } from "../utils/cloudinary.js";
import { addToCart } from "../redux/slices/cartSlice.js";
import { toggleWishlistProduct } from "../redux/slices/wishlistSlice.js";
import API from "../services/api.js";
import { useAlert } from "../contexts/AlertContext.jsx";
import { syncCartNow, syncWishlistNow } from "../services/hydrateCommerce.js";
import {
  RiSparklingFill,
  RiStarFill,
  RiTruckLine,
  RiExchangeLine,
  RiShieldCheckLine,
  RiSecurePaymentLine,
  RiDoubleQuotesL,
  RiAwardLine,
  RiLeafLine,
} from "react-icons/ri";

const safeSetItem = (key, value) => {
  try {
    if (value && typeof value === "string") {
      if (value.startsWith("data:image/") || value.includes("data:image/")) {
        return;
      }
    }
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`localStorage setItem failed for key "${key}":`, e);
  }
};

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

  const [dynCampaignBannersActive, setDynCampaignBannersActive] = useState(
    () => {
      const cached = localStorage.getItem("homeCampaignBannersActive");
      return cached === null ? true : cached === "true";
    },
  );

  const [dynCampaignBanners, setDynCampaignBanners] = useState(() => {
    const cached = localStorage.getItem("homeCampaignBanners");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        title: "Classic Cotton Zari",
        subtitle: "HERITAGE COUTURE",
        path: "/shop?tag=Best Seller",
        image: "/hero.png",
      },
      {
        title: "Handcrafted Linens",
        subtitle: "SUMMER ESSENTIALS",
        path: "/shop?category=kurtis",
        image: "/hero.png",
      },
    ];
  });

  const [settingsLoading, setSettingsLoading] = useState(() => {
    return !localStorage.getItem("homeCategories");
  });

  const [sliderConfig, setSliderConfig] = useState(() => {
    const loadedImages = [
      localStorage.getItem("slideImg1"),
      localStorage.getItem("slideImg2"),
      localStorage.getItem("slideImg3"),
      localStorage.getItem("slideImg4"),
      localStorage.getItem("slideImg5"),
    ].filter(Boolean);
    const fallbackImages = [
      "/hero.png",
      "/hero.png",
      "/hero.png",
      "/hero.png",
      "/hero.png",
    ];
    return {
      active:
        localStorage.getItem("slideBarActive") === null
          ? true
          : localStorage.getItem("slideBarActive") === "true",
      images: loadedImages.length > 0 ? loadedImages : fallbackImages,
    };
  });

  const [activeSlide, setActiveSlide] = useState(0);

  // Dynamic products catalog state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Custom dynamic states for homepage elements
  const [dynCategories, setDynCategories] = useState(() => {
    const cached = localStorage.getItem("homeCategories");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        title: "Designer Suits",
        desc: "Anarkalis & Shararas",
        image: "/hero.png",
        path: "/shop?category=ethnic",
      },
      {
        title: "Premium Kurtis",
        desc: "Everyday Tunics",
        image: "/hero.png",
        path: "/shop?category=kurtis",
      },
      {
        title: "Co-Ord Sets",
        desc: "Modern Ethnic",
        image: "/hero.png",
        path: "/shop?category=suits",
      },
      {
        title: "Best Sellers",
        desc: "Top Trending",
        image: "/hero.png",
        path: "/shop?tag=Best Seller",
      },
      {
        title: "New Arrivals",
        desc: "Fresh Designs",
        image: "/hero.png",
        path: "/shop?tag=New Arrival",
      },
    ];
  });

  const [dynStoryImage, setDynStoryImage] = useState(() => {
    return localStorage.getItem("homeStoryImage") || "/hero.png";
  });

  const [dynVibeMoods, setDynVibeMoods] = useState(() => {
    const cached = localStorage.getItem("homeVibeMoods");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return null;
  });

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
                    : ["/hero.png"];
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
                sizes:
                  Array.isArray(p.sizes) && p.sizes.length > 0
                    ? p.sizes.filter((s) => s !== "S")
                    : ["M", "L", "XL", "XXL"],
                sizesStock: p.sizesStock || { M: 10, L: 10, XL: 10, XXL: 10 },
              };
            });
          setProducts(dbProducts);

          // If no admin custom slides are set, dynamically feature top store products on the slider
          const hasCustomSlides = [
            localStorage.getItem("slideImg1"),
            localStorage.getItem("slideImg2"),
            localStorage.getItem("slideImg3"),
            localStorage.getItem("slideImg4"),
            localStorage.getItem("slideImg5"),
          ].some(Boolean);

          if (!hasCustomSlides && dbProducts.length > 0) {
            const dynamicSlides = dbProducts
              .map((p) => p.images?.[0])
              .filter(Boolean)
              .slice(0, 5);
            if (dynamicSlides.length > 0) {
              setSliderConfig((prev) => ({
                ...prev,
                images: dynamicSlides,
              }));
            }
          }
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
              ...adState,
              ...parsed,
              active:
                (parsed.enabled === true || parsed.enabled === "true") &&
                isDateValid,
            };
          } catch (e) {
            console.error("Failed to parse festiveBannerSettings", e);
          }
        }

        if (!cancelled) {
          setAdConfig(adState);

          const fallbackImages = [
            "/hero.png",
            "/hero.png",
            "/hero.png",
            "/hero.png",
            "/hero.png",
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

          // Sync slideshow images to localStorage
          safeSetItem(
            "slideBarActive",
            settings.slideBarActive === undefined
              ? "true"
              : String(settings.slideBarActive),
          );
          safeSetItem("slideImg1", settings.slideImg1 || "");
          safeSetItem("slideImg2", settings.slideImg2 || "");
          safeSetItem("slideImg3", settings.slideImg3 || "");
          safeSetItem("slideImg4", settings.slideImg4 || "");
          safeSetItem("slideImg5", settings.slideImg5 || "");

          setCountdownConfig({
            active:
              settings.countdownActive === undefined
                ? true
                : settings.countdownActive === "true" ||
                  settings.countdownActive === true,
            endDate: settings.countdownEndDate || "",
            title: settings.countdownTitle || "Limited Collection Closes In:",
          });

          // Fetch new dynamic settings for homepage elements
          if (settings.homeStoryImage) {
            setDynStoryImage(settings.homeStoryImage);
            safeSetItem("homeStoryImage", settings.homeStoryImage);
          }
          if (settings.homeCategories) {
            try {
              const parsed = JSON.parse(settings.homeCategories);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setDynCategories(parsed);
                safeSetItem("homeCategories", settings.homeCategories);
              }
            } catch (e) {
              console.error("Failed to parse homeCategories:", e);
            }
          }
          if (settings.homeVibeMoods) {
            try {
              const parsed = JSON.parse(settings.homeVibeMoods);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setDynVibeMoods(parsed);
                safeSetItem("homeVibeMoods", settings.homeVibeMoods);
              }
            } catch (e) {
              console.error("Failed to parse homeVibeMoods:", e);
            }
          }
          if (settings.homeCampaignBanners) {
            try {
              const parsed = JSON.parse(settings.homeCampaignBanners);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setDynCampaignBanners(parsed);
                safeSetItem(
                  "homeCampaignBanners",
                  settings.homeCampaignBanners,
                );
              }
            } catch (e) {
              console.error("Failed to parse homeCampaignBanners:", e);
            }
          }
          const cBannersActive =
            settings.homeCampaignBannersActive === undefined
              ? true
              : settings.homeCampaignBannersActive === "true" ||
                settings.homeCampaignBannersActive === true;
          setDynCampaignBannersActive(cBannersActive);
          safeSetItem("homeCampaignBannersActive", String(cBannersActive));
        }
      } catch (err) {
        console.error("Error loaded settings:", err);
        if (!cancelled) applyLocalSettingsFallback();
      } finally {
        if (!cancelled) setSettingsLoading(false);
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
      setDynCampaignBannersActive(
        localStorage.getItem("homeCampaignBannersActive") === null
          ? true
          : localStorage.getItem("homeCampaignBannersActive") === "true",
      );

      const fallbackImages = ["/hero.png"];
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

      // Load fallbacks from localStorage for new dynamic settings
      const localStoryImage = localStorage.getItem("homeStoryImage");
      if (localStoryImage) {
        setDynStoryImage(localStoryImage);
      }
      const localCategories = localStorage.getItem("homeCategories");
      if (localCategories) {
        try {
          const parsed = JSON.parse(localCategories);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDynCategories(parsed);
          }
        } catch (e) {}
      }
      const localVibeMoods = localStorage.getItem("homeVibeMoods");
      if (localVibeMoods) {
        try {
          const parsed = JSON.parse(localVibeMoods);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDynVibeMoods(parsed);
          }
        } catch (e) {}
      }
      setSettingsLoading(false);
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
      url: "https://pariwesh.in",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://pariwesh.in/shop?search={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Pariwesh",
      url: "https://pariwesh.in",
      logo: "https://pariwesh.in/logo.png",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+918209903441",
        contactType: "customer service",
      },
    },
  ];

  return (
    <div className="pb-20">
      <SEO
        title="PARIWESH | Premium Traditional Ethnic Wear & Kurtas"
        description="Discover premium traditional ethnic suit sets, handcrafted kurtis, and designer wear for women at PARIWESH. Elevated designs crafted with luxury fabrics."
        keywords="Pariwesh, Ethnic Wear, Suit Sets, Kurtis, Traditional Indian Wear, Luxury Crafts, Designer Kurtas"
        structuredData={websiteSchema}
      />
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

      {/* MOBILE TRUST BAR: Displayed directly below Marquee banner on Mobile (Matches Mockup Image 2) */}
      <div className="md:hidden max-w-7xl mx-auto px-4 py-3.5 border-b border-slate-100 bg-white">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center space-y-1">
            <div className="w-9 h-9 rounded-full border border-[#c5a880]/50 flex items-center justify-center text-[#8a1c14] bg-[#FDFBF7] shadow-xs">
              <RiAwardLine size={18} />
            </div>
            <span className="text-[9px] font-bold text-slate-900 uppercase tracking-wider">
              PREMIUM QUALITY
            </span>
            <span className="text-[8px] text-slate-500">Finest Fabrics</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div className="w-9 h-9 rounded-full border border-[#c5a880]/50 flex items-center justify-center text-[#8a1c14] bg-[#FDFBF7] shadow-xs">
              <RiLeafLine size={18} />
            </div>
            <span className="text-[9px] font-bold text-slate-900 uppercase tracking-wider">
              ETHICAL FASHION
            </span>
            <span className="text-[8px] text-slate-500">Sustainable Choices</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div className="w-9 h-9 rounded-full border border-[#c5a880]/50 flex items-center justify-center text-[#8a1c14] bg-[#FDFBF7] shadow-xs">
              <RiShieldCheckLine size={18} />
            </div>
            <span className="text-[9px] font-bold text-slate-900 uppercase tracking-wider">
              TRUSTED BRAND
            </span>
            <span className="text-[8px] text-slate-500">Loved by Thousands</span>
          </div>
        </div>
      </div>

      <div className="space-y-16 pt-6 md:pt-10">
        {/* EXQUISITE CATEGORY SELECTION CIRCLES (Boutique Horizontal Navigation) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 md:pt-4">
        <div className="flex flex-col space-y-4">
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start space-x-2 text-[#c5a880]">
              <span className="h-[1px] w-8 bg-[#c5a880]/50" />
              <span className="text-[10px] text-[#8a1c14] tracking-[0.2em] uppercase font-bold">
                Shop by Category
              </span>
              <span className="h-[1px] w-8 bg-[#c5a880]/50" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-textPrimary">
              Boutique Curations
            </h2>
          </div>

          <div className="flex items-center gap-4 md:gap-6 overflow-x-auto pb-4 px-4 sm:px-6 -mx-4 sm:-mx-6 scrollbar-none snap-x select-none">
            {settingsLoading
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center space-y-3 min-w-[100px] sm:min-w-[130px]"
                  >
                    <Skeleton
                      variant="circle"
                      className="w-20 h-20 sm:w-24 sm:h-24 border border-accent-gold/20"
                    />
                    <div className="space-y-1.5 w-16 flex flex-col items-center">
                      <Skeleton className="h-2.5 w-full" />
                      <Skeleton className="h-2 w-2/3" />
                    </div>
                  </div>
                ))
              : dynCategories.map((cat, idx) => (
                  <Link
                    key={idx}
                    to={cat.path}
                    className="snap-start flex flex-col items-center space-y-3 group min-w-[100px] sm:min-w-[130px] text-center"
                  >
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[2px] transition-transform duration-300 group-hover:scale-105 border border-accent-gold/40 group-hover:border-accent-gold shadow-md">
                      <div className="w-full h-full rounded-full overflow-hidden relative">
                        <img
                          src={optimizeCloudinaryUrl(cat.image)}
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

      {/* CAMPAIGN BANNER CARDS GRID (Mobile-First visual cards block) */}
      {dynCampaignBannersActive && (
        <CampaignBanners
          banners={dynCampaignBanners}
          settingsLoading={settingsLoading}
        />
      )}

      {/* SECTION 2: THE PARIWESH EDIT (Comfort meets Couture layout with countdown) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Left card - Premium promotional visual block */}
          <div className="relative overflow-hidden border border-borderLight min-h-[450px] flex flex-col justify-between rounded-none shadow-sm group">
            {settingsLoading ? (
              <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
            ) : (
              <img
                src={optimizeCloudinaryUrl(dynStoryImage)}
                alt="Atelier Craftsmanship"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
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

      {/* SECTION 3: TRENDING COLLECTION (Interactive Cards Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="text-center space-y-2 mb-10 max-w-xl mx-auto">
          <span className="text-[10px] text-[#8a1c14] tracking-[0.25em] uppercase font-bold flex items-center justify-center space-x-2">
            <span className="h-[1px] w-6 bg-[#8a1c14]/30" />
            <span>Curated Picks</span>
            <span className="h-[1px] w-6 bg-[#8a1c14]/30" />
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-wide">
            Trending Classics
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Handpicked festive ensembles that define royal grace. Exquisite zari work and bespoke tailoring.
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
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 sm:gap-y-8">
            {products.map((product) => (
              <div
                key={product._id}
                className="group relative bg-white/80 hover:bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/80 hover:border-[#c5a880]/40 shadow-[0_4px_20px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_12px_32px_rgba(197,168,128,0.18),0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-1 flex flex-col h-full transition-all duration-400"
              >
                {/* Product Badge */}
                {product.tag && (
                  <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-xs bg-gradient-to-r from-[#8a1c14] to-[#6b140e] text-white text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.16em] shadow-md border border-amber-300/30">
                      {product.tag}
                    </span>
                  </div>
                )}

                {/* Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleWishlistToggle(product);
                  }}
                  className={`absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-sm border border-white/60 cursor-pointer ${
                    wishlistItems.some((p) => p._id === product._id)
                      ? "bg-white text-[#8a1c14] scale-105 ring-2 ring-[#8a1c14]/30"
                      : "bg-white/85 hover:bg-white text-slate-700 hover:text-[#8a1c14] hover:scale-110 active:scale-95"
                  }`}
                  aria-label="Wishlist"
                >
                  {wishlistItems.some((p) => p._id === product._id) ? (
                    <Icon name="HeartFill" size={15} />
                  ) : (
                    <Icon name="HeartOutline" size={15} />
                  )}
                </button>

                {/* Image / Video Container with Mehrab Arch */}
                <Link
                  to={`/product/${product.slug}`}
                  className="aspect-[3/4] sm:aspect-[4/5] overflow-hidden relative block bg-[#FBF9F5] rounded-t-lg transition-transform duration-500"
                  style={{ clipPath: "url(#mehrab-clip)" }}
                >
                  {product.video ? (
                    <video
                      src={product.video}
                      className="w-full h-full object-cover group-hover:scale-105 transform-gpu transition-transform duration-700 ease-out origin-top"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out">
                      <ProductImageSlider
                        images={product.images}
                        alt={product.name}
                      />
                    </div>
                  )}

                  {/* Royal Golden Mehrab Arch Filigree Stroke */}
                  <svg
                    viewBox="0 0 100 125"
                    className="absolute inset-0 w-full h-full pointer-events-none fill-none stroke-accent-gold stroke-[1.8px] opacity-85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                    preserveAspectRatio="none"
                  >
                    <path d="M 0,125 L 0,7.5 C 0,6 8,5.5 12,5.1 C 12,3.8 22,3.2 28,2.5 C 28,1.7 38,1.2 44,0.6 C 47,0.2 49,0 50,0 C 51,0 53,0.2 56,0.6 C 62,1.2 72,1.7 72,2.5 C 78,3.2 88,3.8 88,5.1 C 92,5.5 100,6 100,7.5 L 100,125" />
                  </svg>

                  {/* Floating Rating Badge (Inspired by Reference Design) */}
                  <div className="absolute bottom-2.5 right-2.5 z-10 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10.5px] font-bold text-slate-800 shadow-sm border border-white/90 flex items-center space-x-1 pointer-events-none transition-opacity duration-200 group-hover:opacity-0 sm:group-hover:opacity-0">
                    <span className="text-amber-500 text-[11px]">★</span>
                    <span>{product.rating || "4.8"}</span>
                    <span className="text-slate-400 font-normal">({product.reviewsCount ? `${product.reviewsCount}+` : "120+"})</span>
                  </div>

                  {/* Subtle Gradient Shade at Hem */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Quick Buy Slide-Up Frosted Glass Dock (DESKTOP HOVER ONLY) */}
                  <div className="hidden md:block absolute inset-x-0 bottom-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none group-hover:pointer-events-auto">
                    <div className="bg-white/95 backdrop-blur-md px-2 py-2.5 border-t border-accent-gold/40 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] flex flex-col items-center space-y-1.5">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-slate-700 flex items-center space-x-1 select-none">
                        <span className="text-accent-gold text-[8px]">✦</span>
                        <span>Quick Buy Size</span>
                        <span className="text-accent-gold text-[8px]">✦</span>
                      </span>
                      <div className="flex justify-center items-center gap-1.5 w-full px-1">
                        {(product.sizes && product.sizes.length > 0
                          ? product.sizes.filter((s) => s !== "S")
                          : ["M", "L", "XL", "XXL"]
                        ).map((size) => {
                          const isOutOfStock =
                            product.sizesStock &&
                            product.sizesStock[size] !== undefined &&
                            product.sizesStock[size] <= 0;
                          return (
                            <button
                              key={size}
                              disabled={isOutOfStock}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleQuickAddToCart(product, size);
                              }}
                              className={`flex-1 h-7 rounded text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center font-sans ${
                                isOutOfStock
                                  ? "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed line-through"
                                  : "bg-white text-slate-800 border border-slate-200 hover:border-[#8a1c14] hover:bg-[#8a1c14] hover:text-white shadow-xs hover:shadow-sm active:scale-95"
                              }`}
                              title={
                                isOutOfStock
                                  ? `${size} (Out of Stock)`
                                  : `Add Size ${size} to Bag`
                              }
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Info area */}
                <div className="pt-3 pb-1 px-1 flex flex-col flex-grow justify-between space-y-2 text-left">
                  <div className="space-y-1">
                    {/* Category & Fabric Tag */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9.5px] text-[#c5a880] uppercase tracking-[0.18em] font-extrabold block truncate">
                        {product.fabric ? `${product.fabric} • ` : ""}{product.category || "Ethnic Wear"}
                      </span>
                      {product.colorVariants && product.colorVariants.length > 1 && (
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
                          {product.colorVariants.length} Colors
                        </span>
                      )}
                    </div>

                    {/* Product Title (1-Tap Navigates Instantly) */}
                    <h3 className="text-xs sm:text-[13px] font-sans font-medium text-slate-900 leading-snug group-hover:text-[#8a1c14] transition-colors duration-200 line-clamp-2 h-9">
                      <Link to={`/product/${product.slug}`}>
                        {product.name}
                      </Link>
                    </h3>

                    {/* Available Sizes Micro-Indicator */}
                    <div className="flex items-center space-x-1.5 pt-0.5 font-sans text-[10px]">
                      <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Sizes:</span>
                      <div className="flex items-center space-x-1">
                        {(product.sizes && product.sizes.length > 0
                          ? product.sizes.filter((s) => s !== "S")
                          : ["M", "L", "XL", "XXL"]
                        ).map((sz) => {
                          const isOut =
                            product.sizesStock &&
                            product.sizesStock[sz] !== undefined &&
                            product.sizesStock[sz] <= 0;
                          return (
                            <span
                              key={sz}
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                isOut
                                  ? "text-slate-300 border-slate-200 line-through bg-slate-50"
                                  : "text-slate-700 border-slate-200 bg-white shadow-2xs"
                              }`}
                            >
                              {sz}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline space-x-2 pt-0.5 font-sans">
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 font-sans tracking-tight">
                      ₹{product.sellingPrice}
                    </span>
                    {product.mrp > product.sellingPrice && (
                      <>
                        <span className="text-[11px] text-slate-400 line-through font-normal font-sans">
                          ₹{product.mrp}
                        </span>
                        <span className="text-[8.5px] font-extrabold text-[#8a1c14] bg-rose-50 border border-rose-200/70 px-1.5 py-0.2 uppercase tracking-wider font-sans rounded">
                          {Math.round(
                            ((product.mrp - product.sellingPrice) /
                              product.mrp) *
                              100,
                          )}
                          % OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* Prominent Full-Width ADD TO CART Button (Subtle 3D Glassy) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuickAddToCart(product, "M");
                    }}
                    className="w-full bg-gradient-to-b from-[#9b2017] to-[#7a1810] hover:from-[#a8251b] hover:to-[#861c13] text-white font-extrabold text-[11px] uppercase tracking-[0.15em] py-2.5 rounded-xl border border-rose-300/25 shadow-[0_4px_14px_rgba(138,28,20,0.22),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(138,28,20,0.38),inset_0_1px_0_rgba(255,255,255,0.35)] active:scale-[0.98] active:translate-y-[1px] transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1.5 mt-1"
                  >
                    <span>ADD TO CART</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 4: ROYAL BRAND PILLARS */}
      <section className="py-16 border-t border-slate-200/50 bg-[#FBF9F5]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[10px] text-[#8a1c14] tracking-[0.25em] uppercase font-bold flex items-center justify-center space-x-2">
              <span className="h-[1px] w-6 bg-[#8a1c14]/30" />
              <span>The Pariwesh Standard</span>
              <span className="h-[1px] w-6 bg-[#8a1c14]/30" />
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-wide">
              The Essence of Royalty
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every creation honors time-tested Indian handicraft traditions blended with contemporary elegance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200/80 hover:border-accent-gold/60 p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-500 text-center flex flex-col items-center space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-accent-gold/40 flex items-center justify-center text-accent-gold group-hover:scale-110 group-hover:bg-[#8a1c14] group-hover:text-white transition-all duration-300 shadow-xs">
                <RiSparklingFill size={26} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-serif font-bold text-slate-900 tracking-wide uppercase">
                  Handcrafted with Love
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-light">
                  Meticulously hand-embroidered by generational artisans using authentic Zari, Resham, and Gotapatti threading.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200/80 hover:border-accent-gold/60 p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-500 text-center flex flex-col items-center space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-accent-gold/40 flex items-center justify-center text-accent-gold group-hover:scale-110 group-hover:bg-[#8a1c14] group-hover:text-white transition-all duration-300 shadow-xs">
                <RiShieldCheckLine size={26} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-serif font-bold text-slate-900 tracking-wide uppercase">
                  Tailored Precision Fit
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-light">
                  Curated in standard luxury sizes (M to XXL) with generous inner seam margins for effortless bespoke custom fitting.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200/80 hover:border-accent-gold/60 p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-500 text-center flex flex-col items-center space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-accent-gold/40 flex items-center justify-center text-accent-gold group-hover:scale-110 group-hover:bg-[#8a1c14] group-hover:text-white transition-all duration-300 shadow-xs">
                <RiTruckLine size={26} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-serif font-bold text-slate-900 tracking-wide uppercase">
                  Regal Muslin Packaging
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-light">
                  Every ensemble arrives wrapped in pure cotton muslin cloths nestled inside a royal rigid keepsake storage box.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: PATRON CHRONICLES (TESTIMONIALS & SOCIAL PROOF) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-[10px] text-[#8a1c14] tracking-[0.25em] uppercase font-bold flex items-center justify-center space-x-2">
            <span className="h-[1px] w-6 bg-[#8a1c14]/30" />
            <span>Royal Patrons</span>
            <span className="h-[1px] w-6 bg-[#8a1c14]/30" />
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-wide">
            Voices of Elegance
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Discover why connoisseurs across India celebrate their festive moments draped in PARIWESH.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Review 1 */}
          <div className="bg-white/60 hover:bg-white backdrop-blur-md p-7 rounded-2xl border border-slate-200/80 hover:border-accent-gold/50 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex text-amber-500 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <RiStarFill key={i} size={14} />
                  ))}
                </div>
                <RiDoubleQuotesL size={22} className="text-accent-gold/40" />
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-serif italic">
                "The embroidery on the Farshi Salwar set was beyond expectations. Wore it for my sister's Sangeet in Jaipur and received countless compliments."
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-sans">Ananya Sharma</h4>
                <p className="text-[10px] text-slate-400">Jaipur, Rajasthan</p>
              </div>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Verified Patron
              </span>
            </div>
          </div>

          {/* Review 2 */}
          <div className="bg-white/60 hover:bg-white backdrop-blur-md p-7 rounded-2xl border border-slate-200/80 hover:border-accent-gold/50 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex text-amber-500 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <RiStarFill key={i} size={14} />
                  ))}
                </div>
                <RiDoubleQuotesL size={22} className="text-accent-gold/40" />
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-serif italic">
                "Extremely comfortable yet looks so regal. The fabric breathes beautifully, doesn't crease easily, and the finishing is top-notch couture quality."
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-sans">Pooja Singhania</h4>
                <p className="text-[10px] text-slate-400">Mumbai, Maharashtra</p>
              </div>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Verified Patron
              </span>
            </div>
          </div>

          {/* Review 3 */}
          <div className="bg-white/60 hover:bg-white backdrop-blur-md p-7 rounded-2xl border border-slate-200/80 hover:border-accent-gold/50 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex text-amber-500 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <RiStarFill key={i} size={14} />
                  ))}
                </div>
                <RiDoubleQuotesL size={22} className="text-accent-gold/40" />
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-serif italic">
                "The Mehrab arch silhouette and bespoke fit in size XL felt made-to-measure. Pariwesh has become my undisputed go-to festive label."
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-sans">Dr. Meera Nambiar</h4>
                <p className="text-[10px] text-slate-400">Bengaluru, Karnataka</p>
              </div>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Verified Patron
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: ROYAL TRUST GUARANTEES BAR */}
      <section className="border-y border-slate-200/60 bg-white/80 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center space-y-1.5 p-2">
              <RiTruckLine size={24} className="text-accent-gold" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Free Express Shipping
              </h4>
              <p className="text-[10px] text-slate-500">Pan-India on all orders</p>
            </div>

            <div className="flex flex-col items-center space-y-1.5 p-2">
              <RiExchangeLine size={24} className="text-accent-gold" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                7-Day Easy Exchange
              </h4>
              <p className="text-[10px] text-slate-500">Hassle-free size & fit swaps</p>
            </div>

            <div className="flex flex-col items-center space-y-1.5 p-2">
              <RiSparklingFill size={24} className="text-accent-gold" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                100% Handcrafted
              </h4>
              <p className="text-[10px] text-slate-500">Authentic artisan weaving</p>
            </div>

            <div className="flex flex-col items-center space-y-1.5 p-2">
              <RiSecurePaymentLine size={24} className="text-accent-gold" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Secure Payments & COD
              </h4>
              <p className="text-[10px] text-slate-500">256-Bit SSL Encrypted</p>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default Home;

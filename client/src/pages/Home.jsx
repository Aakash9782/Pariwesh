import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SEO from "../components/common/SEO.jsx";
import ProductImageSlider from "../components/common/ProductImageSlider.jsx";
import Icon from "../theme/icons.jsx";
import { motion, AnimatePresence } from "framer-motion";
import HeroSlider from "../components/home/HeroSlider.jsx";
import CampaignBanners from "../components/home/CampaignBanners.jsx";
import RoyalWreathRing from "../components/home/RoyalWreathRing.jsx";
import Skeleton, { ProductSkeleton, HeroSkeleton } from "../components/common/Skeleton.jsx";
import { optimizeCloudinaryUrl } from "../utils/cloudinary.js";
import { addToCart } from "../redux/slices/cartSlice.js";
import { toggleWishlistProduct } from "../redux/slices/wishlistSlice.js";
import { trackAddToCart, trackAddToWishlist } from "../services/metaPixel.js";
import API from "../services/api.js";
import { useAlert } from "../contexts/AlertContext.jsx";
import { useSettings } from "../contexts/SettingsContext.jsx";
import { syncCartNow, syncWishlistNow } from "../services/hydrateCommerce.js";
import {
  RiHeartLine,
  RiScissorsLine,
  RiStarFill,
  RiTruckLine,
  RiExchangeLine,
  RiShieldCheckLine,
  RiSecurePaymentLine,
  RiDoubleQuotesL,
  RiAwardLine,
  RiLeafLine,
  RiShoppingBagLine,
  RiGiftLine,
  RiFileCopyLine,
  RiCheckLine,
  RiTimerLine,
  RiCoupon3Line,
} from "react-icons/ri";

const formatProductTitle = (name) => {
  if (!name) return "";
  return name
    .replace(/\s*-\s*-\s*/g, " - ")
    .replace(/\s*-\s*([a-zA-Z]+)-\s*$/g, " - $1")
    .replace(/\s{2,}/g, " ")
    .trim();
};

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
      trackAddToWishlist(prod);
    } else {
      showAlert("Removed from Wishlist Collection", "Wishlist");
    }
  };

  const {
    settings,
    isLoaded: settingsLoaded,
    loading: settingsLoading,
    isCountdownActive,
    isCampaignBannersActive,
    isSlideBarActive,
    slideshowImages,
  } = useSettings();

  const adConfig = React.useMemo(() => {
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
        const isDateValid = (!start || now >= start) && (!end || now <= end);

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
    return adState;
  }, [
    settings.festiveAdActive,
    settings.festiveAdTitle,
    settings.festiveAdSubtitle,
    settings.festiveAdCode,
    settings.festiveAdLink,
    settings.festiveAdTheme,
    settings.festiveBannerSettings,
  ]);

  const dynCampaignBanners = React.useMemo(() => {
    if (settings.homeCampaignBanners) {
      try {
        const parsed = JSON.parse(settings.homeCampaignBanners);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (b) => b && typeof b.image === "string" && b.image.trim() !== "",
          );
        }
      } catch (e) {}
    }
    return [];
  }, [settings.homeCampaignBanners]);

  const sliderConfig = React.useMemo(() => {
    const fallbackImages = [
      "https://res.cloudinary.com/ag1y6hht/image/upload/v1786455681/pariwesh/branding/k6antr9fp5fsmoh2rqje.webp",
      "https://res.cloudinary.com/ag1y6hht/image/upload/v1786455684/pariwesh/branding/afbm96t3d1zvhmzr2cyf.webp",
    ];
    return {
      active: isSlideBarActive,
      images: slideshowImages.length > 0 ? slideshowImages : fallbackImages,
    };
  }, [isSlideBarActive, slideshowImages]);

  const [activeSlide, setActiveSlide] = useState(0);

  // Dynamic products catalog state with Instant Cache (Stale-While-Revalidate)
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem("pariwesh_home_products_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [productsLoading, setProductsLoading] = useState(() => {
    try {
      const cached = localStorage.getItem("pariwesh_home_products_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch (e) {}
    return true;
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedCardSizes, setSelectedCardSizes] = useState({});
  const [activeProductTab, setActiveProductTab] = useState("all");
  const [homeVisibleCount, setHomeVisibleCount] = useState(8);
  const [couponCopied, setCouponCopied] = useState(false);
  const [addedSuccessId, setAddedSuccessId] = useState(null);
  const [quickSizeProduct, setQuickSizeProduct] = useState(null);

  const dynCategories = React.useMemo(() => {
    if (settings.homeCategories) {
      try {
        const parsed = JSON.parse(settings.homeCategories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((cat) => ({
            title: cat.title || "Collection",
            path: cat.path || "/shop",
            image: cat.image || "",
          }));
        }
      } catch (e) {}
    }
    return [
      {
        title: "Suit Sets",
        path: "/shop?category=suits",
        image:
          "https://res.cloudinary.com/ag1y6hht/image/upload/v1789573547/pariwesh/branding/goo9hcxm9dxxkm6ptbm7.jpg",
      },
      {
        title: "Kurtis & Tunics",
        path: "/shop?category=kurtis",
        image:
          "https://res.cloudinary.com/ag1y6hht/image/upload/v1786469512/pariwesh/branding/koccofqqa25dpzb0tnbs.jpg",
      },
      {
        title: "Co-Ord Sets",
        path: "/shop?category=co-ord-sets",
        image:
          "https://res.cloudinary.com/ag1y6hht/image/upload/v1789573547/pariwesh/branding/veu17up5chcbjnawwy4m.jpg",
      },
      {
        title: "Best Sellers",
        path: "/shop?tag=Best Seller",
        image:
          "https://res.cloudinary.com/ag1y6hht/image/upload/v1786469513/pariwesh/branding/pplpu2q5mphur1ibgoye.webp",
      },
      {
        title: "New Arrivals",
        path: "/shop?tag=New Arrival",
        image:
          "https://res.cloudinary.com/ag1y6hht/image/upload/v1786469514/pariwesh/branding/kamnlpss5rjxgshulntw.webp",
      },
    ];
  }, [settings.homeCategories]);

  const dynStoryImage =
    settings.homeStoryImage ||
    "https://res.cloudinary.com/ag1y6hht/image/upload/v1789573299/pariwesh/branding/hpb8m1di4ytmpgczczkn.jpg";

  const [timeLeft, setTimeLeft] = useState(null);
  const [isCountdownExpired, setIsCountdownExpired] = useState(false);

  const effectiveCountdownDate = React.useMemo(() => {
    if (settings.saleEventActive && settings.saleEndDate) {
      return settings.saleEndDate;
    }
    return settings.countdownEndDate || null;
  }, [settings.saleEventActive, settings.saleEndDate, settings.countdownEndDate]);

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
                featured: p.featured === true || p.featured === "true",
                trending: p.trending === true || p.trending === "true",
                bestSeller: p.bestSeller === true || p.bestSeller === "true",
                newArrival: p.newArrival === true || p.newArrival === "true",
                recommended: p.recommended === true || p.recommended === "true",
                fabric: p.fabric || "",
                rating: p.rating !== undefined ? p.rating : 0,
                reviewsCount: p.reviewsCount !== undefined ? p.reviewsCount : 0,
                sizes:
                  Array.isArray(p.sizes) && p.sizes.length > 0
                    ? p.sizes
                    : ["M", "L", "XL", "XXL"],
                sizesStock: p.sizesStock || { M: 10, L: 10, XL: 10, XXL: 10 },
              };
            });
          setProducts(dbProducts);
          try {
            localStorage.setItem(
              "pariwesh_home_products_cache",
              JSON.stringify(dbProducts),
            );
          } catch (e) {}
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

  useEffect(() => {
    if (!sliderConfig.active || sliderConfig.images.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sliderConfig.images.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [sliderConfig.active, sliderConfig.images.length]);

  useEffect(() => {
    if (!isCountdownActive) return;

    const calculateTime = () => {
      if (effectiveCountdownDate) {
        const target = new Date(effectiveCountdownDate).getTime();
        const now = Date.now();
        const difference = target - now;

        if (difference <= 0) {
          setIsCountdownExpired(true);
          setTimeLeft(null);
          return false;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60),
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setIsCountdownExpired(false);
        setTimeLeft({ days, hours, minutes, seconds });
        return true;
      } else {
        // Cycling 24-hr fallback mode to end of current day
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        const diff = endOfDay.getTime() - now.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setIsCountdownExpired(false);
        setTimeLeft({ days: 0, hours, minutes, seconds });
        return true;
      }
    };

    calculateTime();
    const timer = setInterval(() => {
      const shouldContinue = calculateTime();
      if (!shouldContinue) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountdownActive, effectiveCountdownDate]);

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
    trackAddToCart(product, 1, size);
    setAddedSuccessId(product._id);
    setTimeout(() => setAddedSuccessId(null), 1800);
    showAlert(
      `"${product.name}" (Size: ${size}) has been added to your shopping bag!`,
      "Added to Bag",
    );
  };

  const activePromoCode =
    settings.salePromoCode || settings.festiveAdCode || "PARIWESHGOLD";

  const promoCodeDiscountText =
    settings.saleDiscountText || "Flat 15% OFF On Handcrafted Ensembles Above ₹1,499";

  const handleCopyCoupon = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code.trim().toUpperCase());
    setCouponCopied(true);
    showAlert(
      `Promo code "${code.trim().toUpperCase()}" copied! Apply at checkout.`,
      "Coupon Copied",
    );
    setTimeout(() => setCouponCopied(false), 2500);
  };

  const displayedHomeProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    let list = [...products];

    if (activeProductTab === "best-seller") {
      const filtered = list.filter((p) => p.bestSeller || p.trending || /best/i.test(p.tag || ""));
      return filtered.length > 0 ? filtered : list.slice(0, 8);
    }
    if (activeProductTab === "new-arrival") {
      const filtered = list.filter((p) => p.newArrival || /new/i.test(p.tag || ""));
      return filtered.length > 0 ? filtered : list.slice(0, 8);
    }
    if (activeProductTab === "under-2499") {
      const filtered = list.filter((p) => Number(p.sellingPrice) <= 2499);
      return filtered.length > 0 ? filtered : list;
    }

    return list.sort((a, b) => {
      if (a.trending && !b.trending) return -1;
      if (!a.trending && b.trending) return 1;
      return 0;
    });
  }, [products, activeProductTab]);

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
      {settingsLoading ? (
        <HeroSkeleton />
      ) : (
        <HeroSlider
          sliderConfig={sliderConfig}
          activeSlide={activeSlide}
          setActiveSlide={setActiveSlide}
        />
      )}

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
        {/* EXQUISITE CATEGORY SELECTION: Royal Golden Laurel Wreath + Kundan Beaded Halo */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 md:pt-4">
          <div className="flex flex-col space-y-6">
            <div className="text-center space-y-1.5">
              <div className="flex items-center justify-center space-x-2 text-[#c5a880]">
                <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c5a880]" />
                <span className="text-[10px] text-[#8a1c14] tracking-[0.25em] uppercase font-extrabold">
                  Shop by Category
                </span>
                <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c5a880]" />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif text-textPrimary tracking-tight">
                Boutique Curations
              </h2>
            </div>

            {/* DESKTOP VIEW: Centered Airy Row with Royal Laurel Foliage Wreaths */}
            <div className="hidden md:flex items-start justify-center gap-6 lg:gap-10 xl:gap-14 pt-3 pb-2">
              {settingsLoading
                ? Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="flex flex-col items-center space-y-3">
                      <Skeleton variant="circle" className="w-28 h-28 lg:w-32 lg:h-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))
                : dynCategories.map((cat, idx) => (
                    <Link
                      key={idx}
                      to={cat.path}
                      className="group relative flex flex-col items-center text-center cursor-pointer select-none transition-transform duration-300 hover:-translate-y-1.5"
                    >
                      {/* Circular Avatar wrapped inside Royal Foliage Wreath (Guaranteed Zero Overlap) */}
                      <RoyalWreathRing className="w-32 h-32 lg:w-36 lg:h-36">
                        <img
                          src={optimizeCloudinaryUrl(cat.image, 280)}
                          alt={cat.title}
                          loading="lazy"
                          decoding="async"
                          width="112"
                          height="112"
                          className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />
                      </RoyalWreathRing>

                      {/* Title & Subtle Indicator Underline */}
                      <div className="mt-2.5 flex flex-col items-center space-y-0.5">
                        <h3 className="text-sm lg:text-[15px] font-serif font-semibold text-slate-800 tracking-wide group-hover:text-[#8a1c14] transition-colors line-clamp-1">
                          {cat.title}
                        </h3>
                        <span className="h-[1.5px] w-0 bg-[#8a1c14] group-hover:w-8 transition-all duration-300 rounded-full" />
                      </div>
                    </Link>
                  ))}
            </div>

            {/* MOBILE VIEW: Clean 3 + 2 Non-Slider Grid (100% visible, zero horizontal overflow) */}
            <div className="md:hidden pt-2 pb-1">
              {settingsLoading ? (
                <div className="grid grid-cols-3 gap-x-2 gap-y-4 max-w-[360px] mx-auto">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="flex flex-col items-center space-y-2">
                      <Skeleton variant="circle" className="w-[84px] h-[84px]" />
                      <Skeleton className="h-2.5 w-14" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-w-[370px] mx-auto px-2">
                  {/* Top Row: First 3 Categories */}
                  <div className="grid grid-cols-3 gap-x-1.5 gap-y-2 justify-items-center">
                    {dynCategories.slice(0, 3).map((cat, idx) => (
                      <Link
                        key={idx}
                        to={cat.path}
                        className="group flex flex-col items-center text-center cursor-pointer select-none active:scale-95 transition-transform duration-150 w-full"
                      >
                        <RoyalWreathRing className="w-[100px] h-[100px] xs:w-[108px] xs:h-[108px]">
                          <img
                            src={optimizeCloudinaryUrl(cat.image, 200)}
                            alt={cat.title}
                            loading="lazy"
                            decoding="async"
                            width="78"
                            height="78"
                            className="w-full h-full object-cover object-top"
                          />
                        </RoyalWreathRing>

                        <h4 className="mt-1 text-[11px] xs:text-[12px] font-serif font-semibold text-slate-800 tracking-tight group-hover:text-[#8a1c14] transition-colors leading-tight line-clamp-1">
                          {cat.title}
                        </h4>
                      </Link>
                    ))}
                  </div>

                  {/* Bottom Row: Remaining Categories Centered */}
                  {dynCategories.length > 3 && (
                    <div className="flex justify-center gap-x-4 xs:gap-x-6 mt-2">
                      {dynCategories.slice(3).map((cat, idx) => (
                        <Link
                          key={idx + 3}
                          to={cat.path}
                          className="group flex flex-col items-center text-center cursor-pointer select-none active:scale-95 transition-transform duration-150 w-[100px] xs:w-[108px]"
                        >
                          <RoyalWreathRing className="w-[100px] h-[100px] xs:w-[108px] xs:h-[108px]">
                            <img
                              src={optimizeCloudinaryUrl(cat.image, 200)}
                              alt={cat.title}
                              loading="lazy"
                              decoding="async"
                              width="78"
                              height="78"
                              className="w-full h-full object-cover object-top"
                            />
                          </RoyalWreathRing>

                          <h4 className="mt-1 text-[11px] xs:text-[12px] font-serif font-semibold text-slate-800 tracking-tight group-hover:text-[#8a1c14] transition-colors leading-tight line-clamp-1">
                            {cat.title}
                          </h4>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

      {/* 1-TAP LUXURY FESTIVE COUPON STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FAF7F2] via-[#FFFDF9] to-[#FAF7F2] border border-[#c5a880]/40 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-[#c5a880]/50 flex items-center justify-center text-[#8a1c14] shrink-0 shadow-2xs">
              <RiGiftLine size={22} />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#8a1c14]">
                  Exclusive Festive Voucher
                </span>
                <span className="text-[8.5px] bg-red-100 text-red-700 px-2 py-0.2 rounded font-bold uppercase tracking-wider">
                  Limited Offer
                </span>
              </div>
              <p className="text-xs sm:text-sm font-serif font-medium text-slate-900 mt-0.5">
                {promoCodeDiscountText}
              </p>
            </div>
          </div>

          {/* Click to Copy Voucher Badge */}
          <button
            type="button"
            onClick={() => handleCopyCoupon(activePromoCode)}
            className="flex items-center space-x-2.5 bg-white hover:bg-amber-50/60 border border-dashed border-[#8a1c14]/50 hover:border-[#8a1c14] px-4 py-2.5 rounded-xl shadow-2xs transition-all duration-200 cursor-pointer group active:scale-95 shrink-0"
            title="Click to copy coupon code"
          >
            <span className="text-xs font-mono font-bold tracking-wider text-[#8a1c14]">
              {activePromoCode}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              {couponCopied ? "✓ Copied!" : "Tap to Copy"}
            </span>
            {couponCopied ? (
              <RiCheckLine className="text-emerald-600 text-sm" />
            ) : (
              <RiFileCopyLine className="text-slate-400 group-hover:text-slate-700 text-sm" />
            )}
          </button>
        </div>
      </section>

      {/* CAMPAIGN BANNER CARDS GRID (Mobile-First visual cards block) */}
      {settingsLoaded && isCampaignBannersActive && dynCampaignBanners.length > 0 && (
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
                src={optimizeCloudinaryUrl(dynStoryImage, 700)}
                alt="Atelier Craftsmanship"
                loading="lazy"
                decoding="async"
                width="600"
                height="450"
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
          <div className="bg-[#FAF7F3] border border-borderLight p-5 xs:p-6 sm:p-8 md:p-12 flex flex-col justify-between text-left space-y-6 sm:space-y-8 rounded-2xl">
            <div className="space-y-3 sm:space-y-4">
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
            <div className="grid grid-cols-3 gap-2 xs:gap-4 border-y border-[#8a1c14]/10 py-4 sm:py-6">
              <div>
                <h4 className="text-xl sm:text-2xl font-serif text-textPrimary font-semibold">
                  150+
                </h4>
                <p className="text-[8.5px] sm:text-[9px] uppercase tracking-widest text-textSecondary mt-0.5">
                  Unique Styles
                </p>
              </div>
              <div>
                <h4 className="text-xl sm:text-2xl font-serif text-textPrimary font-semibold">
                  4.9★
                </h4>
                <p className="text-[8.5px] sm:text-[9px] uppercase tracking-widest text-textSecondary mt-0.5">
                  Loved By You
                </p>
              </div>
              <div>
                <h4 className="text-xl sm:text-2xl font-serif text-textPrimary font-semibold">
                  100%
                </h4>
                <p className="text-[8.5px] sm:text-[9px] uppercase tracking-widest text-textSecondary mt-0.5">
                  Hand Finished
                </p>
              </div>
            </div>

            {/* LUXURY ROYAL COUNTDOWN WIDGET */}
            {settingsLoaded && isCountdownActive && !isCountdownExpired && timeLeft && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] border border-[#c5a880]/40 p-3.5 sm:p-5 shadow-sm space-y-3 sm:space-y-3.5">
                {/* Subtle Decorative Golden Corner Accent */}
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-[#c5a880]/15 to-transparent rounded-bl-full pointer-events-none" />

                {/* Top Status Header */}
                <div className="flex items-center justify-between gap-2 relative z-10">
                  <div className="inline-flex items-center space-x-1.5 bg-rose-500/10 text-[#8a1c14] border border-rose-200/70 px-2.5 py-0.5 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8a1c14]"></span>
                    </span>
                    <span className="text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest">
                      Live Festive Offer
                    </span>
                  </div>

                  <span className="text-[9.5px] sm:text-[10px] text-slate-500 font-medium flex items-center space-x-1">
                    <RiTimerLine size={13} className="text-[#8a1c14]" />
                    <span>Ending Soon</span>
                  </span>
                </div>

                {/* Main Offer Title / Message */}
                <h4 className="text-xs sm:text-sm font-serif font-bold text-slate-900 tracking-wide leading-snug line-clamp-2">
                  {settings.countdownTitle || "Exclusive Limited-Period Collection Ends In:"}
                </h4>

                {/* Symmetrical 4-Column Luxury Digit Tiles with Gold Accents */}
                <div className="grid grid-cols-4 gap-1.5 xs:gap-2 sm:gap-2.5 my-2">
                  {/* Days */}
                  <div className="bg-gradient-to-b from-white to-[#FDFBF7] border border-[#c5a880]/40 rounded-xl py-2 sm:py-2.5 px-1 shadow-2xs flex flex-col items-center justify-center text-center">
                    <span className="text-xl xs:text-2xl sm:text-3xl font-serif font-bold text-slate-900 leading-none">
                      {String(timeLeft.days || 0).padStart(2, "0")}
                    </span>
                    <span className="text-[7.5px] sm:text-[8.5px] uppercase font-bold tracking-[0.16em] text-[#8a1c14] mt-1">
                      Days
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="bg-gradient-to-b from-white to-[#FDFBF7] border border-[#c5a880]/40 rounded-xl py-2 sm:py-2.5 px-1 shadow-2xs flex flex-col items-center justify-center text-center">
                    <span className="text-xl xs:text-2xl sm:text-3xl font-serif font-bold text-slate-900 leading-none">
                      {String(timeLeft.hours || 0).padStart(2, "0")}
                    </span>
                    <span className="text-[7.5px] sm:text-[8.5px] uppercase font-bold tracking-[0.16em] text-[#8a1c14] mt-1">
                      Hours
                    </span>
                  </div>

                  {/* Minutes */}
                  <div className="bg-gradient-to-b from-white to-[#FDFBF7] border border-[#c5a880]/40 rounded-xl py-2 sm:py-2.5 px-1 shadow-2xs flex flex-col items-center justify-center text-center">
                    <span className="text-xl xs:text-2xl sm:text-3xl font-serif font-bold text-slate-900 leading-none">
                      {String(timeLeft.minutes || 0).padStart(2, "0")}
                    </span>
                    <span className="text-[7.5px] sm:text-[8.5px] uppercase font-bold tracking-[0.16em] text-[#8a1c14] mt-1">
                      Mins
                    </span>
                  </div>

                  {/* Seconds */}
                  <div className="bg-gradient-to-b from-rose-50/50 to-white border border-[#8a1c14]/35 rounded-xl py-2 sm:py-2.5 px-1 shadow-2xs flex flex-col items-center justify-center text-center">
                    <span className="text-xl xs:text-2xl sm:text-3xl font-serif font-bold text-[#8a1c14] leading-none animate-pulse">
                      {String(timeLeft.seconds || 0).padStart(2, "0")}
                    </span>
                    <span className="text-[7.5px] sm:text-[8.5px] uppercase font-bold tracking-[0.16em] text-[#8a1c14] mt-1">
                      Secs
                    </span>
                  </div>
                </div>

                {/* 1-Tap Coupon Voucher Ticket Strip - Guaranteed Zero Truncation */}
                {activePromoCode && (
                  <div
                    onClick={() => handleCopyCoupon(activePromoCode)}
                    className="group/coupon relative overflow-hidden bg-white/95 border border-dashed border-[#c5a880] rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-2xs cursor-pointer hover:border-[#8a1c14] hover:bg-amber-50/30 transition-all duration-200"
                    title="Tap anywhere to copy code"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 border border-[#c5a880]/40 flex items-center justify-center text-[#8a1c14] shrink-0 group-hover/coupon:scale-105 transition-transform">
                        <RiCoupon3Line size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-bold block leading-none">
                          Promo Code
                        </span>
                        <span className="text-xs sm:text-sm font-mono font-extrabold tracking-wider text-slate-900 block mt-0.5 truncate">
                          {activePromoCode}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCoupon(activePromoCode);
                      }}
                      className="inline-flex items-center space-x-1 bg-[#8a1c14] hover:bg-[#6e140e] text-white text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      {couponCopied ? (
                        <>
                          <RiCheckLine size={13} className="text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <RiFileCopyLine size={12} className="opacity-80" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <Link
                to="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#8a1c14] hover:bg-[#6e140e] text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 active:scale-98 text-center cursor-pointer"
              >
                <span>Explore Full Collection</span>
                <span>→</span>
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

        {/* Step A: Luxury Filter Tabs */}
        {!productsLoading && products.length > 0 && (
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {[
              { id: "all", label: "All Styles" },
              { id: "best-seller", label: "Best Sellers" },
              { id: "new-arrival", label: "New Arrivals" },
              { id: "under-2499", label: "Under ₹2,499" },
            ].map((tab) => {
              const isActive = activeProductTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveProductTab(tab.id);
                    setHomeVisibleCount(8);
                  }}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-medium tracking-wide transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-[#8a1c14] text-white shadow-md shadow-[#8a1c14]/20 scale-102 font-semibold"
                      : "bg-[#FAF7F3] hover:bg-[#F2ECE4] text-slate-700 border border-slate-200/70 hover:border-[#c5a880]/50"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

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
        ) : displayedHomeProducts.length === 0 ? (
          <div className="py-12 text-center bg-[#FAF7F3] rounded-xl border border-slate-200/60 max-w-xl mx-auto px-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              No products found in this category
            </p>
            <button
              onClick={() => setActiveProductTab("all")}
              className="mt-3 text-xs font-bold text-[#8a1c14] underline cursor-pointer"
            >
              View All Styles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 sm:gap-y-8">
            {displayedHomeProducts.slice(0, homeVisibleCount).map((product, pIdx) => {
                let badgeText = "";
                if (
                  product.tag &&
                  !["regular", "normal", "standard"].includes(
                    product.tag.trim().toLowerCase(),
                  )
                ) {
                  badgeText = product.tag;
                } else if (product.bestSeller) {
                  badgeText = "Best Seller";
                } else if (product.newArrival) {
                  badgeText = "New Arrival";
                } else if (product.trending) {
                  badgeText = "Trending";
                }

                return (
                  <div
                    key={product._id}
                    className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/75 hover:border-[#c5a880]/60 shadow-[0_3px_14px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(138,28,20,0.12)] hover:-translate-y-1 flex flex-col h-full transition-all duration-300"
                  >
                    {/* Media Container: Full Bleed (Edge-to-edge, zero margin, no awkward arch cut) */}
                    <div className="aspect-[3/4] sm:aspect-[4/5] overflow-hidden relative block bg-[#FBF9F5]">


                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleWishlistToggle(product);
                        }}
                        className={`absolute top-2.5 right-2.5 z-20 w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 shadow-sm border border-white/60 cursor-pointer ${
                          wishlistItems.some((p) => p._id === product._id)
                            ? "bg-white text-[#8a1c14] scale-105 ring-2 ring-[#8a1c14]/30"
                            : "bg-white/90 hover:bg-white text-slate-700 hover:text-[#8a1c14] active:scale-95"
                        }`}
                        aria-label="Wishlist"
                      >
                        {wishlistItems.some((p) => p._id === product._id) ? (
                          <Icon name="HeartFill" size={14} />
                        ) : (
                          <Icon name="HeartOutline" size={14} />
                        )}
                      </button>

                      {/* Image / Video Link */}
                      <Link
                        to={`/product/${product.slug}`}
                        className="w-full h-full block"
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
                              priority={pIdx < 2}
                            />
                          </div>
                        )}
                      </Link>

                      {/* Floating Rating Badge */}
                      {Number(product.reviewsCount) > 0 && (
                        <div className="absolute bottom-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-800 shadow-xs border border-white/80 flex items-center space-x-1 pointer-events-none">
                          <span className="text-amber-500 text-[10.5px]">★</span>
                          <span>{Number(product.rating || 4.8).toFixed(1)}</span>
                          <span className="text-slate-400 font-normal">({product.reviewsCount})</span>
                        </div>
                      )}

                      {/* Floating Luxury Quick-Add Bag Button (Myntra/Suitswala Style) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (product.sizes && product.sizes.length > 1) {
                            setQuickSizeProduct(product);
                          } else {
                            handleQuickAddToCart(product, product.sizes?.[0] || "M");
                          }
                        }}
                        className={`absolute bottom-2.5 right-2.5 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer active:scale-90 ${
                          addedSuccessId === product._id
                            ? "bg-emerald-600 text-white"
                            : "bg-white/95 hover:bg-[#8a1c14] text-slate-800 hover:text-white border border-white hover:border-[#8a1c14]"
                        }`}
                        title="Quick Add to Bag"
                        aria-label="Add to bag"
                      >
                        {addedSuccessId === product._id ? (
                          <RiCheckLine size={16} className="animate-bounce" />
                        ) : (
                          <RiShoppingBagLine size={15} />
                        )}
                      </button>
                    </div>

                    {/* Info Area - Clean & Balanced Typography */}
                    <div className="p-2.5 sm:p-3 flex flex-col flex-grow justify-between space-y-1.5 text-left bg-white">
                      <div className="space-y-1">
                        {/* Category & Clean Fabric Tag + Badge */}
                        <div className="flex items-center justify-between gap-1.5 min-h-[18px]">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            {badgeText && (
                              <span className="text-[7.5px] sm:text-[8px] bg-[#8a1c14] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 leading-none">
                                {badgeText
                                  .replace(/Everyday Essential/i, "Essential")
                                  .replace(/New Arrival/i, "New")
                                  .replace(/Best Seller/i, "Bestseller")}
                              </span>
                            )}
                            <span className="text-[9px] sm:text-[9.5px] text-[#c5a880] uppercase tracking-[0.16em] font-extrabold truncate">
                              {product.fabric && product.fabric.length <= 18 ? `${product.fabric} • ` : ""}
                              {(product.category || "Ethnic Wear").replace(/-/g, " ")}
                            </span>
                          </div>
                          {product.colorVariants && product.colorVariants.length > 1 && (
                            <span className="text-[8.5px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
                              {product.colorVariants.length} Colors
                            </span>
                          )}
                        </div>

                        {/* Product Title */}
                        <h3 className="text-xs sm:text-[13px] font-sans font-medium text-slate-900 leading-snug group-hover:text-[#8a1c14] transition-colors duration-200 line-clamp-2 min-h-[2rem]">
                          <Link to={`/product/${product.slug}`}>
                            {formatProductTitle(product.name)}
                          </Link>
                        </h3>

                        {/* Available Sizes Hint */}
                        <div className="flex items-center space-x-1 text-[9px] text-slate-400 font-sans pt-0.5">
                          <span className="font-semibold uppercase text-[8px] tracking-wider text-slate-400">Sizes:</span>
                          <span className="font-medium text-slate-600 truncate">
                            {product.sizes && product.sizes.length > 0
                              ? product.sizes.join(", ")
                              : "M, L, XL, XXL"}
                          </span>
                        </div>
                      </div>

                      {/* Pricing Row - 100% UNTOUCHED */}
                      <div className="flex items-baseline space-x-2 pt-1 font-sans">
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
                    </div>
                  </div>
            );
          })}
          </div>
        )}

        {/* Show More / Explore Full Collection Actions (Shopify/Flipkart Architecture) */}
        {!productsLoading && displayedHomeProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {displayedHomeProducts.length > homeVisibleCount && (
              <button
                type="button"
                onClick={() => setHomeVisibleCount((prev) => prev + 8)}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white hover:bg-[#FAF7F3] text-slate-800 hover:text-[#8a1c14] border border-[#c5a880]/60 hover:border-[#8a1c14] px-7 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-2xs hover:shadow-sm transition-all duration-300 cursor-pointer active:scale-95"
              >
                <span>Show More Ensembles</span>
              </button>
            )}
            <Link
              to="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#8a1c14] hover:bg-[#6e140e] text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-95 text-center"
            >
              <span>Explore Full Collection →</span>
            </Link>
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
                <RiHeartLine size={26} />
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
              <RiScissorsLine size={24} className="text-accent-gold" />
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

      {/* QUICK SIZE SELECTOR BOTTOM SHEET / DRAWER (Myntra / Zara Style Mobile UX) */}
      <AnimatePresence>
        {quickSizeProduct && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickSizeProduct(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Header: Product Preview & Dismiss */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={optimizeCloudinaryUrl(
                      quickSizeProduct.images?.[0] || quickSizeProduct.image,
                      120,
                    )}
                    alt={quickSizeProduct.name}
                    className="w-12 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {formatProductTitle(quickSizeProduct.name)}
                    </h4>
                    <div className="flex items-baseline space-x-2 mt-0.5">
                      <span className="text-sm font-extrabold text-[#8a1c14]">
                        ₹{quickSizeProduct.sellingPrice}
                      </span>
                      {quickSizeProduct.mrp > quickSizeProduct.sellingPrice && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{quickSizeProduct.mrp}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickSizeProduct(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors text-xs font-bold"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Size Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Select Your Size
                  </span>
                  <span className="text-[10px] text-slate-400">Tap to add directly</span>
                </div>

                <div className="grid grid-cols-4 gap-2.5 pt-1 pb-2">
                  {(quickSizeProduct.sizes && quickSizeProduct.sizes.length > 0
                    ? quickSizeProduct.sizes
                    : ["M", "L", "XL", "XXL"]
                  ).map((sz) => {
                    const isOut =
                      quickSizeProduct.sizesStock &&
                      quickSizeProduct.sizesStock[sz] !== undefined &&
                      quickSizeProduct.sizesStock[sz] <= 0;

                    return (
                      <button
                        key={sz}
                        type="button"
                        disabled={isOut}
                        onClick={() => {
                          handleQuickAddToCart(quickSizeProduct, sz);
                          setQuickSizeProduct(null);
                        }}
                        className={`h-12 rounded-xl text-xs uppercase transition-all duration-150 flex items-center justify-center cursor-pointer font-bold ${
                          isOut
                            ? "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed line-through"
                            : "bg-[#FAF7F3] hover:bg-[#8a1c14] hover:text-white text-slate-800 border border-slate-200 active:scale-95 shadow-2xs hover:shadow-xs"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;

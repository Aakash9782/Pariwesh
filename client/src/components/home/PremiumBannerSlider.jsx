import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../../theme/icons.jsx";

const getBannerTheme = (themeName) => {
  switch (themeName) {
    case "royal-gold":
      return {
        wrapper:
          "bg-[linear-gradient(135deg,#0a0702_0%,#1c1407_30%,#3d2b0e_50%,#1c1407_70%,#0a0702_100%)] border-amber-500/35 text-amber-100",
        badge: "bg-amber-500/20 text-amber-250 border-amber-500/35",
        btnGrab:
          "bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.25)]",
        btnCoupon:
          "bg-amber-955/40 border-amber-500/30 text-amber-205 hover:border-amber-450 hover:bg-amber-955/60",
        sparkle: "text-amber-400",
      };
    case "rose-crimson":
      return {
        wrapper:
          "bg-[linear-gradient(135deg,#0d0204_0%,#24070e_30%,#4a0e1b_50%,#24070e_70%,#0d0204_100%)] border-rose-500/35 text-rose-100",
        badge: "bg-rose-500/20 text-rose-250 border-rose-500/35",
        btnGrab:
          "bg-gradient-to-r from-rose-400 to-rose-600 hover:from-rose-300 hover:to-rose-500 text-neutral-950 shadow-[0_0_15px_rgba(244,63,94,0.25)]",
        btnCoupon:
          "bg-rose-955/40 border-rose-500/30 text-rose-205 hover:border-rose-450 hover:bg-rose-955/60",
        sparkle: "text-rose-400",
      };
    case "royal-emerald":
      return {
        wrapper:
          "bg-[linear-gradient(135deg,#010a04_0%,#051f0c_30%,#0a3d18_50%,#051f0c_70%,#010a04_100%)] border-emerald-500/35 text-emerald-100",
        badge: "bg-emerald-500/20 text-emerald-250 border-emerald-500/35",
        btnGrab:
          "bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.25)]",
        btnCoupon:
          "bg-emerald-955/40 border-emerald-500/30 text-emerald-205 hover:border-emerald-450 hover:bg-emerald-955/60",
        sparkle: "text-emerald-400",
      };
    default:
      return {
        wrapper:
          "bg-[linear-gradient(135deg,#06020c_0%,#110524_30%,#260a4f_50%,#110524_70%,#06020c_100%)] border-purple-500/35 text-purple-100",
        badge: "bg-purple-500/20 text-purple-250 border-purple-500/35",
        btnGrab:
          "bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-300 hover:to-purple-500 text-neutral-950 shadow-[0_0_15px_rgba(168,85,247,0.25)]",
        btnCoupon:
          "bg-purple-955/40 border-purple-500/30 text-purple-205 hover:border-purple-450 hover:bg-purple-955/60",
        sparkle: "text-purple-400",
      };
  }
};

import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";

const PremiumBannerSlider = ({ adConfig, handleCopyCode, copiedCode }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoplayTimer = useRef(null);

  const now = new Date();

  // Check global campaign date schedule
  const globalEnabled =
    adConfig?.enabled !== false && adConfig?.active !== false;
  const start = adConfig?.startDate ? new Date(adConfig.startDate) : null;
  const end = adConfig?.endDate ? new Date(adConfig.endDate) : null;
  const isDateValid = (!start || now >= start) && (!end || now <= end);

  // Build/parse slides matching active states & priorities
  let campaignSlides = [];
  if (globalEnabled && isDateValid) {
    if (adConfig?.slides && Array.isArray(adConfig.slides)) {
      campaignSlides = adConfig.slides
        .filter((s) => s.enabled !== false)
        .map((s) => ({
          id: s.id || `slide-${s.priority || 1}-${s.title}`,
          desktopSrc: optimizeCloudinaryUrl(s.desktopImage || "/hero.png"),
          tabletSrc:
            optimizeCloudinaryUrl(s.tabletImage) ||
            optimizeCloudinaryUrl(s.desktopImage || "/hero.png"),
          mobileSrc:
            optimizeCloudinaryUrl(s.mobileImage) ||
            optimizeCloudinaryUrl(s.tabletImage) ||
            optimizeCloudinaryUrl(s.desktopImage || "/hero.png"),
          title: s.title || "GRAND FESTIVE PARIWESH SALE",
          subtitle: s.subtitle || "",
          categoryLabel: s.badge || "Special Promotion",
          ctaText: s.ctaText || "Explore Collection",
          link: s.ctaLink || "/shop",
          code: s.promoCode || "",
          themeName: s.themeName || "royal-gold",
          isDynamic: true,
          mobileObjectPosition: s.imagePositionMobile || "center",
          desktopObjectPosition: s.imagePositionDesktop || "center",
          priority: s.priority || 1,
        }));
    } else {
      // Legacy fallback structure parsing
      const adDesktopSrc = optimizeCloudinaryUrl(
        adConfig?.desktopImage || adConfig?.bannerImage,
      );
      if (adDesktopSrc) {
        campaignSlides.push({
          id: "legacy-campaign-row",
          desktopSrc: adDesktopSrc,
          tabletSrc:
            optimizeCloudinaryUrl(adConfig?.tabletImage) || adDesktopSrc,
          mobileSrc:
            optimizeCloudinaryUrl(adConfig?.mobileImage) || adDesktopSrc,
          title: adConfig?.title || "GRAND FESTIVE PARIWESH SALE",
          subtitle:
            adConfig?.subtitle || "Handcrafted Luxury suits up to 40% Off",
          categoryLabel: "Special Promotion",
          ctaText: adConfig?.primaryButtonText || "Grab Offer",
          link: adConfig?.link || "/shop",
          code: adConfig?.code || "",
          themeName: adConfig?.theme || "royal-gold",
          isDynamic: true,
          mobileObjectPosition: "center",
          desktopObjectPosition: "center",
          priority: adConfig?.priority || 1,
        });
      }
    }
  }

  // Sort by priority/order upward
  campaignSlides.sort((a, b) => a.priority - b.priority);

  // Monitor preloaded slides to avoid fetching all images on startup
  const [loadedIndices, setLoadedIndices] = useState(new Set([0]));

  useEffect(() => {
    if (campaignSlides.length > 0) {
      setLoadedIndices((prev) => {
        const nextSet = new Set(prev);
        nextSet.add(activeSlide);
        if (campaignSlides.length > 1) {
          nextSet.add((activeSlide + 1) % campaignSlides.length);
        }
        if (campaignSlides.length > 2) {
          nextSet.add((activeSlide + 2) % campaignSlides.length);
        }
        return nextSet;
      });
    }
  }, [activeSlide, campaignSlides.length]);

  // Setup loop timer config
  useEffect(() => {
    if (campaignSlides.length <= 1 || isHovered) {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
      return;
    }

    autoplayTimer.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % campaignSlides.length);
    }, 6000);

    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    };
  }, [campaignSlides.length, isHovered]);

  if (campaignSlides.length === 0) return null;

  const currentSlide = campaignSlides[activeSlide];
  const theme = getBannerTheme(currentSlide.themeName);

  return (
    <section
      className="w-full relative z-10 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative h-[80vw] md:h-auto md:min-h-[450px] overflow-hidden rounded-none border-x-0 border-y border-slate-800 shadow-2xl flex items-center transition-colors duration-500 ${theme.wrapper}`}
      >
        {campaignSlides.map((slide, idx) => {
          const isCurrentActive = idx === activeSlide;
          const isMounted = loadedIndices.has(idx);

          if (!isMounted) return null;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isCurrentActive
                  ? "opacity-100 pointer-events-auto z-1"
                  : "opacity-0 pointer-events-none z-0"
              }`}
            >
              {/* 1. Desktop Blur Backdrop */}
              <div className="hidden md:block absolute inset-0 overflow-hidden">
                <img
                  src={slide.desktopSrc}
                  alt=""
                  className="w-full h-full object-cover blur-3xl scale-110 opacity-70"
                  aria-hidden="true"
                  loading={isCurrentActive ? "eager" : "lazy"}
                  {...(isCurrentActive ? { fetchPriority: "high" } : {})}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/85 z-5" />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-neutral-950/20 to-transparent z-5" />
              </div>

              {/* 2. Desktop Foreground Image */}
              <div className="hidden md:flex absolute right-0 top-0 bottom-0 w-[55%] z-10 p-6 lg:p-10 pr-12 lg:pr-16 items-center justify-center">
                <img
                  src={slide.desktopSrc}
                  alt={slide.title}
                  className="max-h-[90%] max-w-full object-contain rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/5"
                  style={{
                    objectPosition: slide.desktopObjectPosition || "center",
                  }}
                  loading={isCurrentActive ? "eager" : "lazy"}
                  {...(isCurrentActive ? { fetchPriority: "high" } : {})}
                />
              </div>

              {/* 3. Mobile Picture Image Cover Layout */}
              <picture className="absolute inset-0 w-full h-full md:hidden">
                {slide.mobileSrc && (
                  <source media="(max-width: 639px)" srcSet={slide.mobileSrc} />
                )}
                {slide.tabletSrc && (
                  <source
                    media="(max-width: 1023px)"
                    srcSet={slide.tabletSrc}
                  />
                )}
                <img
                  src={slide.desktopSrc}
                  alt={slide.title}
                  className="w-full h-full object-cover brightness-[0.65]"
                  style={{
                    objectPosition: slide.mobileObjectPosition || "center",
                  }}
                  loading={isCurrentActive ? "eager" : "lazy"}
                  {...(isCurrentActive ? { fetchPriority: "high" } : {})}
                />
              </picture>
            </div>
          );
        })}

        {/* Shimmer Overlay - Mobile ONLY */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/35 md:hidden z-1 pointer-events-none"></div>

        {/* 4. Content Area Container */}
        <div className="absolute md:relative top-0 left-0 w-full h-full md:top-auto md:left-auto md:w-auto md:h-auto z-10 max-w-7xl mx-auto px-6 md:px-12 py-6 md:py-16 flex flex-col justify-center items-start pointer-events-none">
          <div className="w-full pointer-events-auto flex flex-col md:max-w-lg lg:max-w-xl md:bg-[#110f0e]/30 md:backdrop-blur-lg md:p-8 md:rounded-[4px] md:border md:border-white/5 md:shadow-2xl space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${currentSlide.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 text-left"
              >
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1 rounded-sm border border-accent-gold/45 text-accent-gold bg-black/60 backdrop-blur-md">
                    {currentSlide.isDynamic && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-ping"></span>
                    )}
                    {currentSlide.categoryLabel}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-extrabold uppercase tracking-wider drop-shadow-md text-white leading-tight">
                  {currentSlide.title}
                </h2>

                <p className="text-[11px] sm:text-xs md:text-sm text-slate-205 font-medium font-sans leading-relaxed tracking-wide">
                  {currentSlide.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-4 font-sans justify-start text-left">
              {currentSlide.code && (
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
                        ✨ {currentSlide.code.toUpperCase()}
                      </span>
                    )}
                  </button>
                </div>
              )}

              <div className="flex flex-col">
                {currentSlide.code && (
                  <span className="text-[9px] uppercase tracking-widest text-[#000000]/0 font-bold mb-1.5 pointer-events-none hidden sm:block">
                    Shop
                  </span>
                )}
                <Link
                  to={currentSlide.link}
                  className={`font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 ${theme.btnGrab}`}
                >
                  {currentSlide.ctaText} <Icon name="ArrowRight" size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Pagination Buttons */}
        {campaignSlides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {campaignSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === activeSlide
                    ? "bg-accent-gold w-4"
                    : "bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Go to banner slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PremiumBannerSlider;

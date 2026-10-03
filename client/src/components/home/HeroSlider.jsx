import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../../theme/icons.jsx";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";
import { RiAwardLine, RiLeafLine, RiShieldCheckLine, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";

const DEFAULT_SLIDE_THEMES = [
  {
    tag: "Spring / Summer 2026 Collection",
    title: "The Radiance of",
    highlight: "indian heritage",
    subtitle: "Discover our premium selection of Kurtas, Suits, and Ethnic sets woven in luxury chanderi and pure cottons.",
    buttonText: "Explore Collection",
    buttonLink: "/shop",
  },
  {
    tag: "Festive & Wedding Edit",
    title: "Crafted in Pure",
    highlight: "chanderi & silk",
    subtitle: "Hand-embossed zari motifs and regal silhouettes crafted for unforgettable celebrations.",
    buttonText: "Shop Festive Edit",
    buttonLink: "/shop?tag=Best+Seller",
  },
  {
    tag: "Contemporary Silhouettes",
    title: "The Art of Modern",
    highlight: "ethnic grace",
    subtitle: "Breathable co-ord sets and versatile A-line ensembles made for effortless day-to-evening style.",
    buttonText: "View New Arrivals",
    buttonLink: "/shop?tag=New+Arrival",
  },
  {
    tag: "Heritage Atelier",
    title: "Timeless Poetry in",
    highlight: "every thread",
    subtitle: "Experience artisanal handlooms and royal flared anarkalis tailored to perfection.",
    buttonText: "Explore Boutique",
    buttonLink: "/shop",
  },
  {
    tag: "Boutique Signature",
    title: "Elegance for the",
    highlight: "modern woman",
    subtitle: "Subtle craftsmanship, tailored comfort, and timeless ethnic aesthetics.",
    buttonText: "Discover All",
    buttonLink: "/shop",
  },
];

const HeroSlider = ({ sliderConfig, activeSlide, setActiveSlide }) => {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  const [direction, setDirection] = useState(1);
  const prevSlideRef = React.useRef(activeSlide);
  const touchStartX = React.useRef(null);

  useEffect(() => {
    if (activeSlide !== prevSlideRef.current) {
      setDirection(activeSlide > prevSlideRef.current ? 1 : -1);
      prevSlideRef.current = activeSlide;
    }
  }, [activeSlide]);

  const totalSlides = sliderConfig.images?.length || 0;

  const goToSlide = (idx) => {
    if (idx === activeSlide || totalSlides <= 0) return;
    setDirection(idx > activeSlide ? 1 : -1);
    setActiveSlide(idx);
  };

  const handlePrev = (e) => {
    e?.preventDefault?.();
    if (totalSlides <= 1) return;
    const prev = (activeSlide - 1 + totalSlides) % totalSlides;
    goToSlide(prev);
  };

  const handleNext = (e) => {
    e?.preventDefault?.();
    if (totalSlides <= 1) return;
    const next = (activeSlide + 1) % totalSlides;
    goToSlide(next);
  };

  const handleTouchStart = (e) => {
    if (totalSlides <= 1) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || totalSlides <= 1) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const minSwipe = 40;
    if (diff > minSwipe) {
      handleNext();
    } else if (diff < -minSwipe) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? "10%" : "-10%",
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4, ease: "easeOut" },
        scale: { duration: 0.4, ease: "easeOut" },
      },
    },
    exit: (dir) => ({
      x: dir > 0 ? "-10%" : "10%",
      opacity: 0,
      scale: 0.98,
      transition: {
        opacity: { duration: 0.25, ease: "easeIn" },
      },
    }),
  };

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!sliderConfig.active || totalSlides === 0) return null;

  // Resolve current slide content (from custom config or smart thematic fallbacks)
  const fallbackTheme = DEFAULT_SLIDE_THEMES[activeSlide % DEFAULT_SLIDE_THEMES.length];
  const customSlideData = sliderConfig.slides && sliderConfig.slides[activeSlide];

  const currentSlide = {
    tag: customSlideData?.tag || fallbackTheme.tag,
    title: customSlideData?.title || fallbackTheme.title,
    highlight: customSlideData?.highlight || fallbackTheme.highlight,
    subtitle: customSlideData?.subtitle || fallbackTheme.subtitle,
    buttonText: customSlideData?.buttonText || fallbackTheme.buttonText,
    buttonLink: customSlideData?.buttonLink || fallbackTheme.buttonLink,
  };

  const currentSlideImage = sliderConfig.images[activeSlide];

  return (
    <section className="relative w-full bg-[#ffffff] overflow-hidden">
      {/* ======================================================== */}
      {/* DESKTOP HERO BANNER: Royal S-Curve & Universal Framing   */}
      {/* ======================================================== */}
      {isDesktop && (
        <div className="hidden md:block w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          <div className="relative h-[560px] lg:h-[600px] w-full rounded-[32px] overflow-hidden bg-white border border-[#c5a880]/30 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            
            {/* Right Image Showcase: Universal Cover Framing with Zero Background Clash */}
            <div className="absolute right-0 top-0 bottom-0 w-[62%] lg:w-[64%] z-0 overflow-hidden bg-[#FAF8F5]">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={activeSlide}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full h-full relative"
                >
                  <img
                    src={optimizeCloudinaryUrl(currentSlideImage, 1000)}
                    alt={`${currentSlide.title} ${currentSlide.highlight}`}
                    width="700"
                    height="600"
                    className="w-full h-full object-cover object-top will-change-transform"
                    fetchPriority={activeSlide === 0 ? "high" : "auto"}
                    loading={activeSlide === 0 ? "eager" : "lazy"}
                    decoding={activeSlide === 0 ? "sync" : "async"}
                  />
                  {/* Subtle edge vignette ensuring seamless blend with the left white panel */}
                  <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none" />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* S-Curve Wave Divider & White Left Panel Fill */}
            <svg
              viewBox="0 0 1000 600"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            >
              <path
                d="M 0,0 L 400,0 C 370,130 345,230 345,310 C 345,420 380,510 410,600 L 0,600 Z"
                fill="#ffffff"
              />
              <path
                d="M 400,0 C 370,130 345,230 345,310 C 345,420 380,510 410,600"
                fill="none"
                stroke="#c5a880"
                strokeWidth="3.5"
              />
            </svg>

            {/* Botanical Watermark: Top-Left */}
            <div className="absolute top-0 left-0 w-44 h-44 pointer-events-none z-15 opacity-25 text-[#c5a880]">
              <svg viewBox="0 0 160 160" className="w-full h-full" fill="currentColor">
                <path d="M0,0 Q30,10 60,40 Q40,60 10,60 Z M15,10 Q50,25 70,70 Q45,75 25,35 Z M5,40 Q35,50 55,95 Q30,95 15,65 Z M40,15 Q80,40 100,90 Q75,95 50,45 Z" />
                <path
                  d="M0,0 C30,30 60,70 80,120 M20,25 C45,45 65,75 75,105 M35,15 C60,40 85,70 110,100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Left Panel Content */}
            <div className="absolute top-0 bottom-0 left-0 w-[38%] lg:w-[36%] z-20 p-6 lg:p-10 flex flex-col justify-between">
              {/* Top Tag, Headline & Description */}
              <div className="space-y-3.5 lg:space-y-4">
                <div className="flex items-center space-x-2 text-[#c5a880]">
                  <span className="text-[11px] uppercase tracking-[0.22em] font-extrabold text-[#c5a880]">
                    {currentSlide.tag}
                  </span>
                </div>

                <h1 className="text-3xl lg:text-4xl xl:text-[42px] font-serif font-normal tracking-tight leading-[1.12] text-slate-900">
                  {currentSlide.title}{" "}
                  <span className="font-script text-[#c5a880] lowercase tracking-normal italic block mt-1">
                    {currentSlide.highlight}
                  </span>
                </h1>

                {/* Gold filigree divider */}
                <div className="flex items-center space-x-2 text-[#c5a880] pt-0.5">
                  <span className="h-[1.5px] w-14 bg-gradient-to-r from-[#c5a880] to-transparent" />
                </div>

                <p className="text-xs lg:text-[13px] text-slate-600 leading-relaxed font-light max-w-sm">
                  {currentSlide.subtitle}
                </p>

                <div className="pt-2 flex items-center space-x-3">
                  <Link
                    to={currentSlide.buttonLink}
                    className="inline-flex items-center space-x-2 bg-[#8a1c14] hover:bg-[#6b140e] text-white font-bold text-xs uppercase tracking-widest px-7 py-3.5 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-[#8a1c14] cursor-pointer"
                  >
                    <span>{currentSlide.buttonText}</span>
                    <Icon name="ArrowRight" size={14} />
                  </Link>

                  {/* Desktop Prev / Next Navigation Arrows */}
                  {totalSlides > 1 && (
                    <div className="flex items-center space-x-1.5 pl-2">
                      <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="Previous Slide"
                        className="w-9 h-9 rounded-full border border-slate-200 bg-white/90 hover:bg-white text-slate-700 hover:text-[#8a1c14] shadow-xs flex items-center justify-center transition cursor-pointer"
                      >
                        <RiArrowLeftSLine size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Next Slide"
                        className="w-9 h-9 rounded-full border border-slate-200 bg-white/90 hover:bg-white text-slate-700 hover:text-[#8a1c14] shadow-xs flex items-center justify-center transition cursor-pointer"
                      >
                        <RiArrowRightSLine size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom 3 Trust Mini-Pillars */}
              <div className="pt-3 border-t border-[#c5a880]/20 grid grid-cols-3 gap-1.5 text-left">
                <div className="flex items-center space-x-1.5">
                  <div className="w-7 h-7 rounded-full border border-[#c5a880]/40 flex items-center justify-center text-[#8a1c14] bg-[#FDFBF7] shrink-0 shadow-xs">
                    <RiAwardLine size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[8.5px] font-bold text-slate-900 block uppercase tracking-wider truncate">
                      PREMIUM QUALITY
                    </span>
                    <span className="text-[7.5px] text-slate-500 block truncate">
                      Finest Fabrics
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <div className="w-7 h-7 rounded-full border border-[#c5a880]/40 flex items-center justify-center text-[#8a1c14] bg-[#FDFBF7] shrink-0 shadow-xs">
                    <RiLeafLine size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[8.5px] font-bold text-slate-900 block uppercase tracking-wider truncate">
                      ETHICAL FASHION
                    </span>
                    <span className="text-[7.5px] text-slate-500 block truncate">
                      Sustainable Choices
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <div className="w-7 h-7 rounded-full border border-[#c5a880]/40 flex items-center justify-center text-[#8a1c14] bg-[#FDFBF7] shrink-0 shadow-xs">
                    <RiShieldCheckLine size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[8.5px] font-bold text-slate-900 block uppercase tracking-wider truncate">
                      TRUSTED BRAND
                    </span>
                    <span className="text-[7.5px] text-slate-500 block truncate">
                      Loved by Thousands
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Indicator Dots */}
            {totalSlides > 1 && (
              <div className="absolute bottom-5 right-10 flex items-center space-x-2 z-30 bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
                {sliderConfig.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeSlide
                        ? "bg-[#c5a880] w-6 shadow-xs"
                        : "bg-white/60 hover:bg-white w-2 shadow-xs"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MOBILE HERO BANNER: Full-Bleed High-Conversion Editorial */}
      {/* ======================================================== */}
      {!isDesktop && (
        <div className="md:hidden w-full px-3 sm:px-4 py-2 bg-white">
          <div
            className="relative h-[500px] xs:h-[540px] w-full rounded-[26px] overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.12)] border border-[#c5a880]/30 touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Full-Bleed Model Background Image with Zero Clashing */}
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={activeSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 w-full h-full"
              >
                <img
                  src={optimizeCloudinaryUrl(currentSlideImage, 700)}
                  alt={`${currentSlide.title} ${currentSlide.highlight}`}
                  width="450"
                  height="550"
                  className="w-full h-full object-cover object-top will-change-transform"
                  fetchPriority={activeSlide === 0 ? "high" : "auto"}
                  loading={activeSlide === 0 ? "eager" : "lazy"}
                  decoding={activeSlide === 0 ? "sync" : "async"}
                />
              </motion.div>
            </AnimatePresence>

            {/* Subtle Top Vignette for Nav Contrast */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent pointer-events-none z-10" />

            {/* Frosted Glass Luxury Bottom Dock with Title + Above-the-fold CTA */}
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-4 px-4 text-center text-white flex flex-col items-center space-y-1.5">
              <span className="text-[9.5px] uppercase tracking-[0.25em] text-[#E5D3B3] font-bold">
                {currentSlide.tag}
              </span>

              <h1 className="text-2xl xs:text-[25px] font-serif font-normal tracking-tight leading-tight text-white drop-shadow-md">
                {currentSlide.title}{" "}
                <span className="font-script text-[#E5D3B3] lowercase tracking-normal italic block text-xl xs:text-2xl mt-0.5">
                  {currentSlide.highlight}
                </span>
              </h1>

              <p className="text-[11px] text-white/80 line-clamp-2 max-w-xs font-light leading-relaxed">
                {currentSlide.subtitle}
              </p>

              <div className="pt-2 w-full flex flex-col items-center">
                <Link
                  to={currentSlide.buttonLink}
                  className="w-full max-w-[260px] py-3 rounded-xl bg-[#8a1c14] hover:bg-[#70150e] text-white font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center space-x-2 border border-[#c5a880]/50 active:scale-95 transition-all cursor-pointer"
                >
                  <span>{currentSlide.buttonText}</span>
                  <Icon name="ArrowRight" size={13} />
                </Link>
              </div>

              {/* Mobile Slide Dots */}
              {totalSlides > 1 && (
                <div className="flex items-center space-x-1.5 pt-2">
                  {sliderConfig.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToSlide(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === activeSlide
                          ? "bg-[#E5D3B3] w-6"
                          : "bg-white/40 w-1.5"
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSlider;

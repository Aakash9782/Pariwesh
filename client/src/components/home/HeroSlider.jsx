import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../../theme/icons.jsx";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";
import { RiAwardLine, RiLeafLine, RiShieldCheckLine } from "react-icons/ri";

const HeroSlider = ({ sliderConfig, activeSlide, setActiveSlide }) => {
  if (!sliderConfig.active || sliderConfig.images.length === 0) return null;

  return (
    <section className="relative w-full bg-[#ffffff] overflow-hidden">
      {/* ======================================================== */}
      {/* DESKTOP HERO BANNER: Royal S-Curve with Fitted Showcase  */}
      {/* ======================================================== */}
      <div className="hidden md:block w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
        <div className="relative h-[560px] lg:h-[600px] w-full rounded-[32px] overflow-hidden bg-[#FBF9F5] border border-[#c5a880]/30 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          {/* Right Image Showcase Area (Shifted right with perfect breathing space) */}
          <div className="absolute right-0 top-0 bottom-0 w-[64%] lg:w-[66%] flex items-center justify-end pr-8 lg:pr-14 pl-12 z-0 overflow-hidden bg-[#F8F5EE]">
            {/* Ambient Blurred Backdrop for Seamless Color Harmony */}
            <motion.img
              key={`desk-bg-${activeSlide}`}
              src={optimizeCloudinaryUrl(sliderConfig.images[activeSlide])}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.18 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0 w-full h-full object-cover blur-3xl scale-125 pointer-events-none"
              aria-hidden="true"
            />

            {/* Main Foreground Model Image - Shifted right & fitted with breathing headroom */}
            <AnimatePresence mode="wait">
              <motion.img
                key={activeSlide}
                src={optimizeCloudinaryUrl(sliderConfig.images[activeSlide])}
                alt="Pariwesh Collection"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="relative z-10 h-[92%] max-w-full object-contain object-right drop-shadow-[0_20px_45px_rgba(0,0,0,0.12)]"
                fetchpriority={activeSlide === 0 ? "high" : "auto"}
                loading={activeSlide === 0 ? "eager" : "lazy"}
              />
            </AnimatePresence>
          </div>

          {/* S-Curve Wave Divider & White Panel Fill */}
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          >
            {/* White Fill for Left Panel */}
            <path
              d="M 0,0 L 395,0 C 365,130 340,230 340,310 C 340,420 375,510 405,600 L 0,600 Z"
              fill="#ffffff"
            />
            {/* Elegant Champagne Gold S-Curve Stroke */}
            <path
              d="M 395,0 C 365,130 340,230 340,310 C 340,420 375,510 405,600"
              fill="none"
              stroke="#c5a880"
              strokeWidth="3.5"
            />
          </svg>

          {/* Botanical Leaf Watermark: Top-Left */}
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

          {/* Botanical Flower Watermark: Bottom-Left */}
          <div className="absolute bottom-20 left-0 w-32 h-32 pointer-events-none z-15 opacity-20 text-[#c5a880]">
            <svg viewBox="0 0 120 120" className="w-full h-full" fill="currentColor">
              <path d="M0,120 Q30,90 60,60 Q70,75 50,100 Z M20,110 Q50,80 80,50 Q85,65 65,95 Z" />
              <path
                d="M0,120 C25,95 55,65 85,40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Left Panel Content */}
          <div className="absolute top-0 bottom-0 left-0 w-[37%] lg:w-[35%] z-20 p-6 lg:p-10 flex flex-col justify-between">
            {/* Top Tag, Headline & Description */}
            <div className="space-y-3.5 lg:space-y-4">
              <div className="flex items-center space-x-2 text-[#c5a880]">
                <span className="text-xs">✦</span>
                <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-[#c5a880]">
                  Spring / Summer 2026 Collection
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-serif font-normal tracking-tight leading-[1.1] text-slate-900">
                The Radiance of{" "}
                <span className="font-script text-[#c5a880] lowercase tracking-normal italic block mt-1">
                  indian heritage
                </span>
              </h1>

              {/* Gold filigree divider */}
              <div className="flex items-center space-x-2 text-[#c5a880] pt-0.5">
                <span className="h-[1px] w-8 bg-[#c5a880]/50" />
                <span className="text-xs">✦</span>
                <span className="h-[1px] w-8 bg-[#c5a880]/50" />
              </div>

              <p className="text-xs lg:text-sm text-slate-600 leading-relaxed font-light max-w-sm">
                Discover our premium selection of Kurtas, Suits, and Ethnic sets
                woven in luxury chanderi and pure cottons.
              </p>

              <div className="pt-1.5">
                <Link
                  to="/shop"
                  className="inline-flex items-center space-x-2 bg-[#8a1c14] hover:bg-[#6b140e] text-white font-bold text-xs uppercase tracking-widest px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-[#8a1c14] cursor-pointer"
                >
                  <span>Explore Collection</span>
                  <Icon name="ArrowRight" size={14} />
                </Link>
              </div>
            </div>

            {/* Bottom 3 Trust Mini-Pillars */}
            <div className="pt-3 border-t border-[#c5a880]/20 grid grid-cols-3 gap-1.5 text-left">
              <div className="flex items-center space-x-1.5">
                <div className="w-7 h-7 rounded-full border border-[#c5a880]/40 flex items-center justify-center text-[#8a1c14] bg-white shrink-0 shadow-xs">
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
                <div className="w-7 h-7 rounded-full border border-[#c5a880]/40 flex items-center justify-center text-[#8a1c14] bg-white shrink-0 shadow-xs">
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
                <div className="w-7 h-7 rounded-full border border-[#c5a880]/40 flex items-center justify-center text-[#8a1c14] bg-white shrink-0 shadow-xs">
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

          {/* Desktop Navigation Dots */}
          {sliderConfig.images.length > 1 && (
            <div className="absolute bottom-4 right-[22%] transform translate-x-1/2 flex space-x-2 z-30">
              {sliderConfig.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === activeSlide
                      ? "bg-[#c5a880] w-6 shadow-xs"
                      : "bg-white/90 hover:bg-white w-2 shadow-xs border border-slate-300"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE HERO BANNER: Fitted Showcase & Editorial Card     */}
      {/* ======================================================== */}
      <div className="md:hidden w-full px-3 sm:px-4 py-3 bg-white">
        <div className="relative rounded-[24px] overflow-hidden bg-[#FBF9F5] border border-[#c5a880]/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          {/* Image Showcase Area - Image FITS completely with zero cropping */}
          <div className="relative h-[340px] xs:h-[380px] w-full flex items-center justify-center overflow-hidden bg-[#F7F4EC]">
            {/* Ambient Blurred Backdrop */}
            <motion.img
              key={`mob-bg-${activeSlide}`}
              src={optimizeCloudinaryUrl(sliderConfig.images[activeSlide])}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 w-full h-full object-cover blur-xl scale-115 pointer-events-none"
              aria-hidden="true"
            />

            {/* Main Fitted Model Image */}
            <AnimatePresence mode="wait">
              <motion.img
                key={activeSlide}
                src={optimizeCloudinaryUrl(sliderConfig.images[activeSlide])}
                alt="Pariwesh Collection Mobile"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="relative z-10 max-h-full max-w-full object-contain drop-shadow-md"
                fetchpriority={activeSlide === 0 ? "high" : "auto"}
                loading={activeSlide === 0 ? "eager" : "lazy"}
              />
            </AnimatePresence>

            {/* Dots on top of image at bottom */}
            {sliderConfig.images.length > 1 && (
              <div className="absolute bottom-2.5 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-20">
                {sliderConfig.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeSlide
                        ? "bg-[#8a1c14] w-5 shadow-xs"
                        : "bg-white/80 w-1.5 shadow-xs"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Text & CTA Card Area below image */}
          <div className="p-4 sm:p-5 bg-white text-center space-y-2 border-t border-[#c5a880]/20">
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#8a1c14] font-extrabold block">
              ✦ Spring / Summer 2026 Collection
            </span>

            <h1 className="text-2xl xs:text-3xl font-serif font-normal tracking-tight leading-tight text-slate-900">
              The Radiance of{" "}
              <span className="font-script text-[#c5a880] lowercase tracking-normal italic block">
                indian heritage
              </span>
            </h1>

            {/* Filigree ornament */}
            <div className="flex items-center justify-center space-x-2 text-[#c5a880] py-0.5">
              <span className="h-[1px] w-8 bg-[#c5a880]/50" />
              <span className="text-[10px]">✦</span>
              <span className="h-[1px] w-8 bg-[#c5a880]/50" />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-light max-w-xs mx-auto">
              Discover our premium selection of Kurtas, Suits, and Ethnic sets
              woven in luxury chanderi and pure cottons.
            </p>

            <div className="pt-2 flex justify-center">
              <Link
                to="/shop"
                className="inline-flex items-center space-x-2 bg-[#8a1c14] hover:bg-[#6b140e] text-white font-bold text-xs uppercase tracking-widest px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-[#8a1c14] cursor-pointer"
              >
                <span>Explore Collection</span>
                <Icon name="ArrowRight" size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;

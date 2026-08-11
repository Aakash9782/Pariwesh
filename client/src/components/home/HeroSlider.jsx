import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../../theme/icons.jsx";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";

const HeroSlider = ({ sliderConfig, activeSlide, setActiveSlide }) => {
  if (!sliderConfig.active || sliderConfig.images.length === 0) return null;

  return (
    <section className="relative h-[80vh] min-h-[520px] max-h-[720px] bg-secondary overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Blurred Background Backdrop - Displayed ONLY on Desktop (md and above) */}
          <div className="hidden md:block absolute inset-0 overflow-hidden">
            <img
              src={optimizeCloudinaryUrl(sliderConfig.images[activeSlide])}
              alt=""
              className="w-full h-full object-cover blur-3xl scale-110 opacity-70"
              aria-hidden="true"
            />
            {/* Visual enhancement gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/85 z-5" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-secondary to-transparent z-5" />
          </div>

          {/* Desktop Foreground Image - Contain Aspect Frame on the right */}
          <div className="hidden md:flex absolute right-0 top-0 bottom-0 w-[55%] z-10 p-8 lg:p-12 pr-16 lg:pr-24 items-center justify-center">
            <img
              src={optimizeCloudinaryUrl(sliderConfig.images[activeSlide])}
              alt="Pariwesh Collection"
              className="max-h-[90%] max-w-full object-contain rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/5"
              fetchpriority={activeSlide === 0 ? "high" : "auto"}
              loading={activeSlide === 0 ? "eager" : "lazy"}
            />
          </div>

          {/* Mobile Image Cover Layout - Displayed ONLY on Mobile */}
          <img
            src={optimizeCloudinaryUrl(sliderConfig.images[activeSlide])}
            alt="Pariwesh Collection Mobile"
            className="md:hidden absolute inset-0 w-full h-full object-cover object-center brightness-[0.65]"
            fetchpriority={activeSlide === 0 ? "high" : "auto"}
            loading={activeSlide === 0 ? "eager" : "lazy"}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-black/30 pointer-events-none" />

      {/* Hero Content Area */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center items-center md:items-start text-center md:text-left px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none">
        <div className="max-w-md md:max-w-xl space-y-6 pointer-events-auto md:bg-[#110f0e]/30 md:backdrop-blur-lg md:p-10 md:rounded-[4px] md:border md:border-white/5 md:shadow-2xl">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.25em] text-accent-gold font-bold block"
          >
            Spring / Summer 2026 Collection
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-7xl font-serif font-normal tracking-tight leading-[1.1] text-white"
          >
            The Radiance of{" "}
            <span className="font-script text-accent-gold lowercase tracking-normal italic block mt-1">
              Indian heritage
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm md:text-base text-gray-250 leading-relaxed font-light block"
          >
            Discover our premium selection of Kurtas, Suits, and Ethnic sets
            woven in luxury chanderi and pure cottons.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="pt-2"
          >
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 bg-[#8a1c14] text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-sm hover:bg-white hover:text-secondary hover:shadow-lg transition-all duration-300 border border-[#8a1c14] hover:border-white"
            >
              <span>Explore Collection</span>
              <Icon name="ArrowRight" size={14} />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Navigation Dot Indicators */}
      {sliderConfig.images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2.5 z-20">
          {sliderConfig.images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === activeSlide
                  ? "bg-accent-gold w-6"
                  : "bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSlider;

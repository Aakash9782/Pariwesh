import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../../theme/icons.jsx";

const HeroSlider = ({ sliderConfig, activeSlide, setActiveSlide }) => {
  if (!sliderConfig.active || sliderConfig.images.length === 0) return null;

  return (
    <section className="relative h-[80vh] min-h-[480px] bg-secondary overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 bg-cover bg-center brightness-[0.65]"
          style={{
            backgroundImage: `url(${sliderConfig.images[activeSlide]})`,
          }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-black/30 pointer-events-none" />

      {/* Hero Content Area */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 z-10 space-y-6">
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
          className="text-5xl md:text-7xl font-serif font-normal tracking-tight leading-[1.1] max-w-2xl text-white"
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
          className="text-sm md:text-base text-gray-300 max-w-md leading-relaxed font-light"
        >
          Discover our premium selection of Kurtas, Suits, and Ethnic sets woven
          in luxury chanderi and pure cottons.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="pt-4"
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

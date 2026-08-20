import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Skeleton from "../common/Skeleton.jsx";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";

const CampaignBanners = ({ banners, settingsLoading }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  // Active campaign banners selection
  const activeBanners =
    Array.isArray(banners) && banners.length > 0 ? banners : [];

  // Auto-slide effect every 4 seconds
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  // If loading and no banners cached, show skeleton placeholder
  if (settingsLoading && activeBanners.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative overflow-hidden w-full bg-bgLight h-[220px] sm:h-[350px] md:h-[450px]">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      </section>
    );
  }

  if (activeBanners.length === 0) return null;

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((prev) => (prev === activeBanners.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative group/slider">
      {/* Slider Viewport */}
      <div className="relative overflow-hidden w-full bg-[#f5f5f5] rounded-none shadow-md">
        {/* Slides Track */}
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${activeIdx * 100}%)`,
          }}
        >
          {activeBanners.map((banner, idx) => (
            <Link
              key={idx}
              to={banner.path || "/shop"}
              className="w-full shrink-0 relative overflow-hidden block"
            >
              <img
                src={optimizeCloudinaryUrl(banner.image || "/hero.png", 1200)}
                alt={banner.title || `Campaign Banner ${idx + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full h-auto object-contain block transform-gpu hover:scale-[1.01] transition-transform duration-[600ms]"
              />
            </Link>
          ))}
        </div>

        {/* Previous Navigation Button (<) */}
        {activeBanners.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-white/90 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 z-35 focus:outline-none border border-slate-100 opacity-0 group-hover/slider:opacity-100 cursor-pointer"
            aria-label="Previous Slide"
          >
            <span className="text-sm sm:text-xl font-bold font-mono">⟨</span>
          </button>
        )}

        {/* Next Navigation Button (>) */}
        {activeBanners.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-white/90 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 z-35 focus:outline-none border border-slate-100 opacity-0 group-hover/slider:opacity-100 cursor-pointer"
            aria-label="Next Slide"
          >
            <span className="text-sm sm:text-xl font-bold font-mono">⟩</span>
          </button>
        )}

        {/* Dot Indicators */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2.5 z-35">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 focus:outline-none ${
                  activeIdx === idx
                    ? "bg-[#c5a880] w-6"
                    : "bg-white/60 hover:bg-white"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CampaignBanners;

import React, { useState, useEffect, useRef } from "react";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";

const ProductImageSlider = ({
  images,
  alt,
  autoPlay = false,
  intervalMs = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxSeenIndex, setMaxSeenIndex] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (!autoPlay || !images || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % images.length;
        setMaxSeenIndex((max) => Math.max(max, next));
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoPlay, images, intervalMs]);

  if (!images || images.length === 0) {
    return <div className="w-full h-full bg-gray-100" />;
  }

  const hasMultipleImages = Array.isArray(images) && images.length > 1;

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => {
      const next = (prev - 1 + images.length) % images.length;
      setMaxSeenIndex((max) => Math.max(max, next));
      return next;
    });
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => {
      const next = (prev + 1) % images.length;
      setMaxSeenIndex((max) => Math.max(max, next));
      return next;
    });
  };

  const handleDotClick = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(idx);
    setMaxSeenIndex((max) => Math.max(max, idx));
  };

  const handleTouchStart = (e) => {
    if (!hasMultipleImages) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!hasMultipleImages || touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 40) {
      handleNext(e);
    } else if (diff < -40) {
      handlePrev(e);
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="w-full h-full relative select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {images.map((img, idx) => {
        // Just-in-time rendering: do not load/render subsequent images
        // until we actually reach them in the slideshow sequence.
        // This avoids downloading all images for all grid products upfront.
        if (idx > maxSeenIndex) return null;

        return (
          <img
            key={img + "-" + idx}
            src={optimizeCloudinaryUrl(img, 400)}
            alt={alt}
            loading="lazy"
            decoding="async"
            width="400"
            height="500"
            className={`absolute inset-0 w-full h-full object-cover transform-gpu group-hover:scale-[1.12] transition-all duration-[700ms] ease-in-out origin-top ${
              idx === currentIndex
                ? "opacity-100 z-[2]"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          />
        );
      })}

      {hasMultipleImages && (
        <>
          {/* Previous image button */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-30 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.18)] border border-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
            aria-label="Previous image"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Next image button */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.18)] border border-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
            aria-label="Next image"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Image indicator dots */}
          <div className="absolute bottom-2.5 md:bottom-2.5 md:group-hover:bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/35 backdrop-blur-xs opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 pointer-events-auto">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleDotClick(e, idx)}
                onMouseEnter={(e) => handleDotClick(e, idx)}
                aria-label={`Go to image ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? "w-3 h-1.5 bg-[#c5a880] shadow-xs"
                    : "w-1.5 h-1.5 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductImageSlider;

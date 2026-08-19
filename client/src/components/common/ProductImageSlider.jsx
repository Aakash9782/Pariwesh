import React, { useState, useEffect } from "react";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";

const ProductImageSlider = ({ images, alt }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxSeenIndex, setMaxSeenIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % images.length;
        setMaxSeenIndex((max) => Math.max(max, next));
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) {
    return <div className="w-full h-full bg-gray-100" />;
  }

  return (
    <div className="w-full h-full relative">
      {images.map((img, idx) => {
        // Just-in-time rendering: do not load/render subsequent images
        // until we actually reach them in the slideshow sequence.
        // This avoids downloading all images for all grid products upfront.
        if (idx > maxSeenIndex) return null;

        return (
          <img
            key={img + "-" + idx}
            src={optimizeCloudinaryUrl(img, 600)}
            alt={alt}
            loading={idx === 0 ? "eager" : "lazy"}
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transform-gpu group-hover:scale-[1.12] transition-all duration-[1000ms] ease-in-out origin-top ${
              idx === currentIndex
                ? "opacity-100 z-[2]"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          />
        );
      })}
    </div>
  );
};

export default ProductImageSlider;

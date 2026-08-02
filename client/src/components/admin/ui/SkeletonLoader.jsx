import React from "react";

const SkeletonLoader = ({ className = "", variant = "rect" }) => {
  const variants = {
    rect: "rounded-md",
    circle: "rounded-full",
    text: "rounded-sm h-3",
  };

  return (
    <div
      className={`animate-pulse bg-slate-100/80 border border-slate-100/30 ${variants[variant] || variants.rect} ${className}`}
    />
  );
};

export default SkeletonLoader;

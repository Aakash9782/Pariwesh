import React from "react";

const Loader = ({
  size = "md", // sm, md, lg
  color = "gold", // gold, text, current
  className = "",
  fullscreen = false,
}) => {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  const colors = {
    gold: "border-accent-gold border-t-transparent",
    text: "border-textPrimary border-t-transparent",
    current: "border-current border-t-transparent",
  };

  const spinner = (
    <div
      className={`animate-spin rounded-full ${sizes[size]} ${colors[color]} ${className}`}
    />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-primary/80 backdrop-blur-sm flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          {spinner}
          <span className="text-xs uppercase font-display font-bold tracking-widest text-textSecondary animate-pulse">
            Loading pariweś...
          </span>
        </div>
      </div>
    );
  }

  return spinner;
};

export default Loader;

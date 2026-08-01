import React from "react";

const Badge = ({
  children,
  variant = "gold", // gold, dark, success, danger, warning, grey
  size = "md", // sm, md
  className = "",
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-display font-bold uppercase tracking-wider rounded-badge transition-all select-none";

  const variants = {
    gold: "bg-secondary text-accent-gold border border-accent-gold/20",
    dark: "bg-secondary text-primary border border-transparent",
    success: "bg-green-500/10 text-green-600 border border-green-500/20",
    danger: "bg-danger/10 text-danger border border-danger/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    grey: "bg-bgLight text-textSecondary border border-borderLight",
  };

  const sizes = {
    sm: "text-[8px] px-2 py-0.5",
    md: "text-[9px] px-2.5 py-1",
  };

  return (
    <span
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;

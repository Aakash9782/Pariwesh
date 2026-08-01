import React from "react";

const Card = ({
  children,
  variant = "flat", // flat, outlined, elevated, secondary
  className = "",
  onClick,
  ...props
}) => {
  const baseStyle =
    "p-6 rounded-card transition-all duration-300 font-sans text-textPrimary";

  const variants = {
    flat: "bg-primary premium-card-shadow border border-transparent",
    outlined: "bg-primary border border-borderLight",
    elevated: "bg-primary shadow-xl border border-borderLight/30",
    secondary: "bg-bgLight border border-borderLight",
  };

  const cursorStyle = onClick
    ? "cursor-pointer hover:shadow-lg active:scale-[0.99]"
    : "";

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${cursorStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

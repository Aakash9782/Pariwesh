import React from "react";

const Card = ({
  children,
  className = "",
  onClick,
  hover = true,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-lg shadow-xs transition-all duration-300 ${
        hover ? "hover:shadow-md" : ""
      } ${onClick ? "cursor-pointer active:scale-[0.99]" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

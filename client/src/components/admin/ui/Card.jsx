import React from "react";

const Card = ({ children, className = "", onClick, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-lg p-5 transition-all duration-300 hover:shadow-md ${
        onClick ? "cursor-pointer active:scale-[0.99]" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

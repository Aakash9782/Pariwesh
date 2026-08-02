import React from "react";

const Skeleton = ({ className = "", variant = "rect", ...props }) => {
  const variantClasses = {
    circle: "rounded-full",
    rect: "rounded-lg",
    text: "rounded-md h-4 w-full",
  };

  return (
    <div
      className={`animate-pulse bg-[#E8E0D5] ${variantClasses[variant] || ""} ${className}`}
      {...props}
    />
  );
};

export const ProductSkeleton = () => {
  return (
    <div className="flex flex-col space-y-3 w-full">
      <Skeleton className="aspect-[4/5] w-full rounded-none border border-borderLight" />
      <div className="space-y-2 py-1">
        <Skeleton className="h-2.5 w-1/4 rounded-none" />
        <Skeleton className="h-3.5 w-4/5 rounded-none" />
        <div className="flex space-x-2 items-center pt-1">
          <Skeleton className="h-3 w-1/5 rounded-none" />
          <Skeleton className="h-3 w-1/5 rounded-none" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;

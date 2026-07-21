import React from "react";

const Skeleton = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse bg-borderLight rounded-sm ${className}`}
      {...props}
    />
  );
};

export const ProductSkeleton = () => {
  return (
    <div className="flex flex-col space-y-4 w-full">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4.5 w-full" />
        <div className="flex space-x-3 items-center">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;

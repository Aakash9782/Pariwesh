import React from "react";

/**
 * Base Atomic Skeleton
 * Uses GPU-accelerated luxury shimmer wave in warm ivory/champagne tones.
 */
const Skeleton = ({ className = "", variant = "rect", shimmer = true, ...props }) => {
  const variantClasses = {
    circle: "rounded-full",
    rect: "rounded-lg",
    text: "rounded-md h-4 w-full",
  };

  return (
    <div
      className={`${shimmer ? "luxury-shimmer" : "bg-[#f1ede6]"} ${variantClasses[variant] || ""} ${className}`}
      {...props}
    />
  );
};

/**
 * Atomic Card Skeleton: Product Card
 * Replicates the exact product card in Shop, Sale, Best Seller grids
 */
export const ProductSkeleton = () => {
  return (
    <div className="flex flex-col space-y-3 w-full bg-white/70 backdrop-blur-xs p-2.5 sm:p-3 rounded-2xl border border-slate-100 shadow-2xs">
      <Skeleton className="aspect-[4/5] w-full rounded-xl" />
      <div className="space-y-2 py-1">
        <Skeleton className="h-3 w-1/3 rounded-full" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <div className="flex space-x-2 items-center pt-1">
          <Skeleton className="h-3.5 w-1/4 rounded-md" />
          <Skeleton className="h-3 w-1/5 rounded-md" />
        </div>
      </div>
    </div>
  );
};

/**
 * Atomic Card Skeleton: Collection Card
 * Replicates the tall editorial lookbook card in /collections
 */
export const CollectionCardSkeleton = () => {
  return (
    <div className="relative aspect-[3/4] min-h-[460px] sm:min-h-[480px] md:min-h-[500px] w-full rounded-2xl overflow-hidden border border-[#c5a880]/20 bg-[#161513] shadow-md flex flex-col justify-end p-6 sm:p-8 space-y-3">
      <Skeleton className="absolute inset-0 w-full h-full rounded-none opacity-40" />
      <div className="relative z-10 space-y-2 w-full">
        <Skeleton className="h-3 w-24 rounded-full bg-white/30" />
        <Skeleton className="h-7 w-3/4 rounded-lg bg-white/30" />
        <Skeleton className="h-3.5 w-1/2 rounded-md bg-white/20" />
        <div className="pt-2">
          <Skeleton className="h-9 w-28 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
};

/**
 * Composite Skeleton: Hero Slider
 * Replicates the exact 1:1 dimensions of the Desktop Royal S-Curve & Mobile Hero
 */
export const HeroSkeleton = () => {
  return (
    <section className="relative w-full bg-[#ffffff] overflow-hidden">
      {/* Desktop S-Curve Shell */}
      <div className="hidden md:block w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
        <div className="relative h-[560px] lg:h-[600px] w-full rounded-[32px] overflow-hidden bg-[#FBF9F5] border border-[#c5a880]/30 shadow-[0_20px_50px_rgba(0,0,0,0.04)] grid grid-cols-12 items-center">
          {/* Left Content Placeholder */}
          <div className="col-span-5 pl-10 lg:pl-16 space-y-5 z-20">
            <Skeleton className="h-3.5 w-32 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-10 lg:h-12 w-4/5 rounded-xl" />
              <Skeleton className="h-10 lg:h-12 w-3/5 rounded-xl" />
            </div>
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <div className="flex gap-4 pt-3">
              <Skeleton className="h-12 w-36 rounded-full" />
              <Skeleton className="h-12 w-32 rounded-full" />
            </div>
          </div>
          {/* Right Image Showcase Placeholder */}
          <div className="col-span-7 h-full w-full flex items-center justify-center p-8 bg-gradient-to-br from-[#F8F5EE] via-[#F4EFE5] to-[#EBE4D5]">
            <Skeleton className="h-[90%] w-[75%] rounded-3xl" />
          </div>
        </div>
      </div>

      {/* Mobile Fitted Showcase Shell */}
      <div className="md:hidden w-full px-3 py-2">
        <div className="relative h-[500px] sm:h-[540px] w-full rounded-[24px] overflow-hidden bg-[#FBF9F5] border border-[#c5a880]/30 flex flex-col justify-between p-6">
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-7 w-3/4 rounded-lg" />
          </div>
          <div className="flex-1 my-4 flex items-center justify-center">
            <Skeleton className="h-[85%] w-[80%] rounded-2xl" />
          </div>
          <div className="space-y-3 pb-2">
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Composite Skeleton: Cart / Bag Layout
 * Replicates the 2-column checkout bag layout (Items on left, Summary on right)
 */
export const CartSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Title & Step Header */}
      <div className="space-y-2 mb-8">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-3.5 w-64 rounded-md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Cart Items (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 flex gap-4 sm:gap-6 items-center"
            >
              <Skeleton className="w-20 h-24 sm:w-24 sm:h-32 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-4.5 w-3/4 rounded-md" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 space-y-5">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="space-y-3 border-y border-slate-100 py-4">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-3.5 w-16 rounded" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3.5 w-14 rounded" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-3.5 w-20 rounded" />
            </div>
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-5 w-28 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Composite Skeleton: Collection Detail
 * Replicates the collection editorial banner + product grid
 */
export const CollectionDetailSkeleton = () => {
  return (
    <div className="pb-20 space-y-10">
      {/* Hero Banner Shell */}
      <div className="relative h-[320px] md:h-[420px] w-full bg-[#161513] flex flex-col justify-end p-8 md:p-14">
        <Skeleton className="absolute inset-0 w-full h-full rounded-none opacity-30" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <Skeleton className="h-3 w-28 rounded-full bg-white/30" />
          <Skeleton className="h-9 md:h-12 w-2/3 rounded-xl bg-white/30" />
          <Skeleton className="h-4 w-4/5 rounded-md bg-white/20" />
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Composite Skeleton: Page Suspense Transition
 * Graceful layout displayed during route changes instead of a harsh spinning spinner
 */
export const PageSuspenseSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-8 w-64 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export default Skeleton;

import React from "react";
import { Link } from "react-router-dom";
import Skeleton from "../common/Skeleton.jsx";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";

const VIBE_MOODS = [
  {
    title: "Day To Dusk",
    bgImg: "/hero.png",
    insetImg: "/hero.png",
    path: "/shop?tag=Best Seller",
  },
  {
    title: "The Linen Edit",
    bgImg: "/hero.png",
    insetImg: "/hero.png",
    path: "/shop?category=kurtis",
  },
  {
    title: "Not So Boring",
    bgImg: "/hero.png",
    insetImg: "/hero.png",
    path: "/shop?category=suits",
  },
  {
    title: "Festive Essentials",
    bgImg: "/hero.png",
    insetImg: "/hero.png",
    path: "/shop?category=ethnic",
  },
];

const VibeGrid = ({ vibeMoods, settingsLoading }) => {
  const activeMoods =
    Array.isArray(vibeMoods) && vibeMoods.length > 0 ? vibeMoods : VIBE_MOODS;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center space-y-2 mb-10">
        <span className="text-[10px] text-[#8a1c14] tracking-[0.25em] uppercase font-black block">
          your mood
        </span>
        <h2 className="text-3xl font-serif text-textPrimary">
          Pick Your{" "}
          <span className="font-script text-[#8a1c14] text-4xl lowercase tracking-normal">
            vibe.
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {settingsLoading && !vibeMoods
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="relative h-[480px] overflow-hidden border border-borderLight flex flex-col items-center justify-between p-8"
              >
                <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
                <div />
                <Skeleton className="w-[140px] aspect-[4/5] z-10 border-[3px] border-white rounded-none" />
                <Skeleton className="h-6 w-32 z-10" />
              </div>
            ))
          : activeMoods.map((vibe, idx) => (
              <Link
                key={idx}
                to={vibe.path}
                className="relative h-[480px] overflow-hidden border border-borderLight group flex flex-col items-center justify-between cursor-pointer"
              >
                {/* Grayscale Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center filter grayscale group-hover:grayscale-0 brightness-[0.4] group-hover:brightness-[0.5] transition-all duration-700 w-full h-full"
                  style={{
                    backgroundImage: `url(${optimizeCloudinaryUrl(vibe.bgImg)})`,
                  }}
                />

                {/* Decorative Frame */}
                <div className="absolute inset-4 border border-white/20 pointer-events-none z-1"></div>

                <div>{/* Just spacing */}</div>

                {/* Smaller Color Inset Photo centered */}
                <div className="w-[140px] aspect-[4/5] overflow-hidden shadow-2xl relative border-[3px] border-white z-10 transition-transform duration-500 group-hover:scale-105">
                  <img
                    src={optimizeCloudinaryUrl(vibe.insetImg)}
                    alt={vibe.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Cursive bottom title */}
                <div className="pb-8 z-20 text-center w-full">
                  <h4 className="font-script text-white text-3xl tracking-wide drop-shadow-lg">
                    {vibe.title}
                  </h4>
                  <span className="text-[8px] tracking-[0.25em] text-white/70 uppercase block mt-1 hover:text-white">
                    explore mood
                  </span>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
};

export default VibeGrid;

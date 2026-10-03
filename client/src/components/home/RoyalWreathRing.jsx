import React from "react";

/**
 * RoyalWreathRing
 * Handcrafted Royal Botanical Laurel Garland inspired by luxury ethnic ateliers.
 * Features:
 * - 74% prominent avatar frame for maximum outfit visibility.
 * - Tangential flowing foliage leaves that follow the natural circular contour.
 * - Zero overlap: clear negative breathing ring with thin Kundan gold hairline.
 * - Metallic antique champagne gold gradients and delicate royal star crest.
 */
export default function RoyalWreathRing({ children, className = "" }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* 1. Golden Botanical Laurel Garland SVG (Z-0: Framing the avatar) */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 drop-shadow-[0_2px_8px_rgba(197,168,128,0.38)] group-hover:drop-shadow-[0_4px_16px_rgba(138,28,20,0.32)] group-hover:scale-105 transition-all duration-300"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="goldStemGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8F6B32" />
            <stop offset="25%" stopColor="#DFBA73" />
            <stop offset="50%" stopColor="#FFF7E6" />
            <stop offset="75%" stopColor="#DFBA73" />
            <stop offset="100%" stopColor="#8F6B32" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBF0D8" />
            <stop offset="35%" stopColor="#DFBA73" />
            <stop offset="80%" stopColor="#A88243" />
            <stop offset="100%" stopColor="#7A5620" />
          </linearGradient>
          <linearGradient id="goldHighGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8EB" />
            <stop offset="100%" stopColor="#DFBA73" />
          </linearGradient>
        </defs>

        {/* Delicate Inner Kundan Hairline Ring (Hugs avatar with 2px breathing gap) */}
        <circle
          cx="100"
          cy="100"
          r="76"
          stroke="#DFBA73"
          strokeWidth="1.1"
          strokeDasharray="1.5 3.5"
          opacity="0.85"
        />
        <circle
          cx="100"
          cy="100"
          r="74.5"
          stroke="#FFF7E6"
          strokeWidth="0.7"
          opacity="0.7"
        />

        {/* Left Laurel Vine Branch */}
        <path
          d="M 100 181 C 52 181 20 144 20 100 C 20 56 52 20 89 20"
          stroke="url(#goldStemGrad)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Left Flowing Leaves (Tangentially curving along contour) */}
        <g fill="url(#leafGrad)" stroke="#8A682D" strokeWidth="0.3">
          <path d="M 79.0 178.2 Q 81.6 184.9 88.2 185.1 Q 85.4 183.4 79.0 178.2 Z" />
          <path d="M 79.0 178.2 Q 82.3 182.8 87.4 181.6 Q 84.2 180.8 79.0 178.2 Z" />
          <path d="M 57.9 169.2 Q 58.4 176.3 64.8 178.4 Q 63.6 176.1 57.9 169.2 Z" />
          <path d="M 57.9 169.2 Q 59.7 174.4 65.0 174.8 Q 62.9 173.4 57.9 169.2 Z" />
          <path d="M 40.1 154.5 Q 38.7 161.5 44.2 165.3 Q 44.7 162.6 40.1 154.5 Z" />
          <path d="M 40.1 154.5 Q 40.4 160.1 45.3 161.9 Q 44.5 160.1 40.1 154.5 Z" />
          <path d="M 27.2 135.5 Q 23.8 141.8 28.0 147.0 Q 30.3 144.1 27.2 135.5 Z" />
          <path d="M 27.2 135.5 Q 25.9 140.9 30.1 144.0 Q 30.7 141.9 27.2 135.5 Z" />
          <path d="M 20.2 113.6 Q 15.2 118.7 17.7 124.8 Q 21.5 122.0 20.2 113.6 Z" />
          <path d="M 20.2 113.6 Q 17.4 118.4 20.6 122.6 Q 22.5 120.4 20.2 113.6 Z" />
          <path d="M 19.5 90.6 Q 13.4 94.0 14.1 100.7 Q 19.0 98.2 19.5 90.6 Z" />
          <path d="M 19.5 90.6 Q 15.5 94.4 17.4 99.3 Q 20.5 97.2 19.5 90.6 Z" />
          <path d="M 25.4 68.4 Q 18.5 69.9 17.3 76.5 Q 23.1 74.5 25.4 68.4 Z" />
          <path d="M 25.4 68.4 Q 20.5 70.9 21.0 76.2 Q 24.9 74.2 25.4 68.4 Z" />
          <path d="M 37.3 48.7 Q 30.3 48.2 27.3 54.2 Q 33.4 52.8 37.3 48.7 Z" />
          <path d="M 37.3 48.7 Q 31.9 49.7 30.9 54.9 Q 35.4 53.4 37.3 48.7 Z" />
          <path d="M 54.3 33.1 Q 47.7 30.7 43.1 35.6 Q 49.1 35.0 54.3 33.1 Z" />
          <path d="M 54.3 33.1 Q 48.8 32.6 46.3 37.3 Q 51.1 36.2 54.3 33.1 Z" />
          <path d="M 75.0 23.0 Q 69.3 18.8 63.5 22.2 Q 68.8 22.4 75.0 23.0 Z" />
          <path d="M 75.0 23.0 Q 69.8 20.9 66.1 24.7 Q 70.8 24.3 75.0 23.0 Z" />
        </g>

        {/* Right Laurel Vine Branch */}
        <path
          d="M 100 181 C 148 181 180 144 180 100 C 180 56 148 20 111 20"
          stroke="url(#goldStemGrad)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Right Flowing Leaves */}
        <g fill="url(#leafGrad)" stroke="#8A682D" strokeWidth="0.3">
          <path d="M 121.0 178.2 Q 113.9 178.8 111.8 185.1 Q 117.8 183.4 121.0 178.2 Z" />
          <path d="M 121.0 178.2 Q 115.5 177.2 112.6 181.6 Q 117.4 180.8 121.0 178.2 Z" />
          <path d="M 142.1 169.2 Q 135.5 171.7 135.2 178.4 Q 140.7 176.1 142.1 169.2 Z" />
          <path d="M 142.1 169.2 Q 136.6 169.7 135.0 174.8 Q 139.7 173.4 142.1 169.2 Z" />
          <path d="M 159.9 154.5 Q 154.2 158.8 155.8 165.3 Q 160.3 162.6 159.9 154.5 Z" />
          <path d="M 159.9 154.5 Q 154.7 156.6 154.7 161.9 Q 158.9 160.1 159.9 154.5 Z" />
          <path d="M 172.8 135.5 Q 168.6 141.2 172.0 147.0 Q 175.0 144.1 172.8 135.5 Z" />
          <path d="M 172.8 135.5 Q 168.4 138.9 169.9 144.0 Q 173.3 141.9 172.8 135.5 Z" />
          <path d="M 179.8 113.6 Q 177.4 120.2 182.3 124.8 Q 183.7 122.0 179.8 113.6 Z" />
          <path d="M 179.8 113.6 Q 176.6 118.1 179.4 122.6 Q 181.7 120.4 179.8 113.6 Z" />
          <path d="M 180.5 90.6 Q 180.0 97.7 185.9 100.7 Q 185.6 98.2 180.5 90.6 Z" />
          <path d="M 180.5 90.6 Q 178.6 95.8 182.6 99.3 Q 183.6 97.2 180.5 90.6 Z" />
          <path d="M 174.6 68.4 Q 176.1 75.3 182.7 76.5 Q 180.7 74.5 174.6 68.4 Z" />
          <path d="M 174.6 68.4 Q 174.3 73.9 179.0 76.2 Q 178.7 74.2 174.6 68.4 Z" />
          <path d="M 162.7 48.7 Q 166.1 54.9 172.7 54.2 Q 169.2 52.8 162.7 48.7 Z" />
          <path d="M 162.7 48.7 Q 164.0 54.1 169.1 54.9 Q 167.5 53.4 162.7 48.7 Z" />
          <path d="M 145.7 33.1 Q 150.7 38.1 156.9 35.6 Q 152.1 35.0 145.7 33.1 Z" />
          <path d="M 145.7 33.1 Q 148.5 37.9 153.7 37.3 Q 150.8 36.2 145.7 33.1 Z" />
          <path d="M 125.0 23.0 Q 131.2 26.4 136.5 22.2 Q 130.8 22.4 125.0 23.0 Z" />
          <path d="M 125.0 23.0 Q 129.0 26.8 133.9 24.7 Q 130.0 24.3 125.0 23.0 Z" />
        </g>

        {/* Bottom Royal Ribbon Tie Accent */}
        <g transform="translate(100, 181)">
          <circle cx="0" cy="0" r="3.2" fill="url(#goldStemGrad)" stroke="#8A682D" strokeWidth="0.4" />
          <circle cx="0" cy="0" r="1.3" fill="#FFF7E6" />
          <path d="M -2 1.8 Q -5 5 -7 9 Q -3 8 -0.8 3 Z" fill="url(#leafGrad)" />
          <path d="M 2 1.8 Q 5 5 7 9 Q 3 8 0.8 3 Z" fill="url(#leafGrad)" />
        </g>
      </svg>

      {/* 2. Photo Avatar: 74% diameter prominent hero frame */}
      <div className="relative z-10 w-[74%] h-[74%] rounded-full overflow-hidden border-2 border-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] group-hover:shadow-[0_8px_24px_rgba(138,28,20,0.22)] transition-all duration-300 bg-[#FAF7F2]">
        {children}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  RiInstagramLine,
  RiFacebookCircleLine,
  RiPinterestLine,
  RiYoutubeLine,
  RiTruckLine,
  RiShieldCheckLine,
  RiHeart3Line,
  RiMailLine,
  RiArrowDownSLine,
  RiTShirtLine,
  RiCustomerService2Line,
  RiCompass3Line,
} from "react-icons/ri";
import { useAlert } from "../../contexts/AlertContext.jsx";

const Footer = () => {
  const { showAlert } = useAlert();
  const [email, setEmail] = useState("");
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (key) => {
    setOpenSection(openSection === key ? null : key);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      showAlert("Please enter a valid email address.", "Invalid Email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert("Please enter a valid email address.", "Invalid Email");
      return;
    }
    showAlert(
      "Welcome to the PARIWESH Club! Your exclusive welcome privilege code has been sent to your email.",
      "Privilege Unlocked",
    );
    setEmail("");
  };

  return (
    <footer className="relative bg-[#0d0c0b] text-white mt-auto select-none border-t border-[#c5a880]/20 overflow-hidden font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP LUXURY TICKER STRIP (Desktop & Tablet)
      ───────────────────────────────────────────────────────────── */}
      <div className="hidden sm:block border-b border-[#c5a880]/15 py-3.5 bg-[#090807]/90">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-5 text-[11px] tracking-[0.3em] uppercase">
          <div className="h-[1px] w-16 md:w-28 bg-gradient-to-r from-transparent via-[#c5a880]/30 to-[#c5a880]/60" />
          <span className="text-white/70 font-light">TIMELESS SILHOUETTES</span>
          <span className="text-[#c5a880] text-xs">✦</span>
          <span className="text-[#c5a880] font-medium tracking-[0.32em]">MODERN CRAFT</span>
          <span className="text-[#c5a880] text-xs">✦</span>
          <span className="text-white/70 font-light">INDIAN SOUL</span>
          <div className="h-[1px] w-16 md:w-28 bg-gradient-to-l from-transparent via-[#c5a880]/30 to-[#c5a880]/60" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. DESKTOP VIEW (lg+)
      ───────────────────────────────────────────────────────────── */}
      <div className="hidden lg:block relative max-w-[1420px] mx-auto pl-6 sm:pl-8 pr-44 xl:pr-56 2xl:pr-64 py-16">
        {/* Dedicated Lookbook Art: Positioned cleanly on the far right without overlapping text */}
        <div className="absolute right-2 xl:right-6 2xl:right-10 top-4 bottom-4 w-[170px] xl:w-[210px] 2xl:w-[240px] pointer-events-none select-none overflow-hidden flex items-center justify-end z-0">
          <img
            src="/clean-woman-art.png"
            alt="Pariwesh Traditional Silhouettes"
            loading="lazy"
            decoding="async"
            className="h-[92%] w-auto object-contain object-right drop-shadow-xl opacity-90"
          />
        </div>

        {/* 5-Column Grid with z-index to stay above background art */}
        <div className="relative z-10 grid grid-cols-12 gap-6 xl:gap-8 items-start">
          {/* Column 1: Brand Info & Signature (3.5 cols) */}
          <div className="col-span-3 space-y-4">
            <Link to="/" className="inline-block">
              <h3 className="text-2xl font-display tracking-[0.22em] text-white uppercase font-medium">
                PARIWESH<span className="text-[#c5a880]">.</span>
              </h3>
            </Link>
            <p className="text-xs text-white/70 leading-relaxed font-light max-w-xs">
              Experience the pinnacle of luxurious women fashion. Elegant Ethnic Suits,
              Girls Kurtas, and Bespoke Collections crafted with fine fabrics.
            </p>

            {/* Social icons row */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href="https://www.instagram.com/pariweshofficial/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-white/20 hover:border-[#c5a880] text-white/80 hover:text-[#c5a880] flex items-center justify-center transition-colors text-sm"
                aria-label="Instagram"
              >
                <RiInstagramLine />
              </a>
              <a
                href="https://www.facebook.com/pariweshofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-white/20 hover:border-[#c5a880] text-white/80 hover:text-[#c5a880] flex items-center justify-center transition-colors text-sm"
                aria-label="Facebook"
              >
                <RiFacebookCircleLine />
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-white/20 hover:border-[#c5a880] text-white/80 hover:text-[#c5a880] flex items-center justify-center transition-colors text-sm"
                aria-label="Pinterest"
              >
                <RiPinterestLine />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-white/20 hover:border-[#c5a880] text-white/80 hover:text-[#c5a880] flex items-center justify-center transition-colors text-sm"
                aria-label="YouTube"
              >
                <RiYoutubeLine />
              </a>
            </div>

            {/* Golden Heritage Signature: Lotus + cursive script */}
            <div className="pt-3 flex items-center gap-2 text-[#c5a880]">
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-1.2 3.2-3.8 5.6-7 6.4 2.8 1.8 4.6 4.9 4.6 8.4 1.4-2.6 3.2-3.8 4.4-3.8s3 1.2 4.4 3.8c0-3.5 1.8-6.6 4.6-8.4-3.2-.8-5.8-3.2-7-6.4zm-1.8 14.8c-.8-1.5-2-2.8-3.6-3.6 1.4 2 2.6 3 3.6 3.6zm3.6 0c1-.6 2.2-1.6 3.6-3.6-1.6.8-2.8 2.1-3.6 3.6z" />
              </svg>
              <span className="font-serif italic text-base text-[#c5a880] tracking-wide">
                Made with Pride in India.
              </span>
            </div>
          </div>

          {/* Column 2: SHOP CATEGORIES (2 cols) */}
          <div className="col-span-2 space-y-4">
            <h4 className="text-xs font-semibold tracking-[0.2em] text-[#c5a880] uppercase">
              Shop Categories
            </h4>
            <ul className="space-y-2 text-xs text-white/70 font-light">
              <li>
                <Link to="/shop?category=kurtis" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  Girls Kurtis
                </Link>
              </li>
              <li>
                <Link to="/shop?category=ethnic" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  Ethnic Wear
                </Link>
              </li>
              <li>
                <Link to="/shop?category=suits" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  Designer Suits
                </Link>
              </li>
              <li>
                <Link to="/collections" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  New Releases
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: CUSTOMER CARE (2 cols) */}
          <div className="col-span-2 space-y-4">
            <h4 className="text-xs font-semibold tracking-[0.2em] text-[#c5a880] uppercase">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs text-white/70 font-light">
              <li>
                <Link to="/contact" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/returns" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link to="/contact" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: ABOUT PARIWESH (2 cols) */}
          <div className="col-span-2 space-y-4">
            <h4 className="text-xs font-semibold tracking-[0.2em] text-[#c5a880] uppercase">
              About Pariwesh
            </h4>
            <ul className="space-y-2 text-xs text-white/70 font-light">
              <li>
                <Link to="/about" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/about" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  Our Craft
                </Link>
              </li>
              <li>
                <Link to="/about" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link to="/collections" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  Journal
                </Link>
              </li>
              <li>
                <Link to="/contact" className="inline-block hover:text-[#c5a880] hover:translate-x-1 transition-all duration-200">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: JOIN THE PARIWESH CLUB (3 cols with subtle left border) */}
          <div className="col-span-3 space-y-3.5 border-l border-white/10 pl-6 lg:pl-8">
            <h4 className="text-xs font-semibold tracking-[0.2em] text-[#c5a880] uppercase">
              Join the Pariwesh Club
            </h4>
            <p className="text-xs text-white/75 font-light leading-relaxed">
              Be the first to discover new collections, exclusive offers and festive edits.
            </p>

            {/* Newsletter Input Form */}
            <form onSubmit={handleSubscribe} className="flex items-stretch max-w-sm">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#151515] border border-white/15 focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/40 text-white placeholder-white/40 px-3.5 py-2.5 text-xs rounded-l-md w-full outline-none transition-all duration-300"
              />
              <button
                type="submit"
                className="bg-[#dfb07a] hover:bg-[#c99c68] text-black font-semibold text-xs tracking-wider uppercase px-4 py-2.5 rounded-r-md transition-all shrink-0 active:scale-95 flex items-center gap-1 shadow-sm"
              >
                <span>JOIN</span>
                <span>→</span>
              </button>
            </form>
            <p className="text-[10px] text-white/40 font-light">
              By subscribing, you agree to receive updates from Pariwesh.
            </p>

            {/* 3 Trust Badges in Desktop Column */}
            <div className="pt-2 grid grid-cols-3 gap-2 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-white/80">
                <RiTruckLine className="text-[#c5a880] text-lg shrink-0" />
                <div className="leading-tight">
                  <p className="text-[10px] font-medium text-white">Free Shipping</p>
                  <p className="text-[9px] text-white/50">on all orders</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-white/80">
                <RiShieldCheckLine className="text-[#c5a880] text-lg shrink-0" />
                <div className="leading-tight">
                  <p className="text-[10px] font-medium text-white">Easy Returns</p>
                  <p className="text-[9px] text-white/50">within 7 days</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-white/80">
                <RiHeart3Line className="text-[#c5a880] text-lg shrink-0" />
                <div className="leading-tight">
                  <p className="text-[10px] font-medium text-white">Secure Payments</p>
                  <p className="text-[9px] text-white/50">100% trusted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MOBILE VIEW (< lg)
      ───────────────────────────────────────────────────────────── */}
      <div className="block lg:hidden px-4 py-6 space-y-6">
        {/* Top Luxury Atelier Card */}
        <div className="relative rounded-2xl border border-[#c5a880]/30 bg-gradient-to-br from-[#1b1916] via-[#100f0d] to-[#0a0a09] p-5 overflow-hidden shadow-2xl">
          {/* Subtle gold glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#c5a880]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            {/* Left Info Column */}
            <div className="space-y-3 max-w-[210px] xs:max-w-[240px]">
              {/* Pariwesh Brand Typography with Floral Branch */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#c5a880]">
                  <span className="text-2xl font-serif tracking-wide text-[#dfb07a] font-medium">परीwesh</span>
                </div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#c5a880] font-light leading-snug">
                  Timeless Indian Elegance for the Modern Woman
                </p>
              </div>

              {/* Social Icons Row */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="https://www.instagram.com/pariweshofficial/?hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full border border-white/20 text-white/80 hover:text-[#c5a880] hover:border-[#c5a880] flex items-center justify-center text-xs transition"
                  aria-label="Instagram"
                >
                  <RiInstagramLine />
                </a>
                <a
                  href="https://www.facebook.com/pariweshofficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full border border-white/20 text-white/80 hover:text-[#c5a880] hover:border-[#c5a880] flex items-center justify-center text-xs transition"
                  aria-label="Facebook"
                >
                  <RiFacebookCircleLine />
                </a>
                <a
                  href="https://pinterest.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full border border-white/20 text-white/80 hover:text-[#c5a880] hover:border-[#c5a880] flex items-center justify-center text-xs transition"
                  aria-label="Pinterest"
                >
                  <RiPinterestLine />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full border border-white/20 text-white/80 hover:text-[#c5a880] hover:border-[#c5a880] flex items-center justify-center text-xs transition"
                  aria-label="YouTube"
                >
                  <RiYoutubeLine />
                </a>
              </div>
            </div>

            {/* Right Artwork: Framed traditional woman silhouette in gold circular arch */}
            <div className="w-[120px] xs:w-[140px] shrink-0 flex justify-end">
              <img
                src="/pariwesh-woman-art.png"
                alt="Pariwesh Lookbook Silhouette"
                className="w-full h-auto object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Interactive Accordion Menu Sections */}
        <div className="space-y-2 pt-1">
          {/* Accordion 1: SHOP CATEGORIES */}
          <div className="border-b border-white/10 pb-2">
            <button
              onClick={() => toggleSection("shop")}
              className="w-full flex items-center justify-between py-2 text-left text-xs uppercase tracking-[0.2em] text-[#c5a880] font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#c5a880] text-sm">
                  <RiTShirtLine />
                </span>
                <span>Shop Categories</span>
              </div>
              <RiArrowDownSLine
                className={`text-lg text-[#c5a880] transition-transform duration-300 ${
                  openSection === "shop" ? "rotate-180" : ""
                }`}
              />
            </button>
            {openSection === "shop" && (
              <ul className="pl-9 pb-3 pt-1 space-y-2 text-xs text-white/75 font-light animate-fadeIn">
                <li>
                  <Link to="/shop?category=kurtis" className="hover:text-[#c5a880] block py-0.5">
                    Girls Kurtis
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=ethnic" className="hover:text-[#c5a880] block py-0.5">
                    Ethnic Wear
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=suits" className="hover:text-[#c5a880] block py-0.5">
                    Designer Suits
                  </Link>
                </li>
                <li>
                  <Link to="/collections" className="hover:text-[#c5a880] block py-0.5">
                    New Releases
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Accordion 2: CUSTOMER CARE */}
          <div className="border-b border-white/10 pb-2">
            <button
              onClick={() => toggleSection("care")}
              className="w-full flex items-center justify-between py-2 text-left text-xs uppercase tracking-[0.2em] text-[#c5a880] font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#c5a880] text-sm">
                  <RiCustomerService2Line />
                </span>
                <span>Customer Care</span>
              </div>
              <RiArrowDownSLine
                className={`text-lg text-[#c5a880] transition-transform duration-300 ${
                  openSection === "care" ? "rotate-180" : ""
                }`}
              />
            </button>
            {openSection === "care" && (
              <ul className="pl-9 pb-3 pt-1 space-y-2 text-xs text-white/75 font-light animate-fadeIn">
                <li>
                  <Link to="/contact" className="hover:text-[#c5a880] block py-0.5">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" className="hover:text-[#c5a880] block py-0.5">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link to="/returns" className="hover:text-[#c5a880] block py-0.5">
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#c5a880] block py-0.5">
                    FAQs
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Accordion 3: ABOUT PARIWESH */}
          <div className="border-b border-white/10 pb-2">
            <button
              onClick={() => toggleSection("about")}
              className="w-full flex items-center justify-between py-2 text-left text-xs uppercase tracking-[0.2em] text-[#c5a880] font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#c5a880] text-sm">
                  <RiCompass3Line />
                </span>
                <span>About Pariwesh</span>
              </div>
              <RiArrowDownSLine
                className={`text-lg text-[#c5a880] transition-transform duration-300 ${
                  openSection === "about" ? "rotate-180" : ""
                }`}
              />
            </button>
            {openSection === "about" && (
              <ul className="pl-9 pb-3 pt-1 space-y-2 text-xs text-white/75 font-light animate-fadeIn">
                <li>
                  <Link to="/about" className="hover:text-[#c5a880] block py-0.5">
                    Our Story
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-[#c5a880] block py-0.5">
                    Our Craft
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-[#c5a880] block py-0.5">
                    Sustainability
                  </Link>
                </li>
                <li>
                  <Link to="/collections" className="hover:text-[#c5a880] block py-0.5">
                    Journal
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#c5a880] block py-0.5">
                    Careers
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Mobile Newsletter: Join The Pariwesh Club */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-[#c5a880]">
            <RiMailLine className="text-base" />
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold">
              Join the Pariwesh Club
            </h4>
          </div>
          <p className="text-xs text-white/75 font-light leading-relaxed">
            Be the first to discover new collections, exclusive offers and festive edits.
          </p>

          <form onSubmit={handleSubscribe} className="flex items-stretch">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#151515] border border-white/20 focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/40 text-white placeholder-white/40 px-3.5 py-2.5 text-xs rounded-l-md w-full outline-none transition-all duration-300"
            />
            <button
              type="submit"
              className="bg-[#dfb07a] hover:bg-[#c99c68] text-black font-semibold text-xs tracking-wider uppercase px-4 py-2.5 rounded-r-md transition shrink-0 active:scale-95 flex items-center gap-1 shadow-sm"
            >
              <span>JOIN</span>
              <span>→</span>
            </button>
          </form>
          <p className="text-[10px] text-white/40 font-light">
            By subscribing, you agree to receive updates from Pariwesh.
          </p>
        </div>

        {/* 3 Trust Badges Row on Mobile */}
        <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/10 text-center">
          <div className="flex flex-col items-center space-y-1">
            <RiTruckLine className="text-[#c5a880] text-xl" />
            <p className="text-[10px] font-medium text-white">Free Shipping</p>
            <p className="text-[9px] text-white/50">on all orders</p>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <RiShieldCheckLine className="text-[#c5a880] text-xl" />
            <p className="text-[10px] font-medium text-white">Easy Returns</p>
            <p className="text-[9px] text-white/50">within 7 days</p>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <RiHeart3Line className="text-[#c5a880] text-xl" />
            <p className="text-[10px] font-medium text-white">Secure Payments</p>
            <p className="text-[9px] text-white/50">100% safe & trusted</p>
          </div>
        </div>

        {/* Lotus Brand Heritage Signature */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c5a880]/40" />
          <div className="flex items-center gap-2 text-[#c5a880]">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-1.2 3.2-3.8 5.6-7 6.4 2.8 1.8 4.6 4.9 4.6 8.4 1.4-2.6 3.2-3.8 4.4-3.8s3 1.2 4.4 3.8c0-3.5 1.8-6.6 4.6-8.4-3.2-.8-5.8-3.2-7-6.4zm-1.8 14.8c-.8-1.5-2-2.8-3.6-3.6 1.4 2 2.6 3 3.6 3.6zm3.6 0c1-.6 2.2-1.6 3.6-3.6-1.6.8-2.8 2.1-3.6 3.6z" />
            </svg>
            <span className="font-serif italic text-sm text-[#c5a880] tracking-wide">
              Made with Pride in India.
            </span>
          </div>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c5a880]/40" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. BOTTOM BAR: PAYMENT PARTNERS & LEGAL (Dual Responsive)
      ───────────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10 py-6 pb-12 sm:pb-6 px-4 sm:px-8 bg-[#090807]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/60 font-light">
          {/* Left: Copyright */}
          <div className="text-center md:text-left text-[10px] text-white/50">
            © {new Date().getFullYear()} PARIWESH. All Rights Reserved. Crafted with Pride in India.
          </div>

          {/* Center: Legal Policy Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-white/70">
            <Link to="/privacy-policy" className="hover:text-[#c5a880] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-white/20">|</span>
            <Link to="/terms" className="hover:text-[#c5a880] transition-colors">
              Terms of Service
            </Link>
            <span className="text-white/20">|</span>
            <Link to="/shipping" className="hover:text-[#c5a880] transition-colors">
              Shipping Policy
            </Link>
            <span className="text-white/20">|</span>
            <Link to="/returns" className="hover:text-[#c5a880] transition-colors">
              Returns & Refunds
            </Link>
          </div>

          {/* Right: Payment Partner Pills */}
          <div className="flex items-center gap-2 select-none flex-wrap justify-center">
            <span className="text-[10px] text-white/50 uppercase tracking-wider mr-1 font-medium">
              Secure Payments
            </span>
            {/* UPI Pill */}
            <span className="px-2 py-0.5 rounded bg-black border border-white/15 text-[10px] font-bold text-white tracking-wider">
              UPI
            </span>
            {/* VISA Pill */}
            <span className="px-2.5 py-0.5 rounded bg-[#1a1f71] text-white text-[10px] font-black italic tracking-wide">
              VISA
            </span>
            {/* MasterCard Pill */}
            <span className="px-2 py-0.5 rounded bg-black border border-white/15 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#eb001b] inline-block -mr-1.5" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f00] inline-block" />
            </span>
            {/* RuPay Pill */}
            <span className="px-2 py-0.5 rounded bg-black border border-white/15 text-[10px] font-extrabold text-white tracking-wider flex items-center gap-0.5">
              <span>RuPay</span>
              <span className="text-[#00a651] text-[9px]">▶</span>
            </span>
            {/* Net Banking Pill */}
            <span className="px-2 py-0.5 rounded bg-black border border-white/15 text-[9px] font-semibold text-white/80 tracking-wider">
              NET BANKING
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

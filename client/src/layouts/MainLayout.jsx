import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiShoppingBagLine,
  RiHeartLine,
  RiUserLine,
  RiSearchLine,
  RiMenuLine,
  RiCloseLine,
  RiSunLine,
  RiMoonLine,
  RiPaletteLine,
  RiWhatsappLine,
} from "react-icons/ri";
import { logoutSuccess } from "../redux/slices/authSlice.js";
import API from "../services/api.js";

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItems = useSelector((state) => state.cart.items);
  const wishlistProducts = useSelector((state) => state.wishlist.products);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark",
  );
  const [accentTheme, setAccentTheme] = useState(
    localStorage.getItem("accent") || "gold",
  );
  const [showAccentPicker, setShowAccentPicker] = useState(false);

  const [logoUrl, setLogoUrl] = useState(
    () => localStorage.getItem("brandLogoUrl") || "",
  );

  React.useEffect(() => {
    const fetchLogoFromDB = async () => {
      try {
        const res = await API.get("/settings");
        if (res.data && res.data.success && res.data.data) {
          const dbLogo = res.data.data.brandLogoUrl;
          if (dbLogo !== undefined) {
            setLogoUrl(dbLogo);
            if (dbLogo) {
              localStorage.setItem("brandLogoUrl", dbLogo);
            } else {
              localStorage.removeItem("brandLogoUrl");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load brand logo from DB:", err);
      }
    };
    fetchLogoFromDB();

    const handleUpdate = () => {
      setLogoUrl(localStorage.getItem("brandLogoUrl") || "");
    };
    window.addEventListener("logo-updated", handleUpdate);
    return () => window.removeEventListener("logo-updated", handleUpdate);
  }, []);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-accent", accentTheme);
    localStorage.setItem("accent", accentTheme);
  }, [accentTheme]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const selectAccent = (accent) => {
    setAccentTheme(accent);
    setShowAccentPicker(false);
  };

  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutSuccess());
  };

  const navLinks = [
    { title: "BEST SELLING", path: "/shop?tag=Best Seller" },
    { title: "NEW ARRIVAL", path: "/shop?tag=New Arrival" },
    { title: "READYMADE DRESSES", path: "/shop?category=ethnic" },
    { title: "CORD SETS", path: "/shop?category=kurtis" },
    { title: "SUMMER SALE IS LIVE", path: "/shop" },
    { title: "PREMIUM DRESSES", path: "/shop?category=suits" },
    { title: "ALL COLLECTION", path: "/shop" },
    { title: "TRACK YOUR ORDER", path: "/profile" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bgLight">
      {/* GLOBAL ARCH CLIP PATH */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <clipPath id="mehrab-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0,1 L 0,0.35 C 0,0.28 0.08,0.26 0.12,0.24 C 0.12,0.18 0.22,0.15 0.28,0.12 C 0.28,0.08 0.38,0.06 0.44,0.03 C 0.47,0.01 0.49,0 0.5,0 C 0.51,0 0.53,0.01 0.56,0.03 C 0.62,0.06 0.72,0.08 0.72,0.12 C 0.78,0.15 0.88,0.18 0.88,0.24 C 0.92,0.26 1,0.28 1,0.35 L 1,1 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* 1. STICKY ANNOUNCEMENT BAR */}
      <div className="w-full bg-secondary text-primary py-2 px-4 text-center text-xs font-display tracking-widest text-shadow uppercase transition-all duration-300">
        ✨ USE CODE{" "}
        <span className="text-accent-gold font-bold">PRIWESHGOLD</span> TO GET
        15% OFF + FREE SHIPPING ON APPAREL ABOVE ₹1500 ✨
      </div>

      <header className="sticky top-0 z-50 bg-primary border-b border-borderLight shadow-sm transition-all duration-300">
        {/* Tier 1: Search, Logo, Actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-textPrimary hover:text-accent-gold transition-colors focus:outline-none"
          >
            {mobileMenuOpen ? (
              <RiCloseLine size={24} />
            ) : (
              <RiMenuLine size={24} />
            )}
          </button>

          {/* Desktop Search Input Field (Left) */}
          <div className="hidden md:flex items-center bg-bgLight border border-borderLight px-4 py-2 rounded-full w-72 focus-within:border-accent-gold transition-colors">
            <RiSearchLine className="text-textSecondary mr-2" size={16} />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent text-xs text-textPrimary focus:outline-none w-full font-sans"
            />
          </div>

          {/* Elegant Center Logo */}
          <div className="flex-1 md:flex-none flex justify-center">
            <Link to="/" className="flex items-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="PRIWESH Logo"
                  className="h-10 md:h-12 w-auto object-contain max-w-[200px]"
                />
              ) : (
                <>
                  <span className="text-xl md:text-2xl font-display font-medium tracking-[0.2em] text-textPrimary uppercase">
                    PRIWESH
                  </span>
                  <span className="text-accent-gold text-2xl font-extrabold -ml-1">
                    .
                  </span>
                </>
              )}
            </Link>
          </div>

          {/* Navigation Action Buttons (Right) */}
          <div className="flex items-center space-x-6 text-textPrimary">
            {/* Mobile Search Toggle */}
            <button className="md:hidden hover:text-accent-gold transition-colors">
              <RiSearchLine size={22} />
            </button>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="hover:text-accent-gold transition-colors relative"
            >
              <RiHeartLine size={22} />
              {wishlistProducts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent-gold text-secondary font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {wishlistProducts.length}
                </span>
              )}
            </Link>

            {/* Cart Link */}
            <Link
              to="/cart"
              className="hover:text-accent-gold transition-colors relative"
            >
              <RiShoppingBagLine size={22} />
              {cartItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent-gold text-secondary font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {/* Dark/Light mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="hover:text-accent-gold transition-colors flex items-center justify-center"
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? <RiSunLine size={21} /> : <RiMoonLine size={21} />}
            </button>

            {/* Accent Theme palette color switcher */}
            <div className="relative">
              <button
                onClick={() => setShowAccentPicker(!showAccentPicker)}
                className="hover:text-accent-gold transition-colors flex items-center justify-center"
                title="Change Color Theme"
              >
                <RiPaletteLine size={21} />
              </button>
              {showAccentPicker && (
                <div className="absolute right-0 mt-3 w-40 bg-primary border border-gray-100 rounded-sm shadow-xl z-50 p-2 space-y-1 animate-fade-in text-textPrimary">
                  <div className="text-[8px] uppercase font-bold text-textSecondary tracking-wider p-1">
                    Accent Accents
                  </div>
                  {[
                    {
                      key: "gold",
                      name: "Premium Gold",
                      color: "bg-[#D4AF37]",
                    },
                    {
                      key: "emerald",
                      name: "Royal Emerald",
                      color: "bg-[#0F5132]",
                    },
                    {
                      key: "sapphire",
                      name: "Sapphire Blue",
                      color: "bg-[#1E3A8A]",
                    },
                    { key: "rose", name: "Velvet Rose", color: "bg-[#DB2777]" },
                    {
                      key: "amethyst",
                      name: "Midnight Amethyst",
                      color: "bg-[#8A2BE2]",
                    },
                    {
                      key: "teal",
                      name: "Ocean Teal",
                      color: "bg-[#008080]",
                    },
                  ].map((x) => (
                    <button
                      key={x.key}
                      onClick={() => selectAccent(x.key)}
                      className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-sm flex items-center space-x-2 transition-all ${
                        accentTheme === x.key
                          ? "bg-bgLight font-bold text-accent-gold"
                          : "hover:bg-bgLight text-textSecondary"
                      }`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${x.color} border border-white/20`}
                      />
                      <span className="truncate">{x.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <Link
                  to="/profile"
                  className="hover:text-accent-gold transition-colors flex items-center space-x-1"
                >
                  <RiUserLine size={22} />
                  <span className="text-xs max-w-[80px] truncate hidden lg:inline-block">
                    Hi, {user?.name?.split(" ")[0]}
                  </span>
                </Link>
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-primary border border-borderLight rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 text-textPrimary">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-textPrimary hover:bg-bgLight hover:text-accent-gold"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-textPrimary hover:bg-bgLight hover:text-accent-gold"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-bgLight"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="hover:text-accent-gold transition-colors"
              >
                <RiUserLine size={22} />
              </Link>
            )}
          </div>
        </div>

        {/* Tier 2: Horizontal Navigation bar (Desktop only) */}
        <div className="hidden md:block border-t border-borderLight py-3.5 bg-primary/95 backdrop-blur-md">
          <nav className="max-w-7xl mx-auto px-4 flex items-center justify-center space-x-8">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.path}
                className="text-[10px] sm:text-[11px] font-semibold text-textPrimary hover:text-accent-gold tracking-[0.18em] uppercase transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-0 after:h-[1.5px] after:bg-accent-gold hover:after:w-full after:transition-all after:duration-300"
              >
                {link.title}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* 3. MOBILE MENU BAR */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden luxury-glass border-b border-borderLight py-4 px-6 space-y-3 overflow-hidden text-left"
          >
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[12px] font-semibold text-textPrimary hover:text-accent-gold transition-colors tracking-widest uppercase"
              >
                {link.title}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MAIN PAGE DISPLAY OUTLET */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* 5. PREMIUM LUXURY FOOTER */}
      <footer className="bg-secondary text-primary mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-medium tracking-[0.2em] text-primary uppercase">
              PRIWESH<span className="text-accent-gold">.</span>
            </h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Experience the pinnacle of luxurious women fashion. Elegant Ethnic
              Suits, Girls Kurtas, and Bespoke Collections crafted with fine
              fabrics.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-display tracking-widest text-accent-gold uppercase mb-4">
              Shop Categories
            </h4>
            <ul className="space-y-2 text-xs text-textSecondary">
              <li>
                <Link
                  to="/shop?category=kurtis"
                  className="hover:text-primary transition-colors"
                >
                  Girls Kurtis
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?category=ethnic"
                  className="hover:text-primary transition-colors"
                >
                  Ethnic Wear
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?category=suits"
                  className="hover:text-primary transition-colors"
                >
                  Designer Suits
                </Link>
              </li>
              <li>
                <Link
                  to="/collections"
                  className="hover:text-primary transition-colors"
                >
                  New Releases
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-display tracking-widest text-accent-gold uppercase mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs text-textSecondary">
              <li>
                <Link
                  to="/contact"
                  className="hover:text-primary transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping"
                  className="hover:text-primary transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/returns"
                  className="hover:text-primary transition-colors"
                >
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link
                  to="/faqs"
                  className="hover:text-primary transition-colors"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Offers Sign up */}
          <div className="space-y-4">
            <h4 className="text-xs font-display tracking-widest text-accent-gold uppercase">
              Join the Club
            </h4>
            <p className="text-xs text-textSecondary leading-relaxed">
              Subscribe to unlock early access to sales events and custom coupon
              codes.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter email..."
                className="bg-bgLight text-textPrimary px-3 py-2 text-xs rounded-l focus:outline-none w-full"
              />
              <button className="bg-accent-gold hover:bg-accent-goldHover text-secondary px-4 py-2 text-xs font-semibold rounded-r transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Border line */}
        <div className="border-t border-gray-900 py-6 text-center text-[10px] text-textSecondary font-sans tracking-wide">
          © {new Date().getFullYear()} PRIWESH Premium E-Commerce. All Rights
          Reserved. Designed with Love.
        </div>
      </footer>

      {/* FLOATING WHATSAPP BUTTON (Suitswala.in style) */}
      <a
        href="https://wa.me/916367329132?text=Hello%20Priwesh%20Ensembles%20support!%20I'm%20interested%20in%20your%20products."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA56] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer"
        title="Chat with us on WhatsApp"
      >
        <RiWhatsappLine size={24} />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
        </span>
      </a>
    </div>
  );
};

export default MainLayout;

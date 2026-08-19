import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
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
  RiInstagramLine,
  RiFacebookCircleLine,
} from "react-icons/ri";
import { logoutSuccess } from "../redux/slices/authSlice.js";
import { clearCart } from "../redux/slices/cartSlice.js";
import { clearWishlist } from "../redux/slices/wishlistSlice.js";
import API from "../services/api.js";
import { useAlert } from "../contexts/AlertContext.jsx";
import { hydrateCommerce } from "../services/hydrateCommerce.js";
import Loader from "../components/common/Loader.jsx";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [searchVal, setSearchVal] = useState("");

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      navigate(`/shop?search=${encodeURIComponent(searchVal)}`);
      setMobileMenuOpen(false);
    }
  };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItems = useSelector((state) => state.cart.items);
  const totalCartQuantity = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const wishlistProducts = useSelector((state) => state.wishlist.products);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const isLinkActive = (path) => {
    const currentPathname = location.pathname;
    const currentSearch = location.search;

    if (path === "/") {
      return currentPathname === "/";
    }

    if (path.includes("?")) {
      const [pathBase, pathQuery] = path.split("?");
      if (currentPathname !== pathBase) return false;
      const linkParams = new URLSearchParams(pathQuery);
      const currentParams = new URLSearchParams(currentSearch);
      for (const [key, val] of linkParams.entries()) {
        if (currentParams.get(key) !== val) return false;
      }
      return true;
    } else {
      if (path === "/shop") {
        return currentPathname === "/shop" && currentSearch === "";
      }
      return currentPathname === path;
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      hydrateCommerce();
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    const isProtectedRoute =
      location.pathname === "/profile" ||
      location.pathname.startsWith("/admin");

    if (!isAuthenticated) {
      if (isProtectedRoute) {
        navigate("/login");
      }
    } else {
      if (location.pathname === "/login") {
        if (user?.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else if (
        location.pathname.startsWith("/admin") &&
        user?.role !== "admin"
      ) {
        navigate("/");
      }
    }
  }, [isAuthenticated, location.pathname, navigate, user]);

  const [logoUrl, setLogoUrl] = useState(
    () => localStorage.getItem("brandLogoUrl") || "",
  );
  const [announcementText, setAnnouncementText] = useState(
    () =>
      localStorage.getItem("announcementText") ||
      "✨ USE CODE PARIWESHGOLD TO GET 15% OFF + FREE SHIPPING ON APPAREL ABOVE ₹1500 ✨",
  );
  const [announcementActive, setAnnouncementActive] = useState(
    () => localStorage.getItem("announcementActive") !== "false",
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

          const dbAnnText = res.data.data.announcementText;
          if (dbAnnText !== undefined) {
            setAnnouncementText(dbAnnText);
            localStorage.setItem("announcementText", dbAnnText);
          }
          const dbAnnActive = res.data.data.announcementActive;
          if (dbAnnActive !== undefined) {
            const isActive = dbAnnActive === "true" || dbAnnActive === true;
            setAnnouncementActive(isActive);
            localStorage.setItem("announcementActive", String(isActive));
          }
        }
      } catch (err) {
        console.error("Failed to load brand settings from DB:", err);
      }
    };
    fetchLogoFromDB();

    const handleUpdate = () => {
      setLogoUrl(localStorage.getItem("brandLogoUrl") || "");
      setAnnouncementText(
        localStorage.getItem("announcementText") ||
          "✨ USE CODE PARIWESHGOLD TO GET 15% OFF + FREE SHIPPING ON APPAREL ABOVE ₹1500 ✨",
      );
      setAnnouncementActive(
        localStorage.getItem("announcementActive") !== "false",
      );
    };
    window.addEventListener("logo-updated", handleUpdate);
    window.addEventListener("settings-updated", handleUpdate);
    return () => {
      window.removeEventListener("logo-updated", handleUpdate);
      window.removeEventListener("settings-updated", handleUpdate);
    };
  }, []);

  // Dynamically update the website favicon to match the custom brand logo
  React.useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.href = logoUrl || "/favicon.svg";
    }
  }, [logoUrl]);

  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutSuccess());
    dispatch(clearCart());
    dispatch(clearWishlist());
  };

  const handleJoinClub = (e) => {
    e.preventDefault();
    if (!subscriberEmail || !subscriberEmail.trim()) {
      showAlert("Please enter a valid email address.", "Invalid Email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(subscriberEmail.trim())) {
      showAlert("Please enter a valid email address.", "Invalid Email");
      return;
    }
    showAlert(
      "Thank you for joining the PARIWESH Club! We have sent a welcome offer to your email.",
      "Success",
    );
    setSubscriberEmail("");
  };

  const navLinks = [
    { title: "HOME", path: "/" },
    { title: "BEST SELLING", path: "/shop?tag=Best Seller" },
    { title: "NEW ARRIVAL", path: "/shop?tag=New Arrival" },
    { title: "READYMADE DRESSES", path: "/shop?category=ethnic" },
    { title: "CORD SETS", path: "/shop?category=kurtis" },
    { title: "SUMMER SALE IS LIVE", path: "/shop" },
    { title: "PREMIUM DRESSES", path: "/shop?category=suits" },
    { title: "ALL COLLECTION", path: "/collections" },
    { title: "TRACK YOUR ORDER", path: "/profile" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bgLight">
      {/* Scroll Progress Bar (follows active theme color) */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-accent-gold z-[99999] origin-[0%]"
        style={{ scaleX }}
      />
      {/* GLOBAL ARCH CLIP PATH */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <clipPath id="mehrab-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0,1 L 0,0.35 C 0,0.28 0.08,0.26 0.12,0.24 C 0.12,0.18 0.22,0.15 0.28,0.12 C 0.28,0.08 0.38,0.06 0.44,0.03 C 0.47,0.01 0.49,0 0.5,0 C 0.51,0 0.53,0.01 0.56,0.03 C 0.62,0.06 0.72,0.08 0.72,0.12 C 0.78,0.15 0.88,0.18 0.88,0.24 C 0.92,0.26 1,0.28 1,0.35 L 1,1 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* 1. STICKY ANNOUNCEMENT BAR */}
      {announcementActive && (
        <div className="w-full bg-secondary text-primary py-2 text-[10px] sm:text-xs font-display tracking-widest uppercase transition-all duration-300 overflow-hidden relative whitespace-nowrap select-none">
          <div className="animate-marquee flex items-center justify-around min-w-full">
            {/* Repeated text blocks for infinite seamless flow */}
            {[...Array(12)].map((_, index) => (
              <span key={index} className="mx-6 flex items-center shrink-0">
                <span>{announcementText}</span>
                <span className="mx-6 text-accent-gold select-none">•</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-primary border-b border-borderLight shadow-sm transition-all duration-300">
        {/* Tier 1: Search, Logo, Actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative">
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
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="bg-transparent text-xs text-textPrimary focus:outline-none w-full font-sans"
            />
          </div>

          {/* Elegant Center Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none flex justify-center">
            <Link to="/" className="flex items-center">
              <img
                src={logoUrl || "/logo.png"}
                alt="PARIWESH Logo"
                className="h-10 md:h-12 w-auto object-contain max-w-[110px] xs:max-w-[130px] md:max-w-[200px]"
              />
            </Link>
          </div>

          {/* Navigation Action Buttons (Right) */}
          <div className="flex items-center space-x-4 md:space-x-6 text-textPrimary">
            {/* Wishlist Link (Hidden on Mobile, now in Drawer) */}
            <Link
              to="/wishlist"
              className="hidden md:block hover:text-accent-gold transition-colors relative"
            >
              <RiHeartLine size={22} />
              {wishlistProducts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent-gold text-secondary font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {wishlistProducts.length}
                </span>
              )}
            </Link>

            {/* Cart Link (Always Visible) */}
            <Link
              to="/cart"
              onClick={(e) => {
                e.preventDefault();
                navigate("/cart");
              }}
              className="hover:text-accent-gold transition-colors relative"
            >
              <RiShoppingBagLine size={22} />
              {totalCartQuantity > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent-gold text-secondary font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {totalCartQuantity}
                </span>
              )}
            </Link>

            {/* Auth Menu (Visible on Desktop & Mobile) */}
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
                {/* Dropdown Menu (Desktop Hover only) */}
                <div className="absolute right-0 mt-2 w-48 bg-primary border border-borderLight rounded-md shadow-lg opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible transition-all duration-300 text-textPrimary hidden md:block z-50">
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
        <div className="hidden md:block border-t border-borderLight py-3.5 bg-primary/95 backdrop-blur-md overflow-x-auto scrollbar-none">
          <nav className="max-w-7xl mx-auto px-4 flex items-center justify-start lg:justify-center gap-x-3 lg:gap-x-6 xl:gap-x-8 gap-y-2 whitespace-nowrap">
            {navLinks.map((link, idx) => {
              const active = isLinkActive(link.path);
              return (
                <Link
                  key={idx}
                  to={link.path}
                  className={`whitespace-nowrap text-[9px] lg:text-[10px] xl:text-[11px] font-semibold tracking-[0.1em] xl:tracking-[0.18em] uppercase transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:h-[1.5px] after:bg-accent-gold after:transition-all after:duration-300 ${
                    active
                      ? "text-accent-gold after:w-full"
                      : "text-textPrimary hover:text-accent-gold after:w-0 hover:after:w-full"
                  }`}
                >
                  {link.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 3. MOBILE SIDEBAR DRAWER MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Dim Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 md:hidden"
            />

            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-primary shadow-2xl z-50 flex flex-col md:hidden text-textPrimary"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-borderLight">
                <span className="font-display font-medium tracking-[0.15em] text-sm uppercase">
                  PARIWESH
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-textPrimary hover:text-accent-gold p-1"
                >
                  <RiCloseLine size={24} />
                </button>
              </div>

              {/* Drawer Body (Scrollable Nav List) */}
              <div className="flex-grow overflow-y-auto py-6 px-4 space-y-6">
                {/* Search bar inside drawer */}
                <div className="flex items-center bg-bgLight border border-borderLight px-4 py-2.5 rounded-full w-full">
                  <RiSearchLine className="text-textSecondary mr-2" size={16} />
                  <input
                    type="text"
                    placeholder="Search premium apparel..."
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                    className="bg-transparent text-xs text-textPrimary focus:outline-none w-full font-sans"
                  />
                </div>

                <nav className="space-y-4">
                  <div className="text-[9px] uppercase font-bold text-textSecondary tracking-wider pb-1 border-b border-borderLight/30">
                    Collections & Categories
                  </div>
                  {navLinks.map((link, idx) => (
                    <Link
                      key={idx}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-[11px] font-bold py-1.5 text-textPrimary hover:text-accent-gold tracking-widest uppercase transition-colors"
                    >
                      {link.title}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Drawer Footer (Drawer actions & user profile details) */}
              <div className="p-4 border-t border-borderLight space-y-4 bg-bgLight mt-auto">
                {/* User Info / Profile Link */}
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 text-xs font-semibold text-textPrimary hover:text-accent-gold transition-colors"
                    >
                      <RiUserLine size={18} />
                      <span>Account ({user?.name?.split(" ")[0]})</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs text-danger font-medium hover:underline"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 text-xs font-semibold text-textPrimary hover:text-accent-gold transition-colors"
                  >
                    <RiUserLine size={18} />
                    <span>Login & Register</span>
                  </Link>
                )}

                {/* Wishlist Link inside Drawer */}
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-xs font-semibold text-textPrimary hover:text-accent-gold transition-colors"
                >
                  <span className="flex items-center space-x-3">
                    <RiHeartLine size={18} />
                    <span>My Wishlist</span>
                  </span>
                  {wishlistProducts.length > 0 && (
                    <span className="bg-accent-gold text-secondary font-bold text-[9px] px-2 py-0.5 rounded-full border border-white">
                      {wishlistProducts.length}
                    </span>
                  )}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. MAIN PAGE DISPLAY OUTLET */}
      <main className="flex-grow overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <React.Suspense fallback={<Loader />}>
              <Outlet />
            </React.Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 5. PREMIUM LUXURY FOOTER */}
      <footer className="bg-secondary text-primary mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-medium tracking-[0.2em] text-primary uppercase">
              PARIWESH<span className="text-accent-gold">.</span>
            </h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Experience the pinnacle of luxurious women fashion. Elegant Ethnic
              Suits, Girls Kurtas, and Bespoke Collections crafted with fine
              fabrics.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a
                href="https://www.instagram.com/pariweshofficial/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="text-textSecondary hover:text-accent-gold transition-colors"
                aria-label="Instagram"
              >
                <RiInstagramLine size={18} />
              </a>
              <a
                href="https://www.facebook.com/pariweshofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="text-textSecondary hover:text-accent-gold transition-colors"
                aria-label="Facebook"
              >
                <RiFacebookCircleLine size={18} />
              </a>
            </div>
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
            <form
              onSubmit={handleJoinClub}
              className="flex gap-x-2 border-b border-borderLight/30 pb-1"
            >
              <input
                type="email"
                placeholder="Enter email..."
                value={subscriberEmail}
                onChange={(e) => setSubscriberEmail(e.target.value)}
                className="bg-transparent text-primary placeholder-textSecondary px-1 py-2 text-base md:text-sm focus:outline-none w-full font-sans border-0"
              />
              <button
                type="submit"
                className="hover:text-accent-gold text-primary px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 font-display bg-transparent border-0 outline-none"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Border line */}
        <div className="border-t border-gray-900 py-6 text-center text-[10px] text-textSecondary font-sans tracking-wide">
          © {new Date().getFullYear()} PARIWESH Premium E-Commerce. All Rights
          Reserved. Designed with Love.
        </div>
      </footer>

      {/* FLOATING WHATSAPP BUTTON (Suitswala.in style) */}
      <a
        href="https://wa.me/918209903441?text=Hello%20Pariwesh%20Ensembles%20support!%20I'm%20interested%20in%20your%20products."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 xs:bottom-24 md:bottom-8 right-4 md:right-8 z-50 bg-[#25D366] hover:bg-[#20BA56] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer"
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

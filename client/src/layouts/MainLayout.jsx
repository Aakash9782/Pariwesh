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
  RiTruckLine,
  RiShieldCheckLine,
} from "react-icons/ri";
import { logoutSuccess } from "../redux/slices/authSlice.js";
import { clearCart } from "../redux/slices/cartSlice.js";
import { clearWishlist } from "../redux/slices/wishlistSlice.js";
import API from "../services/api.js";
import { useAlert } from "../contexts/AlertContext.jsx";
import { hydrateCommerce } from "../services/hydrateCommerce.js";
import Loader from "../components/common/Loader.jsx";
import Footer from "../components/common/Footer.jsx";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
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

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

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

  const [saleEventActive, setSaleEventActive] = useState(
    () => localStorage.getItem("saleEventActive") !== "false",
  );
  const [saleNavTitle, setSaleNavTitle] = useState(
    () => localStorage.getItem("saleNavTitle") || "NAVRATRI SALE IS LIVE",
  );
  const [saleNavBadge, setSaleNavBadge] = useState(
    () => localStorage.getItem("saleNavBadge") || "Sale",
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

          if (res.data.data.saleEventActive !== undefined) {
            const isSaleAct =
              res.data.data.saleEventActive === "true" ||
              res.data.data.saleEventActive === true;
            setSaleEventActive(isSaleAct);
            localStorage.setItem("saleEventActive", String(isSaleAct));
          }
          if (res.data.data.saleNavTitle !== undefined) {
            setSaleNavTitle(res.data.data.saleNavTitle);
            localStorage.setItem("saleNavTitle", res.data.data.saleNavTitle);
          }
          if (res.data.data.saleNavBadge !== undefined) {
            setSaleNavBadge(res.data.data.saleNavBadge);
            localStorage.setItem("saleNavBadge", res.data.data.saleNavBadge);
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
      setSaleEventActive(
        localStorage.getItem("saleEventActive") !== "false",
      );
      setSaleNavTitle(
        localStorage.getItem("saleNavTitle") || "NAVRATRI SALE IS LIVE",
      );
      setSaleNavBadge(
        localStorage.getItem("saleNavBadge") || "Sale",
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

    const desktopNavLinks = [
    { title: "BEST SELLING", path: "/shop?tag=Best Seller", badge: "Hot" },
    { title: "NEW ARRIVAL", path: "/shop?tag=New Arrival", badge: "New" },
    { title: "READYMADE DRESSES", path: "/shop?category=ethnic" },
    { title: "CO-ORD SETS", path: "/shop?category=co-ord-sets" },
    ...(saleEventActive
      ? [
          {
            title: saleNavTitle || "NAVRATRI SALE IS LIVE",
            path: "/sale",
            badge: saleNavBadge || "Sale",
            isSale: true,
          },
        ]
      : []),
    { title: "PREMIUM DRESSES", path: "/shop?category=suits" },
    { title: "ALL COLLECTION", path: "/collections" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bgLight">
      {/* Scroll Progress Bar (follows active theme color) */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-accent-gold z-[99999] origin-[0%]"
        style={{ scaleX }}
      />
      {/* GLOBAL REFINED ROYAL ARCH CLIP PATH (Delicate Crown Arch - Zero Head Cutout) */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <clipPath id="mehrab-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0,1 L 0,0.06 C 0,0.048 0.08,0.044 0.12,0.041 C 0.12,0.031 0.22,0.026 0.28,0.02 C 0.28,0.014 0.38,0.01 0.44,0.005 C 0.47,0.002 0.49,0 0.5,0 C 0.51,0 0.53,0.002 0.56,0.005 C 0.62,0.01 0.72,0.014 0.72,0.02 C 0.78,0.026 0.88,0.031 0.88,0.041 C 0.92,0.044 1,0.048 1,0.06 L 1,1 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* 1. STICKY ANNOUNCEMENT BAR */}
      {announcementActive && (
        <div className="w-full bg-secondary text-primary py-2 text-[10px] sm:text-xs font-display tracking-widest uppercase transition-all duration-300 overflow-hidden relative whitespace-nowrap select-none border-b border-[#c5a880]/30 shadow-xs">
          <div className="animate-marquee flex items-center justify-around min-w-full">
            {/* Repeated text blocks for infinite seamless flow */}
            {[...Array(12)].map((_, index) => (
              <span key={index} className="mx-6 flex items-center shrink-0">
                <span className="font-semibold tracking-[0.2em]">{announcementText}</span>
                <span className="mx-6 text-accent-gold select-none text-xs">✦</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/90 border-b border-[#c5a880]/30 shadow-[0_4px_25px_rgba(0,0,0,0.03)] transition-all duration-300">
        {/* Tier 1: Search, Logo, Actions */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-[68px] md:h-[82px] flex items-center justify-between relative">
          
          {/* Mobile Left: Menu Toggle (Bespoke Luxury Hamburger Icon) */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-full flex flex-col items-center justify-center space-y-[4.5px] bg-[#FDFBF7] hover:bg-[#F5F0E6] border border-[#c5a880]/40 shadow-xs text-slate-800 transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <RiCloseLine size={22} className="text-[#8a1c14]" />
              ) : (
                <>
                  <span className="w-5 h-[1.8px] bg-slate-800 rounded-full transition-transform" />
                  <span className="w-3.5 h-[1.8px] bg-[#8a1c14] rounded-full transition-transform" />
                  <span className="w-4.5 h-[1.8px] bg-slate-800 rounded-full transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Desktop Search Input Field (Left) - Glassy Pill with Gold Accent */}
          <div className="hidden md:flex items-center bg-[#FDFBF7] hover:bg-white focus-within:bg-white border border-[#c5a880]/40 hover:border-[#c5a880]/70 focus-within:border-[#c5a880] shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus-within:shadow-[0_4px_20px_rgba(197,168,128,0.22)] px-3.5 py-2 rounded-full w-64 lg:w-80 transition-all duration-300 group">
            <RiSearchLine className="text-[#8a1c14] group-focus-within:text-[#c5a880] mr-2 shrink-0 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search suits, kurtas, sets..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-full font-sans tracking-normal"
            />
            {searchVal && (
              <button
                onClick={() => setSearchVal("")}
                className="text-slate-400 hover:text-slate-600 p-0.5 mr-1 cursor-pointer"
                title="Clear"
              >
                <RiCloseLine size={14} />
              </button>
            )}
            <kbd className="text-[9px] text-slate-400 font-mono bg-slate-100/90 px-1.5 py-0.5 rounded border border-slate-200/80 shadow-2xs hidden lg:inline-block pointer-events-none">
              ↵
            </kbd>
          </div>

          {/* Regal Centered Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none flex items-center justify-center">
            <Link to="/" className="flex items-center justify-center group py-0.5">
              <img
                src={logoUrl || "/logo.png"}
                alt="PARIWESH"
                className="h-[52px] sm:h-[58px] md:h-[66px] w-auto object-contain max-w-[125px] sm:max-w-[170px] md:max-w-[220px] transition-transform duration-300 group-hover:scale-[1.03] filter contrast-[1.08] brightness-[0.96] drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              />
            </Link>
          </div>

          {/* Navigation Action Buttons (Right) - Uniform Luxury Round Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 md:space-x-3 text-slate-800">
            {/* Wishlist Link (Desktop & Mobile) */}
            <Link
              to="/wishlist"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FDFBF7] hover:bg-[#F5F0E6] border border-[#c5a880]/40 shadow-xs hover:border-[#c5a880] text-slate-800 hover:text-[#8a1c14] transition-all duration-200 relative group cursor-pointer shrink-0"
              title="Wishlist"
            >
              <RiHeartLine size={19} className="group-hover:scale-110 transition-transform" />
              {wishlistProducts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#8a1c14] text-white font-bold text-[9px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs pointer-events-none">
                  {wishlistProducts.length}
                </span>
              )}
            </Link>

            {/* Cart Link (Desktop & Mobile) */}
            <Link
              to="/cart"
              onClick={(e) => {
                e.preventDefault();
                navigate("/cart");
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FDFBF7] hover:bg-[#F5F0E6] border border-[#c5a880]/40 shadow-xs hover:border-[#c5a880] text-slate-800 hover:text-[#8a1c14] transition-all duration-200 relative group cursor-pointer shrink-0"
              title="Shopping Bag"
            >
              <RiShoppingBagLine size={19} className="group-hover:scale-110 transition-transform" />
              {totalCartQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#8a1c14] text-white font-bold text-[9px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs pointer-events-none">
                  {totalCartQuantity}
                </span>
              )}
            </Link>

            {/* Desktop Auth Menu (Hidden on mobile to eliminate header overcrowding) */}
            {isAuthenticated ? (
              <div className="relative group hidden md:block">
                <Link
                  to="/profile"
                  className="h-10 px-3.5 rounded-full flex items-center space-x-2 bg-[#FDFBF7] hover:bg-white border border-[#c5a880]/40 hover:border-[#c5a880] shadow-xs text-slate-800 hover:text-[#8a1c14] transition-all duration-200"
                >
                  <div className="w-6 h-6 rounded-full bg-[#8a1c14] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                    {user?.name?.[0]?.toUpperCase() || <RiUserLine size={12} />}
                  </div>
                  <span className="text-xs font-semibold max-w-[85px] truncate hidden lg:inline-block">
                    {user?.name?.split(" ")[0]}
                  </span>
                </Link>
                {/* Luxury Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-2xl border border-[#c5a880]/35 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible transition-all duration-300 hidden md:block z-50 overflow-hidden p-1.5 divide-y divide-slate-100">
                  <div className="px-3 py-2 text-left">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Signed in as</p>
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-3 py-2 text-xs font-medium rounded-xl text-slate-700 hover:bg-amber-50/60 hover:text-[#8a1c14] transition"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center px-3 py-2 text-xs font-medium rounded-xl text-slate-700 hover:bg-amber-50/60 hover:text-[#8a1c14] transition"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      className="flex items-center px-3 py-2 text-xs font-medium rounded-xl text-slate-700 hover:bg-amber-50/60 hover:text-[#8a1c14] transition"
                    >
                      My Wishlist
                    </Link>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex h-10 px-4 rounded-full items-center space-x-1.5 bg-[#FDFBF7] hover:bg-white border border-[#c5a880]/40 hover:border-[#c5a880] shadow-xs text-slate-800 hover:text-[#8a1c14] transition-all duration-200"
                title="Sign In"
              >
                <RiUserLine size={17} />
                <span className="text-xs font-bold uppercase tracking-wider hidden lg:inline-block">
                  Login
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Tier 2: Horizontal Navigation Bar (Desktop - Royal Editorial Strip) */}
        <div className="hidden md:block border-t border-[#c5a880]/20 py-2.5 bg-[#FBF9F5]/90 backdrop-blur-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] overflow-x-auto scrollbar-none">
          <nav className="max-w-7xl mx-auto px-4 flex items-center justify-start lg:justify-center gap-x-3 lg:gap-x-6 xl:gap-x-8 gap-y-1.5 whitespace-nowrap">
            {desktopNavLinks.map((link, idx) => {
              const active = isLinkActive(link.path);
              return (
                <Link
                  key={idx}
                  to={link.path}
                  className={`inline-flex items-center whitespace-nowrap text-[10px] lg:text-[11px] xl:text-[11.5px] font-bold tracking-[0.14em] xl:tracking-[0.18em] uppercase px-2 py-1 rounded-md transition-all duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:bg-[#c5a880] after:transition-all after:duration-300 ${
                    active
                      ? "text-[#8a1c14] after:w-4/5"
                      : "text-slate-700 hover:text-[#8a1c14] after:w-0 hover:after:w-4/5"
                  }`}
                >
                  <span>{link.title}</span>
                  {link.badge && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 text-[7.5px] font-extrabold uppercase tracking-wider rounded-full shadow-2xs ${
                        link.badge === "Sale"
                          ? "bg-[#8a1c14] text-white animate-pulse"
                          : link.badge === "New"
                          ? "bg-[#c5a880] text-white"
                          : "bg-amber-100 text-amber-900 border border-amber-300/60"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
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
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
            />

            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-2xl z-50 flex flex-col md:hidden text-slate-800"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#FDFBF7]">
                <div className="flex items-center space-x-2">
                  <span className="text-accent-gold text-xs">✦</span>
                  <span className="font-display font-bold tracking-[0.2em] text-sm uppercase text-[#8a1c14]">
                    PARIWESH
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition"
                  aria-label="Close menu"
                >
                  <RiCloseLine size={22} />
                </button>
              </div>

              {/* Drawer Body (Scrollable Nav List) */}
              <div className="flex-grow overflow-y-auto py-5 px-4 space-y-6">
                {/* Search bar inside drawer */}
                <div className="flex items-center bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 rounded-full w-full focus-within:border-[#c5a880] focus-within:bg-white shadow-2xs transition">
                  <RiSearchLine className="text-[#8a1c14] mr-2 shrink-0" size={16} />
                  <input
                    type="text"
                    placeholder="Search silk suits, kurtas, sets..."
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                    className="bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-full font-sans"
                  />
                  {searchVal && (
                    <button onClick={() => setSearchVal("")} className="text-slate-400 p-0.5">
                      <RiCloseLine size={14} />
                    </button>
                  )}
                </div>

                {/* Categories & Curations with Glowing Badges */}
                <nav className="space-y-1">
                  <div className="text-[10px] uppercase font-extrabold text-[#c5a880] tracking-[0.2em] pb-2 mb-1 border-b border-slate-100 flex items-center justify-between">
                    <span>Couture Collections</span>
                    <span className="text-[9px] lowercase font-normal text-slate-400">explore</span>
                  </div>
                  {desktopNavLinks.map((link, idx) => (
                    <Link
                      key={idx}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-2 rounded-lg text-xs font-bold text-slate-800 hover:text-[#8a1c14] hover:bg-amber-50/50 tracking-wider uppercase transition-colors"
                    >
                      <span>{link.title}</span>
                      {link.badge && (
                        <span
                          className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full shadow-2xs ${
                            link.badge === "Sale"
                              ? "bg-[#8a1c14] text-white animate-pulse"
                              : link.badge === "New"
                              ? "bg-[#c5a880] text-white"
                              : "bg-amber-100 text-amber-900 border border-amber-300/60"
                          }`}
                        >
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </nav>

                {/* Quick Client Services Section */}
                <div className="space-y-1 pt-2">
                  <div className="text-[10px] uppercase font-extrabold text-[#c5a880] tracking-[0.2em] pb-2 mb-1 border-b border-slate-100">
                    Client Services
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2.5 py-2 px-2 text-xs font-semibold text-slate-700 hover:text-[#8a1c14] rounded-lg hover:bg-slate-50 transition"
                  >
                    <RiTruckLine size={16} className="text-[#8a1c14]" />
                    <span>Track Your Order</span>
                  </Link>
                  <Link
                    to="/shipping"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2.5 py-2 px-2 text-xs font-semibold text-slate-700 hover:text-[#8a1c14] rounded-lg hover:bg-slate-50 transition"
                  >
                    <RiShieldCheckLine size={16} className="text-[#c5a880]" />
                    <span>Shipping & Returns</span>
                  </Link>
                  <a
                    href="https://wa.me/918209903441?text=Hello%20Pariwesh!%20I'm%20looking%20for%20assistance."
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2.5 py-2 px-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 rounded-lg hover:bg-emerald-50/50 transition"
                  >
                    <RiWhatsappLine size={16} />
                    <span>WhatsApp Style Advisor</span>
                  </a>
                </div>
              </div>

              {/* Drawer Footer (User Profile & Wishlist) */}
              <div className="p-4 border-t border-slate-100 space-y-3 bg-[#FDFBF7] mt-auto">
                {/* User Info / Profile Link */}
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 text-xs font-bold text-slate-800 hover:text-[#8a1c14] transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#8a1c14] text-white text-[11px] font-bold flex items-center justify-center">
                        {user?.name?.[0]?.toUpperCase() || <RiUserLine size={12} />}
                      </div>
                      <span className="truncate max-w-[140px]">Account ({user?.name?.split(" ")[0]})</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8a1c14] to-[#6d150e] text-white text-xs font-bold uppercase tracking-wider shadow-sm"
                  >
                    <RiUserLine size={16} />
                    <span>Login & Register</span>
                  </Link>
                )}

                {/* Wishlist Link inside Drawer */}
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 px-2.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-800 hover:text-[#8a1c14] transition-colors shadow-2xs"
                >
                  <span className="flex items-center space-x-2.5">
                    <RiHeartLine size={16} className="text-[#8a1c14]" />
                    <span>My Wishlist</span>
                  </span>
                  {wishlistProducts.length > 0 && (
                    <span className="bg-[#8a1c14] text-white font-bold text-[9px] px-2 py-0.5 rounded-full shadow-xs">
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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={false}
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
      <Footer />

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href="https://wa.me/918209903441?text=Hello%20Pariwesh%20Ensembles%20support!%20I'm%20interested%20in%20your%20products."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 md:bottom-8 right-3.5 md:right-6 z-40 bg-[#25D366] hover:bg-[#20BA56] text-white p-3 md:p-3.5 rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer"
        title="Chat with us on WhatsApp"
      >
        <RiWhatsappLine size={22} className="md:w-6 md:h-6" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
        </span>
      </a>
    </div>
  );
};

export default MainLayout;

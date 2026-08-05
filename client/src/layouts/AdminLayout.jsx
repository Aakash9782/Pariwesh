import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
  RiDashboardLine,
  RiArchiveLine,
  RiShoppingBag3Line,
  RiGroupLine,
  RiInboxArchiveLine,
  RiMegaphoneLine,
  RiBarChart2Line,
  RiSettings4Line,
  RiNotification3Line,
  RiLogoutBoxRLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiSearchLine,
  RiUserLine,
  RiCloseLine,
  RiExchangeBoxLine,
  RiPriceTag3Line,
  RiMailLine,
} from "react-icons/ri";
import API from "../services/api.js";
import { useAlert } from "../contexts/AlertContext.jsx";
import SEO from "../components/common/SEO.jsx";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/admin/dashboard", icon: RiDashboardLine },
  { name: "Products", path: "/admin/products", icon: RiArchiveLine },
  { name: "Catalog", path: "/admin/catalog", icon: RiPriceTag3Line },
  { name: "Orders", path: "/admin/orders", icon: RiShoppingBag3Line },
  { name: "Returns", path: "/admin/returns", icon: RiExchangeBoxLine },
  { name: "Customers", path: "/admin/customers", icon: RiGroupLine },
  { name: "Inventory", path: "/admin/inventory", icon: RiInboxArchiveLine },
  { name: "Marketing", path: "/admin/marketing", icon: RiMegaphoneLine },
  { name: "Mail", path: "/admin/mail", icon: RiMailLine },
  { name: "Analytics", path: "/admin/analytics", icon: RiBarChart2Line },
  { name: "Settings", path: "/admin/settings", icon: RiSettings4Line },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useAlert();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const notifRef = useRef(null);
  const searchTimer = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      if (res.data?.success) {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.role]);

  // Close panels on Esc / outside click
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowNotifications(false);
        setShowSearchModal(false);
        setMobileSidebarOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      mobileSidebarOpen || showSearchModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen, showSearchModal]);

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    toast.success("Logged out successfully");
    window.location.href = "/";
  };

  const runGlobalSearch = useCallback(async (val) => {
    if (!val || val.trim().length < 2) {
      setGlobalSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const [prodRes, orderRes, userRes, couponRes] = await Promise.all([
        API.get("/products"),
        API.get("/orders"),
        API.get("/users"),
        API.get("/coupons"),
      ]);

      const q = val.toLowerCase();

      setGlobalSearchResults({
        products: (prodRes.data?.data || []).filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q),
        ),
        orders: (orderRes.data?.data || []).filter(
          (o) =>
            o.orderId?.toLowerCase().includes(q) ||
            o.customer?.name?.toLowerCase().includes(q) ||
            o.customer?.phone?.includes(q),
        ),
        customers: (userRes.data?.data || []).filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q),
        ),
        coupons: (couponRes.data?.data || []).filter((c) =>
          c.code?.toLowerCase().includes(q),
        ),
      });
    } catch (err) {
      console.error("Global search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleGlobalSearch = (val) => {
    setGlobalSearchQuery(val);
    clearTimeout(searchTimer.current);
    if (!val || val.trim().length < 2) {
      setGlobalSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimer.current = setTimeout(() => runGlobalSearch(val), 280);
  };

  const closeSearch = () => {
    setShowSearchModal(false);
    setGlobalSearchQuery("");
    setGlobalSearchResults(null);
    setSearchLoading(false);
  };

  const isNavActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNavLinks = (mobile = false) =>
    NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      const active = isNavActive(item.path);
      return (
        <Link
          key={item.path}
          to={item.path}
          title={sidebarCollapsed && !mobile ? item.name : undefined}
          onClick={() => mobile && setMobileSidebarOpen(false)}
          className={`group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all border-l-2 ${
            active
              ? "border-[#c5a880] bg-[#c5a880]/10 text-[#a88f65]"
              : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          } ${sidebarCollapsed && !mobile ? "justify-center px-2" : ""}`}
        >
          <Icon
            size={18}
            className={`shrink-0 ${active ? "text-[#c5a880]" : "text-slate-400 group-hover:text-slate-600"}`}
          />
          {(mobile || !sidebarCollapsed) && (
            <span className="truncate">{item.name}</span>
          )}
          {active && !sidebarCollapsed && !mobile && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#c5a880]" />
          )}
        </Link>
      );
    });

  const hasSearchHits =
    globalSearchResults &&
    (globalSearchResults.products.length > 0 ||
      globalSearchResults.orders.length > 0 ||
      globalSearchResults.customers.length > 0 ||
      globalSearchResults.coupons.length > 0);

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] text-slate-700 font-sans admin-shell">
      <SEO title="Admin Hub Portal" noindex={true} />
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 sticky top-0 h-screen shadow-xs z-30 ${
          sidebarCollapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div
          className={`h-16 flex items-center border-b border-slate-200 shrink-0 ${
            sidebarCollapsed ? "justify-center px-2" : "justify-between px-5"
          }`}
        >
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <span className="font-display font-bold tracking-[0.18em] text-[#c5a880] uppercase text-sm block">
                Pariwesh
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
                Admin Hub
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-slate-400 hover:text-[#c5a880] transition-colors p-1.5 rounded-md hover:bg-slate-50"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? (
              <RiMenuUnfoldLine size={20} />
            ) : (
              <RiMenuFoldLine size={20} />
            )}
          </button>
        </div>

        <nav className="flex-grow py-4 px-2.5 space-y-0.5 overflow-y-auto admin-scrollbar">
          {renderNavLinks(false)}
        </nav>

        <div className="p-3 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors ${
              sidebarCollapsed ? "justify-center px-2" : ""
            }`}
          >
            <RiLogoutBoxRLine size={18} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm"
          />
          <div className="relative flex flex-col h-[100dvh] max-h-[100dvh] w-72 max-w-[85vw] bg-white border-r border-slate-200 animate-slide-in-left shadow-2xl">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 shrink-0">
              <div>
                <span className="font-display font-bold tracking-[0.18em] text-[#c5a880] uppercase text-sm block">
                  Pariwesh
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
                  Admin Hub
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="text-slate-400 hover:text-[#c5a880] p-1.5 rounded-md hover:bg-slate-50"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

            <nav className="flex-grow py-4 px-2.5 space-y-0.5 overflow-y-auto admin-scrollbar">
              {renderNavLinks(true)}
            </nav>

            <div className="p-3 pb-8 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMobileSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <RiLogoutBoxRLine size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="text-slate-500 hover:text-[#c5a880] md:hidden p-1.5 rounded-md hover:bg-slate-50"
              aria-label="Open menu"
            >
              <RiMenuUnfoldLine size={22} />
            </button>

            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="hidden sm:flex items-center bg-[#FAF9F6] border border-slate-200 rounded-lg px-3.5 py-2 w-64 lg:w-80 text-slate-400 hover:border-[#c5a880]/40 transition group"
            >
              <RiSearchLine size={15} className="mr-2.5 shrink-0" />
              <span className="text-xs truncate flex-grow text-left">
                Search products, orders…
              </span>
              <kbd className="hidden lg:inline text-[9px] font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 group-hover:border-[#c5a880]/30">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="sm:hidden text-slate-500 hover:text-[#c5a880] p-1.5 rounded-md hover:bg-slate-50"
              aria-label="Search"
            >
              <RiSearchLine size={20} />
            </button>

            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-slate-500 hover:text-[#c5a880] transition-colors relative p-1.5 rounded-md hover:bg-slate-50"
                aria-label="Notifications"
              >
                <RiNotification3Line size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-red-500 text-white font-bold text-[8px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 text-slate-800 animate-fade-in">
                  <div className="flex justify-between items-center px-2.5 py-2 border-b border-slate-100">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Notifications
                      {unreadCount > 0 ? ` · ${unreadCount} new` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-700 p-0.5"
                    >
                      <RiCloseLine size={16} />
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1.5 space-y-1 admin-scrollbar">
                    {notifications.length === 0 ? (
                      <p className="text-center py-8 text-xs text-slate-400">
                        No notifications yet
                      </p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-2.5 text-xs rounded-lg transition flex flex-col gap-1.5 ${
                            notif.read
                              ? "bg-slate-50/60 opacity-75"
                              : "bg-[#c5a880]/5 border-l-2 border-[#c5a880]"
                          }`}
                        >
                          <p className="font-semibold text-slate-800 leading-snug">
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span>
                              {new Date(notif.createdAt).toLocaleTimeString()}
                            </span>
                            <div className="flex gap-2">
                              {!notif.read && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAsRead(notif._id)}
                                  className="text-[#c5a880] hover:underline font-semibold"
                                >
                                  Mark read
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteNotif(notif._id)}
                                className="text-red-500 hover:underline font-semibold"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 sm:pl-4 h-9">
              <div className="w-8 h-8 rounded-full bg-[#c5a880]/10 border border-[#c5a880]/25 flex items-center justify-center text-[#c5a880]">
                <RiUserLine size={15} />
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                  {user?.name || "Admin"}
                </p>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-6 md:p-8 bg-[#FAF9F6] overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Global search modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[10vh] p-4 bg-neutral-950/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl animate-scaleDown">
            <div className="flex items-center border-b border-slate-200 px-4 py-3.5">
              <RiSearchLine
                size={18}
                className="text-[#c5a880] mr-3 shrink-0"
              />
              <input
                type="text"
                autoFocus
                placeholder="Search products, orders, customers, coupons…"
                value={globalSearchQuery}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className="bg-transparent border-none text-slate-800 placeholder:text-slate-400 focus:outline-none w-full text-sm"
              />
              <button
                type="button"
                onClick={closeSearch}
                className="text-slate-400 hover:text-slate-600 p-1 shrink-0"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="p-4 max-h-[55vh] overflow-y-auto admin-scrollbar space-y-5">
              {!globalSearchQuery || globalSearchQuery.trim().length < 2 ? (
                <p className="text-center py-10 text-slate-400 text-xs">
                  Type at least 2 characters to search
                </p>
              ) : searchLoading ? (
                <p className="text-center py-10 text-slate-400 text-xs animate-pulse">
                  Searching…
                </p>
              ) : hasSearchHits ? (
                <>
                  {globalSearchResults.products.length > 0 && (
                    <SearchGroup
                      title="Products"
                      count={globalSearchResults.products.length}
                    >
                      {globalSearchResults.products.slice(0, 8).map((p) => (
                        <SearchRow
                          key={p._id}
                          onClick={() => {
                            closeSearch();
                            navigate(`/admin/products?edit=${p._id}`);
                          }}
                          title={p.name}
                          subtitle={p.sku}
                          meta={`₹${p.price}`}
                          image={p.images?.[0]}
                        />
                      ))}
                    </SearchGroup>
                  )}
                  {globalSearchResults.orders.length > 0 && (
                    <SearchGroup
                      title="Orders"
                      count={globalSearchResults.orders.length}
                    >
                      {globalSearchResults.orders.slice(0, 8).map((o) => (
                        <SearchRow
                          key={o._id}
                          onClick={() => {
                            closeSearch();
                            navigate(`/admin/orders?view=${o._id}`);
                          }}
                          title={o.orderId}
                          subtitle={`${o.customer?.name || "—"} · ${o.customer?.phone || ""}`}
                          meta={`₹${o.pricing?.grandTotal || o.pricing?.total || o.totalPrice || 0}`}
                          badge={o.orderStatus}
                        />
                      ))}
                    </SearchGroup>
                  )}
                  {globalSearchResults.customers.length > 0 && (
                    <SearchGroup
                      title="Customers"
                      count={globalSearchResults.customers.length}
                    >
                      {globalSearchResults.customers.slice(0, 8).map((c) => (
                        <SearchRow
                          key={c._id}
                          onClick={() => {
                            closeSearch();
                            navigate(`/admin/customers?search=${c.email}`);
                          }}
                          title={c.name}
                          subtitle={c.email}
                          badge={c.role}
                        />
                      ))}
                    </SearchGroup>
                  )}
                  {globalSearchResults.coupons.length > 0 && (
                    <SearchGroup
                      title="Coupons"
                      count={globalSearchResults.coupons.length}
                    >
                      {globalSearchResults.coupons.slice(0, 8).map((cop) => (
                        <SearchRow
                          key={cop._id}
                          onClick={() => {
                            closeSearch();
                            navigate(`/admin/marketing?tab=coupons`);
                          }}
                          title={cop.code}
                          subtitle={`${cop.discountType} · ${cop.value}${cop.discountType === "Flat" ? "₹" : "%"}`}
                        />
                      ))}
                    </SearchGroup>
                  )}
                </>
              ) : (
                <p className="text-center py-10 text-slate-400 text-xs">
                  No matches found
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SearchGroup = ({ title, count, children }) => (
  <div>
    <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#c5a880] mb-2 px-0.5">
      {title} ({count})
    </h4>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const SearchRow = ({ onClick, title, subtitle, meta, badge, image }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left bg-[#FAF9F6] border border-slate-200 hover:border-[#c5a880]/40 hover:bg-white p-3 rounded-lg flex items-center justify-between gap-3 transition-all"
  >
    <div className="flex items-center gap-3 min-w-0">
      {image && (
        <img
          src={image}
          className="w-9 h-9 object-cover rounded-md border border-slate-200 shrink-0"
          alt=""
        />
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">{title}</p>
        {subtitle && (
          <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {badge && (
        <span className="text-[9px] bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
          {badge}
        </span>
      )}
      {meta && (
        <span className="text-xs font-bold text-[#c5a880] font-mono">
          {meta}
        </span>
      )}
    </div>
  </button>
);

export default AdminLayout;

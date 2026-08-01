import React, { useState, useEffect } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutSuccess } from "../redux/slices/authSlice.js";
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
  RiHistoryLine,
  RiLogoutBoxRLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiSearchLine,
  RiUserLine,
  RiCoupon3Line,
  RiCloseLine,
  RiExchangeBoxLine,
  RiPriceTag3Line,
} from "react-icons/ri";
import API from "../services/api.js";
import { useAlert } from "../contexts/AlertContext.jsx";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { alert } = useAlert();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Authenticated & Admin check
  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  // Fetch Admin Notifications
  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      if (res.data && res.data.success) {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

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
      alert("Notification deleted");
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    alert("Logged out successfully");
    window.location.href = "/";
  };

  // Universal Global Search
  const handleGlobalSearch = async (val) => {
    setGlobalSearchQuery(val);
    if (!val || val.trim().length < 2) {
      setGlobalSearchResults(null);
      return;
    }
    try {
      // Execute searches concurrently across entities: products, orders, customers (users), coupons
      const [prodRes, orderRes, userRes, couponRes] = await Promise.all([
        API.get("/products"),
        API.get("/orders"),
        API.get("/users"),
        API.get("/coupons"),
      ]);

      const q = val.toLowerCase();

      const matchedProds = (prodRes.data?.data || []).filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      );

      const matchedOrders = (orderRes.data?.data || []).filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q) ||
          o.customer?.phone?.includes(q),
      );

      const matchedCustomers = (userRes.data?.data || []).filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );

      const matchedCoupons = (couponRes.data?.data || []).filter((c) =>
        c.code.toLowerCase().includes(q),
      );

      setGlobalSearchResults({
        products: matchedProds,
        orders: matchedOrders,
        customers: matchedCustomers,
        coupons: matchedCoupons,
      });
    } catch (err) {
      console.error("Global search failed:", err);
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <RiDashboardLine size={20} />,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: <RiArchiveLine size={20} />,
    },
    {
      name: "Catalog",
      path: "/admin/catalog",
      icon: <RiPriceTag3Line size={20} />,
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: <RiShoppingBag3Line size={20} />,
    },
    {
      name: "Returns",
      path: "/admin/returns",
      icon: <RiExchangeBoxLine size={20} />,
    },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: <RiGroupLine size={20} />,
    },
    {
      name: "Inventory",
      path: "/admin/inventory",
      icon: <RiInboxArchiveLine size={20} />,
    },
    {
      name: "Marketing",
      path: "/admin/marketing",
      icon: <RiMegaphoneLine size={20} />,
    },
    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: <RiBarChart2Line size={20} />,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: <RiSettings4Line size={20} />,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* 1. DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 sticky top-0 h-screen ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand/Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          {!sidebarCollapsed && (
            <span className="font-display font-semibold tracking-wider text-accent-gold uppercase text-base">
              PARIWESH HUBL
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-slate-400 hover:text-accent-gold transition-colors focus:outline-none"
          >
            {sidebarCollapsed ? (
              <RiMenuUnfoldLine size={20} />
            ) : (
              <RiMenuFoldLine size={20} />
            )}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-grow py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center space-x-4 px-3.5 py-3 rounded-lg text-sm font-medium tracking-wide transition-all ${
                  isActive
                    ? "bg-accent-gold text-slate-950 font-bold shadow-lg shadow-accent-gold/10"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                {item.icon}
                {!sidebarCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-4 px-3.5 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-rose-950/20 hover:text-red-300 transition-colors"
          >
            <RiLogoutBoxRLine size={20} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* 2. RESPONSIVE MOBILE DRAWER SIDEBAR */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Tint Screen Overlay */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          {/* Drawer Menu Contents */}
          <div className="relative flex flex-col h-[100dvh] max-h-[100dvh] w-72 max-w-xs bg-slate-950 border-r border-slate-800 animate-slide-in-left">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <span className="font-display font-semibold tracking-wider text-accent-gold uppercase text-base">
                PARIWESH HUB
              </span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="text-slate-400 hover:text-accent-gold p-1"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            <nav className="flex-grow py-6 px-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item, idx) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={idx}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center space-x-4 px-3.5 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-accent-gold text-slate-950 font-bold"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 pb-8 border-t border-slate-800 shrink-0">
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-4 px-3.5 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-rose-950/20 hover:text-red-300 transition-colors animate-pulse"
              >
                <RiLogoutBoxRLine size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN APP VIEW CONTAINER */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        {/* Header Widget */}
        <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="text-slate-400 hover:text-accent-gold md:hidden focus:outline-none"
            >
              <RiMenuUnfoldLine size={24} />
            </button>

            {/* Header Universal Search Input */}
            <div
              onClick={() => setShowSearchModal(true)}
              className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 w-72 text-slate-400 cursor-pointer hover:border-slate-700 transition"
            >
              <RiSearchLine size={16} className="mr-2.5" />
              <span className="text-xs">Search everything...</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Notification Bell Panel */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-slate-400 hover:text-accent-gold transition-colors relative"
              >
                <RiNotification3Line size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl z-50 p-2 text-slate-200">
                  <div className="flex justify-between items-center p-2 border-b border-slate-800">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                      Notifications ({unreadCount} new)
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-500 hover:text-slate-200 text-xs"
                    >
                      <RiCloseLine size={16} />
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1.5 space-y-1">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-500 italic">
                        No new notifications
                      </p>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 text-xs rounded transition flex flex-col space-y-1.5 border-b border-slate-900/50 ${
                            notif.read
                              ? "bg-slate-950/20 opacity-80"
                              : "bg-slate-900/80 border-l-2 border-accent-gold"
                          }`}
                        >
                          <p className="font-semibold text-slate-200">
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                            <span>
                              {new Date(notif.createdAt).toLocaleTimeString()}
                            </span>
                            <div className="flex space-x-2">
                              {!notif.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notif._id)}
                                  className="text-accent-gold hover:underline"
                                >
                                  Mark Read
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotif(notif._id)}
                                className="text-red-400 hover:underline"
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

            {/* Admin Profile Details */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-accent-gold/25 border border-accent-gold flex items-center justify-center text-accent-gold">
                <RiUserLine size={20} />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-200">
                  {user?.name || "Premium Admin"}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Router View Canvas */}
        <main className="flex-grow p-6 md:p-8 bg-slate-900 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* 4. DYNAMIC UNIVERSAL SEARCH MODAL */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Search Input Bar */}
            <div className="flex items-center border-b border-slate-800 p-4">
              <RiSearchLine size={22} className="text-slate-400 mr-3" />
              <input
                type="text"
                autoFocus
                placeholder="Search products by SKU / name, orders by ID / client, coupons, etc..."
                value={globalSearchQuery}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className="bg-transparent border-none text-slate-100 focus:outline-none w-full text-base font-sans"
              />
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setGlobalSearchQuery("");
                  setGlobalSearchResults(null);
                }}
                className="text-slate-400 hover:text-slate-100 p-1"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            {/* Search Result Lists */}
            <div className="p-6 max-h-[500px] overflow-y-auto space-y-6">
              {!globalSearchQuery || globalSearchQuery.trim().length < 2 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  Type at least 2 characters to start scanning enterprise
                  records...
                </div>
              ) : globalSearchResults &&
                (globalSearchResults.products.length > 0 ||
                  globalSearchResults.orders.length > 0 ||
                  globalSearchResults.customers.length > 0 ||
                  globalSearchResults.coupons.length > 0) ? (
                <div className="space-y-6">
                  {/* Products Matches */}
                  {globalSearchResults.products.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase font-extrabold tracking-widest text-accent-gold mb-2.5">
                        Products ({globalSearchResults.products.length})
                      </h4>
                      <div className="space-y-1.5">
                        {globalSearchResults.products.map((p, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setShowSearchModal(false);
                              navigate(`/admin/products?edit=${p._id}`);
                            }}
                            className="bg-slate-950/40 border border-slate-800 hover:border-slate-700 p-3 rounded-lg flex items-center justify-between cursor-pointer transition"
                          >
                            <div className="flex items-center space-x-3.5">
                              {p.images && p.images[0] && (
                                <img
                                  src={p.images[0]}
                                  className="w-10 h-10 object-cover rounded-md"
                                  alt=""
                                />
                              )}
                              <div>
                                <p className="text-sm font-semibold">
                                  {p.name}
                                </p>
                                <p className="text-xs text-slate-500 font-mono">
                                  {p.sku}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-accent-gold">
                              ₹{p.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Orders Matches */}
                  {globalSearchResults.orders.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase font-extrabold tracking-widest text-accent-gold mb-2.5">
                        Orders ({globalSearchResults.orders.length})
                      </h4>
                      <div className="space-y-1.5">
                        {globalSearchResults.orders.map((o, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setShowSearchModal(false);
                              navigate(`/admin/orders?view=${o._id}`);
                            }}
                            className="bg-slate-950/40 border border-slate-800 hover:border-slate-700 p-3 rounded-lg flex items-center justify-between cursor-pointer transition"
                          >
                            <div>
                              <p className="text-sm font-semibold">
                                {o.orderId}
                              </p>
                              <p className="text-xs text-slate-500">
                                Client:{" "}
                                <span className="font-medium text-slate-350">
                                  {o.customer?.name}
                                </span>{" "}
                                ({o.customer?.phone})
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-200">
                                ₹{o.pricing?.total || o.totalPrice}
                              </p>
                              <span className="text-[10px] bg-slate-800 text-accent-gold px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                                {o.orderStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customers Matches */}
                  {globalSearchResults.customers.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase font-extrabold tracking-widest text-accent-gold mb-2.5">
                        Customers ({globalSearchResults.customers.length})
                      </h4>
                      <div className="space-y-1.5">
                        {globalSearchResults.customers.map((c, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setShowSearchModal(false);
                              navigate(`/admin/customers?search=${c.email}`);
                            }}
                            className="bg-slate-950/40 border border-slate-800 hover:border-slate-700 p-3 rounded-lg flex items-center justify-between cursor-pointer transition"
                          >
                            <div>
                              <p className="text-sm font-semibold">{c.name}</p>
                              <p className="text-xs text-slate-500">
                                {c.email}
                              </p>
                            </div>
                            <span className="text-[10px] border border-slate-600 text-slate-400 px-2 py-0.5 rounded font-semibold uppercase">
                              {c.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coupon Matches */}
                  {globalSearchResults.coupons.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase font-extrabold tracking-widest text-accent-gold mb-2.5">
                        Coupons ({globalSearchResults.coupons.length})
                      </h4>
                      <div className="space-y-1.5">
                        {globalSearchResults.coupons.map((cop, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setShowSearchModal(false);
                              navigate(`/admin/settings?tab=coupons`);
                            }}
                            className="bg-slate-950/40 border border-slate-800 hover:border-slate-700 p-3 rounded-lg flex items-center justify-between cursor-pointer transition"
                          >
                            <div className="font-semibold text-sm tracking-wider font-mono uppercase">
                              {cop.code}
                            </div>
                            <span className="text-xs text-accent-gold bg-accent-gold/10 px-2.5 py-0.5 rounded">
                              {cop.discountType} (-{cop.value}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No matching files or credentials found in database
                  directory...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;

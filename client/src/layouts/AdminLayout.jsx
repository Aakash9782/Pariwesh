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
  const { alert, toast } = useAlert();
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
      icon: <RiDashboardLine size={18} />,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: <RiArchiveLine size={18} />,
    },
    {
      name: "Catalog",
      path: "/admin/catalog",
      icon: <RiPriceTag3Line size={18} />,
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: <RiShoppingBag3Line size={18} />,
    },
    {
      name: "Returns",
      path: "/admin/returns",
      icon: <RiExchangeBoxLine size={18} />,
    },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: <RiGroupLine size={18} />,
    },
    {
      name: "Inventory",
      path: "/admin/inventory",
      icon: <RiInboxArchiveLine size={18} />,
    },
    {
      name: "Marketing",
      path: "/admin/marketing",
      icon: <RiMegaphoneLine size={18} />,
    },
    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: <RiBarChart2Line size={18} />,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: <RiSettings4Line size={18} />,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] text-slate-700 font-sans">
      {/* 1. DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 sticky top-0 h-screen shadow-md ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand/Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          {!sidebarCollapsed && (
            <span className="font-display font-semibold tracking-wider text-[#c5a880] uppercase text-sm font-bold">
              PARIWESH HUB
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-slate-400 hover:text-[#c5a880] transition-colors focus:outline-none"
          >
            {sidebarCollapsed ? (
              <RiMenuUnfoldLine size={20} />
            ) : (
              <RiMenuFoldLine size={20} />
            )}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-grow py-5 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center space-x-3.5 px-4 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all border-l-2 ${
                  isActive
                    ? "border-[#c5a880] bg-[#c5a880]/5 text-[#a88f65] font-bold"
                    : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span
                  className={isActive ? "text-[#c5a880]" : "text-slate-400"}
                >
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Logout Button */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider text-red-650 hover:bg-red-50 hover:text-red-750 transition-colors"
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
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs"
          />
          {/* Drawer Menu Contents */}
          <div className="relative flex flex-col h-[100dvh] max-h-[100dvh] w-72 max-w-xs bg-white border-r border-slate-200 animate-slide-in-left shadow-2xl">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
              <span className="font-display font-semibold tracking-wider text-[#c5a880] uppercase text-sm font-bold">
                PARIWESH HUB
              </span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="text-slate-400 hover:text-[#c5a880] p-1"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            <nav className="flex-grow py-5 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item, idx) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={idx}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center space-x-3.5 px-4 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all border-l-2 ${
                      isActive
                        ? "border-[#c5a880] bg-[#c5a880]/5 text-[#a88f65] font-bold"
                        : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span
                      className={isActive ? "text-[#c5a880]" : "text-slate-400"}
                    >
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 pb-8 border-t border-slate-200 shrink-0">
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider text-red-600 hover:bg-red-50 hover:text-red-755 transition-colors"
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-xs">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="text-slate-500 hover:text-[#c5a880] md:hidden focus:outline-none"
            >
              <RiMenuUnfoldLine size={24} />
            </button>

            {/* Header Universal Search Input */}
            <div
              onClick={() => setShowSearchModal(true)}
              className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 w-72 text-slate-450 cursor-pointer hover:border-slate-350 transition"
            >
              <RiSearchLine size={16} className="mr-2.5 text-slate-400" />
              <span className="text-xs">Search everything...</span>
            </div>
          </div>

          <div className="flex items-center space-x-5">
            {/* Notification Bell Panel */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-slate-500 hover:text-[#c5a880] transition-colors relative"
              >
                <RiNotification3Line size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-bold text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 text-slate-800 animate-fadeIn">
                  <div className="flex justify-between items-center p-2 border-b border-slate-100">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Notifications ({unreadCount} new)
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-700 text-xs"
                    >
                      <RiCloseLine size={16} />
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1.5 space-y-1">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400 italic">
                        No new notifications
                      </p>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 text-xs rounded transition flex flex-col space-y-1.5 border-b border-slate-50 ${
                            notif.read
                              ? "bg-slate-50/40 opacity-70"
                              : "bg-[#c5a880]/5 border-l-2 border-[#c5a880]"
                          }`}
                        >
                          <p className="font-semibold text-slate-750">
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-slate-450 pt-1">
                            <span>
                              {new Date(notif.createdAt).toLocaleTimeString()}
                            </span>
                            <div className="flex space-x-2">
                              {!notif.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notif._id)}
                                  className="text-[#c5a880] hover:underline"
                                >
                                  Mark Read
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotif(notif._id)}
                                className="text-red-500 hover:underline"
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
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-4 h-9">
              <div className="w-8 h-8 rounded-full bg-[#c5a880]/10 border border-[#c5a880]/20 flex items-center justify-center text-[#c5a880]">
                <RiUserLine size={16} />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800">
                  {user?.name || "Premium Admin"}
                </p>
                <p className="text-[9px] text-slate-450 uppercase tracking-widest font-extrabold">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Router View Canvas */}
        <main className="flex-grow p-6 md:p-8 bg-[#FAF9F6] overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* 4. DYNAMIC UNIVERSAL SEARCH MODAL */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl animate-scaleDown">
            {/* Search Input Bar */}
            <div className="flex items-center border-b border-slate-200 p-4">
              <RiSearchLine
                size={20}
                className="text-slate-400 mr-3 animate-pulse"
              />
              <input
                type="text"
                autoFocus
                placeholder="Search products by SKU / name, orders by ID / client, coupons, etc..."
                value={globalSearchQuery}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className="bg-transparent border-none text-slate-800 placeholder:text-slate-400 focus:outline-none w-full text-sm font-sans"
              />
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setGlobalSearchQuery("");
                  setGlobalSearchResults(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

            {/* Search Result Lists */}
            <div className="p-5 max-h-[480px] overflow-y-auto space-y-5 text-slate-800">
              {!globalSearchQuery || globalSearchQuery.trim().length < 2 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Type at least 2 characters to start scanning enterprise
                  records...
                </div>
              ) : globalSearchResults &&
                (globalSearchResults.products.length > 0 ||
                  globalSearchResults.orders.length > 0 ||
                  globalSearchResults.customers.length > 0 ||
                  globalSearchResults.coupons.length > 0) ? (
                <div className="space-y-5">
                  {/* Products Matches */}
                  {globalSearchResults.products.length > 0 && (
                    <div>
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#c5a880] mb-2">
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
                            className="bg-slate-50 border border-slate-200 hover:border-slate-300 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all"
                          >
                            <div className="flex items-center space-x-3">
                              {p.images && p.images[0] && (
                                <img
                                  src={p.images[0]}
                                  className="w-9 h-9 object-cover rounded shadow-xxs"
                                  alt=""
                                />
                              )}
                              <div>
                                <p className="text-xs font-semibold text-slate-800">
                                  {p.name}
                                </p>
                                <p className="text-[10px] text-slate-450 font-mono">
                                  {p.sku}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-[#c5a880]">
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
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#c5a880] mb-2">
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
                            className="bg-slate-50 border border-slate-200 hover:border-slate-300 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all"
                          >
                            <div>
                              <p className="text-xs font-semibold text-slate-850">
                                {o.orderId}
                              </p>
                              <p className="text-[10px] text-slate-450">
                                Client:{" "}
                                <span className="font-semibold text-slate-650">
                                  {o.customer?.name}
                                </span>{" "}
                                ({o.customer?.phone})
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-800">
                                ₹{o.pricing?.total || o.totalPrice}
                              </p>
                              <span className="text-[9px] bg-slate-100 border border-slate-200 text-[#a88f65] px-2 py-0.5 rounded uppercase tracking-wider font-extrabold">
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
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#c5a880] mb-2">
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
                            className="bg-slate-50 border border-slate-200 hover:border-slate-300 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all5"
                          >
                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                {c.name}
                              </p>
                              <p className="text-[10px] text-slate-450">
                                {c.email}
                              </p>
                            </div>
                            <span className="text-[9px] border border-slate-265 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">
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
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#c5a880] mb-2">
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
                            className="bg-slate-50 border border-slate-200 hover:border-slate-300 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all"
                          >
                            <div className="font-semibold text-xs tracking-widest font-mono uppercase text-slate-800">
                              {cop.code}
                            </div>
                            <span className="text-[10px] text-[#a88f65] bg-[#c5a880]/10 px-2.5 py-0.5 rounded-sm border border-[#c5a880]/15">
                              {cop.discountType} (-{cop.value}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
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

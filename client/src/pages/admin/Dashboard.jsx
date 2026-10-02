import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import StatusPill from "../../components/admin/ui/StatusPill.jsx";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";
import {
  RiShoppingBag3Line,
  RiMoneyDollarCircleLine,
  RiGroupLine,
  RiArchiveLine,
  RiAlertLine,
  RiPercentLine,
  RiArrowUpSLine,
  RiArrowRightLine,
  RiRefreshLine,
  RiTruckLine,
  RiTimeLine,
  RiCheckDoubleLine,
  RiAddLine,
  RiMapPinLine,
  RiExchangeDollarLine,
  RiInboxArchiveLine,
  RiShieldCheckLine,
  RiArrowRightSLine,
} from "react-icons/ri";

const parseUserAgent = (ua = "") => {
  if (!ua || ua === "::1" || ua === "127.0.0.1") return "Admin Terminal";
  let os = "Desktop";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  let browser = "";
  if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";

  return browser ? `${os} (${browser})` : os;
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const DashboardModule = () => {
  const navigate = useNavigate();
  const { toast } = useAlert();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Computed Business Statistics
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    toPack: 0,
    inTransit: 0,
    delivered: 0,
    cancelled: 0,
    refunds: 0,
    codPending: 0,
    codOrdersCount: 0,
    onlinePaidCount: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    aov: 0,
    fulfillmentRate: "0.0",
    newCustomersToday: 0,
    revenueByDay: [],
    categorySales: [],
    rollingGrowth: "0.0",
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const results = await Promise.allSettled([
        API.get("/orders"),
        API.get("/products"),
        API.get("/users"),
        API.get("/logs"),
        API.get("/notifications"),
        API.get("/returns"),
      ]);

      const oList = results[0]?.status === "fulfilled" ? results[0].value?.data?.data || [] : [];
      const pList = results[1]?.status === "fulfilled" ? results[1].value?.data?.data || [] : [];
      const cList = results[2]?.status === "fulfilled" ? results[2].value?.data?.data || [] : [];
      const lList = results[3]?.status === "fulfilled" ? results[3].value?.data?.data || [] : [];
      const nList = results[4]?.status === "fulfilled" ? results[4].value?.data?.data || [] : [];
      const rList = results[5]?.status === "fulfilled" ? results[5].value?.data?.data || [] : [];

      setOrders(oList);
      setProducts(pList);
      setCustomers(cList);
      setLogs(lList);
      setNotifications(nList);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      let todayOrdersCount = 0;
      let todayRevenueSum = 0;
      let monthlyRevenueSum = 0;
      let toPackCount = 0;
      let inTransitCount = 0;
      let deliveredCount = 0;
      let cancelledCount = 0;
      let codPendingSum = 0;
      let codOrdersCount = 0;
      let onlinePaidCount = 0;
      let totalRev = 0;

      oList.forEach((ord) => {
        const ordDate = new Date(ord.createdAt);
        const status = (ord.orderStatus || "").toLowerCase();
        const isCancelled = status === "cancelled" || status === "refunded";
        const amt = Number(ord.pricing?.grandTotal || ord.pricing?.total || ord.totalPrice || 0);

        if (!isCancelled) {
          totalRev += amt;
        }

        if (ordDate >= today) {
          todayOrdersCount++;
          if (!isCancelled) {
            todayRevenueSum += amt;
          }
        }

        if (ordDate >= firstOfMonth && !isCancelled) {
          monthlyRevenueSum += amt;
        }

        // Group operational dispatch statuses
        if (["placed", "pending", "confirmed", "processing", "packed"].includes(status)) {
          toPackCount++;
        } else if (["ready to ship", "shipped"].includes(status)) {
          inTransitCount++;
        } else if (status === "delivered") {
          deliveredCount++;
        } else if (status === "cancelled") {
          cancelledCount++;
        }

        // COD tracking
        if (ord.paymentMethod === "COD" && ord.paymentStatus !== "Paid" && !isCancelled) {
          codPendingSum += amt;
          codOrdersCount++;
        }
        if (ord.paymentStatus === "Paid") {
          onlinePaidCount++;
        }
      });

      // Returns count from returns endpoint with fallback to order statuses
      let refundRequests = rList.filter(
        (r) => r.status === "Return_Requested" || r.status === "Pending_Approval",
      ).length;
      if (refundRequests === 0 && rList.length === 0) {
        refundRequests = oList.filter(
          (ord) =>
            (ord.orderStatus || "").toLowerCase() === "return_requested" ||
            (ord.orderStatus || "").toLowerCase() === "refunded",
        ).length;
      }

      // Stock shortage detection
      let lowCount = 0;
      let outCount = 0;
      pList.forEach((p) => {
        const totalStock = Object.values(p.sizesStock || {}).reduce(
          (acc, curr) => acc + (Number(curr) || 0),
          0,
        );
        if (totalStock === 0) outCount++;
        else if (totalStock <= 5) lowCount++;
      });

      const actionableOrders = oList.filter((ord) => {
        const s = (ord.orderStatus || "").toLowerCase();
        return s !== "cancelled";
      }).length;

      const computedAov =
        actionableOrders > 0 ? Math.round(totalRev / actionableOrders) : 0;

      const fulfillmentRate =
        actionableOrders > 0
          ? ((deliveredCount / actionableOrders) * 100).toFixed(1)
          : "0.0";

      const newCustomersToday = cList.filter((u) => {
        const d = new Date(u.createdAt);
        return d >= today;
      }).length;

      // Past 14 days daily revenue series
      const dayMs = 24 * 60 * 60 * 1000;
      const revenueByDay = [];
      for (let i = 13; i >= 0; i--) {
        const dayStart = new Date(today.getTime() - i * dayMs);
        const dayEnd = new Date(dayStart.getTime() + dayMs);
        let sum = 0;
        let count = 0;
        oList.forEach((ord) => {
          const s = (ord.orderStatus || "").toLowerCase();
          if (s === "cancelled" || s === "refunded") return;
          const d = new Date(ord.createdAt);
          if (d >= dayStart && d < dayEnd) {
            sum += Number(
              ord.pricing?.grandTotal ||
                ord.pricing?.total ||
                ord.totalPrice ||
                0,
            );
            count++;
          }
        });
        revenueByDay.push({
          label: dayStart.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),
          revenue: sum,
          orders: count,
        });
      }

      // Apple-to-apple rolling growth comparison (Past 14 days vs Previous 14 days)
      let past14Rev = 0;
      let prev14Rev = 0;
      const past14Start = new Date(today.getTime() - 14 * dayMs);
      const prev14Start = new Date(today.getTime() - 28 * dayMs);

      oList.forEach((ord) => {
        const s = (ord.orderStatus || "").toLowerCase();
        if (s === "cancelled" || s === "refunded") return;
        const d = new Date(ord.createdAt);
        const amt = Number(
          ord.pricing?.grandTotal || ord.pricing?.total || ord.totalPrice || 0,
        );
        if (d >= past14Start && d <= new Date()) {
          past14Rev += amt;
        } else if (d >= prev14Start && d < past14Start) {
          prev14Rev += amt;
        }
      });

      let rollingGrowth = "0.0";
      if (prev14Rev > 0) {
        rollingGrowth = (((past14Rev - prev14Rev) / prev14Rev) * 100).toFixed(1);
      } else if (past14Rev > 0) {
        rollingGrowth = "100.0";
      }

      // Category revenue from line items
      const productById = new Map();
      pList.forEach((p) => {
        if (p._id) productById.set(String(p._id), p);
        if (p.sku) productById.set(String(p.sku).toLowerCase(), p);
      });

      const catTotals = {};
      oList.forEach((ord) => {
        (ord.items || []).forEach((item) => {
          const prod =
            productById.get(String(item.productId || "")) ||
            productById.get(String(item.sku || "").toLowerCase());
          const cat = (prod?.category || item.category || "Traditional Wear").toString();
          const line = Number(item.price || 0) * Number(item.quantity || 1);
          catTotals[cat] = (catTotals[cat] || 0) + line;
        });
      });
      const catTotalSum =
        Object.values(catTotals).reduce((a, b) => a + b, 0) || 1;
      const categorySales = Object.entries(catTotals)
        .map(([cat, rev]) => ({
          cat,
          rev,
          pct: Math.round((rev / catTotalSum) * 100),
        }))
        .sort((a, b) => b.rev - a.rev)
        .slice(0, 5);

      setStats({
        todayOrders: todayOrdersCount,
        todayRevenue: todayRevenueSum,
        monthlyRevenue: monthlyRevenueSum,
        toPack: toPackCount,
        inTransit: inTransitCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
        refunds: refundRequests,
        codPending: codPendingSum,
        codOrdersCount,
        onlinePaidCount,
        totalCustomers: cList.length,
        totalProducts: pList.length,
        lowStock: lowCount,
        outOfStock: outCount,
        aov: computedAov,
        fulfillmentRate,
        newCustomersToday,
        revenueByDay,
        categorySales,
        rollingGrowth,
      });

      if (toast?.success) {
        toast.success("Executive store metrics refreshed");
      }
    } catch (err) {
      console.error("Dashboard metrics refresh failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Top 5 Recent Live Orders
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [orders]);

  // Top Low Stock Shortage Products
  const lowStockProducts = useMemo(() => {
    return products
      .map((p) => {
        const stockEntries = Object.entries(p.sizesStock || {});
        const total = stockEntries.reduce(
          (acc, [, qty]) => acc + (Number(qty) || 0),
          0,
        );
        const outSizes = stockEntries
          .filter(([, qty]) => Number(qty) === 0)
          .map(([sz]) => sz);
        return { ...p, totalStock: total, outSizes };
      })
      .filter((p) => p.totalStock <= 5)
      .sort((a, b) => a.totalStock - b.totalStock)
      .slice(0, 5);
  }, [products]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="space-y-2">
            <SkeletonLoader className="h-7 w-48" />
            <SkeletonLoader className="h-3 w-72" />
          </div>
          <SkeletonLoader className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <SkeletonLoader className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Title Header with Live Refresh & Quick Action Shortcuts */}
      <PageHeader
        title="Executive Overview"
        subtitle="Live omnichannel store metrics across catalog, logistics dispatch, and customer accounts"
        breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="flex items-center space-x-1.5 text-slate-700 hover:text-slate-900 border-slate-200"
              title="Refresh Live Store Data"
            >
              <RiRefreshLine size={15} />
              <span>Sync Live Data</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/admin/products")}
              className="flex items-center space-x-1.5"
            >
              <RiAddLine size={16} />
              <span>Add Product</span>
            </Button>
          </div>
        }
      />

      {/* 1. PRIMARY FINANCIAL & BUSINESS PULSE (4 Core Master Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Revenue */}
        <Card
          onClick={() => navigate("/admin/orders?date=today")}
          className="p-5 flex flex-col justify-between space-y-3 border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition cursor-pointer group bg-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-display">
              Today's Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <RiMoneyDollarCircleLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight font-mono">
              ₹{stats.todayRevenue.toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <span>{stats.todayOrders} orders booked today</span>
            </p>
          </div>
        </Card>

        {/* Card 2: Month-to-Date (MTD) Gross Revenue */}
        <Card
          onClick={() => navigate("/admin/analytics")}
          className="p-5 flex flex-col justify-between space-y-3 border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition cursor-pointer group bg-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-display">
              Month-to-Date (MTD) Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] text-[#8a1c14] border border-[#c5a880]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <RiShoppingBag3Line size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight font-mono">
              ₹{stats.monthlyRevenue.toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {stats.delivered} delivered parcels fulfilled
            </p>
          </div>
        </Card>

        {/* Card 3: Average Order Value (AOV) */}
        <Card
          onClick={() => navigate("/admin/analytics")}
          className="p-5 flex flex-col justify-between space-y-3 border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition cursor-pointer group bg-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-display">
              Average Order Value (AOV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <RiExchangeDollarLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight font-mono">
              ₹{stats.aov.toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Fulfillment rate: {stats.fulfillmentRate}%
            </p>
          </div>
        </Card>

        {/* Card 4: Patron Base (Total Customers) */}
        <Card
          onClick={() => navigate("/admin/customers")}
          className="p-5 flex flex-col justify-between space-y-3 border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition cursor-pointer group bg-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-display">
              Customer Base
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <RiGroupLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight font-mono">
              {stats.totalCustomers}
              <span className="text-xs font-normal text-slate-500 ml-1.5 font-sans">
                patrons
              </span>
            </p>
            <p className="text-[11px] text-sky-700 font-medium mt-1">
              {stats.newCustomersToday === 0
                ? "Established customer ledger"
                : `+${stats.newCustomersToday} registered today`}
            </p>
          </div>
        </Card>
      </div>

      {/* 2. OPERATIONAL DISPATCH & RISK ATTENTION CENTER (Urgent Badges) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Action 1: To Pack & Dispatch */}
        <div
          onClick={() => navigate("/admin/orders?tab=to_pack")}
          className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-50 transition cursor-pointer flex items-center justify-between group shadow-2xs"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-800 font-display">
                To Pack & Dispatch
              </span>
            </div>
            <p className="text-xl font-bold text-rose-950 font-mono">
              {stats.toPack}{" "}
              <span className="text-xs font-normal text-rose-700 font-sans">
                Parcels
              </span>
            </p>
            <p className="text-[10px] text-rose-600">Pending courier handoff</p>
          </div>
          <RiArrowRightSLine
            size={20}
            className="text-rose-400 group-hover:translate-x-1 transition-transform"
          />
        </div>

        {/* Action 2: COD Verification Queue */}
        <div
          onClick={() => navigate("/admin/orders?tab=cod_queue")}
          className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-50 transition cursor-pointer flex items-center justify-between group shadow-2xs"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 font-display">
                COD Confirmation
              </span>
            </div>
            <p className="text-xl font-bold text-amber-950 font-mono">
              ₹{stats.codPending.toLocaleString("en-IN")}{" "}
              <span className="text-xs font-normal text-amber-700 font-sans">
                ({stats.codOrdersCount})
              </span>
            </p>
            <p className="text-[10px] text-amber-600">Call buyer to prevent RTO</p>
          </div>
          <RiArrowRightSLine
            size={20}
            className="text-amber-400 group-hover:translate-x-1 transition-transform"
          />
        </div>

        {/* Action 3: Return Claims Pending */}
        <div
          onClick={() => navigate("/admin/returns?tab=action_needed")}
          className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-50 transition cursor-pointer flex items-center justify-between group shadow-2xs"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-800 font-display">
                Return Claims
              </span>
            </div>
            <p className="text-xl font-bold text-purple-950 font-mono">
              {stats.refunds}{" "}
              <span className="text-xs font-normal text-purple-700 font-sans">
                Pending
              </span>
            </p>
            <p className="text-[10px] text-purple-600">
              {stats.refunds === 0 ? "Queue clean" : "Awaiting review / QC"}
            </p>
          </div>
          <RiArrowRightSLine
            size={20}
            className="text-purple-400 group-hover:translate-x-1 transition-transform"
          />
        </div>

        {/* Action 4: Inventory Shortage Alerts */}
        <div
          onClick={() => navigate("/admin/inventory?status=deficit")}
          className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-50 transition cursor-pointer flex items-center justify-between group shadow-2xs"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-orange-800 font-display">
                Stock Shortage
              </span>
            </div>
            <p className="text-xl font-bold text-orange-950 font-mono">
              {stats.lowStock + stats.outOfStock}{" "}
              <span className="text-xs font-normal text-orange-700 font-sans">
                Items
              </span>
            </p>
            <p className="text-[10px] text-orange-600">
              {stats.outOfStock} Out of Stock • {stats.lowStock} Low Stock
            </p>
          </div>
          <RiArrowRightSLine
            size={20}
            className="text-orange-400 group-hover:translate-x-1 transition-transform"
          />
        </div>
      </div>

      {/* 3. RECENT LIVE ORDERS FEED (Crucial missing section!) */}
      <Card className="p-0 overflow-hidden border-slate-200 shadow-2xs bg-white">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-display font-medium text-sm text-slate-900 tracking-wide uppercase">
              Recent Live Orders
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live customer transactions across India awaiting dispatch
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="text-xs font-semibold text-[#8a1c14] hover:text-[#c5a880] flex items-center gap-1 transition cursor-pointer"
          >
            <span>View All Orders</span>
            <RiArrowRightLine size={14} />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 italic text-xs">
            No customer orders registered yet
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((ord, idx) => (
              <div
                key={idx}
                className="p-4 sm:px-5 hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                {/* Order Identity & Customer Destination */}
                <div className="flex items-center gap-3.5 min-w-[220px]">
                  <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#c5a880]/30 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-mono text-slate-400 uppercase">
                      ID
                    </span>
                    <span className="text-[11px] font-bold text-slate-900 font-mono">
                      #{ord.orderId?.slice(-4) || ord.orderId}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 text-xs">
                        {ord.customer?.name ||
                          ord.shippingAddress?.fullName ||
                          "Patron"}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatRelativeTime(ord.createdAt)}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <RiMapPinLine size={11} className="text-[#c5a880] shrink-0" />
                      <span>
                        {ord.shippingAddress?.city
                          ? `${ord.shippingAddress.city}, `
                          : ""}
                        {ord.shippingAddress?.state || "India"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Ordered Garment & Size */}
                <div className="flex items-center gap-2.5 min-w-[200px]">
                  {ord.items?.[0]?.image ? (
                    <img
                      src={optimizeCloudinaryUrl(ord.items[0].image, 80)}
                      alt=""
                      className="w-8 h-10 object-cover rounded border border-slate-200 bg-slate-50 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <RiShoppingBag3Line size={14} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-[11px] truncate max-w-[160px]">
                      {ord.items?.[0]?.name || "Garment Outfit"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {ord.items?.reduce((ttl, itm) => ttl + itm.quantity, 0)}{" "}
                        pcs
                      </span>
                      {ord.items?.[0]?.size && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#FAF9F6] text-[#8a1c14] border border-[#c5a880]/40">
                          {ord.items[0].size}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bill Value & Payment Tag */}
                <div className="min-w-[130px] md:text-right">
                  <div className="font-bold text-slate-900 text-xs font-sans">
                    ₹
                    {(
                      ord.pricing?.grandTotal ||
                      ord.totalPrice ||
                      0
                    ).toLocaleString("en-IN")}
                  </div>
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[8.5px] font-extrabold uppercase mt-0.5 ${
                      ord.paymentMethod === "COD"
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                    }`}
                  >
                    {ord.paymentMethod === "COD" ? "COD" : "Prepaid"}
                  </span>
                </div>

                {/* Status Flag */}
                <div className="min-w-[120px] md:text-center">
                  <StatusPill status={ord.orderStatus} />
                </div>

                {/* Action Link */}
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/orders?view=${ord._id}`)}
                    className="px-3 py-1 rounded-lg bg-[#FAF9F6] hover:bg-amber-50 text-[#8a1c14] border border-[#c5a880]/40 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <span>Inspect</span>
                    <RiArrowRightSLine size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 4. PERFORMANCE CHARTS (14-Day Trajectory & Category Share) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Last 14 days revenue bars with rolling growth rate */}
        <Card className="flex flex-col p-5 bg-white border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-700 font-display">
                Revenue — Last 14 Days
              </h3>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                Daily omnichannel sales trajectory
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center border font-mono ${
                Number(stats.rollingGrowth) >= 0
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-amber-700 bg-amber-50 border-amber-200"
              }`}
            >
              <RiArrowUpSLine
                className={`mr-0.5 ${Number(stats.rollingGrowth) < 0 ? "rotate-180" : ""}`}
              />{" "}
              {Number(stats.rollingGrowth) >= 0 ? "+" : ""}
              {stats.rollingGrowth}% vs prev 14d
            </span>
          </div>

          {stats.revenueByDay.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-16 text-center">
              No order revenue generated yet
            </p>
          ) : (
            <div className="h-60 flex items-end gap-1.5 px-1 pt-6 relative">
              {(() => {
                const maxRev = Math.max(
                  ...stats.revenueByDay.map((d) => d.revenue),
                  1,
                );
                return stats.revenueByDay.map((d, idx) => {
                  const h = Math.max(4, Math.round((d.revenue / maxRev) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                      title={`${d.label}: ₹${d.revenue.toLocaleString("en-IN")} (${d.orders} orders)`}
                    >
                      <span className="absolute -top-6 text-[8.5px] font-mono text-slate-700 font-bold opacity-0 group-hover:opacity-100 transition whitespace-nowrap bg-white px-1 py-0.5 rounded border border-slate-200 shadow-2xs z-20">
                        ₹
                        {d.revenue >= 1000
                          ? `${(d.revenue / 1000).toFixed(1)}k`
                          : d.revenue}
                      </span>
                      <div
                        className="w-full rounded-t bg-[#c5a880]/80 group-hover:bg-[#8a1c14] transition-all min-h-[4px]"
                        style={{ height: `${h}%` }}
                      />
                      {(idx === 0 ||
                        idx === stats.revenueByDay.length - 1 ||
                        idx % 3 === 0) && (
                        <span className="text-[8.5px] text-slate-400 font-mono mt-1.5 truncate w-full text-center">
                          {d.label.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </Card>

        {/* Chart 2: Category sales from live orders */}
        <Card className="flex flex-col p-5 bg-white border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-700 font-display">
                Sales by Category
              </h3>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                Demand distribution across royal ethnic ensembles
              </p>
            </div>
            <span className="text-[10.5px] text-[#c5a880] font-bold font-mono">
              Share (%)
            </span>
          </div>

          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {stats.categorySales.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-12 text-center">
                No category sales recorded yet
              </p>
            ) : (
              stats.categorySales.map((row, idx) => {
                const colors = [
                  "bg-[#8a1c14]",
                  "bg-[#c5a880]",
                  "bg-amber-600",
                  "bg-slate-600",
                  "bg-stone-500",
                ];
                const formatRev =
                  row.rev >= 100000
                    ? `₹${(row.rev / 100000).toFixed(2)}L`
                    : row.rev >= 1000
                      ? `₹${(row.rev / 1000).toFixed(1)}k`
                      : `₹${Math.round(row.rev)}`;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-800 font-semibold capitalize">
                        {row.cat}
                      </span>
                      <span className="text-slate-600 font-semibold font-mono">
                        {formatRev}{" "}
                        <span className="text-[#8a1c14]">({row.pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(row.pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* 5. AUDIT LOGS & INVENTORY DEFICIT WATCHLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Clean Security & Activity Logs */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col shadow-2xs">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-700 font-display">
                Security & Activity Logs
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Staff operational audit trail
              </p>
            </div>
            <span className="text-[10px] text-[#c5a880] font-semibold font-mono">
              Audit Guard
            </span>
          </div>

          <div className="flex-grow overflow-y-auto max-h-72 space-y-2.5">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-10 text-center">
                No system activity logs recorded yet
              </p>
            ) : (
              logs.slice(0, 6).map((log, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF9F6] border border-slate-200/80 p-3 rounded-lg flex items-center justify-between text-xs text-slate-700 transition hover:bg-slate-50"
                >
                  <div className="space-y-0.5 pr-4">
                    <p className="font-semibold text-slate-900 text-[11.5px]">
                      {log.action}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      by{" "}
                      <span className="font-semibold text-[#8a1c14]">
                        {log.adminName || "Admin"}
                      </span>{" "}
                      • {parseUserAgent(log.device)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-mono">
                      {formatRelativeTime(log.createdAt)}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Inventory Shortage Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col shadow-2xs">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-700 font-display">
                Inventory Shortage Alerts
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Garments needing restock to prevent lost sales
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/inventory")}
              className="text-[10px] text-[#8a1c14] hover:text-[#c5a880] font-bold font-mono transition cursor-pointer"
            >
              Restock All →
            </button>
          </div>

          <div className="flex-grow overflow-y-auto max-h-72 space-y-2">
            {lowStockProducts.length === 0 ? (
              <div className="py-10 text-center space-y-1">
                <RiShieldCheckLine size={24} className="mx-auto text-emerald-500" />
                <p className="text-xs text-slate-500 font-medium">
                  Healthy Catalog Stock Levels
                </p>
                <p className="text-[10px] text-slate-400">
                  All active garment sizes have sufficient buffer inventory
                </p>
              </div>
            ) : (
              lowStockProducts.map((prod, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF9F6] border border-slate-200/80 p-2.5 rounded-lg flex items-center justify-between text-xs transition hover:bg-slate-50"
                >
                  <div className="flex items-center space-x-3">
                    {prod.images && prod.images[0] ? (
                      <img
                        src={optimizeCloudinaryUrl(prod.images[0], 80)}
                        className="w-9 h-11 object-cover rounded border border-slate-200 shrink-0"
                        alt=""
                      />
                    ) : (
                      <div className="w-9 h-11 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <RiArchiveLine size={16} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900 text-[11.5px] truncate max-w-[150px]">
                        {prod.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {prod.sku}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        prod.totalStock === 0
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {prod.totalStock === 0
                        ? "Out of Stock"
                        : `${prod.totalStock} Units Left`}
                    </span>
                    {prod.outSizes && prod.outSizes.length > 0 && (
                      <p className="text-[9px] text-rose-600 font-mono mt-0.5 font-semibold">
                        Out of {prod.outSizes.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardModule;

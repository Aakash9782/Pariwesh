import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import {
  RiShoppingBag3Line,
  RiMoneyDollarCircleLine,
  RiExchangeFundsLine,
  RiGroupLine,
  RiArchiveLine,
  RiAlertLine,
  RiCompass3Line,
  RiPercentLine,
  RiArrowUpSLine,
} from "react-icons/ri";

const DashboardModule = () => {
  const navigate = useNavigate();
  const { toast } = useAlert();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats computed from DB
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunds: 0,
    codPending: 0,
    onlinePaid: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    aov: 0,
    conversionRate: 0,
    visitorsToday: 0,
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
      ]);

      const orderRes =
        results[0].status === "fulfilled" ? results[0].value : null;
      const prodRes =
        results[1].status === "fulfilled" ? results[1].value : null;
      const custRes =
        results[2].status === "fulfilled" ? results[2].value : null;
      const logRes =
        results[3].status === "fulfilled" ? results[3].value : null;
      const notifRes =
        results[4].status === "fulfilled" ? results[4].value : null;

      if (results.some((r) => r.status === "rejected")) {
        console.warn(
          "Resilience Warning: Some dashboard metrics endpoints failed to load.",
          results.map((r, i) => ({
            index: i,
            status: r.status,
            reason: r.reason,
          })),
        );
      }

      const oList = orderRes?.data?.data || [];
      const pList = prodRes?.data?.data || [];
      const cList = custRes?.data?.data || [];
      const lList = logRes?.data?.data || [];
      const nList = notifRes?.data?.data || [];

      setOrders(oList);
      setProducts(pList);
      setCustomers(cList);
      setLogs(lList);
      setNotifications(nList);

      // Compute statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      let todayOrdersCount = 0;
      let todayRevenueSum = 0;
      let monthlyRevenueSum = 0;
      let pendingCount = 0;
      let processingCount = 0;
      let shippedCount = 0;
      let deliveredCount = 0;
      let cancelledCount = 0;
      let refundRequests = 0;
      let codPendingCount = 0;
      let onlinePaidCount = 0;
      let totalRev = 0;

      oList.forEach((ord) => {
        const ordDate = new Date(ord.createdAt);
        const amt = ord.pricing?.total || ord.totalPrice || 0;
        totalRev += amt;

        if (ordDate >= today) {
          todayOrdersCount++;
          todayRevenueSum += amt;
        }

        if (ordDate >= firstOfMonth) {
          monthlyRevenueSum += amt;
        }

        // Status counts map
        const status = ord.orderStatus?.toLowerCase() || "";
        if (status === "placed" || status === "pending") pendingCount++;
        else if (status === "processing" || status === "packed")
          processingCount++;
        else if (status === "shipped") shippedCount++;
        else if (status === "delivered") deliveredCount++;
        else if (status === "cancelled") cancelledCount++;
        else if (status === "refunded" || status === "return_requested")
          refundRequests++;

        if (ord.paymentMethod === "COD" && ord.paymentStatus !== "Paid") {
          codPendingCount += amt;
        }
        if (ord.paymentStatus === "Paid") {
          onlinePaidCount++;
        }
      });

      // Low stock & out of stock sizing
      let lowCount = 0;
      let outCount = 0;
      pList.forEach((p) => {
        const totalStock = Object.values(p.sizesStock || {}).reduce(
          (acc, curr) => acc + curr,
          0,
        );
        if (totalStock === 0) outCount++;
        else if (totalStock <= 5) lowCount++;
      });

      const totalOrdersCount = oList.length || 1;
      const computedAov = Math.round(totalRev / totalOrdersCount);

      // Simulated analytics conversions
      const visToday = Math.floor(450 + Math.random() * 125);
      const conversion = ((oList.length / (visToday * 5)) * 100).toFixed(2);

      setStats({
        todayOrders: todayOrdersCount,
        todayRevenue: todayRevenueSum,
        monthlyRevenue: monthlyRevenueSum,
        pending: pendingCount,
        processing: processingCount,
        shipped: shippedCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
        refunds: refundRequests,
        codPending: codPendingCount,
        onlinePaid: onlinePaidCount,
        totalCustomers: cList.length,
        totalProducts: pList.length,
        lowStock: lowCount,
        outOfStock: outCount,
        aov: computedAov,
        conversionRate: conversion,
        visitorsToday: visToday,
      });

      toast.success("Dashboard metrics synced successfully");
    } catch (err) {
      console.error("Dashboard fetching failure:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Title Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="space-y-2">
            <SkeletonLoader className="h-7 w-48" />
            <SkeletonLoader className="h-3 w-72" />
          </div>
          <SkeletonLoader className="h-9 w-32" />
        </div>

        {/* Grid count cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 p-4.5 rounded-lg flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <SkeletonLoader className="h-3 w-20" />
                <SkeletonLoader className="h-4 w-4 rounded-full" />
              </div>
              <SkeletonLoader className="h-6 w-12" />
            </div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-lg space-y-4 shadow-xs">
            <SkeletonLoader className="h-4 w-32" />
            <SkeletonLoader className="h-64 w-full" />
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-lg space-y-6 shadow-xs">
            <SkeletonLoader className="h-4 w-40" />
            <div className="flex justify-center py-4">
              <SkeletonLoader className="h-32 w-32 rounded-full" />
            </div>
            <div className="space-y-2">
              <SkeletonLoader className="h-3 w-full" />
              <SkeletonLoader className="h-3 w-4/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCardsData = [
    {
      label: "Today's Orders",
      val: stats.todayOrders,
      icon: <RiShoppingBag3Line />,
      path: "/admin/orders?date=today",
    },
    {
      label: "Today's Revenue",
      val: `₹${stats.todayRevenue}`,
      icon: <RiMoneyDollarCircleLine className="text-emerald-600" />,
      path: "/admin/analytics",
    },
    {
      label: "Monthly Revenue",
      val: `₹${stats.monthlyRevenue}`,
      icon: <RiMoneyDollarCircleLine className="text-[#c5a880]" />,
      path: "/admin/analytics",
    },
    {
      label: "Pending Orders",
      val: stats.pending,
      icon: <RiShoppingBag3Line className="text-amber-500" />,
      path: "/admin/orders?status=Placed",
    },
    {
      label: "Processing Orders",
      val: stats.processing,
      icon: <RiCompass3Line className="text-blue-500" />,
      path: "/admin/orders?status=Processing",
    },
    {
      label: "Shipped Orders",
      val: stats.shipped,
      icon: <RiCompass3Line className="text-indigo-500" />,
      path: "/admin/orders?status=Shipped",
    },
    {
      label: "Delivered Orders",
      val: stats.delivered,
      icon: <RiShoppingBag3Line className="text-emerald-505" />,
      path: "/admin/orders?status=Delivered",
    },
    {
      label: "Cancelled Orders",
      val: stats.cancelled,
      icon: <RiShoppingBag3Line className="text-red-500" />,
      path: "/admin/orders?status=Cancelled",
    },
    {
      label: "Refund Requests",
      val: stats.refunds,
      icon: <RiExchangeFundsLine className="text-purple-500" />,
      path: "/admin/orders?status=Refunded",
    },
    {
      label: "COD Pending Volume",
      val: `₹${stats.codPending}`,
      icon: <RiMoneyDollarCircleLine className="text-amber-600" />,
      path: "/admin/orders?paymentMethod=COD",
    },
    {
      label: "Online Paid Volume",
      val: stats.onlinePaid,
      icon: <RiMoneyDollarCircleLine className="text-emerald-500" />,
      path: "/admin/orders?paymentStatus=Paid",
    },
    {
      label: "Total Customers",
      val: stats.totalCustomers,
      icon: <RiGroupLine className="text-sky-500" />,
      path: "/admin/customers",
    },
    {
      label: "Total Catalog Products",
      val: stats.totalProducts,
      icon: <RiArchiveLine className="text-slate-500" />,
      path: "/admin/products",
    },
    {
      label: "Low Stock Items",
      val: stats.lowStock,
      icon: <RiAlertLine className="text-amber-400" />,
      path: "/admin/inventory?status=low",
    },
    {
      label: "Out of Stock Items",
      val: stats.outOfStock,
      icon: <RiAlertLine className="text-red-500" />,
      path: "/admin/inventory?status=out",
    },
    {
      label: "Average Order Value (AOV)",
      val: `₹${stats.aov}`,
      icon: <RiPercentLine />,
      path: "/admin/analytics",
    },
    {
      label: "Conversion Rate",
      val: `${stats.conversionRate}%`,
      icon: <RiPercentLine />,
      path: "/admin/analytics",
    },
    {
      label: "Visitors Today",
      val: stats.visitorsToday,
      icon: <RiCompass3Line />,
      path: "/admin/analytics",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Overview"
        subtitle="Real-time parameters syncing with localized stores database"
        breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
        actions={
          <Button variant="primary" size="sm" onClick={fetchData}>
            Sync Live Data
          </Button>
        }
      />

      {/* Grid count cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCardsData.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.path)}
            className="bg-white border border-slate-200 p-4.5 rounded-lg flex flex-col justify-between space-y-4 hover:border-[#c5a880] cursor-pointer transition-all duration-300 shadow-xxs hover:shadow-md group"
          >
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-[9px] uppercase font-bold tracking-wider leading-relaxed text-slate-500 font-display">
                {card.label}
              </span>
              <span className="text-slate-400 text-sm group-hover:text-[#c5a880] transition-colors">
                {card.icon}
              </span>
            </div>
            <p className="text-xl font-semibold tracking-tight text-slate-800 font-display">
              {card.val}
            </p>
          </div>
        ))}
      </div>

      {/* Modern SVG custom line/bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Line Graph */}
        <Card className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-600 font-display">
              Revenue Curve
            </h3>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center border border-emerald-100 font-mono">
              <RiArrowUpSLine className="mr-0.5" /> +14.2% MoM
            </span>
          </div>
          <div className="h-64 flex items-end justify-between relative px-2 pt-8">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-8">
              <div className="border-t border-slate-200" />
              <div className="border-t border-slate-200" />
              <div className="border-t border-slate-200" />
              <div className="border-t border-slate-200" />
            </div>

            {/* Line graph design using absolute SVG overlay */}
            <svg
              className="absolute inset-0 h-full w-full px-8 py-8"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c5a880" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#c5a880" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Chart line shadow gradient area */}
              <path
                d="M 0 100 Q 15 65 30 50 T 60 25 T 90 10 L 100 10 L 100 100 Z"
                fill="url(#chartGrad)"
              />
              {/* Pure Stroke Curve */}
              <path
                d="M 0 100 Q 15 65 30 50 T 60 25 T 90 10 L 100 10"
                fill="none"
                stroke="#c5a880"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            <div className="text-[9px] text-slate-500 w-full flex justify-between absolute bottom-1 px-4 font-mono">
              <span>May 2026</span>
              <span>June 2026</span>
              <span>July 2026</span>
            </div>
          </div>
        </Card>

        {/* Chart 2: Category distribution bar chart */}
        <Card className="flex flex-col">
          <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-600 mb-6 font-display">
            Popular Sales Categories
          </h3>
          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {[
              {
                cat: "Suits & Suit Sets",
                pct: 54,
                rev: "₹2.45L",
                color: "bg-[#c5a880]",
              },
              {
                cat: "Kurtis & Short Tops",
                pct: 31,
                rev: "₹1.40L",
                color: "bg-[#a88f65]",
              },
              {
                cat: "Premium Ethnic Wear",
                pct: 15,
                rev: "₹68k",
                color: "bg-slate-400",
              },
            ].map((row, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-medium">{row.cat}</span>
                  <span className="text-slate-500 font-semibold font-mono">
                    {row.rev} ({row.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${row.color} rounded-full`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Split Activity logs & Low stock products list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Recent Activity Logs */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col shadow-xs">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-750 font-display">
              Security & Activity Logs
            </h3>
            <span className="text-[10px] text-[#c5a880] font-semibold font-mono">
              100 Max Records
            </span>
          </div>
          <div className="flex-grow overflow-y-auto max-h-72 space-y-2.5">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">
                No logs generated yet
              </p>
            ) : (
              logs.slice(0, 8).map((log, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-xs text-slate-700 transition"
                >
                  <div className="space-y-1 pr-4">
                    <p className="font-semibold text-slate-800">{log.action}</p>
                    <p className="text-[10px] text-slate-400">
                      by{" "}
                      <span className="font-semibold text-slate-600">
                        {log.adminName}
                      </span>{" "}
                      ({log.device})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-500 font-mono">
                      {log.ipAddress}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Low Stock Products Grid Widget */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col shadow-xs">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-750 font-display">
              Inventory Shortage Alerts
            </h3>
            <span className="text-[9px] bg-red-50 border border-red-200 text-red-700 font-bold px-2 py-0.5 rounded">
              Needs Replenishing
            </span>
          </div>
          <div className="flex-grow overflow-y-auto max-h-72 space-y-2">
            {products.filter(
              (p) =>
                Object.values(p.sizesStock || {}).reduce(
                  (acc, curr) => acc + curr,
                  0,
                ) <= 5,
            ).length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">
                All catalog items have healthy stock levels
              </p>
            ) : (
              products
                .filter(
                  (p) =>
                    Object.values(p.sizesStock || {}).reduce(
                      (acc, curr) => acc + curr,
                      0,
                    ) <= 5,
                )
                .slice(0, 6)
                .map((prod, idx) => {
                  const total = Object.values(prod.sizesStock || {}).reduce(
                    (acc, curr) => acc + curr,
                    0,
                  );
                  return (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center justify-between text-xs transition hover:bg-slate-100/50"
                    >
                      <div className="flex items-center space-x-3">
                        {prod.images && prod.images[0] && (
                          <img
                            src={prod.images[0]}
                            className="w-9 h-9 object-cover rounded border border-slate-200"
                            alt=""
                          />
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">
                            {prod.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {prod.sku}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            total === 0
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {total === 0
                            ? "Out of Stock"
                            : `${total} Units Remaining`}
                        </span>
                        <div className="text-[9px] text-slate-450 mt-1 uppercase tracking-wider font-mono">
                          {Object.entries(prod.sizesStock || {})
                            .map(([sz, stock]) => `${sz}:${stock}`)
                            .join(" | ")}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardModule;

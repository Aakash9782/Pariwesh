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
    fulfillmentRate: 0,
    newCustomersToday: 0,
    revenueByDay: [],
    categorySales: [],
    momPct: 0,
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
        const status = (ord.orderStatus || "").toLowerCase();
        const isCancelled = status === "cancelled" || status === "refunded";
        const amt =
          ord.pricing?.grandTotal || ord.pricing?.total || ord.totalPrice || 0;

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

        // Status counts map
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

      // Real metrics (no simulated visitors/conversion)
      const newCustomersToday = cList.filter((u) => {
        const d = new Date(u.createdAt);
        return d >= today;
      }).length;

      const actionableOrders = oList.filter((ord) => {
        const s = (ord.orderStatus || "").toLowerCase();
        return s !== "cancelled";
      }).length;
      const fulfillmentRate =
        actionableOrders > 0
          ? ((deliveredCount / actionableOrders) * 100).toFixed(1)
          : "0.0";

      // Last 14 days revenue series
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
            sum +=
              ord.pricing?.grandTotal ||
              ord.pricing?.total ||
              ord.totalPrice ||
              0;
            count++;
          }
        });
        revenueByDay.push({
          label: dayStart.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          }),
          revenue: sum,
          orders: count,
        });
      }

      // Category revenue from order line items ↔ product catalog
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
          const cat = (prod?.category || "Uncategorized").toString();
          const line = (item.price || 0) * (item.quantity || 1);
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
        .slice(0, 6);

      // MoM revenue change from last 2 calendar months
      const thisMonthStart = firstOfMonth;
      const lastMonthStart = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1,
      );
      let lastMonthRev = 0;
      oList.forEach((ord) => {
        const d = new Date(ord.createdAt);
        const amt =
          ord.pricing?.grandTotal || ord.pricing?.total || ord.totalPrice || 0;
        if (d >= lastMonthStart && d < thisMonthStart) lastMonthRev += amt;
      });
      const momPct =
        lastMonthRev > 0
          ? (((monthlyRevenueSum - lastMonthRev) / lastMonthRev) * 100).toFixed(
              1,
            )
          : monthlyRevenueSum > 0
            ? "100.0"
            : "0.0";

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
        fulfillmentRate,
        newCustomersToday,
        revenueByDay,
        categorySales,
        momPct,
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
      icon: <RiShoppingBag3Line className="text-emerald-500" />,
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
      path: "/admin/returns?status=Return_Requested",
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
      label: "Fulfillment Rate",
      val: `${stats.fulfillmentRate}%`,
      icon: <RiPercentLine />,
      path: "/admin/orders?status=Delivered",
    },
    {
      label: "New Customers Today",
      val: stats.newCustomersToday,
      icon: <RiGroupLine className="text-sky-500" />,
      path: "/admin/customers",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Overview"
        subtitle="Live store metrics from orders, catalog, and customers"
        breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
        actions={
          <Button variant="primary" size="sm" onClick={fetchData}>
            Sync Live Data
          </Button>
        }
      />

      {/* Grid count cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCardsData.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.path)}
            className="admin-stat-card flex flex-col justify-between space-y-3 cursor-pointer group p-4"
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

      {/* Live charts from orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Last 14 days revenue bars */}
        <Card className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-600 font-display">
              Revenue — Last 14 Days
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center border font-mono ${
                Number(stats.momPct) >= 0
                  ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                  : "text-red-700 bg-red-50 border-red-100"
              }`}
            >
              <RiArrowUpSLine
                className={`mr-0.5 ${Number(stats.momPct) < 0 ? "rotate-180" : ""}`}
              />{" "}
              {Number(stats.momPct) >= 0 ? "+" : ""}
              {stats.momPct}% MoM
            </span>
          </div>
          {(!stats.revenueByDay || stats.revenueByDay.length === 0) &&
          !orders.length ? (
            <p className="text-xs text-slate-400 italic py-16 text-center">
              No order revenue yet
            </p>
          ) : (
            <div className="h-64 flex items-end gap-1.5 px-1 pt-6 relative">
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
                      title={`₹${d.revenue.toLocaleString("en-IN")} · ${d.orders} orders`}
                    >
                      <span className="absolute -top-5 text-[8px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        ₹
                        {d.revenue >= 1000
                          ? `${(d.revenue / 1000).toFixed(1)}k`
                          : d.revenue}
                      </span>
                      <div
                        className="w-full rounded-t bg-[#c5a880]/80 group-hover:bg-[#c5a880] transition-all min-h-[4px]"
                        style={{ height: `${h}%` }}
                      />
                      {(idx === 0 ||
                        idx === stats.revenueByDay.length - 1 ||
                        idx % 3 === 0) && (
                        <span className="text-[8px] text-slate-400 font-mono mt-1 truncate w-full text-center">
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
        <Card className="flex flex-col">
          <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-600 mb-6 font-display">
            Sales by Category
          </h3>
          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {!stats.categorySales || stats.categorySales.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">
                No category sales data yet — place orders to populate
              </p>
            ) : (
              stats.categorySales.map((row, idx) => {
                const colors = [
                  "bg-[#c5a880]",
                  "bg-[#a88f65]",
                  "bg-slate-400",
                  "bg-slate-500",
                  "bg-amber-400",
                  "bg-stone-400",
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
                      <span className="text-slate-700 font-medium capitalize">
                        {row.cat}
                      </span>
                      <span className="text-slate-500 font-semibold font-mono">
                        {formatRev} ({row.pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[idx % colors.length]} rounded-full`}
                        style={{ width: `${Math.max(row.pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Split Activity logs & Low stock products list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Recent Activity Logs */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col shadow-xs">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-700 font-display">
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
            <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-700 font-display">
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
                        <div className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-mono">
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

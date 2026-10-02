import React, { useState, useEffect, useMemo } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";
import {
  RiBarChart2Line,
  RiPieChartLine,
  RiArrowRightUpLine,
  RiRefreshLine,
  RiShoppingBag3Line,
  RiMoneyDollarCircleLine,
  RiExchangeFundsLine,
  RiTruckLine,
  RiCalendarLine,
  RiCoupon3Line,
  RiFireLine,
  RiShieldCheckLine,
  RiPercentLine,
} from "react-icons/ri";

const TIMEFRAMES = [
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "mtd", label: "This Month" },
  { id: "all", label: "All Time" },
];

const AnalyticsPage = () => {
  const { showAlert: alert } = useAlert();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("7d");
  const [chartMetric, setChartMetric] = useState("revenue"); // "revenue" or "orders"
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Fetch all orders securely from existing API
  const fetchOrdersHistory = async () => {
    try {
      setIsLoading(true);
      const res = await API.get("/orders");
      if (res.data?.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      alert("Failed to compute live analytics ledger");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersHistory();
  }, []);

  // Filter orders by active timeframe
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    if (timeframe === "all") return orders;

    const now = new Date();
    let startDate;

    if (timeframe === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === "mtd") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    return orders.filter((ord) => {
      const created = new Date(ord.createdAt);
      return !startDate || created >= startDate;
    });
  }, [orders, timeframe]);

  // Aggregate executive metrics
  const analyticsData = useMemo(() => {
    const totalOrdersCount = filteredOrders.length;

    // Separate cancelled & refunded
    const validOrders = filteredOrders.filter((ord) => {
      const st = ord.orderStatus?.toLowerCase() || "";
      return st !== "cancelled" && st !== "refunded";
    });

    const netRevenue = validOrders.reduce((sum, ord) => {
      return sum + (ord.pricing?.grandTotal || ord.totalPrice || 0);
    }, 0);

    const grossRevenue = filteredOrders.reduce((sum, ord) => {
      return sum + (ord.pricing?.grandTotal || ord.totalPrice || 0);
    }, 0);

    const avgOrderValue =
      validOrders.length > 0 ? Math.round(netRevenue / validOrders.length) : 0;

    const totalUnitsSold = validOrders.reduce((sum, ord) => {
      if (!Array.isArray(ord.items)) return sum;
      return (
        sum +
        ord.items.reduce((itemSum, it) => itemSum + (Number(it.quantity) || 1), 0)
      );
    }, 0);

    // Payment Methods Split
    const codOrders = filteredOrders.filter(
      (ord) => (ord.paymentMethod || "").toUpperCase() === "COD",
    );
    const onlineOrders = filteredOrders.filter(
      (ord) => (ord.paymentMethod || "").toUpperCase() !== "COD",
    );

    const codCount = codOrders.length;
    const onlineCount = onlineOrders.length;

    const codRevenue = codOrders
      .filter((o) => !["cancelled", "refunded"].includes(o.orderStatus?.toLowerCase()))
      .reduce((sum, o) => sum + (o.pricing?.grandTotal || o.totalPrice || 0), 0);

    const onlineRevenue = onlineOrders
      .filter((o) => !["cancelled", "refunded"].includes(o.orderStatus?.toLowerCase()))
      .reduce((sum, o) => sum + (o.pricing?.grandTotal || o.totalPrice || 0), 0);

    const codPct =
      totalOrdersCount > 0 ? Math.round((codCount / totalOrdersCount) * 100) : 0;
    const onlinePct =
      totalOrdersCount > 0 ? Math.round((onlineCount / totalOrdersCount) * 100) : 0;

    // Fulfillment Status Pipeline
    let deliveredCount = 0;
    let inTransitCount = 0;
    let cancelledCount = 0;
    let returnedCount = 0;

    filteredOrders.forEach((ord) => {
      const st = (ord.orderStatus || "").toLowerCase();
      if (st === "delivered") {
        deliveredCount++;
      } else if (
        st === "cancelled"
      ) {
        cancelledCount++;
      } else if (
        st === "refunded" ||
        st.includes("return") ||
        st.includes("rto")
      ) {
        returnedCount++;
      } else {
        // Placed, Confirmed, Processing, Packed, Shipped, In Transit, Ready to Ship
        inTransitCount++;
      }
    });

    const deliveredPct =
      totalOrdersCount > 0 ? Math.round((deliveredCount / totalOrdersCount) * 100) : 0;
    const inTransitPct =
      totalOrdersCount > 0 ? Math.round((inTransitCount / totalOrdersCount) * 100) : 0;
    const cancelledPct =
      totalOrdersCount > 0 ? Math.round((cancelledCount / totalOrdersCount) * 100) : 0;
    const returnedPct =
      totalOrdersCount > 0 ? Math.round((returnedCount / totalOrdersCount) * 100) : 0;

    // Top 5 Best-Selling Products
    const productSalesMap = {};
    validOrders.forEach((ord) => {
      if (!Array.isArray(ord.items)) return;
      ord.items.forEach((item) => {
        const pId = item.productId || item.name || "unknown";
        if (!productSalesMap[pId]) {
          productSalesMap[pId] = {
            id: pId,
            name: item.name || "Handcrafted Ensemble",
            image: item.image || "",
            sku: item.sku || "",
            units: 0,
            revenue: 0,
          };
        }
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        productSalesMap[pId].units += qty;
        productSalesMap[pId].revenue += price * qty;
      });
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Total Discounts & Promotions Impact
    const totalDiscountGiven = validOrders.reduce((sum, ord) => {
      return sum + (Number(ord.pricing?.discount) || 0);
    }, 0);

    const couponOrdersCount = validOrders.filter(
      (ord) =>
        ord.pricing?.appliedCoupon ||
        (ord.pricing?.discount && ord.pricing.discount > 0),
    ).length;

    return {
      totalOrdersCount,
      validOrdersCount: validOrders.length,
      netRevenue,
      grossRevenue,
      avgOrderValue,
      totalUnitsSold,
      codCount,
      codRevenue,
      codPct,
      onlineCount,
      onlineRevenue,
      onlinePct,
      deliveredCount,
      deliveredPct,
      inTransitCount,
      inTransitPct,
      cancelledCount,
      cancelledPct,
      returnedCount,
      returnedPct,
      topProducts,
      totalDiscountGiven,
      couponOrdersCount,
    };
  }, [filteredOrders]);

  // Compute dynamic daily trend points for the chart
  const trendChartData = useMemo(() => {
    const daysToShow = timeframe === "30d" || timeframe === "mtd" ? 14 : 7;
    const points = [];
    const now = new Date();

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
      });

      // Filter orders on this day
      const dayOrders = filteredOrders.filter((ord) => {
        const oDate = new Date(ord.createdAt).toISOString().split("T")[0];
        return oDate === dateStr;
      });

      const dayValidOrders = dayOrders.filter((ord) => {
        const st = (ord.orderStatus || "").toLowerCase();
        return st !== "cancelled" && st !== "refunded";
      });

      const dayRevenue = dayValidOrders.reduce((sum, ord) => {
        return sum + (ord.pricing?.grandTotal || ord.totalPrice || 0);
      }, 0);

      points.push({
        dateStr,
        label: dayLabel,
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }

    const maxVal = Math.max(
      ...points.map((p) => (chartMetric === "revenue" ? p.revenue : p.orders)),
      chartMetric === "revenue" ? 5000 : 2,
    );

    const n = points.length || 1;
    const colWidth = 100 / n;

    const svgPoints = points.map((p, index) => {
      const val = chartMetric === "revenue" ? p.revenue : p.orders;
      const x = (index + 0.5) * colWidth;
      const y = 88 - (val / maxVal) * 70; // baseline at 88, top at 18
      return { ...p, x, y, val };
    });

    const linePath = svgPoints.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, "");

    const firstPt = svgPoints[0];
    const lastPt = svgPoints[svgPoints.length - 1];
    const areaPath =
      linePath && firstPt && lastPt
        ? `M ${firstPt.x} 88 L ${firstPt.x} ${firstPt.y} ${svgPoints
            .slice(1)
            .map((pt) => `L ${pt.x} ${pt.y}`)
            .join(" ")} L ${lastPt.x} 88 Z`
        : "";

    return { points: svgPoints, linePath, areaPath, maxVal };
  }, [filteredOrders, timeframe, chartMetric]);

  // Donut chart calculations
  const circumference = 283;
  const devDash = (analyticsData.deliveredPct / 100) * circumference;
  const inTDash = (analyticsData.inTransitPct / 100) * circumference;
  const canDash = (analyticsData.cancelledPct / 100) * circumference;
  const retDash = (analyticsData.returnedPct / 100) * circumference;

  const inTOffset = devDash;
  const canOffset = devDash + inTDash;
  const retOffset = devDash + inTDash + canDash;

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in font-sans pb-10">
      {/* Page Header with Timeframe Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <PageHeader
            title="Business Intelligence & Sales Analytics"
            breadcrumbs={[
              { label: "Dashboard", link: "/admin" },
              { label: "Analytics" },
            ]}
            subtitle="Verified real-time revenue velocity, basket sizes, and order fulfillment breakdown"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector pills */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200 shadow-2xs">
            {TIMEFRAMES.map((tf) => {
              const active = timeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeframe(tf.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    active
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

          <Button
            onClick={fetchOrdersHistory}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1.5 text-xs text-[#c5a880] border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
            title="Refresh database records"
          >
            <RiRefreshLine
              size={15}
              className={isLoading ? "animate-spin text-[#c5a880]" : ""}
            />
            <span>Reload</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-3 bg-[#FAF9F6] border-slate-200">
                <SkeletonLoader className="h-3 w-1/2 rounded" />
                <SkeletonLoader className="h-7 w-2/3 rounded" />
                <SkeletonLoader className="h-3 w-4/5 rounded" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 h-80 space-y-4 bg-[#FAF9F6]">
              <SkeletonLoader className="h-4 w-40 rounded" />
              <SkeletonLoader className="h-60 w-full rounded" />
            </Card>
            <Card className="p-6 h-80 space-y-4 bg-[#FAF9F6]">
              <SkeletonLoader className="h-4 w-36 rounded" />
              <SkeletonLoader className="h-60 w-full rounded" />
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Net Sales Revenue */}
            <Card className="p-5 flex flex-col justify-between space-y-3 bg-white border-slate-200/90 shadow-2xs hover:shadow-xs transition">
              <div className="flex justify-between items-start">
                <span className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">
                  Net Realized Sales
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <RiMoneyDollarCircleLine size={18} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
                  ₹{analyticsData.netRevenue.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mr-1.5">
                    {analyticsData.validOrdersCount} Confirmed
                  </span>
                  <span>Gross: ₹{analyticsData.grossRevenue.toLocaleString("en-IN")}</span>
                </p>
              </div>
            </Card>

            {/* Card 2: Average Order Value (AOV) & Items */}
            <Card className="p-5 flex flex-col justify-between space-y-3 bg-white border-slate-200/90 shadow-2xs hover:shadow-xs transition">
              <div className="flex justify-between items-start">
                <span className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">
                  Average Basket (AOV)
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#8a1c14] flex items-center justify-center">
                  <RiShoppingBag3Line size={17} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
                  ₹{analyticsData.avgOrderValue.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Total <span className="font-bold text-slate-800">{analyticsData.totalUnitsSold}</span> items sold across orders
                </p>
              </div>
            </Card>

            {/* Card 3: COD vs Prepaid Revenue & Ratio */}
            <Card className="p-5 flex flex-col justify-between space-y-3 bg-white border-slate-200/90 shadow-2xs hover:shadow-xs transition">
              <div className="flex justify-between items-start">
                <span className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">
                  Payment Channels
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <RiExchangeFundsLine size={18} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-baseline">
                  <p className="text-xl font-serif font-extrabold text-slate-900">
                    {analyticsData.onlinePct}% <span className="text-xs font-sans font-normal text-slate-400">Prepaid</span>
                  </p>
                  <p className="text-xs font-bold text-amber-700">
                    {analyticsData.codPct}% COD
                  </p>
                </div>
                {/* Visual Ratio Bar */}
                <div className="w-full bg-amber-100 h-2 rounded-full overflow-hidden flex my-1.5">
                  <div
                    style={{ width: `${analyticsData.onlinePct}%` }}
                    className="bg-emerald-600 h-full"
                    title={`Online Prepaid: ${analyticsData.onlinePct}%`}
                  />
                  <div
                    style={{ width: `${analyticsData.codPct}%` }}
                    className="bg-amber-500 h-full"
                    title={`Cash on Delivery: ${analyticsData.codPct}%`}
                  />
                </div>
                <p className="text-[9.5px] text-slate-500 flex justify-between">
                  <span>Prepaid: ₹{analyticsData.onlineRevenue.toLocaleString("en-IN")}</span>
                  <span>COD: ₹{analyticsData.codRevenue.toLocaleString("en-IN")}</span>
                </p>
              </div>
            </Card>

            {/* Card 4: Order Fulfillment Health */}
            <Card className="p-5 flex flex-col justify-between space-y-3 bg-white border-slate-200/90 shadow-2xs hover:shadow-xs transition">
              <div className="flex justify-between items-start">
                <span className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">
                  Fulfillment Success
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <RiTruckLine size={18} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
                  {analyticsData.deliveredPct}%
                </p>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    {analyticsData.deliveredCount} Delivered · {analyticsData.inTransitCount} In-Transit
                  </span>
                </p>
              </div>
            </Card>
          </div>

          {/* Middle Section: Sales Trend Curve + Fulfillment Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales / Orders Trend Chart */}
            <Card className="lg:col-span-2 p-6 space-y-4 bg-[#FAF9F6] border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#c5a880] flex items-center">
                    <RiBarChart2Line className="mr-1.5" size={16} /> Order & Sales Trajectory
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Day-by-day velocity over selected timeframe
                  </p>
                </div>

                {/* Metric toggle button */}
                <div className="bg-white p-0.5 rounded-lg border border-slate-200 flex items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setChartMetric("revenue")}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      chartMetric === "revenue"
                        ? "bg-[#8a1c14] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Revenue (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric("orders")}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      chartMetric === "orders"
                        ? "bg-[#8a1c14] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Orders Count
                  </button>
                </div>
              </div>

              {/* Chart Container */}
              <div className="relative h-64 w-full pt-4 pb-8 select-none">
                {trendChartData.points.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                    No order transactions recorded in this period.
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    {/* SVG Layer for Grid, Area and Trend Line */}
                    <svg
                      className="w-full h-full overflow-hidden"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="chartAura" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#c5a880" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#c5a880" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="0" y1="18" x2="100" y2="18" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="0.8" />
                      <line x1="0" y1="53" x2="100" y2="53" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="0.8" />
                      <line x1="0" y1="88" x2="100" y2="88" stroke="#e2e8f0" strokeWidth="1" />

                      {/* Area Fill */}
                      {trendChartData.areaPath && (
                        <path
                          d={trendChartData.areaPath}
                          fill="url(#chartAura)"
                        />
                      )}

                      {/* Trend Line */}
                      {trendChartData.linePath && (
                        <path
                          d={trendChartData.linePath}
                          fill="none"
                          stroke="#8a1c14"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>

                    {/* Interactive Column Overlays with True Round Dots */}
                    <div className="absolute inset-0 flex">
                      {trendChartData.points.map((pt, i) => {
                        const isHovered = activeTooltip?.dateStr === pt.dateStr;
                        return (
                          <div
                            key={i}
                            className="flex-1 h-full relative cursor-pointer group"
                            onMouseEnter={() => setActiveTooltip(pt)}
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            {/* Vertical Guide Line on Hover */}
                            {isHovered && (
                              <div className="absolute top-2 bottom-8 left-1/2 -translate-x-1/2 w-[1px] border-l border-dashed border-[#8a1c14]/40 pointer-events-none" />
                            )}

                            {/* Perfectly Round Point Dot (Never distorted) */}
                            <div
                              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-150 flex items-center justify-center"
                              style={{ top: `${pt.y}%` }}
                            >
                              <div
                                className={`rounded-full transition-all duration-150 ${
                                  isHovered
                                    ? "w-4 h-4 bg-[#8a1c14] border-2 border-white shadow-md ring-4 ring-[#8a1c14]/20 scale-125"
                                    : "w-2.5 h-2.5 bg-[#8a1c14] border-2 border-white shadow-xs group-hover:scale-115"
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Floating Tooltip with Edge Protection */}
                    {activeTooltip && (
                      <div
                        className="absolute z-30 pointer-events-none transition-all duration-75 ease-out"
                        style={{
                          left: `${activeTooltip.x}%`,
                          top: `${Math.max(22, activeTooltip.y)}%`,
                          transform:
                            activeTooltip.x < 15
                              ? "translate(-10%, -125%)"
                              : activeTooltip.x > 85
                              ? "translate(-90%, -125%)"
                              : "translate(-50%, -125%)",
                        }}
                      >
                        <div className="bg-slate-900 text-white text-[11px] px-3 py-2 rounded-xl shadow-xl border border-slate-700/80 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5 pb-1 border-b border-slate-700/80 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880]" />
                            <span className="font-bold text-[#c5a880] tracking-wide">
                              {activeTooltip.label}
                            </span>
                          </div>
                          <p className="font-serif font-bold text-sm text-white">
                            ₹{activeTooltip.revenue.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {activeTooltip.orders} {activeTooltip.orders === 1 ? "order" : "orders"} placed
                          </p>
                        </div>
                      </div>
                    )}

                    {/* X-Axis Date Labels aligned with columns */}
                    <div className="absolute bottom-0 inset-x-0 flex text-[9.5px] font-mono text-slate-500 pt-2 border-t border-slate-200">
                      {trendChartData.points.map((pt, i) => (
                        <div key={i} className="flex-1 text-center truncate px-0.5">
                          <span className={activeTooltip?.dateStr === pt.dateStr ? "font-bold text-[#8a1c14]" : ""}>
                            {pt.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Order Fulfillment Donut Ratio */}
            <Card className="p-6 space-y-4 flex flex-col justify-between bg-[#FAF9F6] border-slate-200">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#c5a880] flex items-center">
                  <RiPieChartLine className="mr-1.5" size={16} /> Fulfillment Distribution
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Order status breakdown for period
                </p>
              </div>

              {/* Donut Chart */}
              <div className="flex justify-center items-center py-2">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="45"
                      stroke="#e2e8f0"
                      strokeWidth="11"
                      fill="transparent"
                    />

                    {analyticsData.totalOrdersCount === 0 ? (
                      <circle
                        cx="72"
                        cy="72"
                        r="45"
                        stroke="#cbd5e1"
                        strokeWidth="11"
                        fill="transparent"
                      />
                    ) : (
                      <>
                        {/* Delivered */}
                        {devDash > 0 && (
                          <circle
                            cx="72"
                            cy="72"
                            r="45"
                            stroke="#059669"
                            strokeWidth="11"
                            fill="transparent"
                            strokeDasharray={`${devDash} ${circumference - devDash}`}
                            strokeDashoffset="0"
                            strokeLinecap="round"
                          />
                        )}
                        {/* In-Transit */}
                        {inTDash > 0 && (
                          <circle
                            cx="72"
                            cy="72"
                            r="45"
                            stroke="#475569"
                            strokeWidth="11"
                            fill="transparent"
                            strokeDasharray={`${inTDash} ${circumference - inTDash}`}
                            strokeDashoffset={-inTOffset}
                            strokeLinecap="round"
                          />
                        )}
                        {/* Cancelled */}
                        {canDash > 0 && (
                          <circle
                            cx="72"
                            cy="72"
                            r="45"
                            stroke="#e11d48"
                            strokeWidth="11"
                            fill="transparent"
                            strokeDasharray={`${canDash} ${circumference - canDash}`}
                            strokeDashoffset={-canOffset}
                            strokeLinecap="round"
                          />
                        )}
                        {/* Returned / RTO */}
                        {retDash > 0 && (
                          <circle
                            cx="72"
                            cy="72"
                            r="45"
                            stroke="#d97706"
                            strokeWidth="11"
                            fill="transparent"
                            strokeDasharray={`${retDash} ${circumference - retDash}`}
                            strokeDashoffset={-retOffset}
                            strokeLinecap="round"
                          />
                        )}
                      </>
                    )}
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold font-serif text-slate-800">
                      {analyticsData.totalOrdersCount}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                      Orders
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown Legend */}
              <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full mr-2 shrink-0" />
                    Delivered
                  </span>
                  <span className="font-bold text-slate-800">
                    {analyticsData.deliveredCount} ({analyticsData.deliveredPct}%)
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 bg-slate-600 rounded-full mr-2 shrink-0" />
                    Active Pipeline / In-Transit
                  </span>
                  <span className="font-bold text-slate-800">
                    {analyticsData.inTransitCount} ({analyticsData.inTransitPct}%)
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 bg-rose-600 rounded-full mr-2 shrink-0" />
                    Cancelled
                  </span>
                  <span className="font-bold text-slate-800">
                    {analyticsData.cancelledCount} ({analyticsData.cancelledPct}%)
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 bg-amber-600 rounded-full mr-2 shrink-0" />
                    Returned / RTO
                  </span>
                  <span className="font-bold text-slate-800">
                    {analyticsData.returnedCount} ({analyticsData.returnedPct}%)
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Section: Top Best-Selling Products & Promotions Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top 5 Products Leaderboard */}
            <Card className="lg:col-span-2 p-6 space-y-4 bg-white border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#c5a880] flex items-center">
                    <RiFireLine className="mr-1.5 text-[#8a1c14]" size={16} /> Top Performing Ensembles
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ranked by total revenue & order volume
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Top 5 Items
                </span>
              </div>

              {analyticsData.topProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No product sales registered in this timeframe yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {analyticsData.topProducts.map((prod, index) => (
                    <div
                      key={prod.id || index}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-lg transition"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <span className="text-xs font-bold text-slate-400 font-mono w-4">
                          #{index + 1}
                        </span>
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          {prod.image ? (
                            <img
                              src={optimizeCloudinaryUrl(prod.image, 100)}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                              Suit
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {prod.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            SKU: {prod.sku || "PRW-ATELIER"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold font-serif text-slate-900">
                          ₹{prod.revenue.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {prod.units} {prod.units === 1 ? "unit" : "units"} sold
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Promotions & Campaign Impact Ledger */}
            <Card className="p-6 space-y-4 bg-white border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#c5a880] flex items-center">
                    <RiCoupon3Line className="mr-1.5 text-[#8a1c14]" size={16} /> Campaign Savings
                  </h3>
                  <span className="text-[9px] bg-rose-50 text-[#8a1c14] font-bold px-2 py-0.5 rounded-full border border-rose-100">
                    Promo Impact
                  </span>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Discounts Given to Customers
                    </span>
                    <p className="text-xl font-bold font-serif text-slate-900 mt-1">
                      ₹{analyticsData.totalDiscountGiven.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Applied across {analyticsData.couponOrdersCount} eligible checkout orders
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span>Orders with Promo Codes</span>
                      <span className="font-bold text-slate-900">
                        {analyticsData.couponOrdersCount} / {analyticsData.totalOrdersCount}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span>Avg Units Per Order</span>
                      <span className="font-bold text-slate-900">
                        {analyticsData.validOrdersCount > 0
                          ? (analyticsData.totalUnitsSold / analyticsData.validOrdersCount).toFixed(1)
                          : "0"}{" "}
                        pcs
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span>Clean Order Realization</span>
                      <span className="font-bold text-emerald-700">
                        {analyticsData.totalOrdersCount > 0
                          ? `${Math.round(((analyticsData.totalOrdersCount - analyticsData.cancelledCount) / analyticsData.totalOrdersCount) * 100)}%`
                          : "100%"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 flex items-center space-x-2">
                <RiShieldCheckLine size={16} className="text-emerald-600 shrink-0" />
                <span>Computed directly from customer order database. Zero simulated data.</span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;

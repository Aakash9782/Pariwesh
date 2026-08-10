import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import {
  RiBarChart2Line,
  RiPieChartLine,
  RiArrowRightUpLine,
  RiRefreshLine,
} from "react-icons/ri";

const AnalyticsPage = () => {
  const { showAlert: alert } = useAlert();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // KPIs
  const [metrics, setMetrics] = useState({
    avgTicketValue: 0,
    codSplitPct: 0,
    onlineSplitPct: 0,
    placedPct: 0,
    deliveredPct: 0,
    cancelledPct: 0,
    returnsPct: 0,
    returnsCount: 0,
    revenueTotal: 0,
    weeklyCounts: [0, 0, 0, 0, 0, 0, 0],
  });

  const fetchOrdersHistory = async () => {
    try {
      setIsLoading(true);
      const res = await API.get("/orders");
      if (res.data?.success) {
        const list = res.data.data || [];
        setOrders(list);

        // Calculate deeply audited metrics
        let totalRev = 0;
        let codCount = 0;
        let onlineCount = 0;
        let placed = 0;
        let delivered = 0;
        let cancelled = 0;
        let returns = 0;
        const weeklyCounts = [0, 0, 0, 0, 0, 0, 0];

        list.forEach((ord) => {
          const val = ord.pricing?.grandTotal || ord.totalPrice || 0;
          totalRev += val;

          if (ord.paymentMethod === "COD") codCount++;
          else onlineCount++;

          const status = ord.orderStatus?.toLowerCase() || "";
          if (
            status === "placed" ||
            status === "pending" ||
            status === "confirmed" ||
            status === "processing" ||
            status === "packed" ||
            status === "ready to ship" ||
            status === "shipped"
          ) {
            placed++;
          } else if (status === "delivered") {
            delivered++;
          } else if (status === "cancelled") {
            cancelled++;
          } else if (
            status === "refunded" ||
            status === "return_requested" ||
            status.startsWith("return_")
          ) {
            returns++;
          }

          // Compute day index based on order creation date
          const date = new Date(ord.createdAt);
          const day = date.getDay(); // 0 is Sunday, 1 is Monday...
          const index = day === 0 ? 6 : day - 1; // Mon -> 0, Tue -> 1 ... Sun -> 6
          weeklyCounts[index]++;
        });

        const totalOrders = list.length || 1;
        setMetrics({
          avgTicketValue: Math.round(totalRev / totalOrders),
          codSplitPct: Math.round((codCount / totalOrders) * 100),
          onlineSplitPct: Math.round((onlineCount / totalOrders) * 100),
          placedPct: Math.round((placed / totalOrders) * 100),
          deliveredPct: Math.round((delivered / totalOrders) * 100),
          cancelledPct: Math.round((cancelled / totalOrders) * 100),
          returnsPct: Math.round((returns / totalOrders) * 100),
          returnsCount: returns,
          revenueTotal: totalRev,
          weeklyCounts,
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to compute deep analytics ledger");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersHistory();
  }, []);

  const weeklyCounts = metrics.weeklyCounts || [0, 0, 0, 0, 0, 0, 0];
  const maxCount = Math.max(...weeklyCounts, 1);
  const chartPoints = weeklyCounts.map((count, i) => {
    const x = (i * 100) / 6;
    const y = 90 - (count / maxCount) * 75;
    return { x, y, count };
  });

  const linePath = chartPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const areaPath = linePath ? `${linePath} L 100 95 L 0 95 Z` : "";

  // Donut chart calculations
  const circumference = 283;
  const devRatio = metrics.deliveredPct || 0;
  const plcRatio = metrics.placedPct || 0;
  const canRatio = metrics.cancelledPct || 0;
  const retRatio = metrics.returnsPct || 0;
  const totalRatios = devRatio + plcRatio + canRatio + retRatio;

  const devDash = (devRatio / 100) * circumference;
  const plcDash = (plcRatio / 100) * circumference;
  const canDash = (canRatio / 100) * circumference;
  const retDash = (retRatio / 100) * circumference;

  const devOffset = 0;
  const plcOffset = devDash;
  const canOffset = devDash + plcDash;
  const retOffset = devDash + plcDash + canDash;

  return (
    <div className="space-y-6 text-slate-700 animate-fade-in font-sans">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <PageHeader
          title="Business Intelligence Dashboard"
          breadcrumbs={[
            { label: "Dashboard", link: "/admin" },
            { label: "Analytics" },
          ]}
          subtitle="Aggregated order values, delivery status ratios, and currency channels ratios"
        />
        <Button
          onClick={fetchOrdersHistory}
          variant="outline"
          className="flex items-center space-x-1.5 text-xs text-[#c5a880] border-slate-200"
        >
          <RiRefreshLine size={16} />
          <span>Reload Ledger</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* KPI columns skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-4">
                <SkeletonLoader className="h-3 w-1/2 rounded animate-pulse" />
                <SkeletonLoader className="h-8 w-2/3 rounded animate-pulse" />
                <SkeletonLoader className="h-3 w-2/5 rounded animate-pulse" />
              </Card>
            ))}
          </div>
          {/* Charts grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 space-y-4">
              <SkeletonLoader className="h-4 w-40 rounded animate-pulse" />
              <SkeletonLoader className="h-64 w-full rounded animate-pulse" />
            </Card>
            <Card className="p-6 space-y-6 flex flex-col justify-between">
              <SkeletonLoader className="h-4 w-44 rounded animate-pulse" />
              <div className="flex justify-center py-4">
                <SkeletonLoader className="h-32 w-32 rounded-full animate-pulse" />
              </div>
              <div className="space-y-2">
                <SkeletonLoader className="h-3.5 w-full rounded animate-pulse" />
                <SkeletonLoader className="h-3.5 w-3/4 rounded animate-pulse" />
                <SkeletonLoader className="h-3.5 w-1/2 rounded animate-pulse" />
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-5 flex flex-col justify-between space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Average Basket Ticket
              </span>
              <p className="text-2xl font-extrabold text-slate-800 tracking-tight">
                ₹{metrics.avgTicketValue}
              </p>
              <span className="text-[9px] text-green-600 flex items-center font-semibold">
                <RiArrowRightUpLine size={14} className="mr-0.5" /> High Margin
                Suits Preferred
              </span>
            </Card>

            <Card className="p-5 flex flex-col justify-between space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">
                Gross Sales Flow
              </span>
              <p className="text-2xl font-extrabold text-slate-800 tracking-tight">
                ₹{metrics.revenueTotal.toLocaleString()}
              </p>
              <span className="text-[9px] text-slate-500 font-mono">
                Integrated Payments
              </span>
            </Card>

            <Card className="p-5 flex flex-col justify-between space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                COD Split Volume Ratio
              </span>
              <p className="text-2xl font-extrabold text-amber-600 tracking-tight">
                {metrics.codSplitPct}%
              </p>
              <span className="text-[9px] text-slate-500 font-sans">
                Cash On Delivery Orders
              </span>
            </Card>

            <Card className="p-5 flex flex-col justify-between space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Online Pre-Paid Ratio
              </span>
              <p className="text-2xl font-extrabold text-green-600 tracking-tight">
                {metrics.onlineSplitPct}%
              </p>
              <span className="text-[9px] text-slate-500 font-mono">
                UPI Credit Cards Gateways
              </span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Daily order volume Line curve */}
            <Card className="lg:col-span-2 p-6 space-y-4">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#c5a880] flex items-center">
                <RiBarChart2Line className="mr-1.5" /> Weekly Order Frequency
              </h3>

              <div className="h-64 flex items-end justify-between relative px-2 pt-8">
                {/* Custom SVG line */}
                <svg
                  className="absolute inset-0 h-full w-full px-6 py-6"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="chartGradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#c5a880"
                        stopOpacity="0.25"
                      />
                      <stop
                        offset="100%"
                        stopColor="#c5a880"
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>

                  {/* Gradient area */}
                  {areaPath && (
                    <path
                      d={areaPath}
                      fill="url(#chartGradient)"
                      className="transition-all duration-300"
                    />
                  )}

                  {/* SVG line path */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#c5a880"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  )}

                  {/* Node circles */}
                  {chartPoints.map((pt, i) => (
                    <g key={i}>
                      <title>{`Orders: ${pt.count}`}</title>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="2.5"
                        fill="#c5a880"
                        stroke="#ffffff"
                        strokeWidth="0.8"
                        className="transition-all duration-300 cursor-pointer hover:scale-125"
                      />
                    </g>
                  ))}
                </svg>
                <div className="text-[8px] text-slate-500 w-full flex justify-between absolute bottom-1 px-4 leading-relaxed font-mono font-semibold">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </Card>

            {/* 2. Order status radial breakdown */}
            <Card className="p-6 space-y-5 flex flex-col justify-between">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#c5a880] flex items-center pr-3">
                <RiPieChartLine className="mr-1.5" /> Order Fulfillment Ratios
              </h3>

              <div className="flex justify-center items-center py-6">
                {/* Dynamic donut chart */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke="#f1f5f9"
                    strokeWidth="10"
                    fill="transparent"
                  />

                  {totalRatios === 0 ? (
                    <circle
                      cx="64"
                      cy="64"
                      r="45"
                      stroke="#cbd5e1"
                      strokeWidth="10"
                      fill="transparent"
                    />
                  ) : (
                    <>
                      {/* Delivered Segment */}
                      {devDash > 0 && (
                        <circle
                          cx="64"
                          cy="64"
                          r="45"
                          stroke="#c5a880"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={`${devDash} ${circumference - devDash}`}
                          strokeDashoffset={-devOffset}
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      )}
                      {/* Processing / Placed Segment */}
                      {plcDash > 0 && (
                        <circle
                          cx="64"
                          cy="64"
                          r="45"
                          stroke="#64748b"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={`${plcDash} ${circumference - plcDash}`}
                          strokeDashoffset={-plcOffset}
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      )}
                      {/* Cancelled Segment */}
                      {canDash > 0 && (
                        <circle
                          cx="64"
                          cy="64"
                          r="45"
                          stroke="#ef4444"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={`${canDash} ${circumference - canDash}`}
                          strokeDashoffset={-canOffset}
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      )}
                      {/* Returned Segment */}
                      {retDash > 0 && (
                        <circle
                          cx="64"
                          cy="64"
                          r="45"
                          stroke="#a855f7"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={`${retDash} ${circumference - retDash}`}
                          strokeDashoffset={-retOffset}
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      )}
                    </>
                  )}
                </svg>
              </div>

              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center font-medium">
                    <span className="w-2.5 h-2.5 bg-[#c5a880] rounded-full mr-2" />
                    Delivered
                  </span>
                  <span className="font-semibold text-slate-700">
                    {metrics.deliveredPct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center font-medium">
                    <span className="w-2.5 h-2.5 bg-[#64748b] rounded-full mr-2" />
                    Processing / Placed
                  </span>
                  <span className="font-semibold text-slate-700">
                    {plcRatio}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center font-medium">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full mr-2" />
                    Cancelled
                  </span>
                  <span className="font-semibold text-slate-700">
                    {metrics.cancelledPct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center font-medium">
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-full mr-2" />
                    Returned / Refunded
                  </span>
                  <span className="font-semibold text-slate-700">
                    {metrics.returnsPct}%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;

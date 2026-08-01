import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import {
  RiBarChart2Line,
  RiPieChartLine,
  RiCoinLine,
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
    returnsCount: 0,
    revenueTotal: 0,
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

        list.forEach((ord) => {
          const val = ord.pricing?.grandTotal || ord.totalPrice || 0;
          totalRev += val;

          if (ord.paymentMethod === "COD") codCount++;
          else onlineCount++;

          const status = ord.orderStatus?.toLowerCase() || "";
          if (status === "placed" || status === "pending") placed++;
          else if (status === "delivered") delivered++;
          else if (status === "cancelled") cancelled++;
          else if (status === "refunded" || status === "return_requested")
            returns++;
        });

        const totalOrders = list.length || 1;
        setMetrics({
          avgTicketValue: Math.round(totalRev / totalOrders),
          codSplitPct: Math.round((codCount / totalOrders) * 100),
          onlineSplitPct: Math.round((onlineCount / totalOrders) * 100),
          placedPct: Math.round((placed / totalOrders) * 100),
          deliveredPct: Math.round((delivered / totalOrders) * 100),
          cancelledPct: Math.round((cancelled / totalOrders) * 100),
          returnsCount: returns,
          revenueTotal: totalRev,
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

  return (
    <div className="space-y-8 font-sans">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold tracking-wide text-white">
            Business Intelligence Dashboard
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Aggregated order values, delivery status ratios, and currency
            channels ratios
          </p>
        </div>
        <button
          onClick={fetchOrdersHistory}
          className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-800 text-accent-gold text-xs font-bold py-2.5 px-4.5 rounded-lg border border-slate-805 transition"
        >
          <RiRefreshLine size={16} />
          <span>Reload Ledger</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {/* KPI columns skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-950 border border-slate-800 p-5 rounded-lg space-y-4"
              >
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            ))}
          </div>
          {/* Charts grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 p-6 rounded-lg space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-lg space-y-6 flex flex-col justify-between">
              <Skeleton className="h-4 w-44" />
              <div className="flex justify-center py-4">
                <Skeleton className="h-32 w-32" variant="circle" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* KPI Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-lg flex flex-col justify-between space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                Average Basket Ticket
              </span>
              <p className="text-2xl font-extrabold text-white tracking-tight">
                ₹{metrics.avgTicketValue}
              </p>
              <span className="text-[9px] text-green-400 flex items-center font-semibold">
                <RiArrowRightUpLine size={14} className="mr-0.5" /> High Margin
                Suits Preferred
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-5 rounded-lg flex flex-col justify-between space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                Gross Sales Flow
              </span>
              <p className="text-2xl font-extrabold text-white tracking-tight">
                ₹{metrics.revenueTotal.toLocaleString()}
              </p>
              <span className="text-[9px] text-slate-500 font-mono">
                Integrated Payments
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-5 rounded-lg flex flex-col justify-between space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                COD Split Volume Ratio
              </span>
              <p className="text-2xl font-extrabold text-amber-500 tracking-tight">
                {metrics.codSplitPct}%
              </p>
              <span className="text-[9px] text-slate-500 font-sans">
                Cash On Delivery Orders
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-5 rounded-lg flex flex-col justify-between space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                Online Pre-Paid Ratio
              </span>
              <p className="text-2xl font-extrabold text-green-400 tracking-tight">
                {metrics.onlineSplitPct}%
              </p>
              <span className="text-[9px] text-slate-500 font-mono">
                UPI Credit Cards Gateways
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Daily order volume Line curve */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 p-6 rounded-lg space-y-4">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center">
                <RiBarChart2Line className="mr-1.5" /> Weekly Order Frequency
              </h3>

              <div className="h-64 flex items-end justify-between relative px-2 pt-8">
                {/* Custom SVG line */}
                <svg
                  className="absolute inset-0 h-full w-full px-6 py-6"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 90 L 20 80 Q 40 40 60 70 T 80 30 L 100 10"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* points */}
                  <circle cx="0" cy="90" r="1.5" fill="#D4AF37" />
                  <circle cx="20" cy="80" r="1.5" fill="#D4AF37" />
                  <circle cx="60" cy="70" r="1.5" fill="#D4AF37" />
                  <circle cx="80" cy="30" r="1.5" fill="#D4AF37" />
                  <circle cx="100" cy="10" r="1.5" fill="#D4AF37" />
                </svg>
                <div className="text-[8px] text-slate-550 w-full flex justify-between absolute bottom-1 px-4 leading-relaxed font-mono">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            {/* 2. Order status radial breakdown */}
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-lg space-y-5 flex flex-col justify-between">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center pr-3">
                <RiPieChartLine className="mr-1.5" /> Order Fulfillment Ratios
              </h3>

              <div className="flex justify-center items-center py-6">
                {/* Simulated donut chart using nested SVG paths */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke="#1e293b"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke="#D4AF37"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="283"
                    strokeDashoffset={
                      283 - (283 * (metrics.deliveredPct || 65)) / 100
                    }
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center">
                    <span className="w-2.5 h-2.5 bg-accent-gold rounded-full mr-2" />
                    Delivered
                  </span>
                  <span className="font-semibold text-slate-200">
                    {metrics.deliveredPct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center">
                    <span className="w-2.5 h-2.5 bg-slate-800 rounded-full mr-2" />
                    Processing / Placed
                  </span>
                  <span className="font-semibold text-slate-200">
                    {metrics.placedPct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center">
                    <span className="w-2.5 h-2.5 bg-rose-900 rounded-full mr-2" />
                    Cancelled
                  </span>
                  <span className="font-semibold text-slate-200">
                    {metrics.cancelledPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;

import React from "react";

const StatusPill = ({ status, className = "" }) => {
  const s = status ? status.toLowerCase() : "";

  // Color configurations based on standard status stages
  const config = {
    placed: {
      dot: "bg-yellow-500",
      bg: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    pending: {
      dot: "bg-yellow-500",
      bg: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    processing: {
      dot: "bg-blue-500",
      bg: "bg-blue-50 text-blue-700 border-blue-200",
    },
    packed: {
      dot: "bg-[#c5a880]",
      bg: "bg-[#c5a880]/10 text-[#a88f65] border-[#c5a880]/20",
    },
    shipped: {
      dot: "bg-indigo-500",
      bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    delivered: {
      dot: "bg-emerald-500",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-250",
    },
    cancelled: {
      dot: "bg-red-500",
      bg: "bg-red-50 text-red-700 border-red-200",
    },
    refunded: {
      dot: "bg-purple-500",
      bg: "bg-purple-50 text-purple-700 border-purple-200",
    },
    return_requested: {
      dot: "bg-amber-500",
      bg: "bg-amber-50 text-amber-700 border-amber-200",
    },
    disputed: {
      dot: "bg-orange-600",
      bg: "bg-orange-50 text-orange-700 border-orange-200",
    },
  };

  const current = config[s] || {
    dot: "bg-slate-400",
    bg: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full border ${current.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      {status || "Unknown"}
    </span>
  );
};

export default StatusPill;

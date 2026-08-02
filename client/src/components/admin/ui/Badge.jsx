import React from "react";

const Badge = ({ children, variant = "default", className = "" }) => {
  const styles = {
    default: "bg-slate-100 text-slate-700 border-slate-205",
    primary: "bg-[#c5a880]/10 text-[#c5a880] border-[#c5a880]/20",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-sm border ${styles[variant] || styles.default} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;

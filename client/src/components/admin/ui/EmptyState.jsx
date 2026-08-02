import React from "react";
import { RiInboxArchiveLine } from "react-icons/ri";

const EmptyState = ({ title, subtitle, action, icon }) => {
  return (
    <div className="text-center py-12 px-4 max-w-sm mx-auto flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100">
        {icon || <RiInboxArchiveLine className="w-6 h-6" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 font-display">
          {title || "No data recorded"}
        </h3>
        <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
          {subtitle ||
            "No products, orders, or operational elements match your query."}
        </p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;

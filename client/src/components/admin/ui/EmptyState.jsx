import React from "react";
import { RiInboxArchiveLine } from "react-icons/ri";

const EmptyState = ({ title, subtitle, action, icon }) => {
  return (
    <div className="text-center py-14 px-4 max-w-sm mx-auto flex flex-col items-center justify-center space-y-4 animate-fade-in">
      <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#c5a880]/10 text-[#c5a880] border border-[#c5a880]/20">
        {icon || <RiInboxArchiveLine className="w-6 h-6" />}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 font-display">
          {title || "No data recorded"}
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
          {subtitle ||
            "Nothing matches your current filters. Try adjusting search or filters."}
        </p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
};

export default EmptyState;

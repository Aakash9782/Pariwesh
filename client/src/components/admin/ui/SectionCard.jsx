import React from "react";

const SectionCard = ({
  title,
  subtitle,
  actions,
  children,
  className = "",
}) => {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs ${className}`}
    >
      {(title || subtitle || actions) && (
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold tracking-wide text-slate-800 uppercase font-display">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-slate-450 mt-0.5 font-sans leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

export default SectionCard;

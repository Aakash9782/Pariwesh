import React from "react";

const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  loading = false,
  className = "",
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-display font-semibold uppercase tracking-widest transition-all duration-200 active:scale-[0.98] active:translate-y-[1px] rounded-btn focus:outline-none focus:ring-1 focus:ring-accent-gold disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-gradient-to-b from-slate-800 to-slate-950 text-white backdrop-blur-md border border-white/20 shadow-[0_4px_14px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.3)] hover:shadow-[0_6px_22px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.3)] hover:from-slate-750 hover:to-slate-900",
    secondary:
      "bg-gradient-to-b from-white to-slate-50/95 hover:from-white hover:to-white text-slate-800 backdrop-blur-md border border-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(0,0,0,0.04)] hover:border-[#c5a880]/50 hover:shadow-[0_6px_20px_rgba(197,168,128,0.22)]",
    gold:
      "bg-gradient-to-b from-[#d2b68e] to-[#a8865a] hover:from-[#dbbf97] hover:to-[#b39062] text-white border border-amber-200/40 shadow-[0_4px_18px_rgba(197,168,128,0.38),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(197,168,128,0.55),inset_0_1px_0_rgba(255,255,255,0.5)]",
    crimson:
      "bg-gradient-to-b from-[#9b2017] to-[#7a1810] hover:from-[#a8251b] hover:to-[#861c13] text-white border border-rose-300/30 shadow-[0_4px_14px_rgba(138,28,20,0.25),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_22px_rgba(138,28,20,0.4),inset_0_1px_0_rgba(255,255,255,0.35)]",
    outline:
      "bg-white/60 hover:bg-white/90 text-textPrimary backdrop-blur-sm border border-slate-200/80 hover:border-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]",
    glass:
      "bg-white/40 hover:bg-white/70 text-slate-800 backdrop-blur-md border border-white/60 shadow-[0_4px_14px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] hover:text-[#8a1c14] hover:shadow-[0_6px_20px_rgba(197,168,128,0.2)]",
    ghost:
      "bg-transparent text-textPrimary hover:bg-white/60 hover:backdrop-blur-sm hover:text-accent-gold",
    danger:
      "bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white backdrop-blur-md border border-white/20 shadow-[0_4px_14px_rgba(211,47,47,0.28),inset_0_1px_0_rgba(255,255,255,0.3)]",
  };

  const sizes = {
    sm: "text-[10px] px-4 py-2",
    md: "text-[11px] px-6 py-3",
    lg: "text-[12px] px-8 py-4.5",
    full: "text-[11px] px-6 py-3 w-full",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center space-x-2">
          <svg
            className="animate-spin h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="opacity-80">Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;

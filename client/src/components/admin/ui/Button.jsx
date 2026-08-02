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
  iconBefore,
  iconAfter,
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-display font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";

  const variants = {
    primary:
      "bg-[#c5a880] hover:bg-[#a88f65] text-white shadow-xs border border-transparent",
    secondary:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xxs",
    dark: "bg-slate-900 hover:bg-slate-800 text-white shadow-xs border border-transparent",
    outline:
      "bg-transparent hover:bg-slate-50 text-slate-700 border border-slate-200",
    danger:
      "bg-red-600 hover:bg-red-700 text-white shadow-xs border border-transparent",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs border border-transparent",
  };

  const sizes = {
    sm: "text-[10px] px-3.5 py-2",
    md: "text-[11px] px-5 py-2.5",
    lg: "text-[12px] px-7 py-3",
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
          <span className="opacity-80">Loading...</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          {iconBefore && <span className="text-sm">{iconBefore}</span>}
          {children}
          {iconAfter && <span className="text-sm">{iconAfter}</span>}
        </span>
      )}
    </button>
  );
};

export default Button;

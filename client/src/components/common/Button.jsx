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
    "inline-flex items-center justify-center font-display font-semibold uppercase tracking-widest transition-all duration-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent-gold disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-secondary text-primary hover:bg-primary hover:text-secondary border border-secondary shadow-sm hover:shadow-md",
    secondary:
      "bg-primary text-secondary hover:bg-secondary hover:text-primary border border-secondary",
    gold: "bg-accent-gold text-accent-contrast hover:bg-secondary hover:text-primary border border-accent-gold hover:border-secondary shadow-sm",
    outline:
      "bg-transparent text-textPrimary hover:bg-secondary hover:text-primary border border-borderLight hover:border-secondary",
    ghost:
      "bg-transparent text-textPrimary hover:bg-bgLight hover:text-accent-gold",
    danger:
      "bg-danger text-white hover:bg-primary hover:text-danger border border-danger shadow-sm",
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

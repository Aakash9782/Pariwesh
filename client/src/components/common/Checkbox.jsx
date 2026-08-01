import React from "react";

const Checkbox = ({
  label,
  checked,
  onChange,
  disabled = false,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <label className="inline-flex items-center space-x-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={`w-4 h-4 border border-borderLight rounded-[3px] flex items-center justify-center bg-primary text-secondary transition-all peer-checked:bg-secondary peer-checked:border-secondary peer-focus:ring-1 peer-focus:ring-accent-gold ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <svg
            className="w-2.5 h-2.5 fill-current text-primary opacity-0 peer-checked:opacity-100 transition-opacity"
            viewBox="0 0 20 20"
          >
            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
          </svg>
        </div>
        {label && (
          <span className="text-base md:text-xs text-textPrimary font-medium font-sans">
            {label}
          </span>
        )}
      </label>
      {error && (
        <span className="text-[10px] text-danger font-medium tracking-wide">
          {error.message || error}
        </span>
      )}
    </div>
  );
};

export default Checkbox;

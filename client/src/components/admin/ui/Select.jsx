import React from "react";

const Select = ({
  label,
  required = false,
  error,
  helperText,
  options = [],
  className = "",
  id,
  children,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-display"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        className={`w-full h-10 px-3 bg-white border rounded-lg text-xs text-slate-800 transition-all focus:outline-none focus:ring-1 ${
          error
            ? "border-red-300 focus:ring-red-400 focus:border-red-400"
            : "border-slate-200 focus:ring-[#c5a880] focus:border-[#c5a880]"
        } disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
        {...props}
      >
        {children
          ? children
          : options.map((opt, index) => (
              <option key={index} value={opt.value}>
                {opt.label}
              </option>
            ))}
      </select>
      {error ? (
        <p className="text-[10px] text-red-500 font-sans tracking-wide">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-400 font-sans tracking-wide">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default Select;

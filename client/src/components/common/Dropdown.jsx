import React from "react";

const Dropdown = ({
  label,
  options = [],
  value,
  onChange,
  required = false,
  error,
  placeholder,
  className = "",
  ...props
}) => {
  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label className="text-[10px] uppercase font-display font-semibold tracking-wider text-textSecondary flex items-center">
          <span>{label}</span>
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full bg-primary border ${
            error
              ? "border-danger"
              : "border-borderLight focus:border-accent-gold"
          } text-base md:text-xs px-4 py-3 rounded-input text-textPrimary focus:outline-none focus:ring-1 focus:ring-accent-gold transition-all appearance-none cursor-pointer`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-textSecondary">
          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
      {error && (
        <span className="text-[10px] text-danger font-medium tracking-wide">
          {error.message || error}
        </span>
      )}
    </div>
  );
};

export default Dropdown;

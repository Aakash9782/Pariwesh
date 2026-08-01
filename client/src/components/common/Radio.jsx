import React from "react";

const Radio = ({
  label,
  name,
  value,
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
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={`w-4 h-4 border border-borderLight rounded-full flex items-center justify-center bg-primary transition-all peer-checked:border-secondary peer-focus:ring-1 peer-focus:ring-accent-gold ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <div className="w-2 h-2 bg-secondary rounded-full transform scale-0 peer-checked:scale-100 transition-transform" />
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

export default Radio;

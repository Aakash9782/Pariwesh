import React from "react";

const Toggle = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <label
      className={`inline-flex items-center space-x-3 cursor-pointer select-none ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
        {...props}
      />
      <div
        className={`w-9 h-5 bg-borderLight rounded-full relative transition-all peer-checked:bg-accent-gold peer-focus:ring-1 peer-focus:ring-accent-gold ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-primary rounded-full transition-transform transform peer-checked:translate-x-4 shadow" />
      </div>
      {label && (
        <span className="text-base md:text-xs text-textPrimary font-medium font-sans">
          {label}
        </span>
      )}
    </label>
  );
};

export default Toggle;

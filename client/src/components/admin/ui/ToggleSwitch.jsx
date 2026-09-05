import React from "react";

/**
 * Enterprise Reusable ToggleSwitch Component
 * Supports both boolean (true/false) and string ("true"/"false") values.
 * Provides smooth animated slide transitions with royal gold branding.
 */
const ToggleSwitch = ({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
  id,
}) => {
  // Normalize value whether passed as boolean or string
  const isChecked =
    checked === true || checked === "true" || checked === 1 || checked === "1";

  const handleToggle = () => {
    if (disabled || !onChange) return;
    onChange(!isChecked);
  };

  const isSmall = size === "sm";

  return (
    <div className="flex items-center justify-between gap-4 select-none">
      {(label || description) && (
        <div className="space-y-0.5 text-left pr-2">
          {label && (
            <label
              htmlFor={id}
              onClick={handleToggle}
              className={`block text-xs font-bold text-slate-800 tracking-wide uppercase cursor-pointer ${
                disabled ? "opacity-50 cursor-not-allowed" : "hover:text-[#c5a880] transition-colors"
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-[11px] text-slate-500 leading-normal font-sans">
              {description}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleToggle}
        className={`relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-250 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a880] focus-visible:ring-offset-2 ${
          isSmall ? "h-5 w-9 p-0.5" : "h-6 w-11 p-0.5"
        } ${
          isChecked
            ? "bg-[#c5a880] shadow-[0_2px_8px_rgba(197,168,128,0.45)]"
            : "bg-slate-200 hover:bg-slate-300 shadow-inner"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none inline-block rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] ring-0 transition-transform duration-250 ease-in-out ${
            isSmall
              ? isChecked
                ? "h-4 w-4 translate-x-4"
                : "h-4 w-4 translate-x-0"
              : isChecked
              ? "h-5 w-5 translate-x-5"
              : "h-5 w-5 translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;

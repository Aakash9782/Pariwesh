import React from "react";

const Textarea = ({
  label,
  required = false,
  error,
  helperText,
  className = "",
  id,
  rows = 4,
  ...props
}) => {
  const textareaId =
    id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-display"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        className={`w-full px-3 py-2.5 bg-white border rounded-lg text-xs text-slate-800 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
          error
            ? "border-red-300 focus:ring-red-400 focus:border-red-400"
            : "border-slate-200 focus:ring-[#c5a880] focus:border-[#c5a880]"
        } disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
        {...props}
      />
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

export default Textarea;

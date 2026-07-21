import React from "react";

const Input = React.forwardRef(
  (
    {
      label,
      type = "text",
      name,
      error,
      helperText,
      className = "",
      required = false,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
        {label && (
          <label className="text-[10px] uppercase font-display font-semibold tracking-wider text-textSecondary flex items-center">
            <span>{label}</span>
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          name={name}
          ref={ref}
          required={required}
          className={`w-full bg-primary border ${
            error
              ? "border-danger"
              : "border-borderLight focus:border-accent-gold"
          } text-xs px-4 py-3 rounded-sm text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-1 focus:ring-accent-gold transition-all`}
          {...props}
        />
        {error && (
          <span className="text-[10px] text-danger font-medium tracking-wide">
            {error.message || error}
          </span>
        )}
        {!error && helperText && (
          <span className="text-[10px] text-textSecondary opacity-80">
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;

import React from "react";
import {
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiAlertLine,
  RiInformationLine,
} from "react-icons/ri";

const Alert = ({
  type = "info", // success, danger, warning, info
  title,
  message,
  className = "",
  onClose,
  ...props
}) => {
  const baseStyle =
    "p-4 rounded-card border font-sans text-xs flex items-start space-x-3 transition-colors duration-300";

  const styles = {
    success: {
      box: "bg-green-500/5 border-green-500/20 text-green-700",
      icon: (
        <RiCheckboxCircleLine
          size={18}
          className="text-green-600 shrink-0 mt-0.5"
        />
      ),
    },
    danger: {
      box: "bg-danger/5 border-danger/20 text-danger",
      icon: (
        <RiErrorWarningLine size={18} className="text-danger shrink-0 mt-0.5" />
      ),
    },
    warning: {
      box: "bg-warning/5 border-warning/20 text-warning",
      icon: <RiAlertLine size={18} className="text-warning shrink-0 mt-0.5" />,
    },
    info: {
      box: "bg-primary border-borderLight text-textPrimary",
      icon: (
        <RiInformationLine
          size={18}
          className="text-accent-gold shrink-0 mt-0.5"
        />
      ),
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div className={`${baseStyle} ${current.box} ${className}`} {...props}>
      {current.icon}
      <div className="flex-grow space-y-0.5">
        {title && (
          <h5 className="font-bold tracking-wide uppercase text-[10px]">
            {title}
          </h5>
        )}
        {message && (
          <p className="text-textSecondary leading-relaxed">{message}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-textSecondary hover:text-textPrimary transition-colors focus:outline-none"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert;

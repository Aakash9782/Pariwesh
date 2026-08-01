import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiInformationFill,
  RiCloseLine,
} from "react-icons/ri";

const Toast = ({
  isOpen,
  message,
  type = "success", // success, error, info
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (isOpen && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const styles = {
    success: {
      box: "bg-secondary text-primary border border-accent-gold/20 shadow-2xl",
      icon: <RiCheckboxCircleFill className="text-accent-gold" size={18} />,
    },
    error: {
      box: "bg-danger text-white shadow-2xl",
      icon: <RiErrorWarningFill className="text-white" size={18} />,
    },
    info: {
      box: "bg-primary text-textPrimary border border-borderLight shadow-2xl",
      icon: <RiInformationFill className="text-accent-gold" size={18} />,
    },
  };

  const current = styles[type] || styles.success;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-6 right-6 z-[200] max-w-sm rounded-card p-4 flex items-center space-x-3 text-xs md:text-sm font-sans font-medium ${current.box}`}
        >
          {current.icon}
          <div className="flex-grow">{message}</div>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-accent-gold transition-colors focus:outline-none ml-2"
          >
            <RiCloseLine size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;

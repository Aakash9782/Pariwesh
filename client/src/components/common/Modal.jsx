import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCloseLine } from "react-icons/ri";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md", // sm, md, lg, xl, drawer
}) => {
  // Prevent page scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const sizes = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
    drawer: "max-w-md ml-auto mr-0 h-full rounded-r-none",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop wrapper */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={
              size === "drawer" ? { x: "100%" } : { opacity: 0, scale: 0.95 }
            }
            animate={size === "drawer" ? { x: 0 } : { opacity: 1, scale: 1 }}
            exit={
              size === "drawer" ? { x: "100%" } : { opacity: 0, scale: 0.95 }
            }
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className={`relative w-full ${sizes[size]} bg-primary shadow-2xl rounded-sm overflow-hidden z-10 flex flex-col ${
              size === "drawer"
                ? "h-full fixed right-0 top-0 bottom-0"
                : "max-h-[90vh]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-borderLight bg-primary">
              {title && (
                <h3 className="text-base font-display font-bold uppercase tracking-wider text-textPrimary">
                  {title}
                </h3>
              )}
              <button
                onClick={onClose}
                className="text-textSecondary hover:text-accent-gold p-1.5 focus:outline-none transition-colors ml-auto"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

            {/* Scrollable Contents */}
            <div className="flex-grow overflow-y-auto p-6 bg-bgLight">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;

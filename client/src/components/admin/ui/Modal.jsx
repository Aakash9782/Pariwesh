import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCloseLine } from "react-icons/ri";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = "",
  size = "md", // sm, md, lg, xl
}) => {
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
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Tint Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/45 backdrop-blur-sm"
          />

          {/* Modal Content Drawer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", duration: 0.35 }}
            className={`bg-white border border-slate-200 rounded-lg shadow-xl w-full relative z-10 flex flex-col max-h-[85vh] ${
              sizes[size] || sizes.md
            } ${className}`}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              {title ? (
                <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-800 font-display">
                  {title}
                </h3>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <RiCloseLine className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-600 font-sans leading-relaxed">
              {children}
            </div>

            {/* Modal Footer */}
            {footer && (
              <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50 rounded-b-lg">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;

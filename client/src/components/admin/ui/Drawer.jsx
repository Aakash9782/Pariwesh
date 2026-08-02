import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCloseLine } from "react-icons/ri";

const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = "",
  size = "md", // sm, md, lg
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
    sm: "w-80",
    md: "w-full max-w-md",
    lg: "w-full max-w-xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex justify-end">
          {/* Overlay Screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm"
          />

          {/* Drawer Box */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className={`bg-white border-l border-slate-200 h-full relative z-10 flex flex-col shadow-2xl ${
              sizes[size] || sizes.md
            } ${className}`}
          >
            {/* Drawer Header */}
            <div className="h-16 border-b border-slate-200 px-5 flex items-center justify-between shrink-0">
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

            {/* Drawer Body content */}
            <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-600 font-sans leading-relaxed">
              {children}
            </div>

            {/* Drawer Footer Actions */}
            {footer && (
              <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Drawer;

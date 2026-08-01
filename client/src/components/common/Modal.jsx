import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCloseLine } from "react-icons/ri";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md", // sm, md, lg, xl, drawer
}) => {
  const modalRef = useRef(null);

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

  // Focus trap & Escape closing key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusableContent = modal.querySelectorAll(focusableElements);
      if (focusableContent.length === 0) return;

      const firstFocusable = focusableContent[0];
      const lastFocusable = focusableContent[focusableContent.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    const timer = setTimeout(() => {
      const modal = modalRef.current;
      if (modal) {
        const focusableElements =
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const firstFocus = modal.querySelector(focusableElements);
        if (firstFocus) {
          firstFocus.focus();
        }
      }
    }, 100);

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

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
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4">
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
            ref={modalRef}
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

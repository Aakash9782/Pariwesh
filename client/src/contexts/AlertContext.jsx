import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCheckboxCircleLine,
  RiQuestionLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiAlertLine,
  RiInformationLine,
} from "react-icons/ri";

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [config, setConfig] = useState({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
  });

  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showAlert = (message, title = "Notification") => {
    return new Promise((resolve) => {
      setConfig({
        isOpen: true,
        type: "alert",
        title,
        message,
        onConfirm: () => {
          setConfig((prev) => ({ ...prev, isOpen: false }));
          resolve();
        },
        onCancel: null,
      });
    });
  };

  const showConfirm = (message, title = "Confirm Decision") => {
    return new Promise((resolve) => {
      setConfig({
        isOpen: true,
        type: "confirm",
        title,
        message,
        onConfirm: () => {
          setConfig((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfig((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  };

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    warning: (msg) => addToast(msg, "warning"),
    info: (msg) => addToast(msg, "info"),
  };

  // Toast Styling mappings
  const toastStyles = {
    success: {
      bg: "bg-white",
      border: "border-emerald-200",
      text: "text-emerald-800",
      iconColor: "text-emerald-500",
      icon: <RiCheckboxCircleLine className="w-5 h-5" />,
    },
    error: {
      bg: "bg-white",
      border: "border-red-200",
      text: "text-red-800",
      iconColor: "text-red-500",
      icon: <RiErrorWarningLine className="w-5 h-5" />,
    },
    warning: {
      bg: "bg-white",
      border: "border-amber-200",
      text: "text-amber-800",
      iconColor: "text-amber-500",
      icon: <RiAlertLine className="w-5 h-5" />,
    },
    info: {
      bg: "bg-white",
      border: "border-blue-200",
      text: "text-blue-800",
      iconColor: "text-blue-500",
      icon: <RiInformationLine className="w-5 h-5" />,
    },
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showConfirm,
        alert: showAlert, // Fallback alias
        confirm: showConfirm, // Fallback alias
        toast,
      }}
    >
      {children}

      {/* 1. Modal Alert/Confirm Dialog Box */}
      <AnimatePresence>
        {config.isOpen && (
          <div className="fixed inset-0 z-[99999] overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (config.type === "alert") {
                  config.onConfirm();
                } else if (config.onCancel) {
                  config.onCancel();
                }
              }}
              className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-sm bg-white border border-slate-200 p-6 rounded-lg shadow-xl z-10 text-center space-y-5 text-slate-800"
            >
              <div className="absolute top-0 left-0 w-full h-[4px] bg-[#c5a880]"></div>

              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center text-[#c5a880] bg-[#c5a880]/10">
                {config.type === "confirm" ? (
                  <RiQuestionLine size={24} />
                ) : (
                  <RiCheckboxCircleLine size={24} />
                )}
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-display font-semibold uppercase tracking-wider text-slate-900">
                  {config.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {config.message}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                {config.type === "confirm" ? (
                  <>
                    <button
                      type="button"
                      onClick={config.onCancel}
                      className="flex-1 px-4 py-2 border border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-all rounded-md bg-white outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={config.onConfirm}
                      className="flex-1 px-4 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-slate-800 transition-all rounded-md outline-none"
                    >
                      Confirm
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={config.onConfirm}
                    className="w-full px-4 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-slate-800 transition-all rounded-md outline-none"
                  >
                    Okay
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Sliding Toast Alerts Container */}
      <div className="fixed top-5 right-5 z-[999999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const style = toastStyles[t.type] || toastStyles.success;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border ${style.bg} ${style.border} pointer-events-auto`}
              >
                <span className={`mt-0.5 ${style.iconColor}`}>
                  {style.icon}
                </span>
                <div className="flex-1">
                  <p className={`text-xs font-medium ${style.text}`}>
                    {t.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-slate-600 transition-colors mt-0.5 focus:outline-none"
                >
                  <RiCloseLine className="w-4.5 h-4.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </AlertContext.Provider>
  );
};

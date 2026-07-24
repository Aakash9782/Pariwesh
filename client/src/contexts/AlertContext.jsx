import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCheckboxCircleLine, RiQuestionLine } from "react-icons/ri";

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

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <AnimatePresence>
        {config.isOpen && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
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
              className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm"
            />

            {/* Centered Premium Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-xs sm:max-w-sm bg-primary border border-borderLight p-6 rounded-sm shadow-2xl z-10 text-center space-y-5 text-textPrimary"
            >
              {/* Accent Color Band */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-accent-gold"></div>

              {/* Centered Icon wrapper */}
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center text-accent-gold bg-accent-gold/10">
                {config.type === "confirm" ? (
                  <RiQuestionLine size={24} />
                ) : (
                  <RiCheckboxCircleLine size={24} />
                )}
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary">
                  {config.title}
                </h3>
                <p className="text-[11px] text-textSecondary leading-relaxed">
                  {config.message}
                </p>
              </div>

              {/* Buttons Actions */}
              <div className="flex items-center justify-center gap-3 pt-2">
                {config.type === "confirm" ? (
                  <>
                    <button
                      type="button"
                      onClick={config.onCancel}
                      className="flex-1 px-4 py-2 border border-borderLight text-[10px] font-bold uppercase tracking-wider text-textSecondary hover:bg-bgLight transition-all rounded-sm bg-primary outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={config.onConfirm}
                      className="flex-1 px-4 py-2 bg-secondary text-primary text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all rounded-sm outline-none"
                    >
                      Confirm
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={config.onConfirm}
                    className="w-full px-4 py-2 bg-secondary text-primary text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all rounded-sm outline-none"
                  >
                    Okay
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

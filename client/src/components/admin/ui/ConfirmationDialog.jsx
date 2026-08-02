import React from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import { RiAlertLine } from "react-icons/ri";

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action is permanent and cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger", // danger, primary
  loading = false,
}) => {
  const footerEl = (
    <>
      <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
        {cancelText}
      </Button>
      <Button
        variant={variant === "danger" ? "danger" : "dark"}
        size="sm"
        onClick={onConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footerEl}
      size="sm"
    >
      <div className="flex gap-4 items-start pt-2">
        <div
          className={`p-2 rounded-full shrink-0 ${
            variant === "danger"
              ? "bg-red-50 text-red-600"
              : "bg-[#c5a880]/10 text-[#c5a880]"
          }`}
        >
          <RiAlertLine className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-sans leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;

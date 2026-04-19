"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiX } from "react-icons/fi";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  variant?: "danger" | "default";
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
  loading = false,
  variant = "default",
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-sm rounded-2xl border border-white/8 bg-[#111]/95 p-6 shadow-2xl backdrop-blur-xl"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-lg p-1 text-white/40 transition hover:text-white"
            >
              <FiX className="h-5 w-5" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              {variant === "danger" && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                  <FiAlertTriangle className="h-5 w-5 text-red-400" />
                </div>
              )}
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>

            <p className="mb-6 text-sm text-white/50">{message}</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  variant === "danger"
                    ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    : "bg-linear-to-r from-brand-pink to-brand-rose text-black hover:opacity-90"
                }`}
              >
                {loading ? "Please wait..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

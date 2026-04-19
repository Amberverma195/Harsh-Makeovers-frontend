"use client";

import { motion } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";

interface ToastProps {
  message: string;
  variant: "success" | "error";
  onDismiss: () => void;
}

export default function Toast({ message, variant, onDismiss }: ToastProps) {
  const isSuccess = variant === "success";

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-xl ${
        isSuccess
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/20 bg-red-500/10 text-red-300"
      }`}
    >
      {isSuccess ? (
        <FiCheckCircle className="h-5 w-5 shrink-0" />
      ) : (
        <FiAlertCircle className="h-5 w-5 shrink-0" />
      )}
      <span className="max-w-xs">{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 shrink-0 rounded p-0.5 transition hover:opacity-70"
      >
        <FiX className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

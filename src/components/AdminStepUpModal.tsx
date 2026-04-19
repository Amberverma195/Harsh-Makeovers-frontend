"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiLock, FiShield, FiX } from "react-icons/fi";

interface AdminStepUpModalProps {
  isOpen: boolean;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
  errorMessage?: string;
}

export default function AdminStepUpModal({
  isOpen,
  password,
  onPasswordChange,
  onSubmit,
  onClose,
  loading = false,
  errorMessage,
}: AdminStepUpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget && !loading) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-2xl border border-white/8 bg-[#111]/95 p-6 shadow-2xl backdrop-blur-xl"
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="absolute right-3 top-3 rounded-lg p-1 text-white/35 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiX className="h-5 w-5" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-pink/20 bg-brand-pink/10">
                <FiShield className="h-5 w-5 text-brand-pink" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Confirm Sensitive Action</h3>
                <p className="text-sm text-white/45">
                  Re-enter your password to continue.
                </p>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void onSubmit();
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/40">
                  Admin Password
                </label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-black/25 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:border-brand-pink/50 focus:outline-none"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {errorMessage && (
                <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {errorMessage}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-linear-to-r from-brand-pink to-brand-rose px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Confirming..." : "Confirm Password"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

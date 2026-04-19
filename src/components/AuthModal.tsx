"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";
import type { ApiError } from "@/types";
import { formatPhoneInput, sanitizePhoneInput } from "@/lib/phone";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "One special character",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

type Tab = "login" | "register";

export default function AuthModal() {
  const { isOpen, closeAuthModal, onSuccessRef } = useAuthModal();
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>("login");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    { field: string; message: string }[]
  >([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setError("");
    setFieldErrors([]);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    resetForm();
  };

  const handleSuccess = () => {
    const cb = onSuccessRef.current;
    closeAuthModal();
    resetForm();
    showToast("Signed in successfully");
    if (cb) setTimeout(cb, 100);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      handleSuccess();
    } catch (err) {
      setError((err as ApiError).error || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors([]);
    if (!name || !email || !password || !phone) {
      setError("Please fill in all required fields");
      return;
    }
    const failed = PASSWORD_RULES.filter((r) => !r.test(password));
    if (failed.length > 0) {
      setError("Password doesn't meet the requirements");
      return;
    }
    setSubmitting(true);
    try {
      await register({ name, email, password, phone });
      handleSuccess();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.details) setFieldErrors(apiErr.details);
      setError(apiErr.error || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getFieldError = (field: string) =>
    fieldErrors.find((e) => e.field === field)?.message;

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20";

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
            if (e.target === e.currentTarget) closeAuthModal();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-md rounded-2xl border border-white/8 bg-[#111]/95 p-8 shadow-2xl backdrop-blur-xl"
          >
            <button
              onClick={closeAuthModal}
              className="absolute right-4 top-4 rounded-lg p-1 text-white/40 transition hover:text-white"
            >
              <FiX className="h-5 w-5" />
            </button>

            <div className="mb-6 flex gap-1 rounded-lg border border-white/8 bg-white/3 p-1">
              {(["login", "register"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                    tab === t
                      ? "bg-white/8 text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {t === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-white/60">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-white/60">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={inputClass}
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-linear-to-r from-brand-pink to-brand-rose py-2.5 text-sm font-semibold text-black transition hover:scale-[1.03] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submitting ? "Signing in..." : "Sign In"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-white/60">
                    Full Name <span className="text-brand-pink">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className={inputClass}
                  />
                  {getFieldError("name") && (
                    <p className="mt-1 text-xs text-red-400">
                      {getFieldError("name")}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-white/60">
                    Email <span className="text-brand-pink">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                  {getFieldError("email") && (
                    <p className="mt-1 text-xs text-red-400">
                      {getFieldError("email")}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-white/60">
                    Phone <span className="text-brand-pink">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={formatPhoneInput(phone)}
                    onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                    placeholder="(123)-456-7890"
                    maxLength={14}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-white/60">
                    Password <span className="text-brand-pink">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className={inputClass}
                    autoComplete="new-password"
                  />
                  {getFieldError("password") && (
                    <p className="mt-1 text-xs text-red-400">
                      {getFieldError("password")}
                    </p>
                  )}
                  {password.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {PASSWORD_RULES.map((rule) => {
                        const passed = rule.test(password);
                        return (
                          <li
                            key={rule.label}
                            className={`flex items-center gap-2 text-xs transition ${
                              passed ? "text-emerald-400" : "text-white/25"
                            }`}
                          >
                            <span className="text-[10px]">
                              {passed ? "●" : "○"}
                            </span>
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-linear-to-r from-brand-pink to-brand-rose py-2.5 text-sm font-semibold text-black transition hover:scale-[1.03] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submitting ? "Creating account..." : "Create Account"}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


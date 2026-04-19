"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/types";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import Spinner from "@/components/Spinner";
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

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, isLoading } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    { field: string; message: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace("/");
  }, [isLoading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors([]);

    if (!name || !email || !password || !phone) {
      setError("Please fill in all required fields");
      return;
    }

    const failedRules = PASSWORD_RULES.filter((r) => !r.test(password));
    if (failedRules.length > 0) {
      setError("Password doesn't meet the requirements below");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        phone,
      });
      showToast("Account created successfully!");
      router.push("/");
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.details) {
        setFieldErrors(apiErr.details);
      }
      setError(apiErr.error || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getFieldError = (field: string) =>
    fieldErrors.find((e) => e.field === field)?.message;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) return null;

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20";

  return (
    <PageTransition>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-white/8 bg-white/4 p-8 backdrop-blur-xl">
            <h1 className="mb-1 text-2xl font-bold">Create an account</h1>
            <p className="mb-6 text-sm text-white/40">
              Join Harsh Makeovers to book appointments
            </p>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-white/60"
                >
                  Full Name <span className="text-brand-pink">*</span>
                </label>
                <input
                  id="name"
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
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-white/60"
                >
                  Email <span className="text-brand-pink">*</span>
                </label>
                <input
                  id="email"
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
                <label
                  htmlFor="phone"
                  className="mb-1 block text-sm font-medium text-white/60"
                >
                  Phone <span className="text-brand-pink">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={formatPhoneInput(phone)}
                  onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                  placeholder="(123)-456-7890"
                  maxLength={14}
                  className={inputClass}
                />
                {getFieldError("phone") && (
                  <p className="mt-1 text-xs text-red-400">
                    {getFieldError("phone")}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-white/60"
                >
                  Password <span className="text-brand-pink">*</span>
                </label>
                <input
                  id="password"
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
                  <ul className="mt-3 space-y-1.5">
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

            <p className="mt-6 text-center text-sm text-white/40">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-brand-pink transition hover:text-brand-rose"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}


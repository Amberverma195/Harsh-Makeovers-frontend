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

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace("/");
  }, [isLoading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      showToast("Welcome back!");
      router.push("/");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.error || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-white/8 bg-white/4 p-8 backdrop-blur-xl">
            <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>
            <p className="mb-6 text-sm text-white/40">
              Sign in to your Harsh Makeovers account
            </p>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-white/60"
                >
                  Email
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
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-white/60"
                >
                  Password
                </label>
                <input
                  id="password"
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

            <p className="mt-6 text-center text-sm text-white/40">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-brand-pink transition hover:text-brand-rose"
              >
                Register
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}

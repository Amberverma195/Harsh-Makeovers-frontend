"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import ClassesHighlightsWheel from "@/components/ClassesHighlightsWheel";
import PageTransition from "@/components/PageTransition";
import LuxuryHeroSubtitle from "@/components/LuxuryHeroSubtitle";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";
import type { ApiError } from "@/types";
import { FiCheck, FiSend } from "react-icons/fi";

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const CLASS_CATEGORIES = [
  "Bridal Makeup",
  "Party Makeup",
  "Hair Styling",
  "Self Makeup",
  "Professional Techniques",
  "Lash Application",
  "Complete Course",
];

const highlights = [
  {
    title: "Hands-on Training",
    desc: "Learn by doing with real models and professional-grade products.",
  },
  {
    title: "Professional Techniques",
    desc: "Master industry-standard methods used by top makeup artists.",
  },
  {
    title: "Small Groups",
    desc: "Personalized attention with limited class sizes for maximum learning.",
  },
  {
    title: "Certificate",
    desc: "Receive a certificate of completion to build your professional portfolio.",
  },
];

export default function ClassesPage() {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { showToast } = useToast();

  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submitInquiry = async () => {
    setError("");
    setSubmitting(true);
    try {
      await api.post("/inquiries/class", {
        inquiryType: "CLASS",
        category,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(true);
      showToast("Class inquiry submitted!");
    } catch (err) {
      setError((err as ApiError).error || "Failed to submit inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!category || !subject.trim() || !message.trim()) {
      setError("Please fill all required fields");
      return;
    }

    if (message.trim().length < 10) {
      setError("Message must be at least 10 characters");
      return;
    }

    if (!user) {
      openAuthModal(() => {
        void submitInquiry();
      });
      return;
    }

    void submitInquiry();
  };

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20";

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,165,116,0.08)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-brand-gold"
          >
            Learn With Harsh
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="text-4xl font-bold sm:text-5xl"
          >
            Makeup Classes & Workshops
          </motion.h1>
          <LuxuryHeroSubtitle delay={0.2}>
            Master professional makeup techniques with personalized training
            from Harsh Makeovers.
          </LuxuryHeroSubtitle>
        </div>
      </section>

      <ClassesHighlightsWheel items={highlights} />

      {/* Inquiry Form */}
      <section className="mx-auto max-w-2xl px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm sm:p-8"
        >
          {success ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                <FiCheck className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold">Inquiry Submitted!</h2>
              <p className="mt-2 text-sm text-white/50">
                We&apos;ll reach out with class details and availability soon.
              </p>
              <button
                onClick={() => {
                  setSuccess(false);
                  setCategory("");
                  setSubject("");
                  setMessage("");
                }}
                className="mt-6 text-sm text-brand-pink hover:underline"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-xl font-semibold">
                Interested in a class?
              </h2>
              <p className="mb-6 text-sm text-white/40">
                Fill out the form and we&apos;ll get back to you with
                availability and details.
              </p>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-white/60">
                    Class Category <span className="text-brand-pink">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setError("");
                    }}
                    className={`${inputClass} ${!category ? "text-white/25" : ""}`}
                  >
                    <option value="">Select a category</option>
                    {CLASS_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-white/60">
                    Subject <span className="text-brand-pink">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setError("");
                    }}
                    placeholder="e.g., Weekend bridal class for 5"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-white/60">
                    Message <span className="text-brand-pink">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setError("");
                    }}
                    placeholder="Tell us about your learning goals, preferred dates, and experience level (min 10 characters)"
                    rows={5}
                    maxLength={2000}
                    className={inputClass}
                  />
                  <p className="mt-1 text-right text-xs text-white/25">
                    {message.length}/2000
                  </p>
                </div>

                {!user && (
                  <p className="text-xs text-white/30">
                    You&apos;ll be asked to sign in before submitting.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-brand-gold to-brand-rose py-2.5 text-sm font-semibold text-black transition hover:scale-[1.03] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  <FiSend className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Inquiry"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </section>
    </PageTransition>
  );
}

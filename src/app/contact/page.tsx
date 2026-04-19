"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import LuxuryHeroSubtitle from "@/components/LuxuryHeroSubtitle";
import { api } from "@/lib/api";
import { formatPhoneDisplay } from "@/lib/phone";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";
import type { ApiError } from "@/types";
import {
  FiMail,
  FiPhone,
  FiInstagram,
  FiSend,
  FiCheck,
} from "react-icons/fi";

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const CATEGORIES = [
  "General Inquiry",
  "Bridal",
  "Non-Bridal",
  "Party",
  "Hair",
  "Lashes",
  "Pricing",
  "Availability",
  "Other",
];

const contactInfo = [
  {
    Icon: FiMail,
    label: "Email",
    value: "harshgodara367@gmail.com",
    href: "mailto:harshgodara367@gmail.com",
  },
  {
    Icon: FiPhone,
    label: "Phone",
    value: "+1 672-855-3363",
    href: "tel:+16728553363",
  },
  {
    Icon: FiInstagram,
    label: "Instagram",
    value: "@harsh_makeovers_",
    href: "https://www.instagram.com/harsh_makeovers_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  },
];

export default function ContactPage() {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { showToast } = useToast();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submitInquiry = async () => {
    setError("");
    setSubmitting(true);
    try {
      await api.post("/inquiries/contact", {
        inquiryType: "CONTACT",
        subject: subject.trim(),
        category,
        message: message.trim(),
      });
      setSuccess(true);
      showToast("Message sent successfully!");
    } catch (err) {
      setError((err as ApiError).error || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!subject.trim() || !category || !message.trim()) {
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
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,168,201,0.06)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="text-4xl font-bold sm:text-5xl"
          >
            Contact Us
          </motion.h1>
          <LuxuryHeroSubtitle>
            Have a question or want to discuss your event? We&apos;d love to
            hear from you.
          </LuxuryHeroSubtitle>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Contact Info */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="space-y-5"
            >
              {contactInfo.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    item.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/3 p-4 transition hover:border-brand-pink/20 hover:bg-white/6"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-brand-pink">
                    <item.Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40">{item.label}</p>
                    <p className="text-sm font-medium text-white/80">
                      {item.label === "Phone"
                        ? formatPhoneDisplay(item.value)
                        : item.value}
                    </p>
                  </div>
                </a>
              ))}

              <a
                href="https://www.tiktok.com/@harsh_makeovers_?_r=1&_t=ZS-94cHX6x9inV"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/3 p-4 transition hover:border-brand-pink/20 hover:bg-white/6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-brand-pink">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.81a8.28 8.28 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.22z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-white/40">TikTok</p>
                  <p className="text-sm font-medium text-white/80">
                    @harsh_makeovers_
                  </p>
                </div>
              </a>
            </motion.div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease }}
              className="rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm sm:p-8"
            >
              {success ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                    <FiCheck className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold">Message Sent!</h2>
                  <p className="mt-2 text-sm text-white/50">
                    We&apos;ll get back to you as soon as possible.
                  </p>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setSubject("");
                      setCategory("");
                      setMessage("");
                    }}
                    className="mt-6 text-sm text-brand-pink hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="mb-6 text-xl font-semibold">
                    Send us a message
                  </h2>

                  {error && (
                    <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
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
                        placeholder="Brief subject of your message"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-white/60">
                        Category <span className="text-brand-pink">*</span>
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
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
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
                        placeholder="Tell us what you need help with (min 10 characters)"
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
                        You&apos;ll be asked to sign in before sending.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-brand-pink to-brand-rose py-2.5 text-sm font-semibold text-black transition hover:scale-[1.03] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <FiSend className="h-4 w-4" />
                      {submitting ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

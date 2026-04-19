"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiStar } from "react-icons/fi";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import type { ApiError } from "@/types";

interface ReviewModalProps {
  bookingId: string;
  serviceName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({
  bookingId,
  serviceName,
  isOpen,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.post("/reviews", {
        bookingId,
        rating,
        reviewText: reviewText || undefined,
      });
      showToast("Review submitted for approval");
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as ApiError).error || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

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
            className="relative w-full max-w-md rounded-2xl border border-white/8 bg-[#111]/95 p-8 shadow-2xl backdrop-blur-xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-white/40 transition hover:text-white"
            >
              <FiX className="h-5 w-5" />
            </button>

            <h2 className="mb-1 text-xl font-bold">Write a Review</h2>
            <p className="mb-6 text-sm text-white/40">
              Share your experience with{" "}
              <span className="text-white/60">{serviceName}</span>
            </p>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/60">
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition"
                    >
                      <FiStar
                        className={`h-7 w-7 transition ${
                          star <= (hoverRating || rating)
                            ? "fill-brand-gold text-brand-gold"
                            : "text-white/15"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/60">
                  Your Review{" "}
                  <span className="font-normal text-white/25">(optional)</span>
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us about your experience..."
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20"
                />
                <p className="mt-1 text-right text-xs text-white/25">
                  {reviewText.length}/1000
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="w-full rounded-lg bg-linear-to-r from-brand-pink to-brand-rose py-2.5 text-sm font-semibold text-black transition hover:scale-[1.03] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

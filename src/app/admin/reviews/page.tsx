"use client";

import { useState, useEffect, useCallback } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import type { AdminReview, PaginatedResponse, ReviewStatus } from "@/types";
import { CATEGORY_LABELS } from "@/lib/utils";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiEyeOff,
  FiStar,
  FiTrash2,
} from "react-icons/fi";

const STATUS_COLORS: Record<ReviewStatus, string> = {
  PENDING: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  APPROVED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-300",
};

type ReviewAction = "approve" | "hide" | "delete";

const ACTION_CONFIG: Record<
  ReviewAction,
  {
    title: string;
    message: string;
    confirmLabel: string;
    successMessage: string;
    variant?: "danger" | "default";
  }
> = {
  approve: {
    title: "Approve Review",
    message: "This review will be visible on the public website.",
    confirmLabel: "Approve",
    successMessage: "Review approved",
  },
  hide: {
    title: "Hide Review",
    message: "This review will be hidden from the public website but kept in the admin system.",
    confirmLabel: "Hide",
    successMessage: "Review hidden",
    variant: "danger",
  },
  delete: {
    title: "Delete Review",
    message: "This will permanently delete the review from the system. This action cannot be undone.",
    confirmLabel: "Delete",
    successMessage: "Review deleted",
    variant: "danger",
  },
};

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <FiStar
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= count ? "fill-brand-pink text-brand-pink" : "text-white/20"
          }`}
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionModal, setActionModal] = useState<{
    type: ReviewAction;
    reviewId: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedResponse<AdminReview>>(
        `/admin/reviews?page=${page}&limit=20`
      );
      setReviews(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Failed to load reviews"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleAction = async () => {
    if (!actionModal) return;

    setActionLoading(true);
    const { type, reviewId } = actionModal;

    try {
      if (type === "delete") {
        await api.delete(`/admin/reviews/${reviewId}`);
      } else {
        await api.patch(`/admin/reviews/${reviewId}/${type}`);
      }
      showToast(ACTION_CONFIG[type].successMessage);
      setActionModal(null);
      await fetchReviews();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Action failed"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const modalConfig = actionModal ? ACTION_CONFIG[actionModal.type] : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Reviews</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Reviews will appear here when clients submit them."
        />
      ) : (
        <>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {reviews.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-white/8 bg-white/3 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{r.user.name}</h3>
                        <Stars count={r.rating} />
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[r.status]
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-white/30">{r.user.email}</p>
                      <p className="mt-1 text-sm text-white/50">
                        {r.booking.service.name} ({CATEGORY_LABELS[r.booking.service.category]})
                      </p>
                      {r.reviewText && (
                        <p className="mt-2 rounded-lg bg-white/3 p-3 text-sm text-white/60">
                          &ldquo;{r.reviewText}&rdquo;
                        </p>
                      )}
                      <p className="mt-2 text-xs text-white/20">
                        {new Date(r.reviewedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      {r.status !== "APPROVED" && (
                        <button
                          onClick={() =>
                            setActionModal({ type: "approve", reviewId: r.id })
                          }
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25"
                        >
                          <FiCheck className="h-3.5 w-3.5" />
                          {r.status === "REJECTED" ? "Show" : "Approve"}
                        </button>
                      )}

                      {r.status !== "REJECTED" && (
                        <button
                          onClick={() => setActionModal({ type: "hide", reviewId: r.id })}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-500/25"
                        >
                          <FiEyeOff className="h-3.5 w-3.5" /> Hide
                        </button>
                      )}

                      <button
                        onClick={() => setActionModal({ type: "delete", reviewId: r.id })}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/25"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:text-white disabled:opacity-30"
              >
                <FiChevronLeft />
              </button>
              <span className="text-sm text-white/40">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:text-white disabled:opacity-30"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {modalConfig && (
        <ConfirmModal
          isOpen
          title={modalConfig.title}
          message={modalConfig.message}
          confirmLabel={modalConfig.confirmLabel}
          onConfirm={handleAction}
          onClose={() => setActionModal(null)}
          loading={actionLoading}
          variant={modalConfig.variant}
        />
      )}
    </div>
  );
}

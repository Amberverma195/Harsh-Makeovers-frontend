"use client";

import AdminStepUpModal from "@/components/AdminStepUpModal";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/context/ToastContext";
import { useAdminStepUp } from "@/hooks/useAdminStepUp";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  CATEGORY_LABELS,
  STATUS_COLORS,
  formatDate,
  formatDateTime,
  formatTime,
} from "@/lib/utils";
import type {
  AdminUserSearchResult,
  AdminUserSearchReview,
  ReviewStatus,
} from "@/types";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  FiCheck,
  FiClock,
  FiExternalLink,
  FiEyeOff,
  FiMail,
  FiPhone,
  FiSearch,
  FiShield,
  FiStar,
  FiTrash2,
  FiUser,
} from "react-icons/fi";

const REVIEW_STATUS_COLORS: Record<ReviewStatus, string> = {
  PENDING: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  APPROVED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-300",
};

type HistoryFilter = "all" | "bookings" | "inquiries" | "reviews";
type ReviewAction = "approve" | "hide" | "delete";

type ReviewActionResponse = {
  message: string;
  review: {
    id: string;
    status: ReviewStatus;
    moderatedAt?: string | null;
  };
};

const REVIEW_ACTION_CONFIG: Record<
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
    message: "This review will be hidden from the public website but kept in the user's history.",
    confirmLabel: "Hide",
    successMessage: "Review hidden",
    variant: "danger",
  },
  delete: {
    title: "Delete Review",
    message: "This will permanently delete the review. This action cannot be undone.",
    confirmLabel: "Delete",
    successMessage: "Review deleted",
    variant: "danger",
  },
};

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <FiStar
          key={value}
          className={`h-3.5 w-3.5 ${
            value <= count ? "fill-brand-pink text-brand-pink" : "text-white/20"
          }`}
        />
      ))}
    </span>
  );
}

function updateReviewHistory(
  reviews: AdminUserSearchReview[],
  reviewId: string,
  changes: Partial<AdminUserSearchReview>
) {
  return reviews.map((review) =>
    review.id === reviewId
      ? {
          ...review,
          ...changes,
        }
      : review
  );
}

export default function AdminUserSearchPage() {
  const { showToast } = useToast();
  const { runWithStepUp, modalProps } = useAdminStepUp();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<AdminUserSearchResult | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [actionModal, setActionModal] = useState<{
    type: ReviewAction;
    reviewId: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = query.trim();
    setSearched(true);

    if (!trimmedQuery) {
      setError("Enter an email or phone number to search.");
      setUser(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await api.get<AdminUserSearchResult>(
        `/admin/users/search?q=${encodeURIComponent(trimmedQuery)}`
      );
      setUser(result);
      setHistoryFilter("all");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "User not found"));
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async () => {
    if (!actionModal) return;

    setActionLoading(true);
    const { type, reviewId } = actionModal;

    if (type === "delete") {
      await runWithStepUp(async () => {
        await api.delete(`/admin/reviews/${reviewId}`);
        setUser((current) =>
          current
            ? {
                ...current,
                reviews: current.reviews.filter((review) => review.id !== reviewId),
              }
            : current
        );
        showToast(REVIEW_ACTION_CONFIG[type].successMessage);
        setActionModal(null);
      }, "Review action failed");

      setActionLoading(false);
      return;
    }

    try {
      const response = await api.patch<ReviewActionResponse>(
        `/admin/reviews/${reviewId}/${type}`
      );
      setUser((current) =>
        current
          ? {
              ...current,
              reviews: updateReviewHistory(current.reviews, reviewId, {
                status: response.review.status,
                moderatedAt: response.review.moderatedAt ?? null,
              }),
            }
          : current
      );
      showToast(REVIEW_ACTION_CONFIG[type].successMessage);
      setActionModal(null);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Review action failed"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const modalConfig = actionModal ? REVIEW_ACTION_CONFIG[actionModal.type] : null;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Search</h1>
          <p className="text-sm text-white/45">
            Search by exact email or phone number to review a client&apos;s full history.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="mb-8 rounded-2xl border border-white/8 bg-white/3 p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by exact email or phone number"
              className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 focus:border-brand-pink/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand-pink px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search User"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState title="No user found" description={error} />
      ) : !searched || !user ? (
        <EmptyState
          title="Search for a user"
          description="Enter an exact email address or phone number to load the user profile and history."
        />
      ) : (
        <div className="space-y-8">
          <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    user.isActive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
                <span className="rounded-full border border-brand-pink/30 bg-brand-pink/10 px-2.5 py-0.5 text-xs font-medium text-brand-pink">
                  {user.role}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-white/55 sm:grid-cols-2">
                <p className="inline-flex items-center gap-2">
                  <FiMail className="h-4 w-4 text-white/30" />
                  {user.email}
                </p>
                <p className="inline-flex items-center gap-2">
                  <FiPhone className="h-4 w-4 text-white/30" />
                  {formatPhoneDisplay(user.phone) || "No phone number"}
                </p>
                <p className="inline-flex items-center gap-2">
                  <FiClock className="h-4 w-4 text-white/30" />
                  Joined {formatDateTime(user.createdAt)}
                </p>
                <p className="inline-flex items-center gap-2">
                  <FiShield className="h-4 w-4 text-white/30" />
                  Updated {formatDateTime(user.updatedAt)}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/3 p-5">
              <div className="flex items-center gap-2">
                <FiUser className="h-4 w-4 text-brand-pink" />
                <h2 className="text-lg font-semibold">History</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All History" },
                  { value: "bookings", label: `Bookings (${user.bookings.length})` },
                  { value: "inquiries", label: `Inquiries (${user.inquiries.length})` },
                  { value: "reviews", label: `Reviews (${user.reviews.length})` },
                ].map((filterOption) => {
                  const active = historyFilter === filterOption.value;

                  return (
                    <button
                      key={filterOption.value}
                      type="button"
                      onClick={() => setHistoryFilter(filterOption.value as HistoryFilter)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "border-brand-pink/40 bg-brand-pink/12 text-brand-pink"
                          : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white/80"
                      }`}
                    >
                      {filterOption.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {(historyFilter === "all" || historyFilter === "bookings") && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <FiUser className="h-4 w-4 text-brand-pink" />
                  <h2 className="text-lg font-semibold">Bookings</h2>
                </div>
                {user.bookings.length === 0 ? (
                  <EmptyState
                    title="No bookings"
                    description="This user has not created any bookings yet."
                  />
                ) : (
                  <div className="space-y-3">
                    {user.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-xl border border-white/8 bg-white/3 p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">{booking.service.name}</h3>
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[booking.status]}`}
                              >
                                {booking.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-white/50">
                              {CATEGORY_LABELS[booking.service.category]} - {booking.peopleCount}{" "}
                              {booking.peopleCount === 1 ? "person" : "people"}
                            </p>
                            <p className="text-sm text-white/40">
                              {formatDate(booking.bookingDate)} - {formatTime(booking.startTime)} to{" "}
                              {formatTime(booking.endTime)}
                            </p>
                            {booking.address && (
                              <p className="mt-1 text-xs text-white/30">{booking.address}</p>
                            )}
                          </div>

                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
                          >
                            <FiExternalLink className="h-3.5 w-3.5" />
                            Open booking
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {(historyFilter === "all" || historyFilter === "inquiries") && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <FiMail className="h-4 w-4 text-brand-pink" />
                  <h2 className="text-lg font-semibold">Inquiries</h2>
                </div>
                {user.inquiries.length === 0 ? (
                  <EmptyState
                    title="No inquiries"
                    description="This user has not submitted any inquiries yet."
                  />
                ) : (
                  <div className="space-y-3">
                    {user.inquiries.map((inquiry) => (
                      <div
                        key={inquiry.id}
                        className="rounded-xl border border-white/8 bg-white/3 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {inquiry.subject?.trim() || `${inquiry.inquiryType} inquiry`}
                          </h3>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/65">
                            {inquiry.inquiryType}
                          </span>
                          <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-0.5 text-xs font-medium text-white/55">
                            {inquiry.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-white/40">
                          {formatDateTime(inquiry.createdAt)}
                        </p>
                        {inquiry.category && (
                          <p className="mt-2 text-sm text-white/35">{inquiry.category}</p>
                        )}
                        <div className="mt-3 whitespace-pre-wrap rounded-xl bg-black/20 p-4 text-sm leading-6 text-white/65">
                          {inquiry.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {(historyFilter === "all" || historyFilter === "reviews") && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <FiStar className="h-4 w-4 text-brand-pink" />
                  <h2 className="text-lg font-semibold">Reviews</h2>
                </div>
                {user.reviews.length === 0 ? (
                  <EmptyState
                    title="No reviews"
                    description="This user has not submitted any reviews yet."
                  />
                ) : (
                  <div className="space-y-3">
                    {user.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-xl border border-white/8 bg-white/3 p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">{review.booking.service.name}</h3>
                              <Stars count={review.rating} />
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${REVIEW_STATUS_COLORS[review.status]}`}
                              >
                                {review.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-white/45">
                              {CATEGORY_LABELS[review.booking.service.category]}
                            </p>
                            <p className="mt-1 text-xs text-white/30">
                              {formatDateTime(review.reviewedAt || review.createdAt)}
                            </p>
                            {review.reviewText && (
                              <p className="mt-3 rounded-xl bg-black/20 p-4 text-sm text-white/65">
                                &ldquo;{review.reviewText}&rdquo;
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                            {review.status !== "APPROVED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  setActionModal({ type: "approve", reviewId: review.id })
                                }
                                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25"
                              >
                                <FiCheck className="h-3.5 w-3.5" />
                                {review.status === "REJECTED" ? "Show" : "Approve"}
                              </button>
                            )}

                            {review.status !== "REJECTED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  setActionModal({ type: "hide", reviewId: review.id })
                                }
                                className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-500/25"
                              >
                                <FiEyeOff className="h-3.5 w-3.5" /> Hide
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                setActionModal({ type: "delete", reviewId: review.id })
                              }
                              className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/25"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </section>
        </div>
      )}

      {modalConfig && (
        <ConfirmModal
          isOpen
          title={modalConfig.title}
          message={modalConfig.message}
          confirmLabel={modalConfig.confirmLabel}
          onConfirm={handleReviewAction}
          onClose={() => setActionModal(null)}
          loading={actionLoading}
          variant={modalConfig.variant}
        />
      )}

      <AdminStepUpModal {...modalProps} />
    </div>
  );
}

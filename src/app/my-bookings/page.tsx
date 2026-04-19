"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import PageTransition from "@/components/PageTransition";
import LuxuryHeroSubtitle from "@/components/LuxuryHeroSubtitle";
import { BookingRowSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import ConfirmModal from "@/components/ConfirmModal";
import ReviewModal from "@/components/ReviewModal";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import {
  CATEGORY_LABELS,
  STATUS_COLORS,
  formatDate,
  formatTime,
} from "@/lib/utils";
import type { Booking, ApiError } from "@/types";
import { FiCalendar, FiClock, FiUsers, FiMapPin } from "react-icons/fi";

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

export default function MyBookingsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [reviewTarget, setReviewTarget] = useState<{
    id: string;
    serviceName: string;
  } | null>(null);

  const fetchBookings = useCallback(() => {
    setError("");
    setLoading(true);
    api
      .get<Booking[]>("/bookings/my")
      .then((data) => {
        setBookings(data);
        setError("");
      })
      .catch(() => setError("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.patch(`/bookings/${cancelTarget}/cancel`, {});
      showToast("Booking cancelled");
      setCancelTarget(null);
      fetchBookings();
    } catch (err) {
      showToast((err as ApiError).error || "Failed to cancel", "error");
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,168,201,0.06)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="text-4xl font-bold sm:text-5xl"
          >
            My Bookings
          </motion.h1>
          <LuxuryHeroSubtitle>
            Track your appointments and leave reviews for completed services.
          </LuxuryHeroSubtitle>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pb-24">
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <BookingRowSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchBookings}
              className="mt-3 text-sm text-brand-pink hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <EmptyState
            title="No bookings yet"
            description="Book your first appointment to get started."
            action={
              <Link
                href="/book"
                className="inline-flex rounded-full bg-linear-to-r from-brand-pink to-brand-rose px-6 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.03] hover:opacity-90"
              >
                Book Now
              </Link>
            }
          />
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease }}
                className="rounded-xl border border-white/6 bg-white/3 p-5 backdrop-blur-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white/90">
                        {booking.service.name}
                      </h3>
                      <span className="text-xs text-white/30">
                        {CATEGORY_LABELS[booking.service.category]}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/50">
                      <span className="inline-flex items-center gap-1">
                        <FiCalendar className="h-3.5 w-3.5" />
                        {formatDate(booking.bookingDate)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FiClock className="h-3.5 w-3.5" />
                        {formatTime(booking.startTime)} –{" "}
                        {formatTime(booking.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FiUsers className="h-3.5 w-3.5" />
                        {booking.peopleCount}{" "}
                        {booking.peopleCount === 1 ? "person" : "people"}
                      </span>
                      {booking.address && (
                        <span className="inline-flex items-center gap-1">
                          <FiMapPin className="h-3.5 w-3.5" />
                          {booking.address}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[booking.status]}`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {booking.status === "PENDING" && (
                    <button
                      onClick={() => setCancelTarget(booking.id)}
                      className="rounded-lg border border-red-500/20 px-4 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                    >
                      Cancel
                    </button>
                  )}
                  {booking.status === "COMPLETED" && !booking.review && (
                    <button
                      onClick={() =>
                        setReviewTarget({
                          id: booking.id,
                          serviceName: booking.service.name,
                        })
                      }
                      className="rounded-lg border border-brand-pink/20 px-4 py-1.5 text-xs font-medium text-brand-pink transition hover:bg-brand-pink/10"
                    >
                      Write Review
                    </button>
                  )}
                  {booking.review && (
                    <span className="text-xs text-white/30">
                      Review submitted
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!cancelTarget}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmLabel="Yes, Cancel"
        variant="danger"
        loading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />

      {reviewTarget && (
        <ReviewModal
          bookingId={reviewTarget.id}
          serviceName={reviewTarget.serviceName}
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={fetchBookings}
        />
      )}
    </PageTransition>
  );
}

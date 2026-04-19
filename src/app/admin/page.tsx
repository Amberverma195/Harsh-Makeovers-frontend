"use client";

import AdminStepUpModal from "@/components/AdminStepUpModal";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import { useToast } from "@/context/ToastContext";
import { useAdminStepUp } from "@/hooks/useAdminStepUp";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatPhoneDisplay } from "@/lib/phone";
import { CATEGORY_LABELS, STATUS_COLORS, formatDate, formatTime } from "@/lib/utils";
import type { AdminBooking, BookingStatus, PaginatedResponse } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiX,
} from "react-icons/fi";

const STATUS_OPTIONS: (BookingStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

export default function AdminBookingsPage() {
  const { showToast } = useToast();
  const { runWithStepUp, modalProps } = useAdminStepUp();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionModal, setActionModal] = useState<{
    type: "confirm" | "reject" | "complete";
    bookingId: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("sortBy", "bookingDate");
      params.set("sortOrder", "desc");

      const data = await api.get<PaginatedResponse<AdminBooking>>(`/admin/bookings?${params}`);
      setBookings(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Failed to load bookings"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, dateFrom, dateTo, showToast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    const { type, bookingId } = actionModal;

    if (type === "reject") {
      try {
        await api.patch(`/admin/bookings/${bookingId}/reject`, {
          reason: rejectReason || undefined,
        });
        showToast("Booking rejected");
        setActionModal(null);
        setRejectReason("");
        await fetchBookings();
      } catch (err: unknown) {
        showToast(getApiErrorMessage(err, "Action failed"), "error");
      } finally {
        setActionLoading(false);
      }
      return;
    }

    await runWithStepUp(async () => {
      if (type === "confirm") {
        await api.patch(`/admin/bookings/${bookingId}/confirm`);
        showToast("Booking confirmed");
      } else {
        await api.patch(`/admin/bookings/${bookingId}/complete`);
        showToast("Booking marked complete");
      }
      setActionModal(null);
      setRejectReason("");
      await fetchBookings();
    }, "Action failed");

    setActionLoading(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-white/45">Review requests, open booking details, and manage notes or scheduling.</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-white/40">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as BookingStatus | "ALL");
              setPage(1);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All statuses" : status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/40">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/40">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
        </div>
        {(statusFilter !== "ALL" || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/40 transition hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {bookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-white/8 bg-white/3 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{booking.fullName}</h3>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[booking.status]}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-white/50">
                        {booking.service.name} ({CATEGORY_LABELS[booking.service.category]}) - {booking.peopleCount} {booking.peopleCount > 1 ? "people" : "person"}
                      </p>
                      <p className="text-sm text-white/40">
                        {formatDate(booking.bookingDate)} - {formatTime(booking.startTime)} to {formatTime(booking.endTime)}
                      </p>
                      <p className="text-xs text-white/30">
                        {booking.email}
                        {booking.phone ? ` - ${formatPhoneDisplay(booking.phone)}` : ""}
                      </p>
                      {booking.address && <p className="text-xs text-white/30">{booking.address}</p>}
                      {booking.adminNotesSummary && (
                        <p className="mt-2 text-xs text-white/35">Latest note: {booking.adminNotesSummary}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">
                      {booking.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => setActionModal({ type: "confirm", bookingId: booking.id })}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25"
                          >
                            <FiCheck className="h-3.5 w-3.5" /> Confirm
                          </button>
                          <button
                            onClick={() => setActionModal({ type: "reject", bookingId: booking.id })}
                            className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/25"
                          >
                            <FiX className="h-3.5 w-3.5" /> Reject
                          </button>
                        </>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <button
                          onClick={() => setActionModal({ type: "complete", bookingId: booking.id })}
                          className="flex items-center gap-1.5 rounded-lg bg-brand-pink/15 px-3 py-2 text-xs font-medium text-brand-pink transition hover:bg-brand-pink/25"
                        >
                          <FiCheckCircle className="h-3.5 w-3.5" /> Complete
                        </button>
                      )}
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
                      >
                        <FiExternalLink className="h-3.5 w-3.5" /> Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:text-white disabled:opacity-30"
              >
                <FiChevronLeft />
              </button>
              <span className="text-sm text-white/40">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:text-white disabled:opacity-30"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {actionModal?.type === "confirm" && (
        <ConfirmModal
          isOpen
          title="Confirm Booking"
          message="This will confirm the booking and notify the client via email."
          confirmLabel="Confirm Booking"
          onConfirm={handleAction}
          onClose={() => setActionModal(null)}
          loading={actionLoading}
        />
      )}

      {actionModal?.type === "complete" && (
        <ConfirmModal
          isOpen
          title="Mark as Completed"
          message="Mark this booking as completed? The client will be able to leave a review."
          confirmLabel="Mark Complete"
          onConfirm={handleAction}
          onClose={() => setActionModal(null)}
          loading={actionLoading}
        />
      )}

      <AnimatePresence>
        {actionModal?.type === "reject" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === event.currentTarget) setActionModal(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#111]/95 p-6 shadow-2xl backdrop-blur-xl"
            >
              <h3 className="mb-2 text-lg font-semibold">Reject Booking</h3>
              <p className="mb-4 text-sm text-white/50">
                Optionally provide a reason for the rejection.
              </p>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Reason (optional)"
                rows={3}
                className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-brand-pink/50 focus:outline-none"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setActionModal(null);
                    setRejectReason("");
                  }}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading}
                  className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
                >
                  {actionLoading ? "Rejecting..." : "Reject Booking"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminStepUpModal {...modalProps} />
    </div>
  );
}

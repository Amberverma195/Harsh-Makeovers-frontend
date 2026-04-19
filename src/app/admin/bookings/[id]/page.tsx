"use client";

import AdminStepUpModal from "@/components/AdminStepUpModal";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import { useToast } from "@/context/ToastContext";
import { useAdminStepUp } from "@/hooks/useAdminStepUp";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatPhoneDisplay } from "@/lib/phone";
import { CATEGORY_LABELS, STATUS_COLORS, formatDate, formatDateTime, formatTime } from "@/lib/utils";
import type { AdminBookingDetail } from "@/types";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiMapPin,
  FiMessageSquare,
  FiRefreshCw,
  FiSave,
  FiUser,
  FiX,
} from "react-icons/fi";

function toDateInputValue(dateValue: string) {
  return dateValue.slice(0, 10);
}

function toTimeInputValue(timeValue: string) {
  if (!timeValue.includes("T")) {
    return timeValue.slice(0, 5);
  }

  const date = new Date(timeValue);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const bookingId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { showToast } = useToast();
  const { runWithStepUp, modalProps } = useAdminStepUp();

  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [newNoteText, setNewNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [schedulePeopleCount, setSchedulePeopleCount] = useState("1");
  const [overrideConflicts, setOverrideConflicts] = useState(false);
  const [scheduleReason, setScheduleReason] = useState("");
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const hydrateScheduleForm = useCallback((nextBooking: AdminBookingDetail) => {
    setScheduleDate(toDateInputValue(nextBooking.bookingDate));
    setScheduleTime(toTimeInputValue(nextBooking.startTime));
    setSchedulePeopleCount(String(nextBooking.peopleCount));
    setOverrideConflicts(false);
    setScheduleReason("");
  }, []);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) {
      setErrorMessage("Booking not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const data = await api.get<AdminBookingDetail>(`/admin/bookings/${bookingId}`);
      setBooking(data);
      hydrateScheduleForm(data);
    } catch (err: unknown) {
      setBooking(null);
      setErrorMessage(getApiErrorMessage(err, "Failed to load booking details."));
    } finally {
      setLoading(false);
    }
  }, [bookingId, hydrateScheduleForm]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleAddNote = async () => {
    const noteText = newNoteText.trim();
    if (!noteText) return;

    setNoteLoading(true);
    try {
      await api.post(`/admin/bookings/${bookingId}/notes`, { noteText });
      setNewNoteText("");
      showToast("Note added");
      await fetchBooking();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Failed to add note"), "error");
    } finally {
      setNoteLoading(false);
    }
  };

  const handleSaveEditedNote = async () => {
    if (!editingNoteId) return;
    const noteText = editingNoteText.trim();
    if (!noteText) return;

    setNoteLoading(true);
    try {
      await api.patch(`/admin/bookings/${bookingId}/notes/${editingNoteId}`, { noteText });
      setEditingNoteId(null);
      setEditingNoteText("");
      showToast("Note updated");
      await fetchBooking();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Failed to update note"), "error");
    } finally {
      setNoteLoading(false);
    }
  };

  const handleStatusAction = async (action: "confirm" | "reject" | "complete" | "cancel") => {
    setActionLoading(action);

    const successMessage =
      action === "confirm"
        ? "Booking confirmed"
        : action === "reject"
          ? "Booking rejected"
          : action === "cancel"
            ? "Booking cancelled"
            : "Booking marked complete";

    if (action === "reject") {
      try {
        await api.patch(`/admin/bookings/${bookingId}/${action}`, {
          reason: actionReason.trim() || undefined,
        });
        setActionReason("");
        showToast(successMessage);
        await fetchBooking();
      } catch (err: unknown) {
        showToast(getApiErrorMessage(err, "Action failed"), "error");
      } finally {
        setActionLoading(null);
      }
      return;
    }

    await runWithStepUp(async () => {
      const body = action === "cancel"
        ? { reason: actionReason.trim() || undefined }
        : undefined;
      await api.patch(`/admin/bookings/${bookingId}/${action}`, body);
      setActionReason("");
      showToast(successMessage);
      await fetchBooking();
    }, "Action failed");

    setActionLoading(null);
  };

  const handleScheduleUpdate = async () => {
    const peopleCount = Number(schedulePeopleCount);
    if (!scheduleDate || !scheduleTime || Number.isNaN(peopleCount)) return;

    setScheduleLoading(true);

    await runWithStepUp(async () => {
      await api.patch(`/admin/bookings/${bookingId}/schedule`, {
        bookingDate: scheduleDate,
        startTime: scheduleTime,
        peopleCount,
        overrideConflicts,
        reason: scheduleReason.trim() || undefined,
      });
      showToast("Booking schedule updated");
      await fetchBooking();
    }, "Failed to update schedule");

    setScheduleLoading(false);
  };

  const startEditingNote = (noteId: string, noteText: string) => {
    setEditingNoteId(noteId);
    setEditingNoteText(noteText);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to bookings
        </Link>
        <EmptyState title="Booking unavailable" description={errorMessage || "This booking could not be loaded."} />
      </div>
    );
  }

  const canConfirm = booking.status === "PENDING";
  const canReject = booking.status === "PENDING";
  const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const canComplete = booking.status === "CONFIRMED";
  const canAdjustSchedule = booking.status === "PENDING" || booking.status === "CONFIRMED";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin"
            className="mb-3 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
          >
            <FiArrowLeft className="h-4 w-4" /> Back to bookings
          </Link>
          <h1 className="text-2xl font-bold">{booking.fullName}</h1>
          <p className="mt-1 text-sm text-white/45">
            {booking.service.name} ({CATEGORY_LABELS[booking.service.category]})
          </p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[booking.status]}`}
        >
          {booking.status}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/8 bg-white/3 p-5"
          >
            <h2 className="mb-4 text-lg font-semibold">Booking Details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 text-sm text-white/65">
                <p className="inline-flex items-center gap-2"><FiUser className="h-4 w-4" /> {booking.fullName}</p>
                <p>{booking.email}</p>
                {booking.phone && <p>{formatPhoneDisplay(booking.phone)}</p>}
                {booking.address && (
                  <p className="inline-flex items-start gap-2"><FiMapPin className="mt-0.5 h-4 w-4 shrink-0" /> {booking.address}</p>
                )}
              </div>
              <div className="space-y-3 text-sm text-white/65">
                <p className="inline-flex items-center gap-2"><FiCalendar className="h-4 w-4" /> {formatDate(booking.bookingDate)}</p>
                <p className="inline-flex items-center gap-2"><FiClock className="h-4 w-4" /> {formatTime(booking.startTime)} to {formatTime(booking.endTime)}</p>
                <p>{booking.peopleCount} {booking.peopleCount === 1 ? "person" : "people"}</p>
                <p>Booked {formatDateTime(booking.createdAt)}</p>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-white/8 bg-white/3 p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <FiMessageSquare className="h-4 w-4 text-brand-pink" />
              <h2 className="text-lg font-semibold">Internal Notes</h2>
            </div>

            <div className="mb-5 rounded-xl border border-white/8 bg-black/20 p-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/40">
                Add Note
              </label>
              <textarea
                value={newNoteText}
                onChange={(event) => setNewNoteText(event.target.value)}
                rows={4}
                placeholder="Add internal context for this booking..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:border-brand-pink/50 focus:outline-none"
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleAddNote}
                  disabled={noteLoading || !newNoteText.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-pink/15 px-4 py-2 text-sm font-medium text-brand-pink transition hover:bg-brand-pink/25 disabled:opacity-50"
                >
                  <FiSave className="h-4 w-4" /> {noteLoading ? "Saving..." : "Add Note"}
                </button>
              </div>
            </div>

            {booking.adminNotes.length === 0 ? (
              <EmptyState title="No internal notes yet" description="Add context here for follow-ups, scheduling, or client preferences." />
            ) : (
              <div className="space-y-3">
                {booking.adminNotes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-white/8 bg-black/20 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/35">
                      <span>{note.admin?.name || "Admin"}</span>
                      <span>{formatDateTime(note.updatedAt)}</span>
                    </div>

                    {editingNoteId === note.id ? (
                      <>
                        <textarea
                          value={editingNoteText}
                          onChange={(event) => setEditingNoteText(event.target.value)}
                          rows={4}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 focus:border-brand-pink/50 focus:outline-none"
                        />
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingNoteId(null);
                              setEditingNoteText("");
                            }}
                            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 transition hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEditedNote}
                            disabled={noteLoading || !editingNoteText.trim()}
                            className="rounded-lg bg-brand-pink/15 px-3 py-2 text-sm font-medium text-brand-pink transition hover:bg-brand-pink/25 disabled:opacity-50"
                          >
                            {noteLoading ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-white/70">{note.noteText}</p>
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => startEditingNote(note.id, note.noteText)}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/60 transition hover:text-white"
                          >
                            <FiEdit2 className="h-3.5 w-3.5" /> Edit note
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>

        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/8 bg-white/3 p-5"
          >
            <h2 className="mb-4 text-lg font-semibold">Status Actions</h2>
            {(canReject || canCancel) && (
              <div className="mb-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/40">
                  Decision Note
                </label>
                <textarea
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  rows={3}
                  placeholder="Optional reason for rejecting or cancelling"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:border-brand-pink/50 focus:outline-none"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {canConfirm && (
                <button
                  onClick={() => handleStatusAction("confirm")}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
                >
                  <FiCheck className="h-4 w-4" /> {actionLoading === "confirm" ? "Confirming..." : "Confirm"}
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => handleStatusAction("reject")}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
                >
                  <FiX className="h-4 w-4" /> {actionLoading === "reject" ? "Rejecting..." : "Reject"}
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => handleStatusAction("cancel")}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <FiRefreshCw className="h-4 w-4" /> {actionLoading === "cancel" ? "Cancelling..." : "Cancel Booking"}
                </button>
              )}
              {canComplete && (
                <button
                  onClick={() => handleStatusAction("complete")}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-pink/15 px-3 py-2 text-sm font-medium text-brand-pink transition hover:bg-brand-pink/25 disabled:opacity-50"
                >
                  <FiCheckCircle className="h-4 w-4" /> {actionLoading === "complete" ? "Completing..." : "Mark Complete"}
                </button>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-white/8 bg-white/3 p-5"
          >
            <h2 className="mb-4 text-lg font-semibold">Manual Scheduling</h2>
            {canAdjustSchedule ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/40">
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(event) => setScheduleDate(event.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/40">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(event) => setScheduleTime(event.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/40">
                    People Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={schedulePeopleCount}
                    onChange={(event) => setSchedulePeopleCount(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/40">
                    Scheduling Note
                  </label>
                  <textarea
                    value={scheduleReason}
                    onChange={(event) => setScheduleReason(event.target.value)}
                    rows={3}
                    placeholder="Optional reason for the schedule adjustment"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:border-brand-pink/50 focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/65">
                  <input
                    type="checkbox"
                    checked={overrideConflicts}
                    onChange={(event) => setOverrideConflicts(event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  Override conflicts and force this slot even if availability is blocked.
                </label>

                <button
                  onClick={handleScheduleUpdate}
                  disabled={
                    scheduleLoading ||
                    !scheduleDate ||
                    !scheduleTime ||
                    !schedulePeopleCount ||
                    Number(schedulePeopleCount) < 1 ||
                    Number(schedulePeopleCount) > 6
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-pink/15 px-4 py-2 text-sm font-medium text-brand-pink transition hover:bg-brand-pink/25 disabled:opacity-50"
                >
                  <FiSave className="h-4 w-4" /> {scheduleLoading ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-white/45">
                Scheduling overrides are only available while the booking is pending or confirmed.
              </p>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/8 bg-white/3 p-5"
          >
            <h2 className="mb-4 text-lg font-semibold">Status History</h2>
            {booking.statusHistory.length === 0 ? (
              <EmptyState title="No history yet" description="Status changes will appear here." />
            ) : (
              <div className="space-y-3">
                {booking.statusHistory.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-white/8 bg-black/20 p-4 text-sm text-white/65">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-white/85">
                        {entry.oldStatus ? `${entry.oldStatus} -> ${entry.newStatus}` : entry.newStatus}
                      </p>
                      <span className="text-xs text-white/35">{formatDateTime(entry.createdAt)}</span>
                    </div>
                    {entry.changeReason && <p className="mt-2 text-white/55">{entry.changeReason}</p>}
                    <p className="mt-2 text-xs text-white/35">
                      {entry.changedBy?.name ? `Updated by ${entry.changedBy.name}` : "System update"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </div>

      <AdminStepUpModal {...modalProps} />
    </div>
  );
}

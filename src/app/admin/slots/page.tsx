"use client";

import AdminStepUpModal from "@/components/AdminStepUpModal";
import { useState, useEffect, useCallback } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAdminStepUp } from "@/hooks/useAdminStepUp";
import { formatTime } from "@/lib/utils";
import type { BlockedSlotFull, PaginatedResponse } from "@/types";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrash2,
  FiPlus,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

export default function AdminSlotsPage() {
  const { showToast } = useToast();
  const { runWithStepUp, modalProps } = useAdminStepUp();
  const [slots, setSlots] = useState<BlockedSlotFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    blockedDate: "",
    startTime: "",
    endTime: "",
    reason: "",
  });
  const [creating, setCreating] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedResponse<BlockedSlotFull>>(
        `/admin/blocked-slots?page=${page}&limit=20`
      );
      setSlots(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Failed to load blocked slots"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.blockedDate || !formData.startTime || !formData.endTime) {
      showToast("Date and time range are required", "error");
      return;
    }
    if (formData.endTime <= formData.startTime) {
      showToast("End time must be after start time", "error");
      return;
    }
    setCreating(true);

    await runWithStepUp(async () => {
      await api.post("/admin/block-slot", {
        blockedDate: formData.blockedDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        reason: formData.reason || undefined,
      });
      showToast("Slot blocked successfully");
      setFormData({ blockedDate: "", startTime: "", endTime: "", reason: "" });
      setShowForm(false);
      await fetchSlots();
    }, "Failed to block slot");

    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/blocked-slots/${deleteId}`);
      showToast("Blocked slot removed");
      setDeleteId(null);
      await fetchSlots();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Failed to delete blocked slot"), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blocked Slots</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-linear-to-r from-brand-pink to-brand-rose px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
        >
          {showForm ? (
            <>
              <FiX className="h-4 w-4" /> Cancel
            </>
          ) : (
            <>
              <FiPlus className="h-4 w-4" /> Block Slot
            </>
          )}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="mb-6 overflow-hidden rounded-xl border border-white/8 bg-white/3 p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-white/40">Date</label>
                <input
                  type="date"
                  value={formData.blockedDate}
                  onChange={(e) =>
                    setFormData({ ...formData, blockedDate: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-brand-pink/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-brand-pink/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-brand-pink/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="e.g. Day off, lunch break"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-brand-pink/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-linear-to-r from-brand-pink to-brand-rose px-5 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {creating ? "Blocking..." : "Block This Slot"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : slots.length === 0 ? (
        <EmptyState
          title="No blocked slots"
          description="Block time slots when you're unavailable."
        />
      ) : (
        <>
          <div className="space-y-3">
            {slots.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 p-4"
              >
                <div>
                  <p className="font-medium">
                    {new Date(s.blockedDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </p>
                  <p className="text-sm text-white/50">
                    {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    {s.reason && (
                      <span className="ml-2 text-white/30">· {s.reason}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteId(s.id)}
                  className="rounded-lg p-2 text-white/30 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
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

      <ConfirmModal
        isOpen={!!deleteId}
        title="Remove Blocked Slot"
        message="This will unblock this time slot, allowing bookings again."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={deleting}
        variant="danger"
      />

      <AdminStepUpModal {...modalProps} />
    </div>
  );
}

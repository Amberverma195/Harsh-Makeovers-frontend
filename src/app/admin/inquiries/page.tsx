"use client";

import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import { useToast } from "@/context/ToastContext";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type {
  AdminInquiry,
  InquiryStatus,
  InquiryType,
  PaginatedResponse,
} from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiMail,
  FiUser,
} from "react-icons/fi";

const STATUS_OPTIONS: (InquiryStatus | "ALL")[] = ["ALL", "OPEN", "IN_PROGRESS", "CLOSED"];
const TYPE_OPTIONS: (InquiryType | "ALL")[] = ["ALL", "CONTACT", "CLASS", "LARGE_GROUP"];

const STATUS_LABELS: Record<InquiryStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  CLOSED: "Closed",
};

const TYPE_LABELS: Record<InquiryType, string> = {
  CONTACT: "Contact",
  CLASS: "Class",
  LARGE_GROUP: "Large Group",
};

const STATUS_COLORS: Record<InquiryStatus, string> = {
  OPEN: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  IN_PROGRESS: "border-brand-pink/30 bg-brand-pink/10 text-brand-pink",
  CLOSED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const ACTION_STYLES: Record<InquiryStatus, string> = {
  OPEN: "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
  IN_PROGRESS: "bg-brand-pink/15 text-brand-pink hover:bg-brand-pink/25",
  CLOSED: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
};

function getStatusActions(status: InquiryStatus) {
  switch (status) {
    case "OPEN":
      return [
        { status: "IN_PROGRESS" as const, label: "Mark In Progress" },
        { status: "CLOSED" as const, label: "Close" },
      ];
    case "IN_PROGRESS":
      return [
        { status: "OPEN" as const, label: "Reopen" },
        { status: "CLOSED" as const, label: "Close" },
      ];
    case "CLOSED":
      return [
        { status: "OPEN" as const, label: "Reopen" },
        { status: "IN_PROGRESS" as const, label: "Mark In Progress" },
      ];
    default:
      return [];
  }
}

export default function AdminInquiriesPage() {
  const { showToast } = useToast();
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<InquiryType | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("inquiryType", typeFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("sortBy", "createdAt");
      params.set("sortOrder", "desc");

      const data = await api.get<PaginatedResponse<AdminInquiry>>(
        `/admin/inquiries?${params.toString()}`
      );
      setInquiries(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Failed to load inquiries"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, dateFrom, dateTo, showToast]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleStatusChange = async (inquiryId: string, status: InquiryStatus) => {
    setUpdatingId(inquiryId);
    try {
      await api.patch(`/admin/inquiries/${inquiryId}/status`, { status });
      showToast(`Inquiry marked ${STATUS_LABELS[status].toLowerCase()}`);
      await fetchInquiries();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Status update failed"), "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inquiries</h1>
          <p className="text-sm text-white/45">Monitor contact, class, and large-group requests.</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-white/40">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as InquiryStatus | "ALL");
              setPage(1);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All statuses" : STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/40">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as InquiryType | "ALL");
              setPage(1);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type === "ALL" ? "All types" : TYPE_LABELS[type]}
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

        {(statusFilter !== "ALL" || typeFilter !== "ALL" || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setTypeFilter("ALL");
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
      ) : inquiries.length === 0 ? (
        <EmptyState
          title="No inquiries found"
          description="Try adjusting your filters or check back after new submissions arrive."
        />
      ) : (
        <>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {inquiries.map((inquiry) => {
                const title = inquiry.subject?.trim() || `${TYPE_LABELS[inquiry.inquiryType]} inquiry`;
                const actions = getStatusActions(inquiry.status);
                const isUpdating = updatingId === inquiry.id;

                return (
                  <motion.div
                    key={inquiry.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-xl border border-white/8 bg-white/3 p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{title}</h3>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/65">
                            {TYPE_LABELS[inquiry.inquiryType]}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[inquiry.status]}`}
                          >
                            {STATUS_LABELS[inquiry.status]}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/45">
                          <span className="inline-flex items-center gap-1.5">
                            <FiUser className="h-3.5 w-3.5" />
                            {inquiry.user?.name || "Account unavailable"}
                          </span>
                          {inquiry.user?.email && (
                            <span className="inline-flex items-center gap-1.5">
                              <FiMail className="h-3.5 w-3.5" />
                              {inquiry.user.email}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5">
                            <FiClock className="h-3.5 w-3.5" />
                            {formatDateTime(inquiry.createdAt)}
                          </span>
                        </div>

                        {inquiry.category && (
                          <p className="mt-2 text-sm text-white/35">
                            {inquiry.category || "General"}
                          </p>
                        )}

                        <div className="mt-3 whitespace-pre-wrap rounded-xl bg-black/20 p-4 text-sm leading-6 text-white/65">
                          {inquiry.message}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 xl:w-56 xl:justify-end">
                        {actions.map((action) => (
                          <button
                            key={action.status}
                            onClick={() => handleStatusChange(inquiry.id, action.status)}
                            disabled={isUpdating}
                            className={`rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${ACTION_STYLES[action.status]}`}
                          >
                            {isUpdating ? "Updating..." : action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
    </div>
  );
}

"use client";

import AdminStepUpModal from "@/components/AdminStepUpModal";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import { useToast } from "@/context/ToastContext";
import { useAdminStepUp } from "@/hooks/useAdminStepUp";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type {
  AdminAuditLog,
  AdminSessionInfo,
  AdminSessionsResponse,
  PaginatedResponse,
} from "@/types";
import { useCallback, useEffect, useState } from "react";
import { FiAlertTriangle, FiClock, FiLogOut, FiRefreshCw, FiShield, FiSmartphone } from "react-icons/fi";

function formatDeviceLabel(session: AdminSessionInfo) {
  if (session.deviceFingerprint) {
    return `Device ${session.deviceFingerprint.slice(0, 8)}`;
  }

  return "Unknown device";
}

function formatUserAgent(userAgent?: string | null) {
  if (!userAgent) {
    return "Unknown browser";
  }

  return userAgent.length > 80 ? `${userAgent.slice(0, 77)}...` : userAgent;
}

function riskBadgeClass(riskLevel?: string | null) {
  switch (riskLevel) {
    case "high":
      return "border-red-500/30 bg-red-500/10 text-red-200";
    case "medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "low":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    default:
      return "border-white/10 bg-white/5 text-white/45";
  }
}

export default function AdminSecurityPage() {
  const { showToast } = useToast();
  const { runWithStepUp, modalProps } = useAdminStepUp();
  const [sessions, setSessions] = useState<AdminSessionInfo[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionActionId, setSessionActionId] = useState<string | null>(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const fetchSecurityData = useCallback(async (withSpinner = true) => {
    if (withSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [sessionsResponse, logsResponse] = await Promise.all([
        api.get<AdminSessionsResponse>("/admin/security/sessions"),
        api.get<PaginatedResponse<AdminAuditLog>>("/admin/security/audit-logs?page=1&limit=20"),
      ]);

      setSessions(sessionsResponse.sessions);
      setCurrentSessionId(sessionsResponse.currentSessionId);
      setAuditLogs(logsResponse.data);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Failed to load admin security data"), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchSecurityData();
  }, [fetchSecurityData]);

  const handleRevokeSession = async (sessionId: string) => {
    setSessionActionId(sessionId);

    await runWithStepUp(async () => {
      const response = await api.delete<{ message: string; loggedOut: boolean }>(
        `/admin/security/sessions/${sessionId}`
      );
      showToast(response.message);

      if (response.loggedOut) {
        window.location.assign("/login");
        return;
      }

      await fetchSecurityData(false);
    }, "Failed to revoke session");

    setSessionActionId(null);
  };

  const handleLogoutAll = async () => {
    setLogoutAllLoading(true);

    await runWithStepUp(async () => {
      const response = await api.post<{ message: string; loggedOut: boolean }>(
        "/admin/security/logout-all"
      );
      showToast(response.message);
      if (response.loggedOut) {
        window.location.assign("/login");
        return;
      }

      await fetchSecurityData(false);
    }, "Failed to log out all sessions");

    setLogoutAllLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Security</h1>
          <p className="text-sm text-white/45">
            Review active admin sessions, revoke devices, and inspect recent audit activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void fetchSecurityData(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/65 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogoutAll}
            disabled={logoutAllLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500/15 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiLogOut className="h-4 w-4" />
            {logoutAllLoading ? "Logging out..." : "Log Out All Sessions"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <div className="mb-4 flex items-center gap-2">
              <FiShield className="h-4 w-4 text-brand-pink" />
              <h2 className="text-lg font-semibold">Active Sessions</h2>
            </div>

            {sessions.length === 0 ? (
              <EmptyState
                title="No admin sessions found"
                description="Sessions will appear here after an admin signs in."
              />
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const isCurrentSession = session.id === currentSessionId;
                  const isRevoked = !session.isActive || !!session.revokedAt;

                  return (
                    <div
                      key={session.id}
                      className={`rounded-xl border p-4 ${
                        isCurrentSession
                          ? "border-brand-pink/30 bg-brand-pink/8"
                          : "border-white/8 bg-black/20"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-white/85">
                              <FiSmartphone className="h-4 w-4 text-brand-pink" />
                              {formatDeviceLabel(session)}
                            </span>
                            {isCurrentSession && (
                              <span className="rounded-full border border-brand-pink/30 bg-brand-pink/10 px-2.5 py-0.5 text-xs font-medium text-brand-pink">
                                Current session
                              </span>
                            )}
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                isRevoked
                                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                              }`}
                            >
                              {isRevoked ? "Revoked" : "Active"}
                            </span>
                            {session.elevatedUntil && new Date(session.elevatedUntil).getTime() > Date.now() && (
                              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-200">
                                Step-up active
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-white/45">{formatUserAgent(session.userAgent)}</p>

                          <div className="grid gap-2 text-xs text-white/40 sm:grid-cols-2 xl:grid-cols-4">
                            <p>IP: {session.ipAddress || "Unknown"}</p>
                            <p>Created: {formatDateTime(session.createdAt)}</p>
                            <p>Last seen: {formatDateTime(session.lastSeenAt)}</p>
                            <p>
                              Elevated until:{" "}
                              {session.elevatedUntil ? formatDateTime(session.elevatedUntil) : "Not elevated"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleRevokeSession(session.id)}
                          disabled={isRevoked || sessionActionId === session.id}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-400/25 px-4 py-2 text-sm font-medium text-red-200 transition hover:border-red-300/40 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiAlertTriangle className="h-4 w-4" />
                          {sessionActionId === session.id
                            ? "Revoking..."
                            : isCurrentSession
                              ? "Revoke This Session"
                              : "Revoke Session"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <div className="mb-4 flex items-center gap-2">
              <FiClock className="h-4 w-4 text-brand-pink" />
              <h2 className="text-lg font-semibold">Recent Audit Activity</h2>
            </div>

            {auditLogs.length === 0 ? (
              <EmptyState
                title="No audit events yet"
                description="Admin mutations and security alerts will appear here."
              />
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-white/8 bg-black/20 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-white/85">{log.action}</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/55">
                            {log.requestMethod}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${riskBadgeClass(log.riskLevel)}`}
                          >
                            {log.riskLevel || "none"}
                          </span>
                        </div>
                        <p className="text-sm text-white/45">
                          {log.entityType}
                          {log.entityId ? ` • ${log.entityId}` : ""}
                        </p>
                        <p className="text-xs text-white/35">{log.requestPath}</p>
                        <div className="grid gap-2 text-xs text-white/35 sm:grid-cols-2 xl:grid-cols-4">
                          <p>Time: {formatDateTime(log.createdAt)}</p>
                          <p>IP: {log.ipAddress || "Unknown"}</p>
                          <p>Session: {log.sessionId || "None"}</p>
                          <p>Request: {log.requestId || "None"}</p>
                        </div>
                        {log.userAgent && (
                          <p className="text-xs text-white/30">{formatUserAgent(log.userAgent)}</p>
                        )}
                        {log.details && (
                          <pre className="overflow-x-auto rounded-xl border border-white/8 bg-black/25 p-3 text-xs text-white/45">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <AdminStepUpModal {...modalProps} />
    </div>
  );
}

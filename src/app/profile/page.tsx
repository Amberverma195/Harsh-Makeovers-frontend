"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import PageTransition from "@/components/PageTransition";
import LuxuryHeroSubtitle from "@/components/LuxuryHeroSubtitle";
import { BookingRowSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatPhoneDisplay, formatPhoneInput, sanitizePhoneInput } from "@/lib/phone";
import {
  getLocalDateString,
  STATUS_COLORS,
  formatDate,
  formatTime,
} from "@/lib/utils";
import type { User, Booking, ApiError } from "@/types";
import { FiUser, FiMail, FiPhone, FiEdit2, FiCheck, FiX } from "react-icons/fi";

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

function isUpcoming(booking: Booking, today: string): boolean {
  if (["CANCELLED", "REJECTED"].includes(booking.status)) return false;
  return booking.bookingDate >= today;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const { showToast } = useToast();
  useRequireAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoadError("");
    setLoading(true);
    try {
      const [userData, bookingsData] = await Promise.all([
        api.get<User>("/users/me"),
        api.get<Booking[]>("/bookings/my"),
      ]);
      setProfile(userData);
      setBookings(bookingsData);
      setEditName(userData.name);
      setEditPhone(userData.phone || "");
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err, "Failed to load profile"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateUser({
        name: editName.trim() || undefined,
        phone: editPhone.trim() || null,
      });
      setProfile((p) =>
        p
          ? { ...p, name: editName.trim(), phone: editPhone.trim() || null }
          : p
      );
      setEditing(false);
      showToast("Profile updated");
    } catch (err) {
      showToast((err as ApiError).error || "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(profile?.name || "");
    setEditPhone(profile?.phone || "");
    setEditing(false);
  };

  const today = getLocalDateString();
  const upcomingBookings = bookings.filter((b) => isUpcoming(b, today));
  const historyBookings = bookings.filter((b) => !isUpcoming(b, today));

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
            My Profile
          </motion.h1>
          <LuxuryHeroSubtitle>
            Manage your account and view your bookings.
          </LuxuryHeroSubtitle>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pb-24">
        {loading ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/8 bg-white/3 p-6">
              <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
              <div className="mt-4 h-4 w-48 animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-4 w-40 animate-pulse rounded bg-white/10" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <BookingRowSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <p className="text-sm text-red-300">{loadError}</p>
            <button
              onClick={fetchData}
              className="mt-4 rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Profile Info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              className="mb-10 rounded-xl border border-white/8 bg-white/3 p-6 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="mb-4 text-lg font-semibold text-white/90">
                    Account Information
                  </h2>
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-xs text-white/40">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 outline-none transition focus:border-brand-pink/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-white/40">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formatPhoneInput(editPhone)}
                          inputMode="numeric"
                          onChange={(e) => setEditPhone(sanitizePhoneInput(e.target.value))}
                          placeholder="(123)-456-7890"
                          maxLength={14}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-pink/50"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving || !editName.trim()}
                          className="flex items-center gap-2 rounded-lg bg-linear-to-r from-brand-pink to-brand-rose px-4 py-2 text-sm font-medium text-black transition hover:scale-[1.03] hover:opacity-90 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          <FiCheck className="h-4 w-4" />
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:text-white disabled:opacity-50"
                        >
                          <FiX className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <FiUser className="h-4 w-4 text-white/30" />
                        <span className="text-white/60">Name:</span>
                        <span className="text-white/90">{profile?.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <FiMail className="h-4 w-4 text-white/30" />
                        <span className="text-white/60">Email:</span>
                        <span className="text-white/90">{profile?.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <FiPhone className="h-4 w-4 text-white/30" />
                        <span className="text-white/60">Phone:</span>
                        <span className="text-white/90">
                          {formatPhoneDisplay(profile?.phone) || "—"}
                        </span>
                      </div>
                      {profile?.createdAt && (
                        <p className="mt-2 text-xs text-white/30">
                          Member since{" "}
                          {new Date(profile.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "long", year: "numeric" }
                          )}
                        </p>
                      )}
                      <button
                        onClick={() => setEditing(true)}
                        className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:text-brand-pink"
                      >
                        <FiEdit2 className="h-4 w-4" />
                        Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Upcoming Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease }}
            >
              <h2 className="mb-4 text-lg font-semibold text-white/90">
                Upcoming Bookings
              </h2>
              {upcomingBookings.length === 0 ? (
                <EmptyState
                  title="No upcoming bookings"
                  description="Book your next appointment to see it here."
                  action={
                    <Link
                      href="/book"
                      className="inline-flex rounded-full bg-linear-to-r from-brand-pink to-brand-rose px-6 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.03] hover:opacity-90"
                    >
                      Book Now
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking, i) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3, ease }}
                      className="rounded-xl border border-white/8 bg-white/3 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white/90">
                            {booking.service.name}
                          </h3>
                          <p className="text-sm text-white/50">
                            {formatDate(booking.bookingDate)} ·{" "}
                            {formatTime(booking.startTime)} –{" "}
                            {formatTime(booking.endTime)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[booking.status]}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <Link
                        href="/my-bookings"
                        className="mt-3 inline-block text-xs text-brand-pink hover:underline"
                      >
                        View details →
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Booking History */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease }}
              className="mt-10"
            >
              <h2 className="mb-4 text-lg font-semibold text-white/90">
                Booking History
              </h2>
              {historyBookings.length === 0 ? (
                <EmptyState
                  title="No past bookings"
                  description="Your completed and cancelled bookings will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {historyBookings.map((booking, i) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3, ease }}
                      className="rounded-xl border border-white/6 bg-white/3 p-4 opacity-80"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white/80">
                            {booking.service.name}
                          </h3>
                          <p className="text-sm text-white/40">
                            {formatDate(booking.bookingDate)} ·{" "}
                            {formatTime(booking.startTime)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[booking.status]}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <Link
                        href="/my-bookings"
                        className="mt-2 inline-block text-xs text-white/40 hover:text-brand-pink"
                      >
                        View details →
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </PageTransition>
  );
}


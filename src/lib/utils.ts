import type { ServiceCategory, BookingStatus } from "@/types";

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  BRIDAL: "Bridal",
  NON_BRIDAL: "Non-Bridal",
  PARTY: "Party",
  HAIR: "Hair",
  LASHES: "Lashes",
};

export const CATEGORY_ICONS: Record<ServiceCategory, string> = {
  BRIDAL: "💍",
  NON_BRIDAL: "🌸",
  PARTY: "✨",
  HAIR: "💇‍♀️",
  LASHES: "👁️",
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  CONFIRMED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-300",
  CANCELLED: "border-white/10 bg-white/5 text-white/40",
  COMPLETED: "border-brand-pink/30 bg-brand-pink/10 text-brand-pink",
};

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTime(timeStr: string) {
  const isoDate = timeStr.includes("T") ? new Date(timeStr) : null;
  if (isoDate && !Number.isNaN(isoDate.getTime())) {
    return isoDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    });
  }

  const match = timeStr.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) return timeStr;

  const hour = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${minutes} ${ampm}`;
}

export function formatDurationInHours(durationMinutes: number) {
  const hours = durationMinutes / 60;

  if (Number.isInteger(hours)) {
    return `~${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `~${hours.toFixed(1)} hours`;
}

export function formatDateTime(isoStr: string) {
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const SAFE_INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);

export function getSafeInstagramUrl(value?: string | null) {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || !SAFE_INSTAGRAM_HOSTS.has(parsed.hostname.toLowerCase())) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

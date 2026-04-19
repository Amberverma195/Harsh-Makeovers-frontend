"use client";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/5 ${className}`}
      aria-hidden
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/3 p-6">
      <Skeleton className="mb-4 h-4 w-16" />
      <Skeleton className="mb-2 h-6 w-3/4" />
      <Skeleton className="mb-3 h-4 w-full" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

export function PortfolioCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/3 overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="mb-2 h-5 w-2/3" />
        <Skeleton className="mb-3 h-4 w-full" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}

export function BookingRowSkeleton() {
  return (
    <div className="rounded-xl border border-white/6 bg-white/3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="mb-1 h-4 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
    </div>
  );
}

"use client";

import { FiInbox } from "react-icons/fi";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/8 bg-white/3">
        <FiInbox className="h-7 w-7 text-white/30" />
      </div>
      <h3 className="text-lg font-semibold text-white/70">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-white/40">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

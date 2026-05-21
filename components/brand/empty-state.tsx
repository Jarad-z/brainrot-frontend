"use client";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  hint?: React.ReactNode;
  glyph?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  hint,
  glyph,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border border-hairline rounded-2xl",
        "bg-bg-primary",
        "px-8 py-14 flex flex-col items-center text-center gap-3",
        className,
      )}
    >
      {glyph && (
        <div className="w-14 h-14 rounded-2xl bg-accent-wash text-accent flex items-center justify-center text-[22px] leading-none mb-1 shadow-[var(--shadow-1)]">
          {glyph}
        </div>
      )}
      <h2 className="text-[17px] font-semibold text-ink-0 m-0">{title}</h2>
      {hint && (
        <p className="text-sm text-ink-2 leading-relaxed max-w-[42ch] m-0">
          {hint}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Headline shown in the editorial display style. */
  title: string;
  /** One-line guidance below the title. */
  hint?: React.ReactNode;
  /** Optional icon glyph or short ascii sigil. */
  glyph?: React.ReactNode;
  /** Primary action (e.g. "新建任务"). */
  action?: React.ReactNode;
  className?: string;
}

/** Editorial empty state — replaces the bare "@" + sentence pattern
 *  used on task detail / approvals / etc. Renders a striped paper card
 *  with a centered title block. */
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
        "relative overflow-hidden border-[1.5px] border-ink-0 rounded-2xl",
        "bg-paper-0 shadow-[var(--shadow-current)]",
        "px-8 py-12 flex flex-col items-center text-center gap-4",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-2 pending-stripes opacity-80"
      />
      {glyph && (
        <div className="text-ink-0 text-5xl leading-none mb-1">{glyph}</div>
      )}
      <h2 className="editorial-title text-[clamp(28px,3vw,40px)] m-0 text-ink-0">
        {title}
      </h2>
      {hint && <p className="editorial-deck max-w-[42ch]">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

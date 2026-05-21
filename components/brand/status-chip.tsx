"use client";

import { cn } from "@/lib/utils";

export type Status =
  | "open"
  | "in_progress"
  | "done"
  | "blocked"
  | "archived"
  | "queued";

const labels: Record<Status, string> = {
  open: "待办",
  in_progress: "进行中",
  done: "完成",
  blocked: "阻塞",
  archived: "归档",
  queued: "排队中",
};

const chipBase =
  "inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md text-[11px] font-medium whitespace-nowrap border";

const chipVariant: Record<Status, string> = {
  open: "bg-paper-1 text-ink-1 border-hairline",
  in_progress: "bg-accent-wash text-accent border-accent-wash-2",
  done: "bg-paper-1 text-ink-2 border-hairline",
  blocked:
    "bg-[color-mix(in_srgb,var(--state-failed)_8%,transparent)] text-state-failed border-[color-mix(in_srgb,var(--state-failed)_22%,transparent)]",
  queued: "bg-paper-1 text-ink-2 border-dashed border-hairline",
  archived: "bg-transparent text-ink-3 border-transparent opacity-70",
};

const dotVariant: Record<Status, string> = {
  open: "w-1.5 h-1.5 rounded-full bg-ink-3",
  in_progress: "w-1.5 h-1.5 rounded-full bg-accent animate-status-pulse",
  done: "w-1.5 h-1.5 rounded-full bg-accent-moss",
  blocked: "w-1.5 h-1.5 rounded-full bg-state-failed",
  queued: "w-1.5 h-1.5 rounded-full border border-dashed border-ink-3",
  archived: "hidden",
};

export interface StatusChipProps {
  status: Status;
}

export function StatusChip({ status }: StatusChipProps) {
  return (
    <span data-status={status} className={cn(chipBase, chipVariant[status])}>
      <span className={dotVariant[status]} aria-hidden />
      {labels[status]}
    </span>
  );
}

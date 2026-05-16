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
  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-bold whitespace-nowrap";

const chipVariant: Record<Status, string> = {
  open: "bg-paper-0 text-ink-0 border-[1.5px] border-ink-0",
  in_progress: "bg-ink-0 text-paper-0 border-[1.5px] border-ink-0",
  done: "bg-paper-2 text-ink-2 border-[1.5px] border-hairline",
  blocked: "bg-paper-0 text-ink-0 border-[1.5px] border-ink-0",
  queued: "bg-paper-0 text-ink-0 border-[1.5px] border-ink-0",
  archived: "text-status-archived-fg opacity-60",
};

const dotVariant: Record<Status, string> = {
  open: "w-1.5 h-1.5 border-[1.5px] border-ink-0",
  in_progress: "w-1.5 h-1.5 bg-paper-0 animate-status-pulse",
  done: "w-1.5 h-1.5 bg-ink-2 rounded-full",
  blocked:
    "w-1.5 h-1.5 bg-[repeating-linear-gradient(45deg,var(--ink-0)_0_2px,transparent_2px_4px)]",
  queued: "w-1.5 h-1.5 rounded-full border-[1.5px] border-dashed border-ink-0",
  archived: "hidden",
};

export interface StatusChipProps {
  status: Status;
}

export function StatusChip({ status }: StatusChipProps) {
  return (
    <span data-status={status} className={cn(chipBase, chipVariant[status])}>
      <span className={dotVariant[status]} />
      {labels[status]}
    </span>
  );
}

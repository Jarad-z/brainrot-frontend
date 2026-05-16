import type { TaskStatus } from "@/lib/api/types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const labelMap: Record<TaskStatus, string> = {
  open: "未开始",
  in_progress: "进行中",
  done: "已完成",
  blocked: "阻塞",
  archived: "已归档",
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  if (status === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
        <span className="inline-block w-3 h-3 border-[1.5px] border-ink-2" aria-hidden />
        {labelMap.open}
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs"
        style={{ color: "var(--status-in_progress-fg)" }}
      >
        <span
          className="inline-block w-3 h-3 animate-pulse"
          style={{ background: "var(--status-in_progress-bg)" }}
          aria-hidden
        />
        {labelMap.in_progress}
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: "var(--status-done-bg)" }}
          aria-hidden
        />
        {labelMap.done}
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-0">
        <span
          className="inline-block w-3 h-3"
          style={{
            background:
              "repeating-linear-gradient(45deg, var(--ink-0), var(--ink-0) 2px, transparent 2px, transparent 4px)",
          }}
          aria-hidden
        />
        {labelMap.blocked}
      </span>
    );
  }
  return (
    <span className="text-xs" style={{ color: "var(--status-archived-fg)" }}>
      {labelMap.archived}
    </span>
  );
}

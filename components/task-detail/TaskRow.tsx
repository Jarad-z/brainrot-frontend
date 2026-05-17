"use client";
import Link from "next/link";
import { StatusChip } from "@/components/brand/status-chip";
import { relativeTime } from "@/lib/format";
import type { TaskCard } from "@/lib/api/types";

interface TaskRowProps {
  task: TaskCard;
  wsId: string;
  projectId: string;
  active: boolean;
}

export function TaskRow({ task, wsId, projectId, active }: TaskRowProps) {
  return (
    <Link
      href={`/w/${wsId}/p/${projectId}/t/${task.id}`}
      data-active={active}
      className={`block px-4 py-3 border-b-[1.5px] border-hairline hover:bg-paper-2 ${active ? "bg-paper-1" : ""}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-semibold text-sm text-ink-0 truncate flex-1">{task.title}</span>
        <span className="font-mono text-[11px] text-ink-2">{relativeTime(task.updated_at)}</span>
      </div>
      {task.summary && <div className="text-xs text-ink-2 line-clamp-2 mb-2">{task.summary}</div>}
      <div className="flex items-center gap-2">
        <StatusChip status={task.status} />
      </div>
    </Link>
  );
}

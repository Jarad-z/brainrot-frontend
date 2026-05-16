"use client";
import { StatusChip } from "@/components/brand/status-chip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/brand/tooltip";
import { IconButton } from "@/components/brand/icon-button";
import type { TaskCard } from "@/lib/api/types";

interface TaskHeaderProps {
  task: TaskCard | undefined;
  taskId: string;
}

export function TaskHeader({ task, taskId }: TaskHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 px-6 py-4 border-b-[1.5px] border-hairline bg-paper-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {task && <StatusChip status={task.status} />}
          <span className="font-mono text-[11px] text-ink-2">WK-{taskId.slice(-4)}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-ink-0 font-tight truncate">{task?.title ?? "…"}</h1>
        {task?.summary && <p className="text-sm text-ink-2 mt-1 line-clamp-2">{task.summary}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <IconButton disabled aria-label="更多">
                ⋯
              </IconButton>
            </span>
          </TooltipTrigger>
          <TooltipContent>S3 上线后启用</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

"use client";
import { StatusChip } from "@/components/brand/status-chip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/brand/tooltip";
import { IconButton } from "@/components/brand/icon-button";
import { CancelRunButton } from "./CancelRunButton";
import type { TaskCard } from "@/lib/api/types";

interface TaskHeaderProps {
  task: TaskCard | null | undefined;
  taskId: string;
}

export function TaskHeader({ task, taskId }: TaskHeaderProps) {
  const busy = Boolean(task?.busy);

  return (
    <header
      className="sticky top-0 z-10 px-5 py-3"
      style={{
        background:
          "linear-gradient(180deg, rgba(110,160,205,0.55) 0%, rgba(90,140,190,0.42) 100%)",
        borderBottom: "1px solid rgba(60,110,165,0.30)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(20,62,107,0.18)",
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          aria-hidden
          className={`relative w-2 h-2 rounded-full shrink-0 ${
            busy ? "bg-accent" : "bg-ink-3"
          }`}
        >
          {busy && (
            <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-60" />
          )}
        </span>

        {/* Title + inline summary share one truncating line */}
        <div className="flex items-baseline gap-2 min-w-0 flex-1">
          <h1 className="text-[16px] font-semibold tracking-[-0.012em] text-ink-0 leading-tight m-0 shrink-0 max-w-[40%] truncate">
            {task?.title ?? "…"}
          </h1>
          {task?.summary && (
            <span
              className="text-[12.5px] text-ink-2 truncate min-w-0 leading-tight"
              title={task.summary}
            >
              {task.summary}
            </span>
          )}
        </div>

        <span className="text-[11px] text-ink-3 shrink-0">
          WK-{taskId.slice(-4)}
        </span>

        {task && (
          <span className="shrink-0">
            <StatusChip status={task.status} />
          </span>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <CancelRunButton taskId={taskId} busy={busy} />
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
    </header>
  );
}

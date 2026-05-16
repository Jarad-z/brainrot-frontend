"use client";

import { Card } from "@/components/brand/card";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/brand/tooltip";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { relativeTime } from "@/lib/format";
import { messages } from "@/lib/messages";
import type { TaskCard as TaskCardType } from "@/lib/api/types";

interface TaskCardProps {
  task: TaskCardType;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="select-none">
            <Card className="p-4 opacity-60 cursor-not-allowed h-full">
              <h4 className="text-sm font-extrabold text-ink-0 mb-1 line-clamp-2 font-tight">
                {task.title}
              </h4>
              {task.summary && (
                <p className="text-xs text-ink-2 line-clamp-2 mb-3">{task.summary}</p>
              )}
              <div className="flex items-center justify-between mt-auto">
                <TaskStatusBadge status={task.status} />
                <span className="text-xs text-ink-2">{relativeTime(task.created_at)}</span>
              </div>
            </Card>
          </div>
        </TooltipTrigger>
        <TooltipContent>{messages.shell.taskDisabled}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

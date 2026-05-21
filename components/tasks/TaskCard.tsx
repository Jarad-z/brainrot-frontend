"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, MoreHorizontal } from "lucide-react";
import { Card } from "@/components/brand/card";
import { ConfirmDialog } from "@/components/brand/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { relativeTime } from "@/lib/format";
import { messages } from "@/lib/messages";
import { useSetTaskStatus } from "@/hooks/useSetTaskStatus";
import type { TaskCard as TaskCardType, TaskStatus } from "@/lib/api/types";

interface TaskCardProps {
  task: TaskCardType;
  wsId: string;
  projectId: string;
}

type SettableStatus = Exclude<TaskStatus, "archived">;
const STATUS_OPTIONS: readonly SettableStatus[] = ["open", "in_progress", "done", "blocked"];

export function TaskCard({ task, wsId, projectId }: TaskCardProps) {
  const m = messages.taskCard;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const setStatus = useSetTaskStatus(projectId);

  return (
    <div className="relative h-full">
      <Link
        href={`/w/${wsId}/p/${projectId}/t/${task.id}`}
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
      >
        <Card className="!p-4 cursor-pointer h-full flex flex-col hover:brightness-105 transition-all">
          <h4 className="text-[14px] font-semibold text-ink-0 mb-1 line-clamp-2 pr-7 leading-snug">
            {task.title}
          </h4>
          {/* Reserve summary slot so cards with/without summary line up */}
          <p className="text-[12px] text-ink-2 line-clamp-2 mb-3 min-h-[2.4em] leading-[1.4]">
            {task.summary || ""}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <TaskStatusBadge status={task.status} />
            <span className="text-[11px] text-ink-3">{relativeTime(task.created_at)}</span>
          </div>
        </Card>
      </Link>

      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={m.menu}
            onClick={(e) => e.preventDefault()}
            className="p-1 rounded-sm text-ink-2 hover:text-ink-0 hover:bg-paper-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-0"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
            <DropdownMenuLabel className="text-xs text-ink-2">
              {m.setStatus}
            </DropdownMenuLabel>
            {STATUS_OPTIONS.map((s) => {
              const current = task.status === s;
              return (
                <DropdownMenuItem
                  key={s}
                  disabled={current || setStatus.isPending}
                  onSelect={(e) => {
                    e.preventDefault();
                    if (current) return;
                    setStatus.mutate({ taskId: task.id, status: s });
                  }}
                >
                  <Check className={current ? "opacity-100" : "opacity-0"} />
                  {m.statusLabel[s]}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-state-failed focus:text-state-failed"
              onSelect={(e) => {
                e.preventDefault();
                setConfirmOpen(true);
              }}
            >
              {m.archive}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={m.archiveConfirmTitle}
        description={m.archiveConfirmBody(task.title)}
        confirmLabel={m.archiveConfirm}
        destructive
        onConfirm={() => {
          setStatus.mutate({ taskId: task.id, status: "archived" });
        }}
      />
    </div>
  );
}

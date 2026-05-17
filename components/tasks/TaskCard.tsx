"use client";

import Link from "next/link";
import { Card } from "@/components/brand/card";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { relativeTime } from "@/lib/format";
import type { TaskCard as TaskCardType } from "@/lib/api/types";

interface TaskCardProps {
  task: TaskCardType;
  wsId: string;
  projectId: string;
}

export function TaskCard({ task, wsId, projectId }: TaskCardProps) {
  return (
    <Link
      href={`/w/${wsId}/p/${projectId}/t/${task.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-0 rounded-md"
    >
      <Card className="p-4 cursor-pointer h-full hover:bg-paper-1">
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
    </Link>
  );
}

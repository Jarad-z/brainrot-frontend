"use client";
import Link from "next/link";
import { useTasks } from "@/hooks/useTasks";
import { useProject } from "@/hooks/useProject";
import { TaskRow } from "./TaskRow";

interface TaskListPaneProps {
  projectId: string;
  wsId: string;
  activeTaskId: string;
}

export function TaskListPane({ projectId, wsId, activeTaskId }: TaskListPaneProps) {
  const { data: tasks = [], isPending } = useTasks(projectId);
  const { data: project } = useProject(projectId);

  return (
    <aside className="aero-glass-soft rounded-xl flex flex-col min-h-0 overflow-hidden">
      <header className="px-3.5 pt-3.5 pb-2.5 flex items-center gap-2">
        <Link
          href={`/w/${wsId}/p/${projectId}`}
          className="grid place-items-center w-6 h-6 rounded-md text-ink-2 hover:bg-paper-2 hover:text-ink-0 transition-colors text-sm shrink-0"
          aria-label="返回项目板"
        >
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13px] text-ink-0 truncate leading-tight">
            {project?.name ?? "…"}
          </div>
          <div className="text-[11px] text-ink-3 mt-0.5">{tasks.length} 个任务</div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isPending && (
          <div className="px-2 space-y-2 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-paper-2/60 rounded-xl animate-pulse" />
            ))}
          </div>
        )}
        {!isPending &&
          tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              wsId={wsId}
              projectId={projectId}
              active={t.id === activeTaskId}
            />
          ))}
      </div>
    </aside>
  );
}

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
    <aside className="border-r-[1.5px] border-hairline bg-paper-0 flex flex-col min-h-0">
      <header className="px-4 py-3 border-b-[1.5px] border-hairline flex items-center gap-2">
        <Link
          href={`/w/${wsId}/p/${projectId}`}
          className="text-ink-2 hover:text-ink-0 text-sm"
          aria-label="返回项目板"
        >
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-sm truncate">{project?.name ?? "…"}</div>
          <div className="text-xs text-ink-2">{tasks.length} 个任务</div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        {isPending && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-paper-2 rounded-sm animate-pulse" />
            ))}
          </div>
        )}
        {!isPending && tasks.map((t) => (
          <TaskRow key={t.id} task={t} wsId={wsId} projectId={projectId} active={t.id === activeTaskId} />
        ))}
      </div>
    </aside>
  );
}

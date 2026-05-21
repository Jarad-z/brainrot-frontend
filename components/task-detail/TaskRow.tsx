"use client";
import Link from "next/link";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { relativeTime } from "@/lib/format";
import { agentColor } from "@/components/brand/avatar";
import type { TaskCard } from "@/lib/api/types";

interface TaskRowProps {
  task: TaskCard;
  wsId: string;
  projectId: string;
  active: boolean;
}

const STATUS_DOT: Record<TaskCard["status"], string> = {
  open: "bg-ink-3",
  in_progress: "bg-accent",
  done: "bg-accent-moss",
  blocked: "bg-state-failed",
  archived: "bg-ink-3 opacity-40",
};

export function TaskRow({ task, wsId, projectId, active }: TaskRowProps) {
  const { data: agents = [] } = useWorkspaceAgents(wsId);
  const agentsMap = new Map(agents.map((a) => [a.id, a]));
  const taskAgents = (task.agents ?? []).slice(0, 3);

  return (
    <Link
      href={`/w/${wsId}/p/${projectId}/t/${task.id}`}
      data-active={active}
      title={task.summary || task.title}
      className={`block my-0.5 px-2.5 py-2 rounded-md transition-all group border ${
        active
          ? "aero-active border-transparent text-white"
          : "border-transparent hover:bg-white/50 hover:border-white/55"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          aria-hidden
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[task.status]} ${
            task.busy ? "animate-status-pulse" : ""
          }`}
        />
        <span
          className={`text-[13px] truncate flex-1 ${
            active
              ? "font-semibold text-white"
              : "font-medium text-ink-1 group-hover:text-ink-0"
          }`}
        >
          {task.title}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-1 pl-3.5">
        <span className={`text-[10.5px] truncate ${active ? "text-white/85" : "text-ink-3"}`}>
          {relativeTime(task.updated_at)}
        </span>
        {taskAgents.length > 0 && (
          <div className="flex -space-x-1 shrink-0">
            {taskAgents.map((id) => {
              const a = agentsMap.get(id);
              if (!a) return null;
              const c = agentColor(a.handle);
              return (
                <span
                  key={id}
                  className="grid place-items-center w-4 h-4 rounded-full text-[8px] font-bold text-paper-0 ring-2 ring-paper-0"
                  style={{ background: c }}
                  title={`@${a.handle}`}
                  aria-label={a.name}
                >
                  {a.name.slice(0, 1).toUpperCase()}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </Link>
  );
}

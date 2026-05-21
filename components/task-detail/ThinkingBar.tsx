"use client";
import { useActiveRuns } from "@/hooks/useActiveRuns";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { Avatar } from "@/components/brand/avatar";

interface ThinkingBarProps {
  taskId: string;
  wsId: string;
}

export function ThinkingBar({ taskId, wsId }: ThinkingBarProps) {
  const runs = useActiveRuns(taskId);
  const { data: agents = [] } = useWorkspaceAgents(wsId);

  if (runs.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-6 py-2.5 border-t-[1.5px] border-ink-0 pending-stripes text-paper-0 text-xs">
      <span className="w-2 h-2 rounded-full bg-paper-0 animate-pulse shrink-0" />
      {runs.map((r) => {
        const a = r.agentId ? agents.find((x) => x.id === r.agentId) : undefined;
        return (
          <span key={r.runId} className="flex items-center gap-1.5">
            <Avatar name={a?.name ?? "agent"} size={20} />
            <span className="font-semibold">@{a?.handle ?? "agent"}</span>
          </span>
        );
      })}
      <span className="text-paper-0/80">正在思考…</span>
    </div>
  );
}

"use client";
import { useActiveRuns } from "@/hooks/useActiveRuns";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { Avatar, agentColor } from "@/components/brand/avatar";

interface ThinkingBarProps {
  taskId: string;
  wsId: string;
}

export function ThinkingBar({ taskId, wsId }: ThinkingBarProps) {
  const runs = useActiveRuns(taskId);
  const { data: agents = [] } = useWorkspaceAgents(wsId);

  if (runs.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-hairline bg-bg-secondary text-ink-2 text-[12px]">
      <span className="w-1.5 h-1.5 rounded-full bg-state-running animate-status-pulse shrink-0" />
      {runs.map((r) => {
        const a = r.agentId ? agents.find((x) => x.id === r.agentId) : undefined;
        const color = agentColor(a?.handle ?? "agent");
        return (
          <span key={r.runId} className="flex items-center gap-1.5">
            <Avatar name={a?.name ?? "agent"} color={color} size={18} radius={4} />
            <span className="font-medium" style={{ color }}>@{a?.handle ?? "agent"}</span>
          </span>
        );
      })}
      <span className="text-ink-3">正在思考…</span>
    </div>
  );
}

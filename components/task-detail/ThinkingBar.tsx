"use client";
import { useActiveRuns } from "@/hooks/useActiveRuns";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { agentColor } from "@/components/brand/avatar";

interface ThinkingBarProps {
  taskId: string;
  wsId: string;
}

export function ThinkingBar({ taskId, wsId }: ThinkingBarProps) {
  const runs = useActiveRuns(taskId);
  const { data: agents = [] } = useWorkspaceAgents(wsId);

  if (runs.length === 0) return null;

  return (
    <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-wash text-[11.5px] text-ink-1">
      <span className="relative w-1.5 h-1.5 rounded-full bg-accent shrink-0">
        <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-60" />
      </span>
      {runs.map((r, i) => {
        const a = r.agentId ? agents.find((x) => x.id === r.agentId) : undefined;
        const color = agentColor(a?.handle ?? "agent");
        return (
          <span key={r.runId} className="flex items-center gap-1">
            {i > 0 && <span className="text-ink-3">,</span>}
            <span className="font-semibold" style={{ color }}>
              @{a?.handle ?? "agent"}
            </span>
          </span>
        );
      })}
      <span className="text-ink-2">在思考</span>
      <span className="flex gap-0.5 ml-0.5">
        <span className="w-1 h-1 rounded-full bg-ink-3 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1 h-1 rounded-full bg-ink-3 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1 h-1 rounded-full bg-ink-3 animate-bounce" style={{ animationDelay: "300ms" }} />
      </span>
    </div>
  );
}

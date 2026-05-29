"use client";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/brand/dialog";
import { agentColor } from "@/components/brand/avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { useChatUIStore } from "@/lib/store/chat-ui";
import { useAgentTrace } from "@/hooks/useAgentTrace";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { TraceRunSection } from "./parts/TraceRunSection";

interface AgentTraceModalProps {
  taskId: string;
  wsId: string;
}

export function AgentTraceModal({ taskId, wsId }: AgentTraceModalProps) {
  const traceAgentId = useChatUIStore((s) => s.byTask[taskId]?.traceAgentId ?? null);
  const closeTrace = useChatUIStore((s) => s.closeTrace);
  const { data: agents = [] } = useWorkspaceAgents(wsId);
  const { groups, isPending } = useAgentTrace(taskId, traceAgentId);

  const agent = agents.find((a) => a.id === traceAgentId);
  const name = agent?.name ?? "Agent";
  const handle = agent?.handle ?? "agent";
  const color = agentColor(handle);
  const open = traceAgentId !== null;
  const runCount = groups.filter((g) => g.runId !== null).length;

  // Clear this task's open-trace state when the pane unmounts or the task
  // changes, so navigating away and back doesn't re-open a stale modal.
  useEffect(() => {
    return () => closeTrace(taskId);
  }, [taskId, closeTrace]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) closeTrace(taskId);
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-w-2xl w-full max-h-[80vh] flex flex-col gap-0 p-0 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-hairline">
          <span
            className="grid place-items-center text-white font-semibold shrink-0"
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              fontSize: 14,
              background: `linear-gradient(180deg, color-mix(in srgb, ${color} 60%, white) 0%, ${color} 100%)`,
              border: "1px solid rgba(255,255,255,0.55)",
            }}
            aria-hidden
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-[15px] font-bold text-ink-0 page-title m-0">
              「{name}」的执行轨迹
            </DialogTitle>
            <div className="text-[12px] text-ink-3">
              @{handle} · 本任务共 {runCount} 个运行
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {isPending && groups.length === 0 ? (
            <div className="text-[12px] text-ink-3 py-8 text-center">加载中…</div>
          ) : groups.length === 0 ? (
            <EmptyState
              title="还没有执行记录"
              description="这个 agent 尚未在本任务里执行过。"
            />
          ) : (
            groups.map((g, i) => (
              <TraceRunSection
                key={g.runId ?? `null-${i}`}
                group={g}
                index={i}
                defaultOpen={i === 0}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

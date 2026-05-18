"use client";

import { useParams } from "next/navigation";
import { useAgent } from "@/hooks/useAgent";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { AgentForm } from "@/components/agents/AgentForm";
import { ArchiveAgentButton } from "@/components/agents/ArchiveAgentButton";
import { messages } from "@/lib/messages";

export default function AgentDetailPage() {
  const { wsId, agentId } = useParams<{ wsId: string; agentId: string }>();
  const { data: agent, isLoading } = useAgent(wsId, agentId);
  const { data: runtimes = [] } = useWorkspaceRuntimes(wsId);

  if (isLoading) return <main className="p-6 text-sm text-ink-2">加载中…</main>;
  if (!agent) return <main className="p-6 text-sm text-state-failed">Agent 不存在</main>;

  return (
    <main className="p-6 overflow-y-auto h-full">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">@{agent.handle}</h1>
        {!agent.archived ? <ArchiveAgentButton wsId={wsId} agentId={agentId} /> : null}
      </header>
      {agent.archived ? (
        <p className="text-xs text-ink-2 mb-3 italic">
          {messages.agents.archivedBadge} — 仅可查看，不可编辑
        </p>
      ) : (
        <p className="text-xs text-ink-2 mb-3 italic">
          编辑暂未开放（后端 PATCH /agents/{"{id}"} 未就绪，BACKEND_GAPS #22）。当前页面为只读。
        </p>
      )}
      <AgentForm
        mode="edit"
        initial={agent}
        runtimes={runtimes}
        isSubmitting={false}
        submitError="编辑暂不可用"
        onSubmit={() => {
          /* PATCH endpoint missing; intentionally a no-op */
        }}
      />
    </main>
  );
}

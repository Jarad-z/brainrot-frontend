"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAgent } from "@/hooks/useAgent";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { useUpdateAgent } from "@/hooks/useUpdateAgent";
import { AgentForm } from "@/components/agents/AgentForm";
import { ArchiveAgentButton } from "@/components/agents/ArchiveAgentButton";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

export default function AgentDetailPage() {
  const { wsId, agentId } = useParams<{ wsId: string; agentId: string }>();
  const { data: agent, isLoading } = useAgent(agentId);
  const { data: runtimes = [] } = useWorkspaceRuntimes(wsId);
  const mutation = useUpdateAgent(wsId, agentId);
  const [error, setError] = useState<string | null>(null);

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
      ) : null}
      <AgentForm
        mode="edit"
        initial={agent}
        runtimes={runtimes}
        isSubmitting={mutation.isPending}
        submitError={error}
        onSubmit={async (input) => {
          setError(null);
          try {
            await mutation.mutateAsync(input);
          } catch (e) {
            if (e instanceof ApiError && e.status === 409) {
              setError(messages.agents.form.handleConflict);
            } else {
              setError((e as Error).message);
            }
          }
        }}
      />
    </main>
  );
}

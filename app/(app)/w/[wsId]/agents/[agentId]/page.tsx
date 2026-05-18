"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useAgent } from "@/hooks/useAgent";
import { useUpdateAgent } from "@/hooks/useUpdateAgent";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { AgentForm } from "@/components/agents/AgentForm";
import { ArchiveAgentButton } from "@/components/agents/ArchiveAgentButton";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";
import type { AgentInput } from "@/lib/api/types";

export default function AgentDetailPage() {
  const { wsId, agentId } = useParams<{ wsId: string; agentId: string }>();
  const { data: agent, isLoading } = useAgent(agentId);
  const { data: runtimes = [] } = useWorkspaceRuntimes(wsId);
  const mutation = useUpdateAgent(wsId, agentId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isLoading) return <main className="p-6 text-sm text-ink-2">加载中…</main>;
  if (!agent) return <main className="p-6 text-sm text-state-failed">Agent 不存在</main>;

  async function onSubmit(input: AgentInput) {
    setSubmitError(null);
    // handle is read-only on PATCH; runtime_id is set at create time and not editable here.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { handle: _handle, runtime_id: _runtimeId, ...patch } = input;
    try {
      await mutation.mutateAsync(patch);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError(messages.agents.form.handleConflict);
      } else {
        setSubmitError((err as Error).message);
      }
    }
  }

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
        isSubmitting={agent.archived || mutation.isPending}
        submitError={submitError}
        onSubmit={onSubmit}
        key={agent.updated_at}
      />
    </main>
  );
}

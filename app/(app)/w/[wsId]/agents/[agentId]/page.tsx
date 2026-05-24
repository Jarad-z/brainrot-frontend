"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useAgent } from "@/hooks/useAgent";
import { useUpdateAgent } from "@/hooks/useUpdateAgent";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { useSession } from "@/hooks/useSession";
import { AgentForm } from "@/components/agents/AgentForm";
import { ArchiveAgentButton } from "@/components/agents/ArchiveAgentButton";
import { PublishAgentToggle } from "@/components/agent/PublishAgentToggle";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";
import type { AgentInput } from "@/lib/api/types";

export default function AgentDetailPage() {
  const { wsId, agentId } = useParams<{ wsId: string; agentId: string }>();
  const { data: agent, isLoading } = useAgent(agentId);
  const { data: runtimes = [] } = useWorkspaceRuntimes(wsId);
  // List endpoint returns AgentRefView (with is_installed/visibility/install_id)
  // — the single-agent GET does not. Use the list cache to discover those fields.
  const { data: refList = [] } = useWorkspaceAgents(wsId);
  const agentRef = refList.find((a) => a.id === agentId);
  const { data: me } = useSession();
  const mutation = useUpdateAgent(wsId, agentId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isLoading) return <main className="p-6 text-sm text-ink-2">加载中…</main>;
  if (!agent) return <main className="p-6 text-sm text-state-failed">Agent 不存在</main>;

  // Only the user whose runtime hosts this agent can edit or archive it.
  // Workspace owners do not override — agents are a personal resource. We
  // discover ownership by looking up the agent's runtime in the runtimes list.
  const ownerRuntime = runtimes.find((r) => r.id === agent.runtime_id);
  const isMine = !!(me && ownerRuntime && ownerRuntime.user_id === me.id);

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
        {!agent.archived && isMine ? <ArchiveAgentButton wsId={wsId} agentId={agentId} /> : null}
      </header>
      {agent.archived ? (
        <p className="text-xs text-ink-2 mb-3 italic">
          {messages.agents.archivedBadge} — 仅可查看，不可编辑
        </p>
      ) : null}
      {!agent.archived && !isMine ? (
        <p className="text-xs text-ink-2 mb-3 italic">
          这个 agent 由其他成员发布，跑在他们的设备上。只有发布者本人可以编辑或归档。
        </p>
      ) : null}
      <fieldset disabled={agent.archived || !isMine} className="border-none p-0 m-0 min-w-0">
        <AgentForm
          mode="edit"
          initial={agent}
          runtimes={runtimes}
          isSubmitting={mutation.isPending}
          submitError={submitError}
          onSubmit={onSubmit}
          key={agent.updated_at}
        />
      </fieldset>
      {isMine && !agent.archived && agentRef && (
        <PublishAgentToggle agent={agentRef} />
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { useSession } from "@/hooks/useSession";
import { messages } from "@/lib/messages";
import {
  PageHeader,
  PageTitle,
  PageSub,
  PageHeaderTitleBlock,
  PageHeaderActions,
} from "@/components/brand/page-header";
import { AgentCard } from "@/components/brand/agent-card";
import { EmptyState } from "@/components/brand/empty-state";
import { uninstallAgent } from "@/lib/api/marketplace";
import { queryKeys } from "@/lib/api/keys";
import { ApiError } from "@/lib/api/client";
import type { AgentRefView, WorkspaceMember } from "@/lib/api/types";

export default function AgentsListPage() {
  const { wsId } = useParams<{ wsId: string }>();
  const router = useRouter();
  const { data: agents = [], isLoading } = useWorkspaceAgents(wsId);
  const { data: runtimes = [] } = useWorkspaceRuntimes(wsId);
  const { data: members = [] } = useWorkspaceMembers(wsId);
  const { data: me } = useSession();
  const [showArchived, setShowArchived] = useState(false);

  const onlineRuntimeIds = new Set(runtimes.filter((r) => r.online).map((r) => r.id));
  // runtime_id → user_id and user_id → member name. Together they let an
  // agent be labelled with its publisher's name without an extra fetch.
  const runtimeToUser = new Map(runtimes.map((r) => [r.id, r.user_id] as const));
  const memberById = new Map(members.map((mem) => [mem.user_id, mem] as const));
  const visible = showArchived ? agents : agents.filter((a) => !a.archived);

  // Split own (workspace-native) agents from marketplace-installed refs.
  // is_installed is set by the AgentRefView backend response (Task 6).
  const ownAgents = visible.filter((a) => !a.is_installed);
  const installedAgents = visible.filter((a) => a.is_installed);

  return (
    <main className="p-7 overflow-y-auto h-full">
      <PageHeader editorial>
        <PageHeaderTitleBlock>
          <PageTitle editorial>{messages.agents.listTitle}</PageTitle>
          <PageSub editorial>
            工作区里的 agent 团队。每位 agent 有自己的句柄、模型与人格。
          </PageSub>
        </PageHeaderTitleBlock>
        <PageHeaderActions>
          <label className="flex items-center gap-1.5 text-xs text-ink-2 font-semibold">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="accent-ink-0"
            />
            {messages.agents.showArchived}
          </label>
          <Link
            href={`/w/${wsId}/agents/new`}
            className="ink-stamp active:ink-stamp-active px-4 py-2 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-md font-semibold text-sm shadow-[var(--shadow-current)]"
          >
            {messages.agents.newCta}
          </Link>
        </PageHeaderActions>
      </PageHeader>

      {isLoading ? (
        <p className="text-sm text-ink-2">加载中…</p>
      ) : visible.length === 0 ? (
        <EmptyState
          glyph="@"
          title={
            agents.length === 0
              ? messages.agents.emptyTitle
              : messages.agents.emptyAllArchived
          }
          hint={
            agents.length === 0 ? (
              <>
                新建一位 agent，或去{" "}
                <Link
                  href="/marketplace"
                  className="font-semibold text-ink-0 underline"
                >
                  marketplace
                </Link>{" "}
                安装一位。
              </>
            ) : (
              "新建一位 agent，给他一个 handle、一个模型，让他开干。"
            )
          }
          action={
            <Link
              href={`/w/${wsId}/agents/new`}
              className="ink-stamp active:ink-stamp-active inline-block px-4 py-2 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-md font-semibold text-sm shadow-[var(--shadow-current)]"
            >
              {messages.agents.newCta}
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          {ownAgents.length > 0 && (
            <AgentGroup heading="自有 agent">
              {ownAgents.map((a) => (
                <li
                  key={a.id}
                  className={a.archived ? "opacity-60" : undefined}
                >
                  <AgentCard
                    handle={a.handle}
                    name={a.name || `@${a.handle}`}
                    model={a.model ?? "—"}
                    online={onlineRuntimeIds.has(a.runtime_id)}
                    description={a.description || undefined}
                    avatarGlyph={a.handle.charAt(0).toUpperCase()}
                    ownerName={
                      ownerNameFor(a, runtimeToUser, memberById)
                    }
                    isMine={isMineFor(a, runtimeToUser, me?.id)}
                    onClick={() => router.push(`/w/${wsId}/agents/${a.id}`)}
                  />
                  {a.archived && (
                    <span className="mt-2 inline-block px-1.5 py-0.5 bg-paper-1 border-[1.5px] border-hairline rounded text-[11px] font-bold text-ink-2">
                      {messages.agents.archivedBadge}
                    </span>
                  )}
                </li>
              ))}
            </AgentGroup>
          )}

          {installedAgents.length > 0 && (
            <AgentGroup heading="从 marketplace 安装">
              {installedAgents.map((a) => (
                <li
                  key={a.id}
                  className={a.archived ? "opacity-60" : undefined}
                >
                  <InstalledAgentCard
                    wsId={wsId}
                    agent={a}
                    online={onlineRuntimeIds.has(a.runtime_id)}
                    ownerName={ownerNameFor(a, runtimeToUser, memberById)}
                  />
                  {a.archived && (
                    <span className="mt-2 inline-block px-1.5 py-0.5 bg-paper-1 border-[1.5px] border-hairline rounded text-[11px] font-bold text-ink-2">
                      {messages.agents.archivedBadge}
                    </span>
                  )}
                </li>
              ))}
            </AgentGroup>
          )}
        </div>
      )}
    </main>
  );
}

function AgentGroup({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-2">
        {heading}
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 list-none p-0">
        {children}
      </ul>
    </section>
  );
}

function ownerNameFor(
  a: AgentRefView,
  runtimeToUser: Map<string, string>,
  memberById: Map<string, WorkspaceMember>,
): string | null {
  const ownerUserId = runtimeToUser.get(a.runtime_id) ?? null;
  const owner = ownerUserId ? memberById.get(ownerUserId) : null;
  return owner?.name ?? null;
}

function isMineFor(
  a: AgentRefView,
  runtimeToUser: Map<string, string>,
  meId: string | undefined,
): boolean {
  const ownerUserId = runtimeToUser.get(a.runtime_id) ?? null;
  return !!(meId && ownerUserId && ownerUserId === meId);
}

interface InstalledAgentCardProps {
  wsId: string;
  agent: AgentRefView;
  online: boolean;
  ownerName: string | null;
}

function InstalledAgentCard({
  wsId,
  agent,
  online,
  ownerName,
}: InstalledAgentCardProps) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const installId = agent.install_id;

  const mutation = useMutation({
    mutationFn: () => {
      if (!installId) throw new Error("missing install_id");
      return uninstallAgent(wsId, installId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.agents(wsId) });
      qc.invalidateQueries({ queryKey: queryKeys.installs.workspace(wsId) });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setError(err.body || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Uninstall failed");
      }
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <AgentCard
        handle={agent.effective_handle || agent.handle}
        name={agent.name || `@${agent.handle}`}
        model={agent.model ?? "—"}
        online={online}
        description={agent.description || undefined}
        avatarGlyph={(agent.effective_handle || agent.handle)
          .charAt(0)
          .toUpperCase()}
        ownerName={ownerName}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="inline-block px-1.5 py-0.5 bg-paper-2 border-[1.5px] border-hairline rounded text-[11px] font-bold text-ink-2">
          已安装
        </span>
        <button
          type="button"
          onClick={() => {
            setError(null);
            mutation.mutate();
          }}
          disabled={mutation.isPending || !installId}
          className="px-2.5 py-1 border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold text-xs disabled:opacity-60"
        >
          {mutation.isPending ? "卸载中…" : "卸载"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-state-failed m-0">{error}</p>
      )}
    </div>
  );
}

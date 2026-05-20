"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
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

export default function AgentsListPage() {
  const { wsId } = useParams<{ wsId: string }>();
  const router = useRouter();
  const { data: agents = [], isLoading } = useWorkspaceAgents(wsId);
  const { data: runtimes = [] } = useWorkspaceRuntimes(wsId);
  const [showArchived, setShowArchived] = useState(false);

  const onlineRuntimeIds = new Set(runtimes.filter((r) => r.online).map((r) => r.id));
  const visible = showArchived ? agents : agents.filter((a) => !a.archived);

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
          hint="新建一位 agent，给他一个 handle、一个模型，让他开干。"
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
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 list-none p-0">
          {visible.map((a) => (
            <li key={a.id} className={a.archived ? "opacity-60" : undefined}>
              <AgentCard
                handle={a.handle}
                name={a.name || `@${a.handle}`}
                model={a.model ?? "—"}
                online={onlineRuntimeIds.has(a.runtime_id)}
                description={a.description || undefined}
                avatarGlyph={a.handle.charAt(0).toUpperCase()}
                onClick={() => router.push(`/w/${wsId}/agents/${a.id}`)}
              />
              {a.archived && (
                <span className="mt-2 inline-block px-1.5 py-0.5 bg-paper-1 border-[1.5px] border-hairline rounded text-[11px] font-bold text-ink-2">
                  {messages.agents.archivedBadge}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

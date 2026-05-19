"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { useIssueInstallToken } from "@/hooks/useIssueInstallToken";
import { InstallTokenModal } from "@/components/workspace/InstallTokenModal";
import type { InstallToken } from "@/lib/api/types";
import { messages } from "@/lib/messages";
import {
  PageHeader,
  PageTitle,
  PageSub,
  PageHeaderTitleBlock,
  PageHeaderActions,
} from "@/components/brand/page-header";
import { RuntimeCard } from "@/components/brand/runtime-card";
import { EmptyState } from "@/components/brand/empty-state";

export default function RuntimesPage() {
  const { wsId } = useParams<{ wsId: string }>();
  const { data: runtimes = [], isLoading } = useWorkspaceRuntimes(wsId);
  const issue = useIssueInstallToken(wsId);
  const [issued, setIssued] = useState<InstallToken | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  async function onIssue() {
    setIssueError(null);
    try {
      const tok = await issue.mutateAsync();
      setIssued(tok);
      setModalOpen(true);
    } catch (e) {
      setIssueError((e as Error).message);
    }
  }

  const m = messages.runtimes;

  return (
    <main className="p-7 overflow-y-auto h-full">
      <PageHeader editorial>
        <PageHeaderTitleBlock>
          <PageTitle editorial>{m.title}</PageTitle>
          <PageSub editorial>
            注册到工作区的执行机器。agent 进程在这里被孵化、调度、心跳。
          </PageSub>
        </PageHeaderTitleBlock>
        <PageHeaderActions>
          <button
            type="button"
            onClick={onIssue}
            disabled={issue.isPending}
            className="ink-stamp active:ink-stamp-active px-4 py-2 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-md font-semibold text-sm shadow-[var(--shadow-current)] disabled:opacity-60"
          >
            {m.issueToken}
          </button>
        </PageHeaderActions>
      </PageHeader>

      {issueError ? (
        <p className="text-sm text-state-failed mb-3">{issueError}</p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-ink-2">加载中…</p>
      ) : runtimes.length === 0 ? (
        <EmptyState
          glyph="♥"
          title={m.emptyTitle}
          hint={m.emptyHelp}
          action={
            <button
              type="button"
              onClick={onIssue}
              disabled={issue.isPending}
              className="ink-stamp active:ink-stamp-active px-4 py-2 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-md font-semibold text-sm shadow-[var(--shadow-current)]"
            >
              {m.issueToken}
            </button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 list-none p-0">
          {runtimes.map((r) => (
            <li key={r.id}>
              <RuntimeCard
                name={r.host}
                host={r.host}
                capacity={r.capacity}
                online={r.online}
                lastHeartbeat={
                  r.last_heartbeat
                    ? `${m.lastHeartbeat} ${r.last_heartbeat}`
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}

      <InstallTokenModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setIssued(null);
        }}
        token={issued}
      />
    </main>
  );
}

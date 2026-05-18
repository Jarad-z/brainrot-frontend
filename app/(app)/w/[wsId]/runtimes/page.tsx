"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { useIssueInstallToken } from "@/hooks/useIssueInstallToken";
import { RuntimeRow } from "@/components/runtimes/RuntimeRow";
import { InstallTokenModal } from "@/components/workspace/InstallTokenModal";
import type { InstallToken } from "@/lib/api/types";
import { messages } from "@/lib/messages";

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

  return (
    <main className="p-6 overflow-y-auto h-full">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">{messages.runtimes.title}</h1>
        <button
          type="button"
          onClick={onIssue}
          disabled={issue.isPending}
          className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
        >
          {messages.runtimes.issueToken}
        </button>
      </header>

      {issueError ? <p className="text-sm text-state-failed mb-3">{issueError}</p> : null}

      {isLoading ? (
        <p className="text-sm text-ink-2">加载中…</p>
      ) : runtimes.length === 0 ? (
        <div className="text-sm text-ink-2">
          <p className="font-semibold">{messages.runtimes.emptyTitle}</p>
          <p className="mt-1">{messages.runtimes.emptyHelp}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {runtimes.map((r) => (
            <RuntimeRow key={r.id} runtime={r} />
          ))}
        </ul>
      )}

      <InstallTokenModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setIssued(null); // clear secret from memory when closing
        }}
        token={issued}
      />
    </main>
  );
}

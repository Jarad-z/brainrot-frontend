"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import { useSession } from "@/hooks/useSession";
import { AddMemberModal } from "@/components/workspace/AddMemberModal";
import type { Workspace } from "@/lib/api/types";
import { messages } from "@/lib/messages";

function useWorkspace(wsId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.detail(wsId),
    queryFn: () => apiFetch<Workspace>(`/api/v1/workspaces/${wsId}`),
    enabled: !!wsId,
  });
}

export default function WorkspaceSettingsPage() {
  const { wsId } = useParams<{ wsId: string }>();
  const { data: ws, isLoading } = useWorkspace(wsId);
  const { data: me } = useSession();
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function copyId() {
    if (!me?.id) return;
    try {
      await navigator.clipboard.writeText(me.id);
      setToast("已复制");
      setTimeout(() => setToast(null), 1500);
    } catch {
      setToast("复制失败");
      setTimeout(() => setToast(null), 1500);
    }
  }

  const m = messages.settings;

  return (
    <main className="p-6 overflow-y-auto h-full max-w-2xl">
      <h1 className="text-lg font-bold mb-6">{m.title}</h1>

      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2">{m.basicSection}</h2>
        {isLoading || !ws ? (
          <p className="text-sm text-ink-2">加载中…</p>
        ) : (
          <dl className="text-sm grid grid-cols-[120px_1fr] gap-y-1.5">
            <dt className="text-ink-2">{m.nameLabel}</dt>
            <dd>{ws.name}</dd>
            <dt className="text-ink-2">{m.slugLabel}</dt>
            <dd className="font-mono">{ws.slug}</dd>
            <dt className="text-ink-2">{m.createdLabel}</dt>
            <dd>{ws.created_at}</dd>
          </dl>
        )}
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">{m.membersSection}</h2>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-xs"
          >
            {m.addMember}
          </button>
        </div>
        <p className="text-xs text-ink-2">{m.membersComingSoon}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2">{m.myIdSection}</h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-paper-2 border border-hairline rounded text-xs font-mono">
            {me?.id ?? "—"}
          </code>
          <button
            type="button"
            onClick={copyId}
            className="px-3 py-2 text-xs font-semibold border-[1.5px] border-ink-0 rounded-sm"
          >
            {toast ?? "复制"}
          </button>
        </div>
        <p className="text-xs text-ink-2 mt-1">{m.myIdHelp}</p>
      </section>

      <section className="border-t-[1.5px] border-hairline pt-4">
        <h2 className="text-sm font-semibold mb-2">{m.dangerSection}</h2>
        <p className="text-xs text-ink-2">{m.dangerHelp}</p>
      </section>

      <AddMemberModal
        open={addOpen}
        onOpenChange={setAddOpen}
        wsId={wsId}
        onAdded={() => {
          setToast(messages.addMember.success);
          setTimeout(() => setToast(null), 2000);
        }}
      />
    </main>
  );
}

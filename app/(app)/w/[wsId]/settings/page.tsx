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
import {
  PageHeader,
  PageTitle,
  PageSub,
  PageHeaderTitleBlock,
  PageHeaderActions,
} from "@/components/brand/page-header";
import { Card } from "@/components/brand/card";

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
    <main className="p-7 overflow-y-auto h-full max-w-3xl">
      <PageHeader editorial>
        <PageHeaderTitleBlock>
          <PageTitle editorial>{m.title}</PageTitle>
          <PageSub editorial>工作区基础信息、成员管理与危险操作。</PageSub>
        </PageHeaderTitleBlock>
        <PageHeaderActions>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="ink-stamp active:ink-stamp-active px-4 py-2 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-md font-semibold text-sm shadow-[var(--shadow-current)]"
          >
            {m.addMember}
          </button>
        </PageHeaderActions>
      </PageHeader>

      <div className="flex flex-col gap-4">
        <Card chunky className="p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2 font-bold mb-3">
            {m.basicSection}
          </h2>
          {isLoading || !ws ? (
            <p className="text-sm text-ink-2">加载中…</p>
          ) : (
            <dl className="text-sm grid grid-cols-[120px_1fr] gap-y-2">
              <dt className="text-ink-2">{m.nameLabel}</dt>
              <dd className="font-semibold">{ws.name}</dd>
              <dt className="text-ink-2">{m.slugLabel}</dt>
              <dd className="font-mono">{ws.slug}</dd>
              <dt className="text-ink-2">{m.createdLabel}</dt>
              <dd>{ws.created_at}</dd>
            </dl>
          )}
        </Card>

        <Card chunky className="p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2 font-bold mb-2">
            {m.membersSection}
          </h2>
          <p className="text-xs text-ink-2">{m.membersComingSoon}</p>
        </Card>

        <Card chunky className="p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2 font-bold mb-3">
            {m.myIdSection}
          </h2>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-paper-2 border-[1.5px] border-hairline rounded-md text-xs font-mono break-all">
              {me?.id ?? "—"}
            </code>
            <button
              type="button"
              onClick={copyId}
              className="ink-stamp active:ink-stamp-active px-3 py-2 text-xs font-semibold border-[1.5px] border-ink-0 rounded-md bg-paper-0 whitespace-nowrap"
            >
              {toast ?? "复制"}
            </button>
          </div>
          <p className="text-xs text-ink-2 mt-2">{m.myIdHelp}</p>
        </Card>

        <Card
          chunky
          className="p-5 border-state-failed"
          style={{ borderColor: "var(--state-failed)" }}
        >
          <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-state-failed font-bold mb-2">
            {m.dangerSection}
          </h2>
          <p className="text-xs text-ink-2">{m.dangerHelp}</p>
        </Card>
      </div>

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

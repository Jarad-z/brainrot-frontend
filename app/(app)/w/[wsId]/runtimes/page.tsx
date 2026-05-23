"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { useSession } from "@/hooks/useSession";
import { messages } from "@/lib/messages";
import {
  PageHeader,
  PageTitle,
  PageSub,
  PageHeaderTitleBlock,
} from "@/components/brand/page-header";
import { RuntimeCard } from "@/components/brand/runtime-card";
import { EmptyState } from "@/components/brand/empty-state";

export default function RuntimesPage() {
  const { wsId } = useParams<{ wsId: string }>();
  const { data: runtimes = [], isLoading } = useWorkspaceRuntimes(wsId);
  const { data: members = [] } = useWorkspaceMembers(wsId);
  const { data: me } = useSession();

  // membersById: user_id → display name + email. Lets us label each runtime
  // with the owning member instead of a bare host string.
  const membersById = useMemo(
    () => new Map(members.map((mem) => [mem.user_id, mem] as const)),
    [members],
  );

  const m = messages.runtimes;

  const sorted = useMemo(() => {
    // Show my own machine first, then online before offline, then by created.
    return [...runtimes].sort((a, b) => {
      const aMine = me ? a.user_id === me.id : false;
      const bMine = me ? b.user_id === me.id : false;
      if (aMine !== bMine) return aMine ? -1 : 1;
      if (a.online !== b.online) return a.online ? -1 : 1;
      return a.created_at < b.created_at ? 1 : -1;
    });
  }, [runtimes, me]);

  return (
    <main className="p-7 overflow-y-auto h-full">
      <PageHeader editorial>
        <PageHeaderTitleBlock>
          <PageTitle editorial>{m.title}</PageTitle>
          <PageSub editorial>{m.subtitle}</PageSub>
        </PageHeaderTitleBlock>
      </PageHeader>

      {isLoading ? (
        <p className="text-sm text-ink-2">加载中…</p>
      ) : runtimes.length === 0 ? (
        <EmptyState glyph="♥" title={m.emptyTitle} hint={m.emptyHelp} />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 list-none p-0">
          {sorted.map((r) => {
            const owner = membersById.get(r.user_id);
            const isMine = me ? r.user_id === me.id : false;
            const displayName = isMine
              ? `${owner?.name ?? me?.name ?? "我"}${m.runtimeOf}`
              : owner
                ? `${owner.name}${m.runtimeOf}`
                : r.name;
            const osArch =
              r.os && r.arch ? `${r.os}/${r.arch}` : r.os ?? r.arch ?? undefined;
            return (
              <li key={r.id}>
                <RuntimeCard
                  name={displayName}
                  ownerEmail={owner?.email ?? null}
                  host={r.host}
                  osArch={osArch}
                  capacity={r.capacity}
                  online={r.online}
                  isMine={isMine}
                  lastHeartbeat={
                    r.last_heartbeat
                      ? `${m.lastHeartbeat} ${r.last_heartbeat}`
                      : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

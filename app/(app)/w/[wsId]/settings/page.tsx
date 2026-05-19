"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import { WorkspaceInfoForm } from "@/components/workspace/WorkspaceInfoForm";
import { MembersList } from "@/components/workspace/MembersList";
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
  const m = messages.settings;
  const { wsId } = useParams<{ wsId: string }>();
  const { data: ws, isLoading } = useWorkspace(wsId);

  return (
    <main className="p-6 overflow-y-auto h-full max-w-2xl flex flex-col gap-8">
      <h1 className="text-lg font-bold">{m.title}</h1>

      <section>
        <h2 className="text-sm font-semibold mb-2">{m.basicSection}</h2>
        {isLoading || !ws ? (
          <p className="text-sm text-ink-2">加载中…</p>
        ) : (
          <WorkspaceInfoForm workspace={ws} />
        )}
      </section>

      <MembersList wsId={wsId} />

      <section className="border-t-[1.5px] border-hairline pt-4">
        <h2 className="text-sm font-semibold mb-2">{m.dangerSection}</h2>
        <button
          type="button"
          disabled
          title={m.dangerArchiveSoon}
          className="px-3 py-1.5 border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold text-sm opacity-50"
        >
          {m.dangerArchive}
        </button>
      </section>
    </main>
  );
}

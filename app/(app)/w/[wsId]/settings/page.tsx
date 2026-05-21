"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import { WorkspaceInfoForm } from "@/components/workspace/WorkspaceInfoForm";
import { MembersList } from "@/components/workspace/MembersList";
import { LeaveWorkspaceButton } from "@/components/workspace/LeaveWorkspaceButton";
import type { Workspace } from "@/lib/api/types";
import { messages } from "@/lib/messages";
import {
  PageHeader,
  PageTitle,
  PageSub,
  PageHeaderTitleBlock,
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
  const m = messages.settings;
  const { wsId } = useParams<{ wsId: string }>();
  const { data: ws, isLoading } = useWorkspace(wsId);

  return (
    <main className="p-7 overflow-y-auto h-full max-w-3xl">
      <PageHeader editorial>
        <PageHeaderTitleBlock>
          <PageTitle editorial>{m.title}</PageTitle>
          <PageSub editorial>工作区基础信息、成员管理与危险操作。</PageSub>
        </PageHeaderTitleBlock>
      </PageHeader>

      <div className="flex flex-col gap-4">
        <Card chunky className="p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2 font-bold mb-3">
            {m.basicSection}
          </h2>
          {isLoading || !ws ? (
            <p className="text-sm text-ink-2">加载中…</p>
          ) : (
            <WorkspaceInfoForm workspace={ws} />
          )}
        </Card>

        <Card chunky className="p-5">
          <MembersList wsId={wsId} />
        </Card>

        <Card chunky className="p-5">
          <h2 className="text-[11px] font-medium text-ink-2 mb-4">
            {m.dangerSection}
          </h2>
          <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-hairline">
            <button
              type="button"
              disabled
              title={m.dangerArchiveSoon}
              className="px-3 py-1.5 border border-hairline text-ink-2 rounded-lg text-sm font-medium opacity-50"
            >
              {m.dangerArchive}
            </button>
            {ws && <LeaveWorkspaceButton wsId={wsId} wsName={ws.name} />}
          </div>
        </Card>
      </div>
    </main>
  );
}

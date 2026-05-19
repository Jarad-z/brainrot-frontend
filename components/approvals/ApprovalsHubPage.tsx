"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWSClient } from "@/lib/ws/context";
import { useProjects } from "@/hooks/useProjects";
import { queryKeys } from "@/lib/api/keys";
import { useWorkspacePendingApprovals } from "@/hooks/useWorkspacePendingApprovals";
import { ApprovalHubCard } from "./ApprovalHubCard";
import { BulkApprovalsList } from "./BulkApprovalsList";
import { ToolFilterInput } from "./ToolFilterInput";
import { messages } from "@/lib/messages";
import type { TaskCard } from "@/lib/api/types";
import {
  PageHeader,
  PageTitle,
  PageSub,
  PageHeaderTitleBlock,
  PageHeaderActions,
} from "@/components/brand/page-header";
import { EmptyState } from "@/components/brand/empty-state";

interface ApprovalsHubPageProps {
  wsId: string;
}

export function ApprovalsHubPage({ wsId }: ApprovalsHubPageProps) {
  const qc = useQueryClient();
  const client = useWSClient();
  const { data: projects = [] } = useProjects(wsId);
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Collect all task IDs in the current workspace from cache.
  const taskIds = useMemo(() => {
    const ids: string[] = [];
    for (const p of projects) {
      const tasks =
        qc.getQueryData<TaskCard[]>(queryKeys.projects.tasks(p.id)) ?? [];
      for (const t of tasks) ids.push(t.id);
    }
    return ids;
  }, [qc, projects]);

  // Subscribe to every task in the workspace while the hub is open.
  // Depend on the join-string to avoid identity churn when the array reference
  // changes but contents don't.
  const taskIdsKey = taskIds.join(",");
  useEffect(() => {
    if (!client) return;
    const ids = taskIdsKey ? taskIdsKey.split(",") : [];
    ids.forEach((id) => client.subscribe("task", id));
    return () => {
      ids.forEach((id) => client.unsubscribe("task", id));
    };
  }, [taskIdsKey, client]);

  const approvals = useWorkspacePendingApprovals(wsId);
  const visible = useMemo(
    () =>
      filter
        ? approvals.filter((a) => a.toolName.toLowerCase().includes(filter))
        : approvals,
    [approvals, filter],
  );

  return (
    <div className="h-full overflow-y-auto p-7">
      <PageHeader editorial>
        <PageHeaderTitleBlock>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-accent rounded-full border-[1.5px] border-ink-0" />
            <PageTitle editorial>
              待审批 · {visible.length} 件
            </PageTitle>
          </div>
          <PageSub editorial>所有待你决定的工具调用。</PageSub>
        </PageHeaderTitleBlock>
        <PageHeaderActions>
          <ToolFilterInput onChange={setFilter} />
        </PageHeaderActions>
      </PageHeader>

      {visible.length === 0 ? (
        <EmptyState
          glyph="✓"
          title="全部处理完了"
          hint="队列里没有待你决定的工具调用，agent 安静着。"
        />
      ) : (
        <div className="max-w-3xl">
          <BulkApprovalsList
            items={visible}
            renderRow={(a) => <ApprovalHubCard approval={a} />}
            onResult={(r) => {
              if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
              setToast(messages.bulkApprovals.summarySimple(r.ok.length, r.fail.length));
              toastTimerRef.current = setTimeout(() => setToast(null), 3000);
            }}
          />
          {toast && (
            <div className="fixed bottom-4 right-4 px-3 py-2 bg-ink-0 text-paper-0 rounded-sm text-sm shadow-[var(--shadow-current)]">
              {toast}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

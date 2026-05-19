"use client";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWSClient } from "@/lib/ws/context";
import { useProjects } from "@/hooks/useProjects";
import { queryKeys } from "@/lib/api/keys";
import { useWorkspacePendingApprovals } from "@/hooks/useWorkspacePendingApprovals";
import { ApprovalHubCard } from "./ApprovalHubCard";
import { ToolFilterInput } from "./ToolFilterInput";
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
        <div className="flex flex-col gap-4 max-w-3xl">
          {visible.map((a) => (
            <ApprovalHubCard key={a.id} approval={a} />
          ))}
        </div>
      )}
    </div>
  );
}

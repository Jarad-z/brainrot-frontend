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
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-accent rounded-full" />
            <h1 className="text-2xl font-extrabold text-ink-0 page-title">
              待审批 · {visible.length} 件
            </h1>
          </div>
          <p className="text-sm text-ink-2 mt-1">所有待你决定的工具调用</p>
        </div>
        <ToolFilterInput onChange={setFilter} />
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-20 text-ink-2">
          <div className="text-4xl mb-2">✓</div>
          <div>全部处理完了</div>
        </div>
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

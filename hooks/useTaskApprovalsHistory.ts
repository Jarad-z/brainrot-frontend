"use client";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTaskApprovals } from "@/lib/api/approvals";
import { queryKeys } from "@/lib/api/keys";
import { useTaskMessages } from "./useTaskMessages";
import { useChatUIStore, getDecision } from "@/lib/store/chat-ui";
import { normalizeApprovalRequest } from "@/lib/approvals/derive";
import type { ApprovalRecord, ApprovalStatus } from "@/lib/approvals/types";
import type { ClientMessage, Project, TaskCard } from "@/lib/api/types";

type StatusFilter = ApprovalStatus | "all";

export interface UseTaskApprovalsHistoryResult {
  data: ApprovalRecord[] | undefined;
  isLoading: boolean;
  source: "api" | "derive" | "loading";
}

export function useTaskApprovalsHistory(
  taskId: string,
  filter: StatusFilter = "all",
): UseTaskApprovalsHistoryResult {
  const qc = useQueryClient();

  const apiQuery = useQuery({
    queryKey: queryKeys.approvals.task(taskId),
    queryFn: () => fetchTaskApprovals(taskId),
    enabled: !!taskId,
    staleTime: 30_000,
  });

  const { data: messages = [] } = useTaskMessages(taskId);
  const decisionsSlot = useChatUIStore((s) => s.byTask);
  void decisionsSlot;

  const task = qc.getQueryData<TaskCard>(queryKeys.tasks.detail(taskId));
  const project = task
    ? qc.getQueryData<Project>(queryKeys.projects.detail(task.project_id))
    : undefined;

  const ctx = useMemo(
    () => ({
      projectId: task?.project_id ?? "",
      projectName: project?.name ?? "",
      taskId,
      taskTitle: task?.title ?? "",
    }),
    [task, project, taskId],
  );

  return useMemo<UseTaskApprovalsHistoryResult>(() => {
    if (apiQuery.isLoading) {
      return { data: undefined, isLoading: true, source: "loading" };
    }
    // 200 path
    if (Array.isArray(apiQuery.data)) {
      const normalized = apiQuery.data.map((r) => normalizeApprovalRequest(r, ctx));
      return {
        data: filter === "all" ? normalized : normalized.filter((r) => r.status === filter),
        isLoading: false,
        source: "api",
      };
    }
    // Fallback derive path (null = 404). Returns ALL statuses (pending + decided),
    // unlike deriveApprovalsFromMessages which filters to pending only.
    const state = useChatUIStore.getState();
    const records: ApprovalRecord[] = [];
    for (const m of messages as ClientMessage[]) {
      if (m.parsed.type !== "permission_request") continue;
      const p = m.parsed.payload;
      const id = p.approval_id ?? p.tool_use_id ?? m.id;
      const d = getDecision(state, id);
      records.push({
        id,
        runId: m.task_run_id ?? "",
        toolName: p.tool_name,
        toolInput: p.tool_input,
        status: d ? d.decision : "pending",
        decidedBy: null,
        decidedAt: null,
        decisionNote: d?.note ?? null,
        createdAt: m.created_at,
        expiresAt: p.expires_at ?? "",
        projectId: ctx.projectId,
        projectName: ctx.projectName,
        taskId: ctx.taskId,
        taskTitle: ctx.taskTitle,
      });
    }
    const filtered = filter === "all" ? records : records.filter((r) => r.status === filter);
    return { data: filtered, isLoading: false, source: "derive" };
  }, [apiQuery.data, apiQuery.isLoading, messages, ctx, filter, decisionsSlot]);
}

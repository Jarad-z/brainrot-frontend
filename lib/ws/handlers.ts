import type { QueryClient } from "@tanstack/react-query";
import type { Message, TaskCard, ApprovalDecision, ClientMessage } from "@/lib/api/types";
// run.completed payload lacks project_id/ws_id (see lib/ws/events.ts), so we
// reverse-look projectId from the task detail cache to scope invalidation.
// Tracked in docs/BACKEND_GAPS.md.
import { queryKeys } from "@/lib/api/keys";
import { enrichMessage } from "@/lib/chat/enrich-message";
import { upsertMessage } from "@/lib/chat/upsert-message";
import type { WSClient } from "./client";

interface ChatUIStoreSlice {
  recordDecision: (
    approvalId: string,
    d: { decision: ApprovalDecision; note?: string; at: number },
  ) => void;
}

export type WSEvent =
  | { type: "task.created"; scope: "project"; id: string; payload: { task: TaskCard } }
  | { type: "task.updated"; scope: "project"; id: string; payload: { task: TaskCard } }
  | {
      type: "message.appended";
      scope: "task";
      id: string;
      // Backend sends two payload shapes (see backend/docs/API.md, message.appended row):
      //   user-message path  : { message: Message, runs?: EnqueuedRun[] }
      //   agent stream path  : { message_id, seq, content }  (no full Message)
      payload:
        | { message: Message }
        | { message_id: string; seq: number; content: unknown };
    }
  | {
      type: "run.completed";
      scope: "task";
      id: string;
      payload: { run_id: string; status: "done" | "failed" | "canceled"; error?: string };
    }
  | {
      type: "approval.requested";
      scope: "task";
      id: string;
      payload: { approval_id: string; run_id: string; tool_name: string; tool_input: string };
    }
  | {
      type: "approval.decided";
      scope: "task";
      id: string;
      payload: { approval_id: string; decision: ApprovalDecision; note?: string };
    };

export function registerHandlers(
  client: WSClient,
  queryClient: QueryClient,
  chatUI: () => ChatUIStoreSlice,
): () => void {
  return client.addListener((ev) => {
    let data: WSEvent;
    try {
      data = JSON.parse(ev.data) as WSEvent;
    } catch {
      return;
    }
    switch (data.type) {
      case "message.appended":
        return onMessageAppended(data, queryClient);
      case "task.created":
      case "task.updated":
        return onTaskMutation(data, queryClient);
      case "run.completed":
        return onRunCompleted(data, queryClient);
      case "approval.decided":
        return onApprovalDecided(data, chatUI());
      default:
        return;
    }
  });
}

export function onMessageAppended(
  ev: Extract<WSEvent, { type: "message.appended" }>,
  qc: QueryClient,
): void {
  const payload = ev.payload;
  if ("message" in payload && payload.message) {
    const enriched = enrichMessage(payload.message);
    qc.setQueryData<ClientMessage[]>(queryKeys.tasks.messages(ev.id), (old = []) =>
      upsertMessage(old, enriched),
    );
    return;
  }
  // Agent-stream payload lacks the full Message (no role/author/created_at), so
  // we cannot synthesize a ClientMessage. Invalidate and let the REST refetch
  // bring in the complete record. Cheap because the user is already on the task.
  qc.invalidateQueries({ queryKey: queryKeys.tasks.messages(ev.id) });
}

export function onTaskMutation(
  ev: Extract<WSEvent, { type: "task.created" | "task.updated" }>,
  qc: QueryClient,
): void {
  const projectId = ev.id;
  const task = ev.payload.task;
  qc.setQueryData<TaskCard[]>(queryKeys.projects.tasks(projectId), (old = []) => {
    const idx = old.findIndex((t) => t.id === task.id);
    if (idx === -1) return [...old, task];
    return [...old.slice(0, idx), task, ...old.slice(idx + 1)];
  });
  qc.setQueryData(queryKeys.tasks.detail(task.id), task);
}

export function onRunCompleted(
  ev: Extract<WSEvent, { type: "run.completed" }>,
  qc: QueryClient,
): void {
  const taskId = ev.id;
  qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
  qc.invalidateQueries({ queryKey: queryKeys.tasks.runs(taskId) });
  const cachedTask = qc.getQueryData<TaskCard>(queryKeys.tasks.detail(taskId));
  const projectId = cachedTask?.project_id;
  if (projectId) {
    qc.invalidateQueries({ queryKey: queryKeys.projects.tasks(projectId) });
  }
}

export function onApprovalDecided(
  ev: Extract<WSEvent, { type: "approval.decided" }>,
  chatUI: ChatUIStoreSlice,
): void {
  chatUI.recordDecision(ev.payload.approval_id, {
    decision: ev.payload.decision,
    note: ev.payload.note,
    at: Date.now(),
  });
}

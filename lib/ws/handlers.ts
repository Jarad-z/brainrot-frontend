import type { QueryClient } from "@tanstack/react-query";
import type { Message, TaskCard, ApprovalDecision, ClientMessage } from "@/lib/api/types";
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
  | { type: "message.appended"; scope: "task"; id: string; payload: { message: Message } }
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
  const enriched = enrichMessage(ev.payload.message);
  qc.setQueryData<ClientMessage[]>(queryKeys.tasks.messages(ev.id), (old = []) =>
    upsertMessage(old, enriched),
  );
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
  _ev: Extract<WSEvent, { type: "run.completed" }>,
  qc: QueryClient,
): void {
  qc.invalidateQueries({ queryKey: ["projects"] });
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

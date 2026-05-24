import type { QueryClient } from "@tanstack/react-query";
import type {
  Message,
  TaskCard,
  ApprovalDecision,
  ClientMessage,
  DirectMessage,
  User,
} from "@/lib/api/types";
// run.completed payload lacks project_id/ws_id (see lib/ws/events.ts), so we
// reverse-look projectId from the task detail cache to scope invalidation.
// Tracked in docs/BACKEND_GAPS.md.
import { queryKeys } from "@/lib/api/keys";
import { enrichMessage } from "@/lib/chat/enrich-message";
import { upsertMessage } from "@/lib/chat/upsert-message";
import { useBadges } from "@/lib/stores/badges";
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
    }
  | { type: "friend.request.sent"; scope: "user"; id: string; payload: { from_id: string } }
  | { type: "friend.request.accepted"; scope: "user"; id: string; payload: { by_user_id: string } }
  | { type: "friend.request.declined"; scope: "user"; id: string; payload: { by_user_id: string } }
  | { type: "friend.removed"; scope: "user"; id: string; payload: { by_user_id: string } }
  | {
      type: "workspace.invitation.created";
      scope: "user";
      id: string;
      payload: { invitation_id: string; workspace_id: string; inviter_id: string; role: string };
    }
  | {
      type: "workspace.invitation.accepted";
      scope: "user" | "workspace";
      id: string;
      payload: Record<string, unknown>;
    }
  | {
      type: "workspace.invitation.declined";
      scope: "user";
      id: string;
      payload: Record<string, unknown>;
    }
  | {
      type: "workspace.invitation.revoked";
      scope: "user";
      id: string;
      payload: Record<string, unknown>;
    }
  | {
      type: "dm.sent";
      scope: "user";
      id: string;
      payload: { conversation_id: string; message: DirectMessage };
    }
  | {
      type: "dm.read";
      scope: "user";
      id: string;
      payload: { conversation_id: string; last_read_at: string };
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
      case "friend.request.sent":
      case "friend.request.accepted":
      case "friend.request.declined":
      case "friend.removed":
        return onFriendEvent(data, queryClient);
      case "workspace.invitation.created":
      case "workspace.invitation.accepted":
      case "workspace.invitation.declined":
      case "workspace.invitation.revoked":
        return onInvitationEvent(data, queryClient);
      case "dm.sent":
        return onDMSent(data, queryClient);
      case "dm.read":
        return onDMRead(data, queryClient);
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

export function onFriendEvent(
  ev: Extract<WSEvent, { type: `friend.${string}` }>,
  qc: QueryClient,
): void {
  qc.invalidateQueries({ queryKey: queryKeys.friends.requests() });
  qc.invalidateQueries({ queryKey: queryKeys.friends.list() });
  if (ev.type === "friend.request.sent") {
    useBadges.getState().bumpFriendRequests();
  }
}

export function onInvitationEvent(
  ev: Extract<WSEvent, { type: `workspace.invitation.${string}` }>,
  qc: QueryClient,
): void {
  qc.invalidateQueries({ queryKey: queryKeys.invitations.incoming() });
  if (ev.scope === "workspace") {
    qc.invalidateQueries({ queryKey: queryKeys.workspaces.members(ev.id) });
  }
  if (ev.type === "workspace.invitation.created") {
    useBadges.getState().bumpWorkspaceInvitations();
  }
}

export function onDMSent(
  ev: Extract<WSEvent, { type: "dm.sent" }>,
  qc: QueryClient,
): void {
  qc.invalidateQueries({ queryKey: queryKeys.conversations.list() });
  qc.setQueryData<DirectMessage[]>(
    queryKeys.conversations.messages(ev.payload.conversation_id),
    (old = []) => [ev.payload.message, ...old],
  );
  // Only bump badge for incoming messages (sender != me).
  const me = qc.getQueryData<User>(queryKeys.me.self());
  if (me && ev.payload.message.sender_id && ev.payload.message.sender_id !== me.id) {
    useBadges.getState().bumpConversation(ev.payload.conversation_id);
  }
}

export function onDMRead(
  ev: Extract<WSEvent, { type: "dm.read" }>,
  qc: QueryClient,
): void {
  useBadges.getState().clearConversation(ev.payload.conversation_id);
  qc.invalidateQueries({ queryKey: queryKeys.conversations.list() });
}

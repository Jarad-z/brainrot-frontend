import { describe, it, expect, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  onMessageAppended,
  onTaskMutation,
  onApprovalDecided,
  onRunCompleted,
  onFriendEvent,
  onInvitationEvent,
  onDMSent,
  onDMRead,
} from "./handlers";
import { queryKeys } from "@/lib/api/keys";
import { useBadges } from "@/lib/stores/badges";
import type { Message, TaskCard, DirectMessage } from "@/lib/api/types";

describe("WS handlers", () => {
  it("onMessageAppended upserts the enriched message into the task messages cache", () => {
    const qc = new QueryClient();
    const taskId = "t1";
    qc.setQueryData(queryKeys.tasks.messages(taskId), []);
    const raw: Message = {
      id: "m1",
      task_card_id: taskId,
      role: "user",
      author_user_id: "u1",
      author_agent_id: null,
      content: { text: "hi", mentions: [] },
      task_run_id: null,
      seq: null,
      metadata: {},
      created_at: "2026-05-16T10:00:00Z",
    };
    onMessageAppended(
      { type: "message.appended", scope: "task", id: taskId, payload: { message: raw } },
      qc,
    );
    const list = qc.getQueryData<unknown[]>(queryKeys.tasks.messages(taskId));
    expect(list).toHaveLength(1);
  });

  it("onTaskMutation updates the project task list and task detail caches", () => {
    const qc = new QueryClient();
    const projectId = "p1";
    const task: TaskCard = {
      id: "t1",
      project_id: projectId,
      title: "T",
      summary: "",
      status: "in_progress",
      sort_order: 0,
      created_by: "u",
      created_at: "",
      updated_at: "",
      done_at: null,
    };
    qc.setQueryData(queryKeys.projects.tasks(projectId), [{ ...task, status: "open" }]);
    onTaskMutation(
      { type: "task.updated", scope: "project", id: projectId, payload: { task } },
      qc,
    );
    const list = qc.getQueryData<TaskCard[]>(queryKeys.projects.tasks(projectId));
    expect(list?.[0]!.status).toBe("in_progress");
  });

  it("onApprovalDecided records the decision in the chatUI store (mock)", () => {
    const record = vi.fn();
    onApprovalDecided(
      {
        type: "approval.decided",
        scope: "task",
        id: "t1",
        payload: { approval_id: "a1", decision: "approved" },
      },
      { recordDecision: record } as never,
    );
    expect(record).toHaveBeenCalledWith("a1", expect.objectContaining({ decision: "approved" }));
  });

  it("onRunCompleted invalidates only the affected task and its project task list", () => {
    const qc = new QueryClient();
    const taskId = "t1";
    const projectId = "p1";
    const task: TaskCard = {
      id: taskId,
      project_id: projectId,
      title: "T",
      summary: "",
      status: "in_progress",
      sort_order: 0,
      created_by: "u",
      created_at: "",
      updated_at: "",
      done_at: null,
    };
    qc.setQueryData(queryKeys.tasks.detail(taskId), task);
    const invSpy = vi.spyOn(qc, "invalidateQueries");
    onRunCompleted(
      {
        type: "run.completed",
        scope: "task",
        id: taskId,
        payload: { run_id: "r1", status: "done" },
      },
      qc,
    );
    expect(invSpy).toHaveBeenCalledWith({ queryKey: queryKeys.tasks.detail(taskId) });
    expect(invSpy).toHaveBeenCalledWith({ queryKey: queryKeys.tasks.runs(taskId) });
    expect(invSpy).toHaveBeenCalledWith({ queryKey: queryKeys.projects.tasks(projectId) });
  });
});

describe("onFriendEvent", () => {
  it("invalidates friend caches and bumps badge for request.sent", () => {
    useBadges.getState().reset();
    const qc = new QueryClient();
    onFriendEvent(
      { type: "friend.request.sent", scope: "user", id: "u1", payload: { from_id: "u2" } },
      qc,
    );
    expect(useBadges.getState().friendRequests).toBe(1);
  });

  it("does NOT bump for accepted/declined/removed", () => {
    useBadges.getState().reset();
    const qc = new QueryClient();
    onFriendEvent(
      { type: "friend.request.accepted", scope: "user", id: "u1", payload: { by_user_id: "u2" } },
      qc,
    );
    expect(useBadges.getState().friendRequests).toBe(0);
  });
});

describe("onInvitationEvent", () => {
  it("bumps badge on created", () => {
    useBadges.getState().reset();
    const qc = new QueryClient();
    onInvitationEvent(
      {
        type: "workspace.invitation.created",
        scope: "user",
        id: "u1",
        payload: { invitation_id: "i1", workspace_id: "w1", inviter_id: "u2", role: "editor" },
      },
      qc,
    );
    expect(useBadges.getState().workspaceInvitations).toBe(1);
  });

  it("invalidates workspace members on workspace-scope accepted", () => {
    const qc = new QueryClient();
    // Pre-populate workspace members cache so we can observe invalidation
    qc.setQueryData(queryKeys.workspaces.members("w1"), [{ user_id: "u9" }]);
    onInvitationEvent(
      {
        type: "workspace.invitation.accepted",
        scope: "workspace",
        id: "w1",
        payload: { user_id: "u2", role: "editor" },
      },
      qc,
    );
    const state = qc.getQueryState(queryKeys.workspaces.members("w1"));
    expect(state?.isInvalidated).toBe(true);
  });
});

describe("onDMSent", () => {
  it("prepends message + bumps badge when sender != me", () => {
    useBadges.getState().reset();
    const qc = new QueryClient();
    qc.setQueryData(queryKeys.me.self(), { id: "me" });
    qc.setQueryData<DirectMessage[]>(queryKeys.conversations.messages("c1"), [
      {
        id: "m0",
        conversation_id: "c1",
        sender_id: "me",
        body: "old",
        created_at: "2026-05-23T00:00:00Z",
      },
    ]);
    const newMsg: DirectMessage = {
      id: "m1",
      conversation_id: "c1",
      sender_id: "peer",
      body: "hi",
      created_at: "2026-05-23T00:00:01Z",
    };
    onDMSent(
      {
        type: "dm.sent",
        scope: "user",
        id: "me",
        payload: { conversation_id: "c1", message: newMsg },
      },
      qc,
    );
    const msgs = qc.getQueryData<DirectMessage[]>(queryKeys.conversations.messages("c1"));
    expect(msgs?.[0]!.id).toBe("m1");
    expect(useBadges.getState().dm.c1).toBe(1);
  });

  it("does NOT bump badge when sender == me", () => {
    useBadges.getState().reset();
    const qc = new QueryClient();
    qc.setQueryData(queryKeys.me.self(), { id: "me" });
    const myMsg: DirectMessage = {
      id: "m2",
      conversation_id: "c2",
      sender_id: "me",
      body: "self",
      created_at: "2026-05-23T00:00:02Z",
    };
    onDMSent(
      {
        type: "dm.sent",
        scope: "user",
        id: "me",
        payload: { conversation_id: "c2", message: myMsg },
      },
      qc,
    );
    expect(useBadges.getState().dm.c2 ?? 0).toBe(0);
  });
});

describe("onDMRead", () => {
  it("clears conversation badge", () => {
    useBadges.getState().bumpConversation("c1");
    useBadges.getState().bumpConversation("c1");
    const qc = new QueryClient();
    onDMRead(
      {
        type: "dm.read",
        scope: "user",
        id: "me",
        payload: { conversation_id: "c1", last_read_at: "2026-05-23T01:00:00Z" },
      },
      qc,
    );
    expect(useBadges.getState().dm.c1 ?? 0).toBe(0);
  });
});

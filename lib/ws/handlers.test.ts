import { describe, it, expect, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { onMessageAppended, onTaskMutation, onApprovalDecided, onRunCompleted } from "./handlers";
import { queryKeys } from "@/lib/api/keys";
import type { Message, TaskCard } from "@/lib/api/types";

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

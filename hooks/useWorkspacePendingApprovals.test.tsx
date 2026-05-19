import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useWorkspacePendingApprovals } from "./useWorkspacePendingApprovals";
import { useChatUIStore } from "@/lib/store/chat-ui";
import { queryKeys } from "@/lib/api/keys";
import type { ClientMessage, Project, TaskCard } from "@/lib/api/types";

function makeMsg(taskId: string, approvalId: string, expiresAt: string): ClientMessage {
  return {
    id: `m-${approvalId}`,
    task_card_id: taskId,
    role: "agent",
    author_user_id: null,
    author_agent_id: "a1",
    content: {},
    task_run_id: "r1",
    seq: 1,
    metadata: {},
    created_at: "2026-05-17T10:00:00Z",
    meta: {},
    parsed: {
      type: "permission_request",
      payload: {
        approval_id: approvalId,
        tool_use_id: `tu-${approvalId}`,
        tool_name: "Bash",
        tool_input: { command: "ls" },
        expires_at: expiresAt,
      },
    },
  };
}

function makeProject(id: string, wsId: string): Project {
  return {
    id, workspace_id: wsId, name: `proj-${id}`, description: "",
    archived: false, created_by: "u",
    created_at: "2026-05-17T00:00:00Z", updated_at: "2026-05-17T00:00:00Z",
  };
}

function makeTask(id: string, projectId: string, title = `task-${id}`): TaskCard {
  return {
    id, project_id: projectId, title, summary: "",
    status: "open", sort_order: 0, created_by: "u",
    created_at: "2026-05-17T00:00:00Z", updated_at: "2026-05-17T00:00:00Z",
    done_at: null,
  };
}

function setupCache(qc: QueryClient, wsId: string) {
  qc.setQueryData<Project[]>(queryKeys.workspaces.projects(wsId), [
    makeProject("p1", wsId),
    makeProject("p2", wsId),
  ]);
  qc.setQueryData<TaskCard[]>(queryKeys.projects.tasks("p1"), [
    makeTask("t1", "p1"), makeTask("t2", "p1"),
  ]);
  qc.setQueryData<TaskCard[]>(queryKeys.projects.tasks("p2"), [makeTask("t3", "p2")]);
  qc.setQueryData<ClientMessage[]>(queryKeys.tasks.messages("t1"), [
    makeMsg("t1", "ap1", "2026-05-17T11:00:00Z"),
  ]);
  qc.setQueryData<ClientMessage[]>(queryKeys.tasks.messages("t2"), [
    makeMsg("t2", "ap2", "2026-05-17T10:30:00Z"),
  ]);
  qc.setQueryData<ClientMessage[]>(queryKeys.tasks.messages("t3"), [
    makeMsg("t3", "ap3", "2026-05-17T11:30:00Z"),
  ]);
}

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useWorkspacePendingApprovals", () => {
  beforeEach(() => {
    useChatUIStore.setState({ byTask: {} });
  });

  it("returns empty when no projects in cache", () => {
    const qc = new QueryClient();
    const { result } = renderHook(() => useWorkspacePendingApprovals("ws1"), {
      wrapper: wrapper(qc),
    });
    expect(result.current).toEqual([]);
  });

  it("aggregates approvals across projects and tasks, sorted by expiresAt", () => {
    const qc = new QueryClient();
    setupCache(qc, "ws1");
    const { result } = renderHook(() => useWorkspacePendingApprovals("ws1"), {
      wrapper: wrapper(qc),
    });
    expect(result.current.map((a) => a.id)).toEqual(["ap2", "ap1", "ap3"]);
  });

  it("filters out approvals already decided in chat-ui store", () => {
    const qc = new QueryClient();
    setupCache(qc, "ws1");
    useChatUIStore.getState().recordDecision("ap2", {
      decision: "approved",
      at: Date.now(),
    });
    const { result } = renderHook(() => useWorkspacePendingApprovals("ws1"), {
      wrapper: wrapper(qc),
    });
    expect(result.current.map((a) => a.id)).toEqual(["ap1", "ap3"]);
  });
});

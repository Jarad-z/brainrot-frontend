import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTaskApprovalsHistory } from "./useTaskApprovalsHistory";
import { queryKeys } from "@/lib/api/keys";
import type { ApprovalRequest, ClientMessage, Project, TaskCard } from "@/lib/api/types";
import * as approvalsApi from "@/lib/api/approvals";

function makeReq(id: string, status: ApprovalRequest["status"]): ApprovalRequest {
  return {
    id, run_id: "r1", task_card_id: "t1",
    tool_name: "Bash", tool_input: "eyJjb21tYW5kIjoibHMifQ==",
    status,
    decided_by: status === "pending" ? null : "u1",
    decided_at: status === "pending" ? null : "2026-05-17T10:30:00Z",
    decision_note: status === "pending" ? null : "ok",
    created_at: "2026-05-17T10:00:00Z",
    expires_at: "2026-05-17T11:00:00Z",
  };
}

function permMsg(approvalId: string): ClientMessage {
  return {
    id: `m-${approvalId}`,
    task_card_id: "t1",
    role: "agent", author_user_id: null, author_agent_id: "a1",
    content: "", task_run_id: "r1", seq: 1, metadata: "",
    created_at: "2026-05-17T10:00:00Z", meta: {},
    parsed: {
      type: "permission_request",
      payload: {
        approval_id: approvalId,
        tool_use_id: `tu-${approvalId}`,
        tool_name: "Bash",
        tool_input: { command: "ls" },
        expires_at: "2026-05-17T11:00:00Z",
      },
    },
  };
}

function seedTaskCtx(qc: QueryClient) {
  qc.setQueryData<TaskCard>(queryKeys.tasks.detail("t1"), {
    id: "t1", project_id: "p1", title: "Write release",
    summary: "", status: "open", sort_order: 0, created_by: "u",
    created_at: "2026-05-17T00:00:00Z", updated_at: "2026-05-17T00:00:00Z",
    done_at: null,
  });
  qc.setQueryData<Project>(queryKeys.projects.detail("p1"), {
    id: "p1", workspace_id: "ws1", name: "Launch Plan",
    description: "", archived: false, created_by: "u",
    created_at: "2026-05-17T00:00:00Z", updated_at: "2026-05-17T00:00:00Z",
  });
}

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useTaskApprovalsHistory", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes 200 response from fetchTaskApprovals", async () => {
    vi.spyOn(approvalsApi, "fetchTaskApprovals").mockResolvedValue([
      makeReq("ap1", "approved"),
      makeReq("ap2", "denied"),
    ]);
    const qc = new QueryClient();
    seedTaskCtx(qc);
    const { result } = renderHook(() => useTaskApprovalsHistory("t1"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data?.length).toBe(2));
    expect(result.current.data?.[0]?.status).toBe("approved");
    expect(result.current.source).toBe("api");
  });

  it("falls back to messages-derive when fetchTaskApprovals returns null (404)", async () => {
    vi.spyOn(approvalsApi, "fetchTaskApprovals").mockResolvedValue(null);
    const qc = new QueryClient();
    seedTaskCtx(qc);
    qc.setQueryData<ClientMessage[]>(queryKeys.tasks.messages("t1"), [
      permMsg("ap1"),
    ]);
    const { result } = renderHook(() => useTaskApprovalsHistory("t1"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.source).toBe("derive"));
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0]?.id).toBe("ap1");
  });

  it("filters by status when filter argument provided", async () => {
    vi.spyOn(approvalsApi, "fetchTaskApprovals").mockResolvedValue([
      makeReq("ap1", "approved"),
      makeReq("ap2", "denied"),
    ]);
    const qc = new QueryClient();
    seedTaskCtx(qc);
    const { result } = renderHook(() => useTaskApprovalsHistory("t1", "denied"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data?.length).toBe(1));
    expect(result.current.data?.[0]?.id).toBe("ap2");
  });
});

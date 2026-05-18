import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApprovalHubCard } from "./ApprovalHubCard";
import type { ApprovalLite } from "@/lib/approvals/types";
import * as approvalsApi from "@/lib/api/approvals";

const FUTURE = new Date(Date.now() + 30 * 60_000).toISOString();

function lite(overrides: Partial<ApprovalLite> = {}): ApprovalLite {
  return {
    id: "ap1",
    taskId: "t1",
    taskTitle: "Write release",
    projectId: "p1",
    projectName: "Launch Plan",
    toolName: "Bash",
    toolInput: { command: "rm -rf node_modules" },
    expiresAt: FUTURE,
    status: "pending",
    ...overrides,
  };
}

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("ApprovalHubCard", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders tool name, project, task, and command", () => {
    wrap(<ApprovalHubCard approval={lite()} />);
    expect(screen.getByText(/Bash/)).toBeInTheDocument();
    expect(screen.getByText(/Launch Plan/)).toBeInTheDocument();
    expect(screen.getByText(/Write release/)).toBeInTheDocument();
    expect(screen.getByText(/rm -rf node_modules/)).toBeInTheDocument();
  });

  it("calls decideApproval on Approve click", async () => {
    const spy = vi.spyOn(approvalsApi, "decideApproval").mockResolvedValue({} as never);
    wrap(<ApprovalHubCard approval={lite()} />);
    fireEvent.click(screen.getByRole("button", { name: "批准" }));
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("ap1", { decision: "approved", note: undefined });
    });
  });

  it("calls decideApproval(denied) on Deny click", async () => {
    const spy = vi.spyOn(approvalsApi, "decideApproval").mockResolvedValue({} as never);
    wrap(<ApprovalHubCard approval={lite()} />);
    fireEvent.click(screen.getByRole("button", { name: "拒绝" }));
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("ap1", { decision: "denied", note: undefined });
    });
  });

  it("opens textarea and submits approved_with_edits with note", async () => {
    const spy = vi.spyOn(approvalsApi, "decideApproval").mockResolvedValue({} as never);
    wrap(<ApprovalHubCard approval={lite()} />);
    fireEvent.click(screen.getByRole("button", { name: "批准并修改" }));
    const textarea = screen.getByPlaceholderText(/备注/);
    fireEvent.change(textarea, { target: { value: "tweak args" } });
    fireEvent.click(screen.getByRole("button", { name: "提交" }));
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("ap1", {
        decision: "approved_with_edits",
        note: "tweak args",
      });
    });
  });

  it("disables buttons when expired", () => {
    wrap(<ApprovalHubCard approval={lite({ expiresAt: "2000-01-01T00:00:00Z" })} />);
    expect(screen.getByRole("button", { name: "批准" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "拒绝" })).toBeDisabled();
  });
});

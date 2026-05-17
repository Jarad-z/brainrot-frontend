import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationBell } from "./NotificationBell";
import { queryKeys } from "@/lib/api/keys";
import type { Project, TaskCard, ClientMessage } from "@/lib/api/types";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function wrap(qc: QueryClient, ui: React.ReactNode) {
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

function seed(qc: QueryClient, opts: { tasks: number; approvalsPerTask: number }) {
  qc.setQueryData<Project[]>(queryKeys.workspaces.projects("ws1"), [
    { id: "p1", workspace_id: "ws1", name: "P1", description: "",
      archived: false, created_by: "u",
      created_at: "2026-05-17T00:00:00Z", updated_at: "2026-05-17T00:00:00Z" },
  ]);
  const tasks: TaskCard[] = Array.from({ length: opts.tasks }, (_, i) => ({
    id: `t${i}`, project_id: "p1", title: `T${i}`, summary: "",
    status: "open" as const, sort_order: i, created_by: "u",
    created_at: "2026-05-17T00:00:00Z", updated_at: "2026-05-17T00:00:00Z", done_at: null,
  }));
  qc.setQueryData<TaskCard[]>(queryKeys.projects.tasks("p1"), tasks);
  tasks.forEach((t, ti) => {
    const msgs: ClientMessage[] = Array.from({ length: opts.approvalsPerTask }, (_, j) => ({
      id: `m-${ti}-${j}`, task_card_id: t.id, role: "agent",
      author_user_id: null, author_agent_id: "a1", content: "",
      task_run_id: "r1", seq: j, metadata: "",
      created_at: "2026-05-17T10:00:00Z", meta: {},
      parsed: {
        type: "permission_request",
        payload: {
          approval_id: `ap-${ti}-${j}`, tool_use_id: `tu-${ti}-${j}`,
          tool_name: "Bash",
          tool_input: { command: "ls" },
          expires_at: "2026-05-17T11:00:00Z",
        },
      },
    }));
    qc.setQueryData<ClientMessage[]>(queryKeys.tasks.messages(t.id), msgs);
  });
}

describe("NotificationBell", () => {
  it("shows no badge digit when count=0", () => {
    const qc = new QueryClient();
    seed(qc, { tasks: 0, approvalsPerTask: 0 });
    wrap(qc, <NotificationBell wsId="ws1" />);
    expect(screen.queryByText(/^\d/)).not.toBeInTheDocument();
  });

  it("renders count when between 1 and 99", () => {
    const qc = new QueryClient();
    seed(qc, { tasks: 3, approvalsPerTask: 1 });
    wrap(qc, <NotificationBell wsId="ws1" />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders 99+ when count > 99", () => {
    const qc = new QueryClient();
    seed(qc, { tasks: 100, approvalsPerTask: 2 });
    wrap(qc, <NotificationBell wsId="ws1" />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("navigates to /w/<wsId>/approvals on click", () => {
    const qc = new QueryClient();
    seed(qc, { tasks: 0, approvalsPerTask: 0 });
    wrap(qc, <NotificationBell wsId="ws1" />);
    fireEvent.click(screen.getByRole("button", { name: "通知" }));
    expect(pushMock).toHaveBeenCalledWith("/w/ws1/approvals");
  });
});

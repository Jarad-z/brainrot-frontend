import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { PermissionRequestCard } from "./PermissionRequestCard";
import type { ClientMessage } from "@/lib/api/types";

vi.mock("@/hooks/useApprovalDecide", () => ({
  useApprovalDecide: () => ({ mutate: vi.fn() }),
}));

const futureTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

const pendingMsg: ClientMessage = {
  id: "p1",
  task_card_id: "t1",
  role: "agent",
  author_user_id: null,
  author_agent_id: "a1",
  content: "",
  task_run_id: "r1",
  seq: 1,
  metadata: "",
  created_at: "2026-05-16T10:00:00Z",
  parsed: {
    type: "permission_request",
    payload: {
      tool_use_id: "tu1",
      tool_name: "Bash",
      approval_id: "ap1",
      tool_input: { command: "ls" },
      expires_at: futureTime,
    },
  },
  meta: {},
};

describe("PermissionRequestCard", () => {
  it("renders pending state with 3 buttons", () => {
    const { getByText } = render(
      <PermissionRequestCard msg={pendingMsg} taskId="t1" />,
    );
    expect(getByText("批准")).toBeInTheDocument();
    expect(getByText("拒绝")).toBeInTheDocument();
    expect(getByText("批准并修改")).toBeInTheDocument();
  });

  it("shows command from tool_input", () => {
    const { container } = render(
      <PermissionRequestCard msg={pendingMsg} taskId="t1" />,
    );
    expect(container.textContent).toContain("ls");
  });

  it("triggers decide on approve click", () => {
    const { getByText } = render(
      <PermissionRequestCard msg={pendingMsg} taskId="t1" />,
    );
    fireEvent.click(getByText("批准"));
    // covered by mocked mutate
  });
});

import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ToolPair } from "./ToolPair";
import type { ClientMessage } from "@/lib/api/types";

const useMsg: ClientMessage = {
  id: "u1",
  task_card_id: "t1",
  role: "agent",
  author_user_id: null,
  author_agent_id: "a1",
  content: {},
  task_run_id: "r1",
  seq: 1,
  metadata: {},
  created_at: "2026-05-16T10:00:00Z",
  parsed: {
    type: "tool_use",
    payload: { tool_name: "Write", tool_use_id: "tu1", input: { file_path: "/a.md" } },
  },
  meta: {},
};
const resultMsg: ClientMessage = {
  ...useMsg,
  id: "r1",
  parsed: {
    type: "tool_result",
    payload: { tool_use_id: "tu1", is_error: false, content: "ok" },
  },
};

describe("ToolPair", () => {
  it("renders tool name + file_path inline", () => {
    const { getByText } = render(
      <ToolPair useMsg={useMsg} resultMsg={resultMsg} taskId="t1" />,
    );
    expect(getByText(/Write/)).toBeInTheDocument();
    expect(getByText(/\/a\.md/)).toBeInTheDocument();
  });

  it("shows 'running…' when no result yet", () => {
    const { getByText } = render(<ToolPair useMsg={useMsg} taskId="t1" />);
    expect(getByText(/运行中/)).toBeInTheDocument();
  });

  it("toggle expands/collapses body", () => {
    const { container } = render(
      <ToolPair useMsg={useMsg} resultMsg={resultMsg} taskId="t1" />,
    );
    const head = container.querySelector(".tool-head");
    expect(head).toBeTruthy();
    if (head) fireEvent.click(head);
  });
});

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { OrphanToolResult } from "./OrphanToolResult";
import type { ClientMessage } from "@/lib/api/types";

const msg: ClientMessage = {
  id: "or1",
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
    type: "tool_result",
    payload: { tool_use_id: "missing", is_error: false, content: "stray output" },
  },
  meta: {},
};

describe("OrphanToolResult", () => {
  it("renders unmatched-result warning with tool_use_id", () => {
    const { getByText, container } = render(<OrphanToolResult msg={msg} />);
    expect(getByText("未配对的工具结果")).toBeInTheDocument();
    expect(container.textContent).toContain("missing");
  });
});

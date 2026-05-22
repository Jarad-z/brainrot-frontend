import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ResultBanner } from "./ResultBanner";
import type { ClientMessage } from "@/lib/api/types";

const msg: ClientMessage = {
  id: "r1",
  task_card_id: "t1",
  role: "agent",
  author_user_id: null,
  author_agent_id: "a1",
  content: {},
  task_run_id: "run1",
  seq: 99,
  metadata: {},
  created_at: "2026-05-16T10:00:00Z",
  parsed: { type: "result", payload: { duration_ms: 12400, result: "ok" } },
  meta: {},
};

describe("ResultBanner", () => {
  // The theme refresh (commit 7bf7934) silenced the banner — it now returns
  // null. Keeping the spec around as a regression marker: if the component
  // grows back, this test should re-acquire its original assertions.
  it("renders nothing in the current theme", () => {
    const { container } = render(<ResultBanner msg={msg} />);
    expect(container.firstChild).toBeNull();
  });
});

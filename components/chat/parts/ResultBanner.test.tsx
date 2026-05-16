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
  content: "",
  task_run_id: "run1",
  seq: 99,
  metadata: "",
  created_at: "2026-05-16T10:00:00Z",
  parsed: { type: "result", payload: { duration_ms: 12400, result: "ok" } },
  meta: {},
};

describe("ResultBanner", () => {
  it("renders duration in seconds", () => {
    const { getByText } = render(<ResultBanner msg={msg} />);
    expect(getByText(/12\.4s/)).toBeInTheDocument();
  });
});

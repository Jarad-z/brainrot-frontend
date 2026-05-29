import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { TraceRunSection } from "./TraceRunSection";
import type { TraceRunGroup } from "@/lib/chat/build-agent-trace";
import type { ClientMessage } from "@/lib/api/types";

function textStep(id: string, text: string) {
  const msg: ClientMessage = {
    id, task_card_id: "t1", role: "agent",
    author_user_id: null, author_agent_id: "a1",
    content: {}, task_run_id: "r1", seq: 1, metadata: {},
    created_at: "2026-05-30T10:00:00Z",
    parsed: { type: "assistant_text", payload: { text } }, meta: {},
  };
  return { msg };
}

const group: TraceRunGroup = {
  runId: "r1",
  run: {
    id: "r1", workspace_id: "w1", task_card_id: "t1", agent_id: "a1",
    runtime_id: "rt1", trigger_message_id: null, session_id: null,
    status: "done", error: null, created_at: "2026-05-30T10:00:00Z",
    claimed_at: null, started_at: "2026-05-30T10:00:00Z", finished_at: "2026-05-30T10:01:00Z",
  },
  steps: [textStep("m1", "step one")],
};

describe("TraceRunSection", () => {
  it("shows the run number and step count, expanded by default shows steps", () => {
    const { getByText } = render(<TraceRunSection group={group} index={0} defaultOpen />);
    expect(getByText(/运行 #1/)).toBeInTheDocument();
    expect(getByText(/step one/)).toBeInTheDocument();
  });

  it("collapses and expands on header click", () => {
    const { getByText, queryByText, getByRole } = render(
      <TraceRunSection group={group} index={0} defaultOpen={false} />,
    );
    expect(queryByText(/step one/)).toBeNull();
    fireEvent.click(getByRole("button"));
    expect(getByText(/step one/)).toBeInTheDocument();
  });

  it("renders '运行 (未知)' when run metadata is missing", () => {
    const { getByText } = render(
      <TraceRunSection group={{ ...group, runId: "rX", run: null }} index={1} defaultOpen />,
    );
    expect(getByText(/运行 \(未知\)/)).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TraceStep } from "./TraceStep";
import type { ClientMessage } from "@/lib/api/types";
import type { TraceStepData } from "@/lib/chat/build-agent-trace";

function step(parsed: ClientMessage["parsed"], result?: ClientMessage): TraceStepData {
  const msg: ClientMessage = {
    id: "m1", task_card_id: "t1", role: "agent",
    author_user_id: null, author_agent_id: "a1",
    content: {}, task_run_id: "r1", seq: 1, metadata: {},
    created_at: "2026-05-30T10:00:00Z", parsed, meta: {},
  };
  return { msg, result };
}

describe("TraceStep", () => {
  it("renders a tool_use step with the tool name", () => {
    const { getByText } = render(
      <TraceStep step={step({ type: "tool_use", payload: { tool_name: "WebSearch", tool_use_id: "tu1", input: { query: "x" } } })} />,
    );
    expect(getByText("WebSearch")).toBeInTheDocument();
  });

  it("renders assistant_text content", () => {
    const { getByText } = render(
      <TraceStep step={step({ type: "assistant_text", payload: { text: "hello world" } })} />,
    );
    expect(getByText(/hello world/)).toBeInTheDocument();
  });

  it("renders a thinking step label", () => {
    const { getByText } = render(
      <TraceStep step={step({ type: "thinking", payload: { text: "pondering" } })} />,
    );
    expect(getByText(/思考/)).toBeInTheDocument();
  });

  it("renders nothing for empty thinking", () => {
    const { container } = render(
      <TraceStep step={step({ type: "thinking", payload: { text: "" } })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a result step", () => {
    const { getByText } = render(
      <TraceStep step={step({ type: "result", payload: { duration_ms: 1200, result: "done summary" } })} />,
    );
    expect(getByText(/done summary/)).toBeInTheDocument();
  });
});

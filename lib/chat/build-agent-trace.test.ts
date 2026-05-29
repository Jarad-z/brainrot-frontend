import { describe, it, expect } from "vitest";
import { buildAgentTrace } from "./build-agent-trace";
import type { ClientMessage, RunView } from "@/lib/api/types";

function msg(
  over: Partial<ClientMessage> & { parsed: ClientMessage["parsed"] },
): ClientMessage {
  return {
    id: "m", task_card_id: "t1", role: "agent",
    author_user_id: null, author_agent_id: "agentA",
    content: {}, task_run_id: "r1", seq: 1, metadata: {},
    created_at: "2026-05-30T10:00:00Z", meta: {},
    ...over,
  };
}

function run(over: Partial<RunView> & { id: string }): RunView {
  return {
    workspace_id: "w1", task_card_id: "t1", agent_id: "agentA",
    runtime_id: "rt1", trigger_message_id: null, session_id: null,
    status: "done", error: null, created_at: "2026-05-30T10:00:00Z",
    claimed_at: null, started_at: null, finished_at: null,
    ...over,
  };
}

describe("buildAgentTrace", () => {
  it("returns empty groups when agentId is null", () => {
    const r = buildAgentTrace(
      [msg({ id: "m1", parsed: { type: "assistant_text", payload: { text: "hi" } } })],
      [],
      null,
    );
    expect(r).toEqual([]);
  });

  it("filters to the target agent only", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "m1", author_agent_id: "agentA", parsed: { type: "assistant_text", payload: { text: "A" } } }),
        msg({ id: "m2", author_agent_id: "agentB", parsed: { type: "assistant_text", payload: { text: "B" } } }),
      ],
      [run({ id: "r1" })],
      "agentA",
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]!.steps).toHaveLength(1);
    expect(groups[0]!.steps[0]!.msg.id).toBe("m1");
  });

  it("groups by task_run_id and attaches run metadata", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "m1", task_run_id: "r1", seq: 1, parsed: { type: "assistant_text", payload: { text: "first" } } }),
        msg({ id: "m2", task_run_id: "r2", seq: 5, parsed: { type: "assistant_text", payload: { text: "second" } } }),
      ],
      [run({ id: "r1", status: "done" }), run({ id: "r2", status: "running" })],
      "agentA",
    );
    expect(groups).toHaveLength(2);
    expect(groups[0]!.runId).toBe("r1");
    expect(groups[0]!.run?.status).toBe("done");
    expect(groups[1]!.runId).toBe("r2");
    expect(groups[1]!.run?.status).toBe("running");
  });

  it("orders groups by earliest step seq ascending", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "m2", task_run_id: "r2", seq: 10, parsed: { type: "assistant_text", payload: { text: "late" } } }),
        msg({ id: "m1", task_run_id: "r1", seq: 2, parsed: { type: "assistant_text", payload: { text: "early" } } }),
      ],
      [run({ id: "r1" }), run({ id: "r2" })],
      "agentA",
    );
    expect(groups.map((g) => g.runId)).toEqual(["r1", "r2"]);
  });

  it("sorts steps within a run by seq ascending", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "m2", task_run_id: "r1", seq: 3, parsed: { type: "assistant_text", payload: { text: "b" } } }),
        msg({ id: "m1", task_run_id: "r1", seq: 1, parsed: { type: "assistant_text", payload: { text: "a" } } }),
      ],
      [run({ id: "r1" })],
      "agentA",
    );
    expect(groups[0]!.steps.map((s) => s.msg.id)).toEqual(["m1", "m2"]);
  });

  it("pairs tool_use with its tool_result and consumes the result", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "u1", task_run_id: "r1", seq: 1, parsed: { type: "tool_use", payload: { tool_name: "Bash", tool_use_id: "tu1", input: {} } } }),
        msg({ id: "res1", task_run_id: "r1", seq: 2, parsed: { type: "tool_result", payload: { tool_use_id: "tu1", is_error: false, content: "ok" } } }),
      ],
      [run({ id: "r1" })],
      "agentA",
    );
    expect(groups[0]!.steps).toHaveLength(1);
    expect(groups[0]!.steps[0]!.msg.id).toBe("u1");
    expect(groups[0]!.steps[0]!.result?.id).toBe("res1");
  });

  it("puts task_run_id=null messages in a trailing 'unassigned' group", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "m1", task_run_id: "r1", seq: 1, parsed: { type: "assistant_text", payload: { text: "a" } } }),
        msg({ id: "m2", task_run_id: null, seq: 2, parsed: { type: "assistant_text", payload: { text: "loose" } } }),
      ],
      [run({ id: "r1" })],
      "agentA",
    );
    expect(groups).toHaveLength(2);
    expect(groups[groups.length - 1]!.runId).toBeNull();
  });

  it("creates a group with run=null when the run id is not in the runs list", () => {
    const groups = buildAgentTrace(
      [msg({ id: "m1", task_run_id: "rX", seq: 1, parsed: { type: "assistant_text", payload: { text: "a" } } })],
      [],
      "agentA",
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]!.runId).toBe("rX");
    expect(groups[0]!.run).toBeNull();
  });

  it("orders by created_at when seq is null", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "late", task_run_id: "r1", seq: null, created_at: "2026-05-30T10:05:00Z", parsed: { type: "assistant_text", payload: { text: "late" } } }),
        msg({ id: "early", task_run_id: "r1", seq: null, created_at: "2026-05-30T10:01:00Z", parsed: { type: "assistant_text", payload: { text: "early" } } }),
      ],
      [run({ id: "r1" })],
      "agentA",
    );
    expect(groups[0]!.steps.map((s) => s.msg.id)).toEqual(["early", "late"]);
  });

  it("filters out system-noise messages", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "m1", task_run_id: "r1", seq: 1, parsed: { type: "assistant_text", payload: { text: "real" } } }),
        msg({ id: "n1", task_run_id: "r1", seq: 2, parsed: { type: "system", payload: { subtype: "init" } as unknown as string } }),
      ],
      [run({ id: "r1" })],
      "agentA",
    );
    expect(groups[0]!.steps).toHaveLength(1);
    expect(groups[0]!.steps[0]!.msg.id).toBe("m1");
  });
});

import { describe, it, expect } from "vitest";
import { pairToolMessages } from "./pair-tool-messages";
import type { ClientMessage } from "@/lib/api/types";

function mkUse(id: string, tool_use_id: string): ClientMessage {
  return {
    id, task_card_id: "t1", role: "agent",
    author_user_id: null, author_agent_id: "a1",
    content: "", task_run_id: "r1", seq: 1, metadata: "",
    created_at: "2026-05-16T10:00:00Z",
    parsed: { type: "tool_use", payload: { tool_name: "Bash", tool_use_id, input: {} } },
    meta: {},
  };
}
function mkResult(id: string, tool_use_id: string): ClientMessage {
  return {
    id, task_card_id: "t1", role: "agent",
    author_user_id: null, author_agent_id: "a1",
    content: "", task_run_id: "r1", seq: 2, metadata: "",
    created_at: "2026-05-16T10:00:01Z",
    parsed: { type: "tool_result", payload: { tool_use_id, is_error: false, content: "ok" } },
    meta: {},
  };
}
function mkPerm(id: string, tool_use_id: string): ClientMessage {
  return {
    id, task_card_id: "t1", role: "agent",
    author_user_id: null, author_agent_id: "a1",
    content: "", task_run_id: "r1", seq: 3, metadata: "",
    created_at: "2026-05-16T10:00:02Z",
    parsed: { type: "permission_request", payload: { tool_use_id, tool_name: "Write" } },
    meta: {},
  };
}

describe("pairToolMessages", () => {
  it("empty input", () => {
    const r = pairToolMessages([]);
    expect(r.useToResult.size).toBe(0);
    expect(r.consumed.size).toBe(0);
    expect(r.orphanResults.size).toBe(0);
  });

  it("pairs one use with one result", () => {
    const r = pairToolMessages([mkUse("u1", "tu1"), mkResult("res1", "tu1")]);
    expect(r.useToResult.get("tu1")?.id).toBe("res1");
    expect(r.consumed.has("res1")).toBe(true);
    expect(r.orphanResults.size).toBe(0);
  });

  it("pairs multiple use/result pairs independently", () => {
    const r = pairToolMessages([
      mkUse("u1", "tu1"), mkResult("res1", "tu1"),
      mkUse("u2", "tu2"), mkResult("res2", "tu2"),
    ]);
    expect(r.useToResult.size).toBe(2);
    expect(r.consumed.size).toBe(2);
  });

  it("handles out-of-order arrival (result before use in array)", () => {
    const r = pairToolMessages([mkResult("res1", "tu1"), mkUse("u1", "tu1")]);
    expect(r.useToResult.get("tu1")?.id).toBe("res1");
    expect(r.orphanResults.size).toBe(0);
  });

  it("marks unmatched result as orphan", () => {
    const r = pairToolMessages([mkResult("res-x", "tu-missing")]);
    expect(r.orphanResults.has("res-x")).toBe(true);
    expect(r.consumed.has("res-x")).toBe(false);
  });

  it("running: use without result has no orphan effect", () => {
    const r = pairToolMessages([mkUse("u1", "tu1")]);
    expect(r.useToResult.size).toBe(0);
    expect(r.orphanResults.size).toBe(0);
  });

  it("multiple results for same tool_use_id: last wins", () => {
    const r = pairToolMessages([
      mkUse("u1", "tu1"),
      mkResult("res-old", "tu1"),
      mkResult("res-new", "tu1"),
    ]);
    expect(r.useToResult.get("tu1")?.id).toBe("res-new");
    expect(r.consumed.has("res-old")).toBe(true);
    expect(r.consumed.has("res-new")).toBe(true);
  });

  it("permission_request does not participate in pairing", () => {
    const r = pairToolMessages([mkUse("u1", "tu1"), mkPerm("p1", "tu1")]);
    expect(r.useToResult.size).toBe(0);
    expect(r.orphanResults.size).toBe(0);
  });
});

import { describe, it, expect } from "vitest";
import { stringifyToolResult } from "./stringify-tool-result";
import type { ClientMessage } from "@/lib/api/types";

function mkResult(content: unknown): ClientMessage {
  return {
    id: "res1", task_card_id: "t1", role: "agent",
    author_user_id: null, author_agent_id: "a1",
    content: {}, task_run_id: "r1", seq: 1, metadata: {},
    created_at: "2026-05-16T10:00:00Z",
    parsed: { type: "tool_result", payload: { tool_use_id: "tu1", is_error: false, content } },
    meta: {},
  };
}

function mkUse(): ClientMessage {
  return {
    id: "u1", task_card_id: "t1", role: "agent",
    author_user_id: null, author_agent_id: "a1",
    content: {}, task_run_id: "r1", seq: 1, metadata: {},
    created_at: "2026-05-16T10:00:00Z",
    parsed: { type: "tool_use", payload: { tool_name: "Bash", tool_use_id: "tu1", input: {} } },
    meta: {},
  };
}

describe("stringifyToolResult", () => {
  it("returns null for undefined", () => {
    expect(stringifyToolResult(undefined)).toBeNull();
  });

  it("returns null for a non-tool_result message", () => {
    expect(stringifyToolResult(mkUse())).toBeNull();
  });

  it("returns empty string for null content", () => {
    expect(stringifyToolResult(mkResult(null))).toBe("");
  });

  it("returns the string for string content", () => {
    expect(stringifyToolResult(mkResult("ok"))).toBe("ok");
  });

  it("JSON-stringifies object content", () => {
    expect(stringifyToolResult(mkResult({ a: 1, b: "x" }))).toBe('{"a":1,"b":"x"}');
  });

  it("falls back to String() for a cyclic object", () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    expect(stringifyToolResult(mkResult(a))).toBe("[object Object]");
  });
});

import { describe, it, expect } from "vitest";
import { parseMessageContent, type ParsedMessage } from "@/lib/parse-message";
import { encodeJSON } from "@/lib/codec";

function parsed(input: object): ParsedMessage {
  return parseMessageContent(encodeJSON(input));
}

describe("parseMessageContent variants", () => {
  it("user (default type)", () => {
    const r = parsed({ text: "hello @writer", mentions: ["uuid-1"] });
    expect(r.type).toBe("user");
    if (r.type === "user") expect(r.mentions).toEqual(["uuid-1"]);
  });

  it("system", () => {
    const r = parsed({ type: "system", payload: '{"type":"init"}' });
    expect(r.type).toBe("system");
  });

  it("assistant_text", () => {
    const r = parsed({ type: "assistant_text", payload: { text: "hi" } });
    expect(r.type).toBe("assistant_text");
    if (r.type === "assistant_text") expect(r.payload.text).toBe("hi");
  });

  it("tool_use", () => {
    const r = parsed({
      type: "tool_use",
      payload: { tool_name: "Write", tool_use_id: "u1", input: { path: "/x" } },
    });
    expect(r.type).toBe("tool_use");
  });

  it("tool_result", () => {
    const r = parsed({
      type: "tool_result",
      payload: { tool_use_id: "u1", is_error: false, content: "ok" },
    });
    expect(r.type).toBe("tool_result");
  });

  it("permission_request", () => {
    const r = parsed({
      type: "permission_request",
      payload: { tool_use_id: "u1", tool_name: "Bash" },
    });
    expect(r.type).toBe("permission_request");
  });

  it("thinking", () => {
    const r = parsed({ type: "thinking", payload: { text: "hmm" } });
    expect(r.type).toBe("thinking");
  });

  it("result", () => {
    const r = parsed({ type: "result", payload: { duration_ms: 1200, result: "done" } });
    expect(r.type).toBe("result");
  });

  it("rate_limit_event", () => {
    const r = parsed({ type: "rate_limit_event", payload: { retry_in_seconds: 30 } });
    expect(r.type).toBe("rate_limit_event");
  });
});

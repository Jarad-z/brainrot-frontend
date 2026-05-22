import { describe, it, expect } from "vitest";
import { parseMessageContent } from "./parse-message";

describe("parseMessageContent — permission_request payload", () => {
  it("decodes permission_request with all optional fields", () => {
    const parsed = parseMessageContent({
      type: "permission_request",
      payload: {
        tool_use_id: "tu-1",
        tool_name: "Bash",
        approval_id: "ap-1",
        tool_input: { command: "ls" },
        expires_at: "2026-05-16T10:00:00Z",
      },
    });
    expect(parsed.type).toBe("permission_request");
    if (parsed.type === "permission_request") {
      expect(parsed.payload.approval_id).toBe("ap-1");
      expect(parsed.payload.tool_input).toEqual({ command: "ls" });
      expect(parsed.payload.expires_at).toBe("2026-05-16T10:00:00Z");
    }
  });

  it("decodes permission_request with only required fields", () => {
    const parsed = parseMessageContent({
      type: "permission_request",
      payload: { tool_use_id: "tu-2", tool_name: "Write" },
    });
    expect(parsed.type).toBe("permission_request");
    if (parsed.type === "permission_request") {
      expect(parsed.payload.approval_id).toBeUndefined();
      expect(parsed.payload.tool_input).toBeUndefined();
    }
  });

  it("decodes user message (no type field)", () => {
    const parsed = parseMessageContent({ text: "hi @writer", mentions: ["agent-1"] });
    expect(parsed.type).toBe("user");
    if (parsed.type === "user") {
      expect(parsed.text).toBe("hi @writer");
      expect(parsed.mentions).toEqual(["agent-1"]);
    }
  });

  it("decodes assistant_text message", () => {
    const parsed = parseMessageContent({ type: "assistant_text", payload: { text: "hello" } });
    expect(parsed.type).toBe("assistant_text");
    if (parsed.type === "assistant_text") expect(parsed.payload.text).toBe("hello");
  });

  it("decodes assistant_text with stringified payload (seed-data quirk)", () => {
    const parsed = parseMessageContent({
      type: "assistant_text",
      payload: JSON.stringify({ text: "hello from seed" }),
    });
    expect(parsed.type).toBe("assistant_text");
    if (parsed.type === "assistant_text") expect(parsed.payload.text).toBe("hello from seed");
  });

  it("decodes tool_use message", () => {
    const parsed = parseMessageContent({
      type: "tool_use",
      payload: { tool_name: "Read", tool_use_id: "x", input: { path: "a.txt" } },
    });
    expect(parsed.type).toBe("tool_use");
  });

  it("normalizes thinking payload from Claude CLI envelope", () => {
    const parsed = parseMessageContent({
      type: "thinking",
      payload: {
        type: "assistant",
        message: { content: [{ type: "thinking", thinking: "let me think..." }] },
      },
    });
    expect(parsed.type).toBe("thinking");
    if (parsed.type === "thinking") expect(parsed.payload.text).toBe("let me think...");
  });

  it("accepts thinking payload that is already flat", () => {
    const parsed = parseMessageContent({ type: "thinking", payload: { text: "flat" } });
    expect(parsed.type).toBe("thinking");
    if (parsed.type === "thinking") expect(parsed.payload.text).toBe("flat");
  });

  it("falls back to empty text when thinking payload is malformed", () => {
    const parsed = parseMessageContent({ type: "thinking", payload: { foo: "bar" } });
    expect(parsed.type).toBe("thinking");
    if (parsed.type === "thinking") expect(parsed.payload.text).toBe("");
  });

  it("normalizes assistant_text from Claude CLI envelope", () => {
    const parsed = parseMessageContent({
      type: "assistant_text",
      payload: {
        type: "assistant",
        message: { content: [{ type: "text", text: "wrapped reply" }] },
      },
    });
    expect(parsed.type).toBe("assistant_text");
    if (parsed.type === "assistant_text") expect(parsed.payload.text).toBe("wrapped reply");
  });

  it("falls back to empty text when assistant_text payload is malformed", () => {
    const parsed = parseMessageContent({ type: "assistant_text", payload: { foo: "bar" } });
    expect(parsed.type).toBe("assistant_text");
    if (parsed.type === "assistant_text") expect(parsed.payload.text).toBe("");
  });
});

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
});

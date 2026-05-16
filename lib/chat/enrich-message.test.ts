import { describe, it, expect, vi } from "vitest";
import { enrichMessage } from "./enrich-message";
import { encodeJSON } from "@/lib/codec";
import type { Message } from "@/lib/api/types";

function buildRaw(overrides: Partial<Message>): Message {
  return {
    id: "m1",
    task_card_id: "t1",
    role: "user",
    author_user_id: "u1",
    author_agent_id: null,
    content: encodeJSON({ text: "hello", mentions: [] }),
    task_run_id: null,
    seq: null,
    metadata: encodeJSON({}),
    created_at: "2026-05-16T10:00:00Z",
    ...overrides,
  };
}

describe("enrichMessage", () => {
  it("parses user content and empty metadata", () => {
    const r = buildRaw({});
    const enriched = enrichMessage(r);
    expect(enriched.parsed.type).toBe("user");
    expect(enriched.meta).toEqual({});
  });

  it("decodes queued metadata", () => {
    const r = buildRaw({ metadata: encodeJSON({ queued: true }) });
    const enriched = enrichMessage(r);
    expect(enriched.meta.queued).toBe(true);
  });

  it("handles empty content string gracefully", () => {
    const r = buildRaw({ content: "" });
    // CodecError on empty — must not crash; fall back to a system parse error
    const enriched = enrichMessage(r);
    expect(enriched.parsed.type).toBe("system");
  });

  it("handles malformed metadata gracefully (returns empty meta)", () => {
    const r = buildRaw({ metadata: "not-base64-at-all!!!" });
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const enriched = enrichMessage(r);
    expect(enriched.meta).toEqual({});
    spy.mockRestore();
  });
});

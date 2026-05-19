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
    // Empty content is treated as an empty user message (post-#24 wire
    // path returns `{}` for never-set content, base64 path returned "").
    const enriched = enrichMessage(r);
    expect(enriched.parsed.type).toBe("user");
    if (enriched.parsed.type === "user") {
      expect(enriched.parsed.text).toBe("");
    }
  });

  it("accepts already-decoded object content (post-#24 wire format)", () => {
    // Backend PR #2 serves `content` as a structured object on REST.
    // Cast through unknown because the wire type still claims `string`
    // until the WS push path catches up (#30) and we can tighten it.
    const r = buildRaw({
      content: { text: "from object", mentions: [] } as unknown as string,
    });
    const enriched = enrichMessage(r);
    expect(enriched.parsed.type).toBe("user");
    if (enriched.parsed.type === "user") {
      expect(enriched.parsed.text).toBe("from object");
    }
  });

  it("accepts already-decoded object metadata", () => {
    const r = buildRaw({ metadata: { queued: true } as unknown as string });
    const enriched = enrichMessage(r);
    expect(enriched.meta.queued).toBe(true);
  });

  it("handles malformed metadata gracefully (returns empty meta)", () => {
    const r = buildRaw({ metadata: "not-base64-at-all!!!" });
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const enriched = enrichMessage(r);
    expect(enriched.meta).toEqual({});
    spy.mockRestore();
  });
});

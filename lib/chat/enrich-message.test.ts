import { describe, it, expect, vi } from "vitest";
import { enrichMessage } from "./enrich-message";
import type { Message } from "@/lib/api/types";

function buildRaw(overrides: Partial<Message>): Message {
  return {
    id: "m1",
    task_card_id: "t1",
    role: "user",
    author_user_id: "u1",
    author_agent_id: null,
    content: { text: "hello", mentions: [] },
    task_run_id: null,
    seq: null,
    metadata: {},
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
    const r = buildRaw({ metadata: { queued: true } });
    const enriched = enrichMessage(r);
    expect(enriched.meta.queued).toBe(true);
  });

  it("handles empty content object gracefully (falls back to user type)", () => {
    const r = buildRaw({ content: {} });
    const enriched = enrichMessage(r);
    expect(enriched.parsed.type).toBe("user");
  });

  it("handles metadata without queued field (returns empty meta)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = buildRaw({ metadata: { other: "stuff" } });
    const enriched = enrichMessage(r);
    expect(enriched.meta).toEqual({});
    spy.mockRestore();
  });
});

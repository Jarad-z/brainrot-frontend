import { describe, it, expect } from "vitest";
import { upsertMessage } from "./upsert-message";
import type { ClientMessage } from "@/lib/api/types";

function mkUser(id: string, text: string, opts: Partial<ClientMessage> = {}): ClientMessage {
  return {
    id,
    task_card_id: "t1",
    role: "user",
    author_user_id: "u1",
    author_agent_id: null,
    content: "",
    task_run_id: null,
    seq: null,
    metadata: "",
    created_at: opts.created_at ?? "2026-05-16T10:00:00Z",
    parsed: { type: "user", text, mentions: [] },
    meta: {},
    ...opts,
  };
}

describe("upsertMessage", () => {
  it("replaces optimistic message matched by tempId via author+text+time window", () => {
    const opt = mkUser("temp-1", "hello", { tempId: "temp-1" });
    const server = mkUser("srv-1", "hello", { created_at: "2026-05-16T10:00:02Z" });
    const merged = upsertMessage([opt], server);
    expect(merged.length).toBe(1);
    expect(merged[0]!.id).toBe("srv-1");
    expect(merged[0]!.tempId).toBeUndefined();
  });

  it("does NOT match optimistic when text differs", () => {
    const opt = mkUser("temp-1", "hello", { tempId: "temp-1" });
    const server = mkUser("srv-1", "goodbye");
    const merged = upsertMessage([opt], server);
    expect(merged.length).toBe(2);
  });

  it("updates existing message by id (agent multi-update)", () => {
    const m1 = mkUser("m-1", "v1");
    const m2 = mkUser("m-1", "v2");
    const merged = upsertMessage([m1], m2);
    expect(merged.length).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- discriminated union narrowing in test
    expect((merged[0]!.parsed as any).text).toBe("v2");
  });

  it("inserts new message in sorted order", () => {
    const a = mkUser("a", "1", { created_at: "2026-05-16T10:00:00Z" });
    const c = mkUser("c", "3", { created_at: "2026-05-16T10:00:02Z" });
    const b = mkUser("b", "2", { created_at: "2026-05-16T10:00:01Z" });
    const merged = upsertMessage([a, c], b);
    expect(merged.map(m => m.id)).toEqual(["a", "b", "c"]);
  });
});

import { describe, it, expect } from "vitest";
import { compareMessages, insertSorted } from "./sort-messages";
import type { ClientMessage } from "@/lib/api/types";

function mk(
  id: string,
  created_at: string,
  task_run_id: string | null = null,
  seq: number | null = null,
): ClientMessage {
  return {
    id,
    task_card_id: "t1",
    role: "user",
    author_user_id: "u1",
    author_agent_id: null,
    content: "",
    task_run_id,
    seq,
    metadata: "",
    created_at,
    parsed: { type: "user", text: "", mentions: [] },
    meta: {},
  };
}

describe("compareMessages", () => {
  it("orders by created_at ascending", () => {
    const a = mk("a", "2026-05-16T10:00:00Z");
    const b = mk("b", "2026-05-16T10:00:01Z");
    expect(compareMessages(a, b)).toBeLessThan(0);
  });

  it("within same run, orders by seq ascending", () => {
    const a = mk("a", "2026-05-16T10:00:00Z", "run-1", 2);
    const b = mk("b", "2026-05-16T10:00:00Z", "run-1", 1);
    expect(compareMessages(a, b)).toBeGreaterThan(0);
  });

  it("falls back to id for deterministic tiebreak", () => {
    const a = mk("a", "2026-05-16T10:00:00Z");
    const b = mk("b", "2026-05-16T10:00:00Z");
    expect(compareMessages(a, b)).toBeLessThan(0);
  });
});

describe("insertSorted", () => {
  it("inserts into empty list", () => {
    expect(insertSorted([], mk("a", "2026-05-16T10:00:00Z")).length).toBe(1);
  });

  it("appends when newer than all", () => {
    const list = [mk("a", "2026-05-16T10:00:00Z"), mk("b", "2026-05-16T10:00:01Z")];
    const m = mk("c", "2026-05-16T10:00:02Z");
    expect(insertSorted(list, m)[2]!.id).toBe("c");
  });

  it("inserts in middle when timestamp falls between", () => {
    const list = [mk("a", "2026-05-16T10:00:00Z"), mk("c", "2026-05-16T10:00:02Z")];
    const m = mk("b", "2026-05-16T10:00:01Z");
    expect(insertSorted(list, m).map(x => x.id)).toEqual(["a", "b", "c"]);
  });
});

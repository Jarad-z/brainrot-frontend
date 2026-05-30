import { describe, it, expect } from "vitest";
import { isSystemNoise } from "./system-noise";
import type { ClientMessage } from "@/lib/api/types";

function mk(parsed: ClientMessage["parsed"]): ClientMessage {
  return {
    id: "m1", task_card_id: "t1", role: "system",
    author_user_id: null, author_agent_id: null,
    content: {}, task_run_id: "r1", seq: 1, metadata: {},
    created_at: "2026-05-30T10:00:00Z", parsed, meta: {},
  };
}

describe("isSystemNoise", () => {
  it("does not flag stringified subtype payloads (system payload is a string on the wire)", () => {
    for (const subtype of ["hook_started", "hook_response", "init", "notification"]) {
      expect(isSystemNoise(mk({ type: "system", payload: JSON.stringify({ subtype }) }))).toBe(false);
    }
  });

  it("flags system messages whose object payload has a noisy subtype", () => {
    for (const subtype of ["hook_started", "hook_response", "init", "notification"]) {
      expect(
        isSystemNoise(mk({ type: "system", payload: { subtype } as unknown as string })),
      ).toBe(true);
    }
  });

  it("does not flag a system object payload with a non-noisy subtype", () => {
    expect(
      isSystemNoise(mk({ type: "system", payload: { subtype: "result" } as unknown as string })),
    ).toBe(false);
  });

  it("non-system message is never noise", () => {
    expect(isSystemNoise(mk({ type: "assistant_text", payload: { text: "hi" } }))).toBe(false);
  });

  it("system message without a noisy subtype is not noise", () => {
    expect(isSystemNoise(mk({ type: "system", payload: "some note" }))).toBe(false);
  });
});

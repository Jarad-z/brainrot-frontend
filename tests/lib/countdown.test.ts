import { describe, it, expect } from "vitest";
import { computeCountdown, URGENT_MS } from "@/lib/countdown";

const now = Date.parse("2026-05-16T12:00:00Z");

describe("computeCountdown", () => {
  it("returns urgent=false when remaining > 10min", () => {
    const expires = new Date(now + 15 * 60 * 1000).toISOString();
    const r = computeCountdown(expires, now);
    expect(r.urgent).toBe(false);
    expect(r.expired).toBe(false);
    expect(r.remainingMs).toBe(15 * 60 * 1000);
  });

  it("returns urgent=true when remaining ≤ 10min", () => {
    const expires = new Date(now + 5 * 60 * 1000).toISOString();
    expect(computeCountdown(expires, now).urgent).toBe(true);
  });

  it("returns expired=true when remaining = 0", () => {
    const expires = new Date(now).toISOString();
    const r = computeCountdown(expires, now);
    expect(r.expired).toBe(true);
    expect(r.label).toBe("已超时");
  });

  it("clamps negative remainder to 0", () => {
    const expires = new Date(now - 60_000).toISOString();
    expect(computeCountdown(expires, now).remainingMs).toBe(0);
  });

  it("formats label as MM:SS zero-padded", () => {
    const expires = new Date(now + 65_000).toISOString();
    expect(computeCountdown(expires, now).label).toBe("01:05");
  });

  it("URGENT_MS is 10 minutes", () => {
    expect(URGENT_MS).toBe(10 * 60 * 1000);
  });
});

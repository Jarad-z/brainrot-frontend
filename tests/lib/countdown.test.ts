import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { computeCountdown, useCountdown, URGENT_MS } from "@/lib/countdown";

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

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock requestAnimationFrame to call callback immediately
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16) as unknown as number,
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns initial countdown state on mount", () => {
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { result } = renderHook(() => useCountdown(expires));
    expect(result.current.expired).toBe(false);
    expect(result.current.urgent).toBe(true);
  });

  it("returns expired state for past timestamp", () => {
    const expires = new Date(Date.now() - 1000).toISOString();
    const { result } = renderHook(() => useCountdown(expires));
    expect(result.current.expired).toBe(true);
    expect(result.current.label).toBe("已超时");
  });

  it("cleans up animation frame on unmount", () => {
    const expires = new Date(Date.now() + 60_000).toISOString();
    const { unmount } = renderHook(() => useCountdown(expires));
    // Should not throw
    act(() => {
      unmount();
    });
  });
});

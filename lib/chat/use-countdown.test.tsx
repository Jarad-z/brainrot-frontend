import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCountdown } from "./use-countdown";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-16T10:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useCountdown", () => {
  it("returns mm:ss for time remaining", () => {
    const expiresAt = "2026-05-16T10:30:00Z"; // 30 min
    const { result } = renderHook(() => useCountdown(expiresAt));
    expect(result.current.label).toBe("30:00");
    expect(result.current.urgent).toBe(false);
    expect(result.current.expired).toBe(false);
  });

  it("marks urgent when <= 5 min", () => {
    const expiresAt = "2026-05-16T10:03:00Z";
    const { result } = renderHook(() => useCountdown(expiresAt));
    expect(result.current.urgent).toBe(true);
  });

  it("marks expired when past", () => {
    const expiresAt = "2026-05-16T09:00:00Z";
    const { result } = renderHook(() => useCountdown(expiresAt));
    expect(result.current.expired).toBe(true);
    expect(result.current.label).toBe("已超时");
  });
});

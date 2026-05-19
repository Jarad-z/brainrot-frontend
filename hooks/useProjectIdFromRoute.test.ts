import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProjectIdFromRoute } from "./useProjectIdFromRoute";

const pathnameMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

describe("useProjectIdFromRoute", () => {
  it("extracts projectId from /w/ws-1/p/p-2/t/t-3", () => {
    pathnameMock.mockReturnValue("/w/ws-1/p/p-2/t/t-3");
    const { result } = renderHook(() => useProjectIdFromRoute());
    expect(result.current).toBe("p-2");
  });

  it("extracts projectId from /w/ws-1/p/p-2 (no task)", () => {
    pathnameMock.mockReturnValue("/w/ws-1/p/p-2");
    const { result } = renderHook(() => useProjectIdFromRoute());
    expect(result.current).toBe("p-2");
  });

  it("returns null for /approvals", () => {
    pathnameMock.mockReturnValue("/approvals");
    const { result } = renderHook(() => useProjectIdFromRoute());
    expect(result.current).toBeNull();
  });

  it("returns null for /w/ws-1/settings", () => {
    pathnameMock.mockReturnValue("/w/ws-1/settings");
    const { result } = renderHook(() => useProjectIdFromRoute());
    expect(result.current).toBeNull();
  });

  it("returns null for /", () => {
    pathnameMock.mockReturnValue("/");
    const { result } = renderHook(() => useProjectIdFromRoute());
    expect(result.current).toBeNull();
  });
});

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useIssueInstallToken } from "./useIssueInstallToken";
import * as runtimesApi from "@/lib/api/runtimes";

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useIssueInstallToken", () => {
  it("returns the token but does not place it in the React Query cache", async () => {
    vi.spyOn(runtimesApi, "issueInstallToken").mockResolvedValue({
      token: "bri_secret_xxx",
      expires_at: "2026-05-18T01:00:00Z",
    });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useIssueInstallToken("ws1"), { wrapper: wrapper(qc) });

    let returned;
    await act(async () => {
      returned = await result.current.mutateAsync();
    });
    expect(returned).toEqual({ token: "bri_secret_xxx", expires_at: "2026-05-18T01:00:00Z" });

    // Confirm the secret is not in any cache entry
    const cacheEntries = qc.getQueryCache().getAll();
    const serialised = JSON.stringify(cacheEntries.map((e) => e.state.data));
    expect(serialised).not.toContain("bri_secret_xxx");
  });
});

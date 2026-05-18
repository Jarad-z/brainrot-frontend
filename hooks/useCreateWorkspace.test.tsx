import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCreateWorkspace } from "./useCreateWorkspace";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import * as wsApi from "@/lib/api/workspaces";
import type { Workspace } from "@/lib/api/types";

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeWs(): Workspace {
  return {
    id: "ws-new",
    name: "Marketing-Q2",
    slug: "marketing-q2",
    owner_id: "u1",
    created_at: "2026-05-18T00:00:00Z",
    updated_at: "2026-05-18T00:00:00Z",
  };
}

describe("useCreateWorkspace", () => {
  it("returns the created workspace on success and invalidates the list", async () => {
    const ws = makeWs();
    vi.spyOn(wsApi, "createWorkspace").mockResolvedValue(ws);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useCreateWorkspace(), { wrapper: wrapper(qc) });
    await act(async () => {
      await result.current.mutateAsync({ name: "Marketing-Q2", slug: "marketing-q2" });
    });

    await waitFor(() => expect(result.current.data?.id).toBe("ws-new"));
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.workspaces.list() });
  });

  it("surfaces ApiError on 409 conflict", async () => {
    vi.spyOn(wsApi, "createWorkspace").mockRejectedValue(new ApiError(409, "slug taken"));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useCreateWorkspace(), { wrapper: wrapper(qc) });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ name: "X", slug: "marketing-q2" });
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useProjectAssets } from "./useProjectAssets";
import type { Asset } from "@/lib/api/types";
import * as assetsApi from "@/lib/api/assets";

function makeAsset(id: string): Asset {
  return {
    id,
    project_id: "p1",
    uploaded_by: "u1",
    filename: `ref-${id}.pdf`,
    mime_type: "application/pdf",
    size_bytes: 2048,
    blob_key: `blob/${id}`,
    sha256: "cafebabe",
    created_at: "2026-05-18T10:00:00Z",
  };
}

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useProjectAssets", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns assets on 200", async () => {
    vi.spyOn(assetsApi, "fetchProjectAssets").mockResolvedValue([
      makeAsset("a1"),
      makeAsset("a2"),
    ]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useProjectAssets("p1"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data?.length).toBe(2));
    expect(result.current.data?.[0]?.id).toBe("a1");
  });

  it("does not fetch when projectId is empty", () => {
    const spy = vi.spyOn(assetsApi, "fetchProjectAssets").mockResolvedValue([]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useProjectAssets(""), { wrapper: wrapper(qc) });
    expect(spy).not.toHaveBeenCalled();
  });

  it("surfaces fetch errors", async () => {
    vi.spyOn(assetsApi, "fetchProjectAssets").mockRejectedValue(
      new Error("500 boom"),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useProjectAssets("p1"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTaskArtifacts } from "./useTaskArtifacts";
import type { Artifact } from "@/lib/api/types";
import * as artifactsApi from "@/lib/api/artifacts";

function makeArtifact(id: string): Artifact {
  return {
    id,
    project_id: "p1",
    task_card_id: "t1",
    task_run_id: "r1",
    filename: `out-${id}.txt`,
    mime_type: "text/plain",
    size_bytes: 128,
    blob_key: `blob/${id}`,
    sha256: "deadbeef",
    source: "claude_write",
    excluded: false,
    created_at: "2026-05-18T10:00:00Z",
  };
}

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useTaskArtifacts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns artifacts on 200", async () => {
    vi.spyOn(artifactsApi, "fetchTaskArtifacts").mockResolvedValue([
      makeArtifact("a1"),
      makeArtifact("a2"),
    ]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useTaskArtifacts("t1"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data?.length).toBe(2));
    expect(result.current.data?.[0]?.id).toBe("a1");
  });

  it("does not fetch when taskId is empty", () => {
    const spy = vi.spyOn(artifactsApi, "fetchTaskArtifacts").mockResolvedValue([]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useTaskArtifacts(""), { wrapper: wrapper(qc) });
    expect(spy).not.toHaveBeenCalled();
  });

  it("surfaces fetch errors", async () => {
    vi.spyOn(artifactsApi, "fetchTaskArtifacts").mockRejectedValue(
      new Error("500 boom"),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useTaskArtifacts("t1"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

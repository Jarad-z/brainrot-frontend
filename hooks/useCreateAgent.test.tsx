import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCreateAgent } from "./useCreateAgent";
import { queryKeys } from "@/lib/api/keys";
import * as agentsApi from "@/lib/api/agents";
import type { Agent } from "@/lib/api/types";

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeAgent(): Agent {
  return {
    id: "a1",
    workspace_id: "ws1",
    runtime_id: "rt1",
    handle: "writer",
    name: "Writer",
    avatar_url: null,
    description: "",
    instructions: "",
    backend_type: "claude",
    model: "claude-sonnet-4-6",
    custom_env: { K: "V" },
    custom_args: ["--x"],
    mcp_config: {},
    archived: false,
    created_at: "2026-05-18T00:00:00Z",
    updated_at: "2026-05-18T00:00:00Z",
  };
}

describe("useCreateAgent", () => {
  it("sends raw structured JSON (not base64) and invalidates the agents list", async () => {
    const createSpy = vi.spyOn(agentsApi, "createAgent").mockResolvedValue(makeAgent());
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useCreateAgent("ws1"), { wrapper: wrapper(qc) });
    await act(async () => {
      await result.current.mutateAsync({
        runtime_id: "rt1",
        handle: "writer",
        name: "Writer",
        custom_env: { K: "V" },
        custom_args: ["--x"],
        mcp_config: {},
      });
    });

    expect(createSpy).toHaveBeenCalledWith("ws1", expect.objectContaining({
      custom_env: { K: "V" },
      custom_args: ["--x"],
    }));
    await waitFor(() =>
      expect(invSpy).toHaveBeenCalledWith({ queryKey: queryKeys.workspaces.agents("ws1") }),
    );
  });
});

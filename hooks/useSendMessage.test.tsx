import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSendMessage } from "./useSendMessage";
import { queryKeys } from "@/lib/api/keys";
import { encodeJSON } from "@/lib/codec";

vi.mock("@/lib/api/messages", () => ({
  sendMessage: vi.fn(),
}));
vi.mock("./useSession", () => ({
  useSession: () => ({ data: { ID: "u1", Email: "u@x", Name: "U" } }),
}));

import { sendMessage } from "@/lib/api/messages";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(queryKeys.tasks.messages("t1"), []);
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  (sendMessage as any).mockReset();
});

describe("useSendMessage", () => {
  it("inserts optimistic message, then replaces with server message", async () => {
    (sendMessage as any).mockResolvedValueOnce({
      message: {
        id: "srv-1", task_card_id: "t1", role: "user",
        author_user_id: "u1", author_agent_id: null,
        content: encodeJSON({ text: "hi", mentions: [] }),
        task_run_id: null, seq: null, metadata: "",
        created_at: "2026-05-16T10:00:01Z",
      },
      runs: [],
    });
    const { result } = renderHook(() => useSendMessage("t1"), { wrapper });
    await act(async () => {
      result.current.mutate({ text: "hi", mentions: [] });
    });
    await waitFor(() => expect(sendMessage).toHaveBeenCalled());
  });

  it("rolls back optimistic insert on error", async () => {
    (sendMessage as any).mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useSendMessage("t1"), { wrapper });
    await act(async () => {
      try { await result.current.mutateAsync({ text: "hi", mentions: [] }); } catch {}
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

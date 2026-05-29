import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AgentTraceModal } from "./AgentTraceModal";
import { useChatUIStore } from "@/lib/store/chat-ui";

// Trace + agents hooks are network-backed; stub them to isolate the modal shell.
vi.mock("@/hooks/useAgentTrace", () => ({
  useAgentTrace: () => ({ groups: [], isPending: false }),
}));
vi.mock("@/hooks/useWorkspaceAgents", () => ({
  useWorkspaceAgents: () => ({ data: [{ id: "agentA", name: "Writer", handle: "writer" }] }),
}));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  useChatUIStore.setState({ byTask: {} });
});

describe("AgentTraceModal", () => {
  it("is closed (renders no dialog) when traceAgentId is null", () => {
    const { queryByRole } = wrap(<AgentTraceModal taskId="t1" wsId="w1" />);
    expect(queryByRole("dialog")).toBeNull();
  });

  it("opens and shows the agent name + empty state when traceAgentId is set", () => {
    useChatUIStore.getState().openTrace("t1", "agentA");
    const { getByRole, getByText } = wrap(<AgentTraceModal taskId="t1" wsId="w1" />);
    expect(getByRole("dialog")).toBeInTheDocument();
    expect(getByText(/Writer/)).toBeInTheDocument();
    expect(getByText(/还没有/)).toBeInTheDocument();
  });

  it("closes (clears traceAgentId) when the dialog requests close via Escape", () => {
    useChatUIStore.getState().openTrace("t1", "agentA");
    const { getByRole } = wrap(<AgentTraceModal taskId="t1" wsId="w1" />);
    expect(getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(getByRole("dialog"), { key: "Escape" });
    expect(useChatUIStore.getState().byTask["t1"]!.traceAgentId).toBeNull();
  });

  it("clears traceAgentId when the modal unmounts (no stale re-open)", () => {
    useChatUIStore.getState().openTrace("t1", "agentA");
    const { unmount } = wrap(<AgentTraceModal taskId="t1" wsId="w1" />);
    expect(useChatUIStore.getState().byTask["t1"]!.traceAgentId).toBe("agentA");
    unmount();
    expect(useChatUIStore.getState().byTask["t1"]!.traceAgentId).toBeNull();
  });
});

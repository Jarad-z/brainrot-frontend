import { describe, it, expect, beforeEach } from "vitest";
import { useChatUIStore, getDecision } from "./chat-ui";

beforeEach(() => {
  useChatUIStore.setState({ byTask: {} });
});

describe("ChatUIStore", () => {
  it("toggleToolBody expands then collapses", () => {
    useChatUIStore.getState().toggleToolBody("t1", "m1");
    expect(useChatUIStore.getState().byTask["t1"]!.expandedToolBodies.has("m1")).toBe(true);
    useChatUIStore.getState().toggleToolBody("t1", "m1");
    expect(useChatUIStore.getState().byTask["t1"]!.expandedToolBodies.has("m1")).toBe(false);
  });

  it("setScrollAnchor switches anchor", () => {
    useChatUIStore.getState().setScrollAnchor("t1", "manual");
    expect(useChatUIStore.getState().byTask["t1"]!.scrollAnchor).toBe("manual");
  });

  it("setActiveTab updates tab", () => {
    useChatUIStore.getState().setActiveTab("t1", "approvals");
    expect(useChatUIStore.getState().byTask["t1"]!.activeTab).toBe("approvals");
  });

  it("recordDecision is idempotent (last write wins)", () => {
    useChatUIStore.getState().recordDecision("ap1", { decision: "approved", at: 1 });
    useChatUIStore.getState().recordDecision("ap1", { decision: "approved", at: 2 });
    const state = useChatUIStore.getState();
    const rec = getDecision(state, "ap1");
    expect(rec).toBeDefined();
    expect(rec?.at).toBe(2);
  });

  it("clearTask only wipes that task", () => {
    useChatUIStore.getState().setActiveTab("t1", "approvals");
    useChatUIStore.getState().setActiveTab("t2", "approvals");
    useChatUIStore.getState().clearTask("t1");
    expect(useChatUIStore.getState().byTask["t1"]).toBeUndefined();
    expect(useChatUIStore.getState().byTask["t2"]).toBeDefined();
  });

  it("openTrace sets traceAgentId, closeTrace clears it", () => {
    useChatUIStore.getState().openTrace("t1", "agentA");
    expect(useChatUIStore.getState().byTask["t1"]!.traceAgentId).toBe("agentA");
    useChatUIStore.getState().closeTrace("t1");
    expect(useChatUIStore.getState().byTask["t1"]!.traceAgentId).toBeNull();
  });

  it("traceAgentId defaults to null on a fresh task", () => {
    useChatUIStore.getState().setActiveTab("t9", "artifacts");
    expect(useChatUIStore.getState().byTask["t9"]!.traceAgentId).toBeNull();
  });
});

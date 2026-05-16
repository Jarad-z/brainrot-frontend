import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/lib/store";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it("setSelection merges partial patch", () => {
    useAppStore.getState().setSelection({ wsId: "ws-1" });
    expect(useAppStore.getState().selection).toEqual({
      wsId: "ws-1",
      projectId: null,
      taskId: null,
    });
    useAppStore.getState().setSelection({ projectId: "p-1" });
    expect(useAppStore.getState().selection).toEqual({
      wsId: "ws-1",
      projectId: "p-1",
      taskId: null,
    });
  });

  it("setWsStatus updates lastConnectedAt only on 'connected'", () => {
    const before = Date.now();
    useAppStore.getState().setWsStatus("connecting");
    expect(useAppStore.getState().ws.lastConnectedAt).toBeNull();
    useAppStore.getState().setWsStatus("connected");
    const ts = useAppStore.getState().ws.lastConnectedAt;
    expect(ts).not.toBeNull();
    expect(ts!).toBeGreaterThanOrEqual(before);
    useAppStore.getState().setWsStatus("offline");
    expect(useAppStore.getState().ws.lastConnectedAt).toBe(ts);
  });

  it("reset clears selection and ws", () => {
    useAppStore.getState().setSelection({ wsId: "ws-1", projectId: "p-1" });
    useAppStore.getState().setWsStatus("connected");
    useAppStore.getState().reset();
    expect(useAppStore.getState().selection).toEqual({ wsId: null, projectId: null, taskId: null });
    expect(useAppStore.getState().ws).toEqual({ status: "idle", lastConnectedAt: null });
  });

  it("setSelection independent of ws state", () => {
    useAppStore.getState().setWsStatus("connected");
    const wsBefore = useAppStore.getState().ws;
    useAppStore.getState().setSelection({ wsId: "ws-1" });
    expect(useAppStore.getState().ws).toEqual(wsBefore);
  });
});

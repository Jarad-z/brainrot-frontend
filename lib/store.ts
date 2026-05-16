import { create } from "zustand";

export interface Selection {
  wsId: string | null;
  projectId: string | null;
  taskId: string | null;
}

export type WsStatus = "idle" | "connecting" | "connected" | "offline";

interface AppState {
  selection: Selection;
  setSelection: (patch: Partial<Selection>) => void;
  ws: { status: WsStatus; lastConnectedAt: number | null };
  setWsStatus: (status: WsStatus) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selection: { wsId: null, projectId: null, taskId: null },
  setSelection: (patch) =>
    set((s) => ({ selection: { ...s.selection, ...patch } })),
  ws: { status: "idle", lastConnectedAt: null },
  setWsStatus: (status) =>
    set((s) => ({
      ws: {
        status,
        lastConnectedAt: status === "connected" ? Date.now() : s.ws.lastConnectedAt,
      },
    })),
  reset: () =>
    set({
      selection: { wsId: null, projectId: null, taskId: null },
      ws: { status: "idle", lastConnectedAt: null },
    }),
}));

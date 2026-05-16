import { create } from "zustand";
import type { ApprovalDecision } from "@/lib/api/types";

export interface DecisionRecord {
  decision: ApprovalDecision;
  note?: string;
  at: number;
}

export interface TaskUIState {
  expandedToolBodies: Set<string>;
  expandedThinkings: Set<string>;
  scrollAnchor: "bottom" | "manual";
  activeTab: "artifacts" | "assets" | "approvals";
  decisions: Record<string, DecisionRecord>;
}

export interface ChatUIStore {
  byTask: Record<string, TaskUIState>;
  toggleToolBody: (taskId: string, msgId: string) => void;
  toggleThinking: (taskId: string, msgId: string) => void;
  setScrollAnchor: (taskId: string, anchor: "bottom" | "manual") => void;
  setActiveTab: (taskId: string, tab: TaskUIState["activeTab"]) => void;
  recordDecision: (approvalId: string, d: DecisionRecord) => void;
  clearDecision: (approvalId: string) => void;
  clearTask: (taskId: string) => void;
}

const DEFAULT_TASK = (): TaskUIState => ({
  expandedToolBodies: new Set(),
  expandedThinkings: new Set(),
  scrollAnchor: "bottom",
  activeTab: "artifacts",
  decisions: {},
});

const GLOBAL_DECISIONS_KEY = "_global";

function ensureTask(
  byTask: Record<string, TaskUIState>,
  taskId: string,
): Record<string, TaskUIState> {
  if (byTask[taskId]) return byTask;
  return { ...byTask, [taskId]: DEFAULT_TASK() };
}

export const useChatUIStore = create<ChatUIStore>((set) => ({
  byTask: {},

  toggleToolBody: (taskId, msgId) =>
    set((state) => {
      const byTask = ensureTask(state.byTask, taskId);
      const next = new Set(byTask[taskId]!.expandedToolBodies);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return {
        byTask: { ...byTask, [taskId]: { ...byTask[taskId]!, expandedToolBodies: next } },
      };
    }),

  toggleThinking: (taskId, msgId) =>
    set((state) => {
      const byTask = ensureTask(state.byTask, taskId);
      const next = new Set(byTask[taskId]!.expandedThinkings);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return {
        byTask: { ...byTask, [taskId]: { ...byTask[taskId]!, expandedThinkings: next } },
      };
    }),

  setScrollAnchor: (taskId, anchor) =>
    set((state) => {
      const byTask = ensureTask(state.byTask, taskId);
      return {
        byTask: { ...byTask, [taskId]: { ...byTask[taskId]!, scrollAnchor: anchor } },
      };
    }),

  setActiveTab: (taskId, tab) =>
    set((state) => {
      const byTask = ensureTask(state.byTask, taskId);
      return {
        byTask: { ...byTask, [taskId]: { ...byTask[taskId]!, activeTab: tab } },
      };
    }),

  recordDecision: (approvalId, d) =>
    set((state) => {
      const byTask = ensureTask(state.byTask, GLOBAL_DECISIONS_KEY);
      const next = { ...byTask[GLOBAL_DECISIONS_KEY]!.decisions, [approvalId]: d };
      return {
        byTask: {
          ...byTask,
          [GLOBAL_DECISIONS_KEY]: { ...byTask[GLOBAL_DECISIONS_KEY]!, decisions: next },
        },
      };
    }),

  clearDecision: (approvalId) =>
    set((state) => {
      const slot = state.byTask[GLOBAL_DECISIONS_KEY];
      if (!slot) return state;
      const next = { ...slot.decisions };
      delete next[approvalId];
      return {
        byTask: { ...state.byTask, [GLOBAL_DECISIONS_KEY]: { ...slot, decisions: next } },
      };
    }),

  clearTask: (taskId) =>
    set((state) => {
      const { [taskId]: _drop, ...rest } = state.byTask;
      void _drop;
      return { byTask: rest };
    }),
}));

export function getDecision(
  state: ChatUIStore,
  approvalId: string,
): DecisionRecord | undefined {
  return state.byTask[GLOBAL_DECISIONS_KEY]?.decisions[approvalId];
}

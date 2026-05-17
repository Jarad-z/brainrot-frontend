"use client";
import { useMemo } from "react";
import { useTaskMessages } from "./useTaskMessages";

export interface ActiveRun {
  runId: string;
  agentId: string | null;
}

export function useActiveRuns(taskId: string): ActiveRun[] {
  const { data: messages = [] } = useTaskMessages(taskId);
  return useMemo(() => {
    const runs = new Map<string, ActiveRun>();
    for (const m of messages) {
      if (!m.task_run_id) continue;
      if (m.parsed.type === "result") {
        runs.delete(m.task_run_id);
      } else if (!runs.has(m.task_run_id)) {
        runs.set(m.task_run_id, { runId: m.task_run_id, agentId: m.author_agent_id });
      }
    }
    return Array.from(runs.values());
  }, [messages]);
}

"use client";
import { useMemo } from "react";
import { useTaskMessages } from "./useTaskMessages";
import { useTaskRuns } from "./useTaskRuns";
import { buildAgentTrace, type TraceRunGroup } from "@/lib/chat/build-agent-trace";

export interface AgentTraceResult {
  groups: TraceRunGroup[];
  isPending: boolean;
}

/** Derives an agent's per-run trace for a task from already-cached messages and
 *  runs. No new requests; disabled (returns empty) when agentId is null. */
export function useAgentTrace(taskId: string, agentId: string | null): AgentTraceResult {
  const { data: messages = [], isPending: msgsPending } = useTaskMessages(taskId);
  const { data: runs = [], isPending: runsPending } = useTaskRuns(taskId, agentId !== null);

  const groups = useMemo(
    () => buildAgentTrace(messages, runs, agentId),
    [messages, runs, agentId],
  );

  return { groups, isPending: agentId !== null && (msgsPending || runsPending) };
}

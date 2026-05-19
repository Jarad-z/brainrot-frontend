"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import type { RunView } from "@/lib/api/types";

export interface ActiveRun {
  runId: string;
  agentId: string | null;
}

const ACTIVE_STATUSES = new Set(["pending", "claimed", "running", "awaiting_approval"]);

export function useActiveRuns(taskId: string): ActiveRun[] {
  const { data = [] } = useQuery({
    queryKey: queryKeys.tasks.runs(taskId),
    queryFn: () => apiFetch<RunView[]>(`/api/v1/tasks/${taskId}/runs`),
    enabled: !!taskId,
    // Auto-refresh: until WS run lifecycle events are wired, poll every 5 s so
    // pending → running → done transitions show up. Once daemon WS broadcasts
    // run.* events into the cache this can drop back to default staleness.
    refetchInterval: 5000,
  });

  return data
    .filter((r) => ACTIVE_STATUSES.has(r.status))
    .map((r) => ({ runId: r.id, agentId: r.agent_id }));
}

"use client";

import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";

/**
 * Resolves a single agent by id from the workspace agents list.
 *
 * Backend GAP: `GET /api/v1/agents/{id}` does not exist (BACKEND_GAPS #22) — only
 * list + create + delete are implemented. Until that endpoint lands we derive
 * the detail view from the list, which is fine since wsId is in the URL.
 */
export function useAgent(wsId: string, agentId: string) {
  const q = useWorkspaceAgents(wsId);
  const agent = q.data?.find((a) => a.id === agentId);
  return {
    data: agent,
    isLoading: q.isLoading,
    isError: q.isError,
  };
}

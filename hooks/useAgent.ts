"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAgent } from "@/lib/api/agents";
import { queryKeys } from "@/lib/api/keys";

/**
 * Single-agent query. BACKEND_GAPS #22 closed — GET /api/v1/agents/{id} now exists.
 */
export function useAgent(agentId: string) {
  return useQuery({
    queryKey: queryKeys.agents.detail(agentId),
    queryFn: () => fetchAgent(agentId),
    enabled: !!agentId,
  });
}

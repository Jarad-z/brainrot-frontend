"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAgent } from "@/lib/api/agents";
import { queryKeys } from "@/lib/api/keys";

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: queryKeys.agents.detail(agentId),
    queryFn: () => fetchAgent(agentId),
    enabled: !!agentId,
    staleTime: 0,
  });
}

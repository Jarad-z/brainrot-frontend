"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaceAgents } from "@/lib/api/agents";
import { queryKeys } from "@/lib/api/keys";

export function useWorkspaceAgents(wsId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.agents(wsId),
    queryFn: () => fetchWorkspaceAgents(wsId),
    enabled: !!wsId,
    staleTime: 0,
  });
}

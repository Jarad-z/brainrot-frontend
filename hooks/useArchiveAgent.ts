"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveAgent } from "@/lib/api/agents";
import { queryKeys } from "@/lib/api/keys";

export function useArchiveAgent(wsId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (agentId) => archiveAgent(agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.agents(wsId) });
    },
  });
}

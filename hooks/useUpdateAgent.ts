"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAgent } from "@/lib/api/agents";
import { queryKeys } from "@/lib/api/keys";
import type { Agent, AgentInput } from "@/lib/api/types";

export function useUpdateAgent(wsId: string, agentId: string) {
  const qc = useQueryClient();
  return useMutation<Agent, Error, AgentInput>({
    mutationFn: (input) => updateAgent(agentId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.agents(wsId) });
      qc.invalidateQueries({ queryKey: queryKeys.agents.detail(agentId) });
    },
  });
}

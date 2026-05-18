"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAgent } from "@/lib/api/agents";
import { queryKeys } from "@/lib/api/keys";
import type { Agent, AgentInput } from "@/lib/api/types";

export function useCreateAgent(wsId: string) {
  const qc = useQueryClient();
  return useMutation<Agent, Error, AgentInput>({
    mutationFn: (input) => createAgent(wsId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.agents(wsId) });
    },
  });
}

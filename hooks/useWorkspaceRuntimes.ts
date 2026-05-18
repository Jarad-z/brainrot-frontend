"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaceRuntimes } from "@/lib/api/runtimes";
import { queryKeys } from "@/lib/api/keys";

export function useWorkspaceRuntimes(wsId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.runtimes(wsId),
    queryFn: () => fetchWorkspaceRuntimes(wsId),
    enabled: !!wsId,
    staleTime: 0,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/api/keys";

export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces.list(),
    queryFn: fetchWorkspaces,
    staleTime: 30_000,
  });
}

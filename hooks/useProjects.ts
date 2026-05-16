"use client";

import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";

export function useProjects(wsId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.projects(wsId),
    queryFn: () => projectsApi.list(wsId),
    enabled: !!wsId,
  });
}

"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchProjectAssets } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";

export function useProjectAssets(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.assets(projectId),
    queryFn: () => fetchProjectAssets(projectId),
    enabled: !!projectId,
  });
}

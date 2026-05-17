"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchTaskArtifacts } from "@/lib/api/artifacts";
import { queryKeys } from "@/lib/api/keys";

export function useTaskArtifacts(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.artifacts(taskId),
    queryFn: () => fetchTaskArtifacts(taskId),
    enabled: !!taskId,
  });
}

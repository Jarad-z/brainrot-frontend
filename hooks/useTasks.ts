"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { queryKeys } from "@/lib/api/keys";

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.tasks(projectId),
    queryFn: () => tasksApi.list(projectId),
    enabled: !!projectId,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTask } from "@/lib/api/task";
import { queryKeys } from "@/lib/api/keys";
import type { TaskCard } from "@/lib/api/types";

export function useTask(taskId: string) {
  const queryClient = useQueryClient();
  return useQuery<TaskCard | undefined>({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: async () => {
      const direct = await fetchTask(taskId);
      if (direct) return direct;
      // Fallback: scan project task-list caches for this task
      const allProjects = queryClient.getQueryCache().findAll({ queryKey: ["projects"] });
      for (const q of allProjects) {
        const data = q.state.data;
        if (Array.isArray(data)) {
          const hit = (data as TaskCard[]).find((t) => t.id === taskId);
          if (hit) return hit;
        }
      }
      return undefined;
    },
    enabled: !!taskId,
  });
}

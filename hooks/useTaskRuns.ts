"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchTaskRuns } from "@/lib/api/task";
import { queryKeys } from "@/lib/api/keys";

/** Read-only access to a task's runs cache (same key as useActiveRuns, so they
 *  share fetches and the 5s poll started by useActiveRuns). */
export function useTaskRuns(taskId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.runs(taskId),
    queryFn: () => fetchTaskRuns(taskId),
    enabled: enabled && !!taskId,
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { queryKeys } from "@/lib/api/keys";

interface UpdateTaskMetaInput {
  taskId: string;
  title?: string;
  summary?: string;
}

export function useUpdateTaskMeta(projectId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, UpdateTaskMetaInput>({
    mutationFn: ({ taskId, title, summary }) => {
      const body: { title?: string; summary?: string } = {};
      if (title !== undefined) body.title = title;
      if (summary !== undefined) body.summary = summary;
      return tasksApi.patch(taskId, body);
    },
    onSuccess: (_data, { taskId }) => {
      // The server publishes task.updated and the WS handler in
      // lib/ws/handlers.ts:onTaskMutation already does the cache merge.
      // Belt-and-suspenders invalidate in case the WS event is delayed.
      qc.invalidateQueries({ queryKey: queryKeys.projects.tasks(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
    },
  });
}

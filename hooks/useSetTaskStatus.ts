"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { queryKeys } from "@/lib/api/keys";
import type { TaskStatus } from "@/lib/api/types";

interface SetStatusInput {
  taskId: string;
  status: TaskStatus;
}

export function useSetTaskStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, SetStatusInput>({
    mutationFn: ({ taskId, status }) => tasksApi.patch(taskId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.tasks(projectId) });
    },
  });
}


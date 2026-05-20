"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { queryKeys } from "@/lib/api/keys";
import type { CreateTaskInput, TaskCard } from "@/lib/api/types";

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation<TaskCard, Error, CreateTaskInput>({
    mutationFn: (input) => tasksApi.create(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.tasks(projectId) });
    },
  });
}

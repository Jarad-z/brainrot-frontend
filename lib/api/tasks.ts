import { apiFetch } from "./client";
import type { CreateTaskInput, TaskCard } from "./types";

export const tasksApi = {
  list: (projectId: string) => apiFetch<TaskCard[]>(`/api/v1/projects/${projectId}/tasks`),
  create: (projectId: string, input: CreateTaskInput) =>
    apiFetch<TaskCard>(`/api/v1/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

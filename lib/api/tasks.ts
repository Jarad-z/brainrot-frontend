import { apiFetch } from "./client";
import type { CreateTaskInput, PatchTaskInput, TaskCard } from "./types";

export const tasksApi = {
  list: (projectId: string) => apiFetch<TaskCard[]>(`/api/v1/projects/${projectId}/tasks`),
  create: (projectId: string, input: CreateTaskInput) =>
    apiFetch<TaskCard>(`/api/v1/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  patch: (taskId: string, input: PatchTaskInput) =>
    apiFetch<void>(`/api/v1/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};

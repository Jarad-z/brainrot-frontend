import { apiFetch } from "./client";
import type { TaskCard } from "./types";

export const tasksApi = {
  list: (projectId: string) => apiFetch<TaskCard[]>(`/api/v1/projects/${projectId}/tasks`),
};

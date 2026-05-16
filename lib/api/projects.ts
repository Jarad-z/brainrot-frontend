import { apiFetch } from "./client";
import type { Project } from "./types";

export const projectsApi = {
  list: (wsId: string) => apiFetch<Project[]>(`/api/v1/workspaces/${wsId}/projects`),
  get:  (projectId: string) => apiFetch<Project>(`/api/v1/projects/${projectId}`),
};

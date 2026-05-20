import { apiFetch } from "./client";
import type { CreateProjectInput, Project } from "./types";

export const projectsApi = {
  list: (wsId: string) => apiFetch<Project[]>(`/api/v1/workspaces/${wsId}/projects`),
  get: (projectId: string) => apiFetch<Project>(`/api/v1/projects/${projectId}`),
  create: (wsId: string, input: CreateProjectInput) =>
    apiFetch<Project>(`/api/v1/workspaces/${wsId}/projects`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

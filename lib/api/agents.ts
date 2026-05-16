import { apiFetch } from "./client";
import type { Agent } from "./types";

export async function fetchWorkspaceAgents(wsId: string): Promise<Agent[]> {
  return apiFetch<Agent[]>(`/api/v1/workspaces/${wsId}/agents`);
}

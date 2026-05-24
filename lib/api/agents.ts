import { apiFetch } from "./client";
import type { Agent, AgentInput, AgentRefView } from "./types";

// Backend now returns AgentRefView[] (Task 6) — the superset shape that adds
// is_installed / effective_handle / install_id on top of the base Agent fields.
// Existing consumers that only read Agent fields keep working unchanged.
export async function fetchWorkspaceAgents(wsId: string): Promise<AgentRefView[]> {
  return apiFetch<AgentRefView[]>(`/api/v1/workspaces/${wsId}/agents`);
}

export async function fetchAgent(agentId: string): Promise<Agent> {
  return apiFetch<Agent>(`/api/v1/agents/${agentId}`);
}

export async function createAgent(wsId: string, input: AgentInput): Promise<Agent> {
  return apiFetch<Agent>(`/api/v1/workspaces/${wsId}/agents`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAgent(
  agentId: string,
  input: Partial<AgentInput>,
): Promise<Agent> {
  return apiFetch<Agent>(`/api/v1/agents/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function archiveAgent(agentId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/agents/${agentId}`, { method: "DELETE" });
}

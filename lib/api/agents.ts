import { apiFetch } from "./client";
import type { Agent, AgentInput, AgentWire } from "./types";
import { decodeAgentResponse, encodeAgentInput } from "./agents-encoding";

export async function fetchWorkspaceAgents(wsId: string): Promise<Agent[]> {
  const wire = await apiFetch<AgentWire[]>(`/api/v1/workspaces/${wsId}/agents`);
  return wire.map(decodeAgentResponse);
}

export async function fetchAgent(agentId: string): Promise<Agent> {
  const wire = await apiFetch<AgentWire>(`/api/v1/agents/${agentId}`);
  return decodeAgentResponse(wire);
}

export async function createAgent(wsId: string, input: AgentInput): Promise<Agent> {
  const wire = await apiFetch<AgentWire>(`/api/v1/workspaces/${wsId}/agents`, {
    method: "POST",
    body: JSON.stringify(encodeAgentInput(input)),
  });
  return decodeAgentResponse(wire);
}

export async function updateAgent(agentId: string, input: AgentInput): Promise<Agent> {
  const wire = await apiFetch<AgentWire>(`/api/v1/agents/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(encodeAgentInput(input)),
  });
  return decodeAgentResponse(wire);
}

export async function archiveAgent(agentId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/agents/${agentId}`, { method: "DELETE" });
}

import { apiFetch } from "./client";
import type { PublicAgentView, InstallView } from "./types";

// Publish/unpublish (publisher-only)
export async function publishAgent(agentId: string, description?: string): Promise<void> {
  await apiFetch<void>(`/api/v1/agents/${agentId}/publish`, {
    method: "PATCH",
    body: JSON.stringify(description !== undefined ? { description } : {}),
  });
}

export async function unpublishAgent(agentId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/agents/${agentId}/unpublish`, { method: "PATCH" });
}

// Browse marketplace
export interface SearchMarketplaceParams {
  q?: string;
  limit?: number;
  offset?: number;
}

export async function searchMarketplaceAgents(
  params: SearchMarketplaceParams = {},
): Promise<PublicAgentView[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  const s = qs.toString();
  return apiFetch<PublicAgentView[]>(`/api/v1/marketplace/agents${s ? "?" + s : ""}`);
}

export async function getMarketplaceAgent(agentId: string): Promise<PublicAgentView> {
  return apiFetch<PublicAgentView>(`/api/v1/marketplace/agents/${agentId}`);
}

// Install into workspace
export async function installAgent(
  wsId: string,
  sourceAgentId: string,
  aliasHandle?: string,
): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/agent-installs`, {
    method: "POST",
    body: JSON.stringify({
      source_agent_id: sourceAgentId,
      ...(aliasHandle ? { alias_handle: aliasHandle } : {}),
    }),
  });
}

export async function listInstalls(wsId: string): Promise<InstallView[]> {
  return apiFetch<InstallView[]>(`/api/v1/workspaces/${wsId}/agent-installs`);
}

export async function uninstallAgent(wsId: string, installId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/agent-installs/${installId}`, {
    method: "DELETE",
  });
}

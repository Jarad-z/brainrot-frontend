import { apiFetch } from "./client";
import type {
  PluginView,
  PluginVersionView,
  PluginInstallView,
  AgentPluginView,
} from "./types";

// Plugin REST surface — mirrors backend/internal/handler/plugin.go.
// All endpoints are session-or-PAT authenticated except where noted.

// ---------- Plugin CRUD (author side) -----------------------------------

/** List plugins owned by a workspace. The current ws's "my plugins" page. */
export async function listWorkspacePlugins(wsId: string): Promise<PluginView[]> {
  return apiFetch<PluginView[]>(`/api/v1/workspaces/${wsId}/plugins`);
}

/** Get a single plugin by id. Visibility: callers in the owning workspace
 *  always see it; non-members only see it if public. */
export async function getPlugin(pluginId: string): Promise<PluginView> {
  return apiFetch<PluginView>(`/api/v1/plugins/${pluginId}`);
}

/** List versions of a plugin (newest first). */
export async function listPluginVersions(pluginId: string): Promise<PluginVersionView[]> {
  return apiFetch<PluginVersionView[]>(`/api/v1/plugins/${pluginId}/versions`);
}

export async function publishPlugin(pluginId: string): Promise<PluginView> {
  return apiFetch<PluginView>(`/api/v1/plugins/${pluginId}/publish`, {
    method: "PATCH",
  });
}

export async function unpublishPlugin(pluginId: string): Promise<PluginView> {
  return apiFetch<PluginView>(`/api/v1/plugins/${pluginId}/unpublish`, {
    method: "PATCH",
  });
}

// ---------- Marketplace browse ------------------------------------------

export interface SearchMarketplacePluginsParams {
  q?: string;
  limit?: number;
  offset?: number;
}

export async function searchMarketplacePlugins(
  params: SearchMarketplacePluginsParams = {},
): Promise<PluginView[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  const s = qs.toString();
  return apiFetch<PluginView[]>(`/api/v1/marketplace/plugins${s ? "?" + s : ""}`);
}

// ---------- Workspace install / uninstall (consumer side) ---------------

export async function installPlugin(
  wsId: string,
  sourcePluginId: string,
  pinnedVersionId?: string,
): Promise<PluginInstallView> {
  return apiFetch<PluginInstallView>(`/api/v1/workspaces/${wsId}/plugin-installs`, {
    method: "POST",
    body: JSON.stringify({
      source_plugin_id: sourcePluginId,
      ...(pinnedVersionId ? { pinned_version_id: pinnedVersionId } : {}),
    }),
  });
}

export async function listWorkspacePluginInstalls(wsId: string): Promise<PluginInstallView[]> {
  return apiFetch<PluginInstallView[]>(`/api/v1/workspaces/${wsId}/plugin-installs`);
}

export async function uninstallPlugin(wsId: string, installId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/plugin-installs/${installId}`, {
    method: "DELETE",
  });
}

// ---------- Agent attach / detach / enable ------------------------------

export async function listAgentPlugins(agentId: string): Promise<AgentPluginView[]> {
  return apiFetch<AgentPluginView[]>(`/api/v1/agents/${agentId}/plugins`);
}

export async function attachPlugin(agentId: string, pluginInstallId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/agents/${agentId}/plugins`, {
    method: "POST",
    body: JSON.stringify({ plugin_install_id: pluginInstallId }),
  });
}

export async function detachPlugin(agentId: string, pluginInstallId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/agents/${agentId}/plugins/${pluginInstallId}`, {
    method: "DELETE",
  });
}

/** Toggle the enabled bit on an existing attachment without unbinding. */
export async function setAgentPluginEnabled(
  agentId: string,
  pluginInstallId: string,
  enabled: boolean,
): Promise<void> {
  await apiFetch<void>(`/api/v1/agents/${agentId}/plugins/${pluginInstallId}`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}

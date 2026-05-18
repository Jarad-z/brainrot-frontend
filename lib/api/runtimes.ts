import { apiFetch } from "./client";
import type { InstallToken, Runtime } from "./types";

export async function fetchWorkspaceRuntimes(wsId: string): Promise<Runtime[]> {
  return apiFetch<Runtime[]>(`/api/v1/workspaces/${wsId}/runtimes`);
}

export async function issueInstallToken(wsId: string): Promise<InstallToken> {
  return apiFetch<InstallToken>(`/api/v1/workspaces/${wsId}/install-tokens`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

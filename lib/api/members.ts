import { apiFetch } from "./client";
import type {
  InviteInput,
  UpdateWorkspaceInput,
  Workspace,
  WorkspaceMember,
  WorkspaceMemberInput,
  WorkspaceRole,
} from "./types";

export async function addWorkspaceMember(
  wsId: string,
  input: WorkspaceMemberInput,
): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/members`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listWorkspaceMembers(
  wsId: string,
): Promise<WorkspaceMember[]> {
  return apiFetch<WorkspaceMember[]>(`/api/v1/workspaces/${wsId}/members`);
}

export async function updateMemberRole(
  wsId: string,
  userId: string,
  role: WorkspaceRole,
): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(wsId: string, userId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/members/${userId}`, {
    method: "DELETE",
  });
}

export async function updateWorkspace(
  wsId: string,
  input: UpdateWorkspaceInput,
): Promise<Workspace> {
  return apiFetch<Workspace>(`/api/v1/workspaces/${wsId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function inviteByEmail(
  wsId: string,
  input: InviteInput,
): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/invitations`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

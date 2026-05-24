import { apiFetch } from "./client";
import type { InvitationView } from "./types";

export async function createInvitation(
  wsId: string,
  inviteeUserId: string,
  role: "owner" | "editor" | "viewer",
): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ invitee_user_id: inviteeUserId, role }),
  });
}

export async function listWorkspaceInvitations(wsId: string): Promise<InvitationView[]> {
  return apiFetch<InvitationView[]>(`/api/v1/workspaces/${wsId}/invitations`);
}

export async function revokeInvitation(wsId: string, invId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/invitations/${invId}`, {
    method: "DELETE",
  });
}

export async function listIncomingInvitations(): Promise<InvitationView[]> {
  return apiFetch<InvitationView[]>("/api/v1/invitations");
}

export async function decideInvitation(
  invId: string,
  action: "accept" | "decline",
): Promise<void> {
  await apiFetch<void>(`/api/v1/invitations/${invId}`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

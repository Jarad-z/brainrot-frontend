import { apiFetch } from "./client";
import type { UserSummary } from "./types";

export async function searchUserByEmail(email: string): Promise<UserSummary> {
  return apiFetch<UserSummary>("/api/v1/users/search", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function listFriends(): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>("/api/v1/friends");
}

export async function listFriendRequests(): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>("/api/v1/friends/requests");
}

export async function sendFriendRequest(toUserId: string): Promise<void> {
  await apiFetch<void>("/api/v1/friends/requests", {
    method: "POST",
    body: JSON.stringify({ to_user_id: toUserId }),
  });
}

export async function decideFriendRequest(
  fromUserId: string,
  action: "accept" | "decline",
): Promise<void> {
  await apiFetch<void>(`/api/v1/friends/requests/${fromUserId}`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

export async function removeFriend(userId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/friends/${userId}`, { method: "DELETE" });
}

export async function blockUser(userId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/friends/${userId}/block`, { method: "POST" });
}

export async function unblockUser(userId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/friends/${userId}/block`, { method: "DELETE" });
}

export async function listBlocked(): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>("/api/v1/friends/blocked");
}

import { apiFetch } from "./client";
import type { ConvSummary, DirectMessage } from "./types";

export async function listConversations(): Promise<ConvSummary[]> {
  return apiFetch<ConvSummary[]>("/api/v1/conversations");
}

export async function getMessages(
  convId: string,
  opts: { before?: string; limit?: number } = {},
): Promise<DirectMessage[]> {
  const q = new URLSearchParams();
  if (opts.before) q.set("before", opts.before);
  if (opts.limit) q.set("limit", String(opts.limit));
  const qs = q.toString();
  return apiFetch<DirectMessage[]>(
    `/api/v1/conversations/${convId}/messages${qs ? "?" + qs : ""}`,
  );
}

export async function sendDirectMessage(
  peerUserId: string,
  body: string,
): Promise<DirectMessage> {
  return apiFetch<DirectMessage>("/api/v1/conversations", {
    method: "POST",
    body: JSON.stringify({ peer_user_id: peerUserId, body }),
  });
}

export async function markConversationRead(
  convId: string,
  upTo: string,
): Promise<void> {
  await apiFetch<void>(`/api/v1/conversations/${convId}/read`, {
    method: "POST",
    body: JSON.stringify({ up_to: upTo }),
  });
}

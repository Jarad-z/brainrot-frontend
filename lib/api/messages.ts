import { apiFetch } from "./client";
import type { ClientMessage, EnqueuedRun, Message } from "./types";
import { enrichMessage } from "@/lib/chat/enrich-message";

export type { ParsedMessage } from "@/lib/parse-message";

export interface SendMessageInput {
  text: string;
  mentions: string[];
}

export interface SendMessageResponse {
  message: Message;
  runs: EnqueuedRun[];
}

export async function fetchMessages(taskId: string): Promise<ClientMessage[]> {
  const raw = await apiFetch<Message[]>(`/api/v1/tasks/${taskId}/messages`);
  return raw.map(enrichMessage);
}

export async function sendMessage(
  taskId: string,
  input: SendMessageInput,
): Promise<SendMessageResponse> {
  return apiFetch<SendMessageResponse>(`/api/v1/tasks/${taskId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: input }),
  });
}

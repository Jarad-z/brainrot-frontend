import type { ClientMessage } from "@/lib/api/types";
import { insertSorted } from "./sort-messages";

const MATCH_WINDOW_MS = 5000;

function messagesMatch(opt: ClientMessage, srv: ClientMessage): boolean {
  if (opt.role !== srv.role) return false;
  if (opt.author_user_id !== srv.author_user_id) return false;
  if (opt.task_card_id !== srv.task_card_id) return false;
  if (opt.parsed.type !== "user" || srv.parsed.type !== "user") return false;
  if (opt.parsed.text !== srv.parsed.text) return false;
  const dt = Math.abs(Date.parse(opt.created_at) - Date.parse(srv.created_at));
  return dt < MATCH_WINDOW_MS;
}

export function upsertMessage(
  list: ReadonlyArray<ClientMessage>,
  incoming: ClientMessage,
): ClientMessage[] {
  const tempIdx = list.findIndex(m => m.tempId && messagesMatch(m, incoming));
  if (tempIdx !== -1) {
    return [...list.slice(0, tempIdx), incoming, ...list.slice(tempIdx + 1)];
  }
  const idIdx = list.findIndex(m => m.id === incoming.id);
  if (idIdx !== -1) {
    return [...list.slice(0, idIdx), incoming, ...list.slice(idIdx + 1)];
  }
  return insertSorted(list, incoming);
}

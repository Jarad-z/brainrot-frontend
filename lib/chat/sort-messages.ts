import type { ClientMessage } from "@/lib/api/types";

export function compareMessages(a: ClientMessage, b: ClientMessage): number {
  const ta = Date.parse(a.created_at);
  const tb = Date.parse(b.created_at);
  if (ta !== tb) return ta - tb;
  if (a.task_run_id && a.task_run_id === b.task_run_id) {
    const sa = a.seq ?? 0;
    const sb = b.seq ?? 0;
    if (sa !== sb) return sa - sb;
  }
  return a.id.localeCompare(b.id);
}

export function insertSorted(
  list: ReadonlyArray<ClientMessage>,
  m: ClientMessage,
): ClientMessage[] {
  const idx = list.findIndex(x => compareMessages(x, m) > 0);
  if (idx === -1) return [...list, m];
  return [...list.slice(0, idx), m, ...list.slice(idx)];
}

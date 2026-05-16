import type { Agent } from "@/lib/api/types";

export function filterCandidates(
  query: string,
  agents: ReadonlyArray<Agent>,
): Agent[] {
  const q = query.toLowerCase().trim();
  const active = agents.filter(a => !a.archived);
  if (!q) return active.slice(0, 10);
  return active.filter(a => a.handle.toLowerCase().startsWith(q)).slice(0, 10);
}

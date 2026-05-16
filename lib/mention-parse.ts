export interface AgentLike {
  id: string;
  handle: string;
  archived?: boolean;
}

export function filterCandidates(
  prefix: string,
  agents: ReadonlyArray<AgentLike>,
): AgentLike[] {
  const p = (prefix || "").toLowerCase();
  return agents
    .filter((a) => !a.archived)
    .filter((a) => a.handle.toLowerCase().startsWith(p));
}

export function parseSubmit(
  text: string,
  placedMentions: ReadonlyArray<{ id: string; handle: string }>,
): { text: string; mentions: string[] } {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const m of placedMentions) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    ids.push(m.id);
  }
  return { text, mentions: ids };
}

export function activePrefix(text: string, caret: number): string | null {
  if (caret <= 0 || caret > text.length) return null;
  let i = caret - 1;
  while (i >= 0) {
    const ch = text[i];
    if (ch === "@") {
      const prev = i === 0 ? "" : text[i - 1];
      if (i === 0 || (prev !== undefined && /\s/.test(prev))) {
        return text.slice(i + 1, caret);
      }
      return null;
    }
    if (ch !== undefined && /\s/.test(ch)) return null;
    i--;
  }
  return null;
}

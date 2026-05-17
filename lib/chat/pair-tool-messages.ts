import type { ClientMessage } from "@/lib/api/types";

export interface ToolPairing {
  useToResult: Map<string, ClientMessage>;
  consumed: Set<string>;
  orphanResults: Set<string>;
}

export function pairToolMessages(
  messages: ReadonlyArray<ClientMessage>,
): ToolPairing {
  const uses = new Map<string, ClientMessage>();
  for (const m of messages) {
    if (m.parsed.type === "tool_use") {
      uses.set(m.parsed.payload.tool_use_id, m);
    }
  }
  const useToResult = new Map<string, ClientMessage>();
  const consumed = new Set<string>();
  const orphanResults = new Set<string>();
  for (const m of messages) {
    if (m.parsed.type !== "tool_result") continue;
    const id = m.parsed.payload.tool_use_id;
    if (uses.has(id)) {
      useToResult.set(id, m);
      consumed.add(m.id);
    } else {
      orphanResults.add(m.id);
    }
  }
  return { useToResult, consumed, orphanResults };
}

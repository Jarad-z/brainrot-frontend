import { parseMessageContent } from "@/lib/parse-message";
import type { ClientMessage, Message } from "@/lib/api/types";

export function enrichMessage(raw: Message): ClientMessage {
  let parsed;
  try {
    parsed = parseMessageContent(raw.content ?? {});
  } catch (e) {
    console.warn("[enrich-message] content parse error", e);
    parsed = { type: "system" as const, payload: "(parse error)" };
  }

  // metadata may arrive as a base64 string on the legacy WS push path
  // (same root cause as content — see parse-message.ts coerceContent).
  let metadata: Record<string, unknown> = {};
  if (typeof raw.metadata === "string") {
    if (raw.metadata !== "") {
      try {
        const parsedMeta = JSON.parse(atob(raw.metadata)) as unknown;
        if (parsedMeta && typeof parsedMeta === "object" && !Array.isArray(parsedMeta)) {
          metadata = parsedMeta as Record<string, unknown>;
        }
      } catch {
        /* leave as {} */
      }
    }
  } else if (raw.metadata && typeof raw.metadata === "object") {
    metadata = raw.metadata as Record<string, unknown>;
  }
  const meta: { queued?: boolean } = {
    queued: metadata.queued === true ? true : undefined,
  };

  return { ...raw, parsed, meta };
}

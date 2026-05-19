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

  let metadata: Record<string, unknown> = {};
  if (raw.metadata && typeof raw.metadata === "object") {
    metadata = raw.metadata as Record<string, unknown>;
  }
  const meta: { queued?: boolean } = {
    queued: metadata.queued === true ? true : undefined,
  };

  return { ...raw, parsed, meta };
}

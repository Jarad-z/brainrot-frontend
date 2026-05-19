import { decodeJSON, CodecError } from "@/lib/codec";
import { parseMessageContent } from "@/lib/parse-message";
import type { ClientMessage, Message } from "@/lib/api/types";

export function enrichMessage(raw: Message): ClientMessage {
  let parsed;
  try {
    parsed = parseMessageContent(raw.content || "");
  } catch (e) {
    if (e instanceof CodecError) {
      console.warn("[enrich-message] content parse error", e.message);
    } else {
      console.warn("[enrich-message] unexpected content error", e);
    }
    parsed = { type: "system" as const, payload: "(parse error)" };
  }

  let meta: { queued?: boolean } = {};
  if (raw.metadata && raw.metadata.length > 0) {
    try {
      meta = decodeJSON<{ queued?: boolean }>(raw.metadata);
    } catch (e) {
      if (e instanceof CodecError) {
        console.warn("[enrich-message] metadata parse error", e.message);
      } else {
        console.warn("[enrich-message] unexpected metadata error", e);
      }
      meta = {};
    }
  }

  return { ...raw, parsed, meta };
}

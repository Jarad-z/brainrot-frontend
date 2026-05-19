import { decodeJSON, CodecError } from "@/lib/codec";
import { parseMessageContent } from "@/lib/parse-message";
import type { ClientMessage, Message } from "@/lib/api/types";

type MetadataShape = { queued?: boolean };

export function enrichMessage(raw: Message): ClientMessage {
  let parsed;
  try {
    parsed = parseMessageContent(
      raw.content as Parameters<typeof parseMessageContent>[0],
    );
  } catch (e) {
    if (e instanceof CodecError) {
      console.warn("[enrich-message] content parse error", e.message);
    } else {
      console.warn("[enrich-message] unexpected content error", e);
    }
    parsed = { type: "system" as const, payload: "(parse error)" };
  }

  let meta: MetadataShape = {};
  meta = coerceMetadata(raw.metadata);

  return { ...raw, parsed, meta };
}

/**
 * Backend PR #2 (#24) now serves `metadata` as a structured object on the
 * REST path, but the WS push path still sends a base64-JSON string until
 * GAP #30 lands. Accept both; bail to `{}` on anything we can't decode.
 */
function coerceMetadata(input: unknown): MetadataShape {
  if (input == null || input === "") return {};
  if (typeof input === "object") return input as MetadataShape;
  if (typeof input !== "string") return {};
  try {
    return decodeJSON<MetadataShape>(input);
  } catch (e) {
    if (e instanceof CodecError) {
      console.warn("[enrich-message] metadata parse error", e.message);
    } else {
      console.warn("[enrich-message] unexpected metadata error", e);
    }
    return {};
  }
}

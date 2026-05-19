import { decodeJSON, CodecError } from "./codec";

export type ParsedMessage =
  | { type: "user"; text: string; mentions: string[] }
  | { type: "system"; payload: string }
  | { type: "assistant_text"; payload: { text: string } }
  | { type: "tool_use"; payload: { tool_name: string; tool_use_id: string; input: unknown } }
  | { type: "tool_result"; payload: { tool_use_id: string; is_error: boolean; content: unknown } }
  | { type: "permission_request"; payload: {
      tool_use_id: string;
      tool_name: string;
      approval_id?: string;
      tool_input?: unknown;
      expires_at?: string;
    } }
  | { type: "thinking"; payload: { text: string } }
  | { type: "result"; payload: { duration_ms: number; result: string } }
  | { type: "rate_limit_event"; payload: { retry_in_seconds: number } };

interface RawWithType {
  type?: string;
  text?: string;
  mentions?: string[];
  payload?: unknown;
}

/**
 * Decode a message `content` field into a discriminated ParsedMessage.
 *
 * The wire format has shifted over the project's lifetime:
 *
 * 1. Original (S2): `content` was a base64-encoded JSON string. This is
 *    still the format on the WS push path until backend GAP #30 lands.
 * 2. After backend PR #2 (#24): REST handlers now serialize `content` as
 *    a plain JSON object — no more base64 wrapping.
 *
 * Both shapes coexist in v1, so this function accepts either. The S6 J
 * cleanup will remove the base64 branch once #30 ships.
 */
export function parseMessageContent(input: string | RawWithType | null | undefined): ParsedMessage {
  const raw = coerceRaw(input);
  if (!raw.type) {
    return {
      type: "user",
      text: typeof raw.text === "string" ? raw.text : "",
      mentions: Array.isArray(raw.mentions) ? raw.mentions : [],
    };
  }
  return { type: raw.type, payload: raw.payload } as ParsedMessage;
}

function coerceRaw(input: string | RawWithType | null | undefined): RawWithType {
  if (input == null) {
    throw new CodecError("expected string or object", String(input));
  }
  if (typeof input === "object") {
    return input;
  }
  if (input === "") {
    return {};
  }
  // Legacy base64-JSON path (WS push pre-#30).
  return decodeJSON<RawWithType>(input);
}

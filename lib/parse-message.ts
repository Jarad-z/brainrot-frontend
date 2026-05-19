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
 * Defensively coerce a possibly-stringified payload back into an object.
 * Seed data has assistant_text content with payload encoded as a JSON string
 * rather than a parsed object; handle both shapes.
 */
function coercePayload(payload: unknown): unknown {
  if (typeof payload !== "string") return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

function coerceContent(
  content: Record<string, unknown> | string | null | undefined,
): Record<string, unknown> {
  if (content == null) return {};
  if (typeof content === "object") return content;
  return { text: content };
}

export function parseMessageContent(content: Record<string, unknown> | string | null | undefined): ParsedMessage {
  const raw = coerceContent(content) as RawWithType;
  if (!raw.type) {
    return {
      type: "user",
      text: typeof raw.text === "string" ? raw.text : "",
      mentions: Array.isArray(raw.mentions) ? raw.mentions : [],
    };
  }
  return {
    type: raw.type,
    payload: coercePayload(raw.payload),
  } as ParsedMessage;
}

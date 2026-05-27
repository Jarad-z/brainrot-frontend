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

// Claude CLI streams tool_use as `{type:"assistant", message:{content:[{type:"tool_use", id, name, input}]}}`
// and tool_result as `{type:"user", message:{content:[{type:"tool_result", tool_use_id, is_error, content}]}}`.
// The daemon forwards these JSON objects as-is in `payload`, so we normalize them
// into the flat shape the chat components expect.
function normalizeToolUsePayload(p: unknown): { tool_name: string; tool_use_id: string; input: unknown } {
  if (p && typeof p === "object") {
    const obj = p as Record<string, unknown>;
    const msg = obj.message as Record<string, unknown> | undefined;
    const content = msg?.content;
    if (Array.isArray(content) && content.length > 0) {
      const c0 = content[0] as Record<string, unknown>;
      if (c0 && c0.type === "tool_use") {
        return {
          tool_name: typeof c0.name === "string" ? c0.name : "",
          tool_use_id: typeof c0.id === "string" ? c0.id : "",
          input: c0.input,
        };
      }
    }
    if (typeof obj.tool_name === "string" && typeof obj.tool_use_id === "string") {
      return { tool_name: obj.tool_name, tool_use_id: obj.tool_use_id, input: obj.input };
    }
  }
  return { tool_name: "", tool_use_id: "", input: undefined };
}

// Claude CLI streams thinking as `{type:"assistant", message:{content:[{type:"thinking", thinking:"..."}]}}`.
// The daemon forwards this as-is in `payload`, so we normalize it into the flat
// `{text}` shape the renderer expects. We also fall back to `text` directly in
// case some path already flattens it.
function normalizeThinkingPayload(p: unknown): { text: string } {
  if (p && typeof p === "object") {
    const obj = p as Record<string, unknown>;
    if (typeof obj.text === "string") return { text: obj.text };
    const msg = obj.message as Record<string, unknown> | undefined;
    const content = msg?.content;
    if (Array.isArray(content) && content.length > 0) {
      const c0 = content[0] as Record<string, unknown>;
      if (c0 && c0.type === "thinking" && typeof c0.thinking === "string") {
        return { text: c0.thinking };
      }
    }
  }
  return { text: "" };
}

// Defensive shape for assistant_text. The daemon flattens to `{text}` today,
// but a future change or replayed-from-raw path could deliver the wrapped
// Claude CLI envelope. Coerce both.
function normalizeAssistantTextPayload(p: unknown): { text: string } {
  if (p && typeof p === "object") {
    const obj = p as Record<string, unknown>;
    if (typeof obj.text === "string") return { text: obj.text };
    const msg = obj.message as Record<string, unknown> | undefined;
    const content = msg?.content;
    if (Array.isArray(content) && content.length > 0) {
      const c0 = content[0] as Record<string, unknown>;
      if (c0 && c0.type === "text" && typeof c0.text === "string") {
        return { text: c0.text };
      }
    }
  }
  return { text: "" };
}

function normalizeToolResultPayload(p: unknown): { tool_use_id: string; is_error: boolean; content: unknown } {
  if (p && typeof p === "object") {
    const obj = p as Record<string, unknown>;
    const msg = obj.message as Record<string, unknown> | undefined;
    const content = msg?.content;
    if (Array.isArray(content) && content.length > 0) {
      const c0 = content[0] as Record<string, unknown>;
      if (c0 && c0.type === "tool_result") {
        return {
          tool_use_id: typeof c0.tool_use_id === "string" ? c0.tool_use_id : "",
          is_error: c0.is_error === true,
          content: c0.content,
        };
      }
    }
    if (typeof obj.tool_use_id === "string") {
      return {
        tool_use_id: obj.tool_use_id,
        is_error: obj.is_error === true,
        content: obj.content,
      };
    }
  }
  return { tool_use_id: "", is_error: false, content: undefined };
}

// Claude CLI emits `{type:"user", message:{content:[...]}}` envelopes for
// synthetic prompts injected by hooks, Skill launches, and tool_result
// turn-arounds. The daemon persists these as messages with role=agent and
// content `{type:"user", payload:"<envelope>"}`. They are NOT real user input
// — surfacing them as user bubbles is both visually wrong (a blue "排队中"
// bubble for hook output) and unsafe (no `text` field, crashes MentionedText).
// Summarize down to a short SystemLine instead.
function summarizeSyntheticUserEvent(p: unknown): string {
  if (p && typeof p === "object") {
    const obj = p as Record<string, unknown>;
    const msg = obj.message as Record<string, unknown> | undefined;
    const content = msg?.content;
    if (Array.isArray(content) && content.length > 0) {
      const c0 = content[0] as Record<string, unknown>;
      if (c0?.type === "tool_result") return "tool_result · injected";
      if (c0?.type === "text" && typeof c0.text === "string") {
        const t = c0.text.replace(/\s+/g, " ").trim();
        return t.length > 120 ? `${t.slice(0, 120)}…` : t;
      }
    }
  }
  return "synthetic user event";
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
  const payload = coercePayload(raw.payload);
  if (raw.type === "tool_use") {
    return { type: "tool_use", payload: normalizeToolUsePayload(payload) };
  }
  if (raw.type === "tool_result") {
    return { type: "tool_result", payload: normalizeToolResultPayload(payload) };
  }
  if (raw.type === "thinking") {
    return { type: "thinking", payload: normalizeThinkingPayload(payload) };
  }
  if (raw.type === "assistant_text") {
    return { type: "assistant_text", payload: normalizeAssistantTextPayload(payload) };
  }
  if (raw.type === "user") {
    return { type: "system", payload: summarizeSyntheticUserEvent(payload) };
  }
  return { type: raw.type, payload } as ParsedMessage;
}

import type { ClientMessage } from "@/lib/api/types";

/** Stringify a tool_result message's content for inline display. Returns null
 *  when the message isn't a tool_result. Survives non-serializable content. */
export function stringifyToolResult(result: ClientMessage | undefined): string | null {
  if (result?.parsed.type !== "tool_result") return null;
  const c = result.parsed.payload.content;
  if (c == null) return "";
  if (typeof c === "string") return c;
  try {
    return JSON.stringify(c);
  } catch {
    return String(c);
  }
}

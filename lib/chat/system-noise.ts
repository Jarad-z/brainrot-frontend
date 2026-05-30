import type { ClientMessage } from "@/lib/api/types";

// Hook/session metadata from claude CLI that should not be shown in the chat
// stream or in an agent trace.
export const SYSTEM_NOISE_SUBTYPES = new Set([
  "hook_started",
  "hook_response",
  "init",
  "notification",
]);

export function isSystemNoise(msg: ClientMessage): boolean {
  if (msg.parsed.type !== "system") return false;
  const payload = msg.parsed.payload;
  if (payload && typeof payload === "object") {
    const subtype = (payload as Record<string, unknown>).subtype;
    if (typeof subtype === "string" && SYSTEM_NOISE_SUBTYPES.has(subtype)) return true;
  }
  return false;
}

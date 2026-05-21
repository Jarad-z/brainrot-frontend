import type { ClientMessage } from "@/lib/api/types";

interface SystemLineProps {
  msg: ClientMessage;
}

function renderPayload(payload: unknown): string {
  if (payload == null) return "";
  if (typeof payload === "string") return payload;
  if (typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    // Claude Code hook events come through as objects — show a compact summary.
    const subtype = typeof p.subtype === "string" ? p.subtype : undefined;
    const hookName = typeof p.hook_name === "string" ? p.hook_name : undefined;
    const hookEvent = typeof p.hook_event === "string" ? p.hook_event : undefined;
    const parts = [subtype, hookName, hookEvent].filter(Boolean);
    if (parts.length > 0) return parts.join(" · ");
    try {
      return JSON.stringify(payload);
    } catch {
      return "[system event]";
    }
  }
  return String(payload);
}

export function SystemLine({ msg }: SystemLineProps) {
  const text = msg.parsed.type === "system" ? renderPayload(msg.parsed.payload) : "";
  if (!text) return null;
  return (
    <div className="flex items-center gap-3 py-2 my-1 text-[11px] text-ink-3">
      <span className="flex-1 h-px bg-hairline" aria-hidden />
      <span>{text}</span>
      <span className="flex-1 h-px bg-hairline" aria-hidden />
    </div>
  );
}

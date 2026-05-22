import type { ClientMessage } from "@/lib/api/types";
import { MentionedText } from "../MentionedText";

interface UserMessageProps {
  msg: ClientMessage;
  authorName?: string;
  authorHandle?: string;
  isFirstInGroup?: boolean;
}

/**
 * Aero-glass user bubble. Three-band blue gradient with a sharp mirror
 * highlight near the top, white inner stroke, deep-blue outer edge.
 * Reads as a piece of Vista chrome rather than a flat IM bubble.
 */
export function UserMessage({
  msg,
  authorName = "You",
  isFirstInGroup = true,
}: UserMessageProps) {
  if (msg.parsed.type !== "user") return null;
  const time = msg.created_at
    ? new Date(msg.created_at).toTimeString().slice(0, 5)
    : "";

  return (
    <div className={`flex justify-end ${isFirstInGroup ? "mt-4" : "mt-1"}`}>
      <div className="max-w-[72%] min-w-0 flex flex-col items-end">
        {isFirstInGroup && (
          <div className="flex items-baseline gap-1.5 mb-1 pr-2">
            <span className="text-[12px] text-ink-2">{authorName}</span>
            <span className="text-[11px] text-ink-3">{time}</span>
          </div>
        )}
        <div
          data-bubble="user"
          className="relative px-3.5 py-2 text-[14px] leading-[1.55] whitespace-pre-wrap break-words text-white"
          style={{
            background:
              "linear-gradient(180deg, " +
              "rgba(180, 220, 245, 0.95) 0%, " +
              "rgba(120, 185, 230, 0.95) 49.5%, " +
              "rgba(80, 145, 205, 0.95) 50.5%, " +
              "rgba(50, 110, 175, 0.95) 100%)",
            borderRadius: "12px 12px 4px 12px",
            border: "1px solid rgba(30, 72, 119, 0.55)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.7), " +
              "inset 0 -1px 0 rgba(30,72,119,0.35), " +
              "0 0 0 1px rgba(255,255,255,0.5), " +
              "0 1px 2px rgba(30,72,119,0.25), " +
              "0 6px 16px rgba(91,155,213,0.30)",
            textShadow: "0 -1px 0 rgba(30,72,119,0.35)",
          }}
        >
          {msg.meta.queued && (
            <span className="inline-block mr-2 px-1.5 py-px text-[10px] text-white/90 border border-dashed border-white/50 rounded-full align-middle">
              排队中
            </span>
          )}
          <MentionedText text={msg.parsed.text} />
        </div>
      </div>
    </div>
  );
}

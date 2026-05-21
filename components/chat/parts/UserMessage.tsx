import type { ClientMessage } from "@/lib/api/types";
import { MentionedText } from "../MentionedText";

interface UserMessageProps {
  msg: ClientMessage;
  authorName?: string;
  authorHandle?: string;
  isFirstInGroup?: boolean;
}

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
    <div className={`flex justify-end ${isFirstInGroup ? "mt-4" : "mt-0.5"}`}>
      <div className="max-w-[72%] min-w-0">
        {isFirstInGroup && (
          <div className="flex items-baseline justify-end gap-1.5 mb-1">
            <span className="text-[11px] text-ink-3">{time}</span>
            <span className="text-[13px] font-medium text-ink-1">{authorName}</span>
          </div>
        )}
        <div className="px-3.5 py-2 bg-bg-secondary rounded-xl rounded-tr-sm break-words text-[14px] text-ink-0 leading-[1.7] whitespace-pre-wrap">
          {msg.meta.queued && (
            <span className="inline-block mr-2 px-1.5 py-0.5 text-[10px] text-ink-3 border border-dashed border-ink-3 rounded-full align-middle">
              排队中
            </span>
          )}
          <MentionedText text={msg.parsed.text} />
        </div>
      </div>
    </div>
  );
}

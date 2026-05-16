import type { ClientMessage } from "@/lib/api/types";
import { Avatar } from "@/components/brand/avatar";
import { MentionedText } from "../MentionedText";

interface UserMessageProps {
  msg: ClientMessage;
  authorName?: string;
  authorHandle?: string;
}

export function UserMessage({
  msg,
  authorName = "You",
  authorHandle = "",
}: UserMessageProps) {
  if (msg.parsed.type !== "user") return null;
  const time = msg.created_at
    ? new Date(msg.created_at).toTimeString().slice(0, 5)
    : "";
  return (
    <div className="flex gap-3 my-3">
      <Avatar name={authorName} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-ink-2 mb-1">
          <span className="font-bold text-ink-0">{authorName}</span>
          {authorHandle && <span>@{authorHandle}</span>}
          <span>· {time}</span>
          {msg.meta.queued && (
            <span className="ml-2 px-2 py-0.5 text-[11px] text-ink-2 border-[1.5px] border-dashed border-ink-2 rounded-full">
              排队中
            </span>
          )}
        </div>
        <div className="inline-block px-4 py-2 bg-role-user rounded-2xl max-w-[70%] break-words">
          <MentionedText text={msg.parsed.text} />
        </div>
      </div>
    </div>
  );
}

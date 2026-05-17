"use client";
import type { ClientMessage } from "@/lib/api/types";
import { Avatar } from "@/components/brand/avatar";
import { useChatUIStore } from "@/lib/store/chat-ui";

interface AssistantMessageProps {
  msg: ClientMessage;
  taskId: string;
  agent: { name: string; handle: string };
}

export function AssistantMessage({ msg, taskId, agent }: AssistantMessageProps) {
  const expanded = useChatUIStore(
    (s) => s.byTask[taskId]?.expandedThinkings.has(msg.id) ?? false,
  );
  const toggle = useChatUIStore((s) => s.toggleThinking);

  if (msg.parsed.type !== "assistant_text" && msg.parsed.type !== "thinking") {
    return null;
  }
  const time = msg.created_at
    ? new Date(msg.created_at).toTimeString().slice(0, 5)
    : "";

  return (
    <div className="flex gap-3 my-3">
      <Avatar name={agent.name} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-ink-2 mb-1">
          <span className="font-bold text-ink-0">{agent.name}</span>
          <span>@{agent.handle}</span>
          <span>· {time}</span>
          {msg.task_run_id && (
            <span className="font-mono text-[11px] px-1.5 py-0 border-[1.5px] border-hairline rounded-sm">
              run#{msg.task_run_id.slice(0, 4)}
            </span>
          )}
        </div>
        {msg.parsed.type === "assistant_text" && (
          <div className="px-4 py-2 bg-role-agent rounded-2xl max-w-[70%] break-words whitespace-pre-wrap">
            {msg.parsed.payload.text}
          </div>
        )}
        {msg.parsed.type === "thinking" && (
          <div
            className="thinking-card flex items-center gap-2 px-3 py-1.5 bg-role-thinking rounded-md text-xs italic text-ink-2 cursor-pointer max-w-[70%]"
            onClick={() => toggle(taskId, msg.id)}
          >
            <span className="font-bold">思考</span>
            <span className={expanded ? "" : "truncate"} style={{ flex: 1 }}>
              {msg.parsed.payload.text}
            </span>
            <span>{expanded ? "▾" : "▸"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

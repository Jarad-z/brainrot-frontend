"use client";
import { ChevronDown, ChevronRight } from "lucide-react";
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
        <div className="flex items-center gap-2 text-xs text-ink-2 mb-1.5">
          <span className="font-bold text-ink-0">{agent.name}</span>
          <span className="text-ink-3">@{agent.handle}</span>
          <span>· {time}</span>
          {msg.task_run_id && (
            <span className="font-mono text-[10px] px-2 py-0.5 bg-paper-2 border-[1.5px] border-hairline rounded-full text-ink-2">
              run#{msg.task_run_id.slice(0, 4)}
            </span>
          )}
        </div>
        {msg.parsed.type === "assistant_text" && (
          <div className="px-4 py-2.5 bg-role-agent border-[1.5px] border-hairline rounded-2xl max-w-[75%] break-words whitespace-pre-wrap shadow-[2px_2px_0_var(--ink-0)]">
            {msg.parsed.payload.text}
          </div>
        )}
        {msg.parsed.type === "thinking" && (
          <div
            className="thinking-card flex items-center gap-2 pl-4 pr-3 py-2 bg-paper-2 border-l-[3px] border-ink-3 rounded-lg text-xs italic text-ink-2 cursor-pointer max-w-[75%] hover:bg-paper-1 transition-colors"
            onClick={() => toggle(taskId, msg.id)}
          >
            <span className="font-bold not-italic text-ink-2">思考</span>
            <span className={expanded ? "whitespace-pre-wrap" : "truncate"} style={{ flex: 1 }}>
              {msg.parsed.payload.text}
            </span>
            <span className="shrink-0 text-ink-3">
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

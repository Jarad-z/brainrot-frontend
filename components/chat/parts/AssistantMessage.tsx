"use client";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ClientMessage } from "@/lib/api/types";
import { Avatar, agentColor } from "@/components/brand/avatar";
import { useChatUIStore } from "@/lib/store/chat-ui";

interface AssistantMessageProps {
  msg: ClientMessage;
  taskId: string;
  agent: { name: string; handle: string };
  isFirstInGroup?: boolean;
}

export function AssistantMessage({ msg, taskId, agent, isFirstInGroup = true }: AssistantMessageProps) {
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
  const color = agentColor(agent.handle);
  const avatarSize = 28;

  return (
    <div className={`flex gap-3 ${isFirstInGroup ? "mt-4" : "mt-0.5"}`}>
      {/* Avatar column — fixed width so text always aligns; avatar only on first */}
      <div className="shrink-0" style={{ width: avatarSize }}>
        {isFirstInGroup && (
          <Avatar name={agent.name} color={color} size={avatarSize} radius={6} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Name row — only on first message in group */}
        {isFirstInGroup && (
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-[13px] font-medium" style={{ color }}>
              {agent.name}
            </span>
            <span className="text-[11px] text-ink-3">@{agent.handle}</span>
            {time && <span className="text-[11px] text-ink-3">· {time}</span>}
          </div>
        )}

        {/* Primary response — bare text, highest visual weight */}
        {msg.parsed.type === "assistant_text" && (
          <p className="text-[14px] text-ink-0 leading-[1.7] whitespace-pre-wrap break-words m-0">
            {msg.parsed.payload.text}
          </p>
        )}

        {/* Thinking — lowest weight, collapsed by default */}
        {msg.parsed.type === "thinking" && (
          <button
            type="button"
            className="flex items-center gap-1.5 text-[12px] text-ink-3 hover:text-ink-2 transition-colors cursor-pointer text-left w-full"
            onClick={() => toggle(taskId, msg.id)}
          >
            <span className="shrink-0">
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
            <span className="italic">思考</span>
            {expanded && (
              <span className="ml-2 text-ink-2 not-italic whitespace-pre-wrap break-words">
                {msg.parsed.payload.text}
              </span>
            )}
            {!expanded && (
              <span className="truncate text-ink-3 max-w-[40ch]">
                {msg.parsed.payload.text.slice(0, 80)}…
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

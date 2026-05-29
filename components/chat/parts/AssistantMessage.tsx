"use client";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ClientMessage } from "@/lib/api/types";
import { agentColor } from "@/components/brand/avatar";
import { useChatUIStore } from "@/lib/store/chat-ui";

interface AssistantMessageProps {
  msg: ClientMessage;
  taskId: string;
  agent: { name: string; handle: string };
  agentId?: string | null;
  isFirstInGroup?: boolean;
}

/**
 * Agent message — Aero white-glass card. Half-opaque white with strong
 * backdrop blur, top highlight + bottom shadow line, hairline edge.
 * Avatar is a glass tile tinted with the agent's identity color.
 */
export function AssistantMessage({
  msg,
  taskId,
  agent,
  agentId,
  isFirstInGroup = true,
}: AssistantMessageProps) {
  const expanded = useChatUIStore(
    (s) => s.byTask[taskId]?.expandedThinkings.has(msg.id) ?? false,
  );
  const toggle = useChatUIStore((s) => s.toggleThinking);
  const openTrace = useChatUIStore((s) => s.openTrace);

  if (msg.parsed.type !== "assistant_text" && msg.parsed.type !== "thinking") {
    return null;
  }

  // Opus 4.x emits thinking blocks with empty text and only an encrypted
  // `signature` (Anthropic's summarized-thinking mode). There is nothing to
  // render — drop the message entirely so the empty pill chrome doesn't appear.
  if (msg.parsed.type === "thinking" && msg.parsed.payload.text === "") {
    return null;
  }

  const time = msg.created_at
    ? new Date(msg.created_at).toTimeString().slice(0, 5)
    : "";
  const color = agentColor(agent.handle);
  const avatarSize = 30;

  return (
    <div className={`flex gap-2.5 ${isFirstInGroup ? "mt-4" : "mt-1"}`}>
      <div className="shrink-0" style={{ width: avatarSize }}>
        {isFirstInGroup && (
          <button
            type="button"
            data-chat="avatar"
            onClick={() => {
              if (agentId) openTrace(taskId, agentId);
            }}
            disabled={!agentId}
            aria-label={`查看 ${agent.name} 的执行轨迹`}
            title={`查看 ${agent.name} 的执行轨迹`}
            className="grid place-items-center text-white font-semibold transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default cursor-pointer"
            style={{
              width: avatarSize,
              height: avatarSize,
              background: `linear-gradient(180deg, color-mix(in srgb, ${color} 60%, white) 0%, ${color} 100%)`,
              borderRadius: 10,
              fontSize: 12,
              border: "1px solid rgba(255,255,255,0.55)",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.15), 0 1px 2px ${color}55, 0 4px 10px ${color}33`,
              textShadow: "0 -1px 0 rgba(0,0,0,0.2)",
            }}
          >
            {agent.name.slice(0, 1).toUpperCase()}
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0 max-w-[72%]">
        {isFirstInGroup && (
          <div className="flex items-baseline gap-1.5 mb-1 pl-2">
            <span
              className="text-[12.5px] font-semibold tracking-tight"
              style={{ color }}
            >
              {agent.name}
            </span>
            <span className="text-[11px] text-ink-3">@{agent.handle}</span>
            {time && <span className="text-[11px] text-ink-3">· {time}</span>}
          </div>
        )}

        {msg.parsed.type === "assistant_text" && (
          <div
            data-bubble="assistant"
            className="px-3.5 py-2 text-[14px] text-ink-0 leading-[1.65] whitespace-pre-wrap break-words"
            style={{
              background:
                "linear-gradient(180deg, rgba(225,232,240,0.78) 0%, rgba(210,220,232,0.72) 50%, rgba(198,210,224,0.70) 100%)",
              backdropFilter: "blur(22px) saturate(1.05)",
              WebkitBackdropFilter: "blur(22px) saturate(1.05)",
              borderRadius: "4px 12px 12px 12px",
              border: "1px solid rgba(220,232,245,0.65)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(50,80,110,0.10), 0 1px 2px rgba(20,62,107,0.10), 0 6px 16px rgba(20,62,107,0.12)",
            }}
          >
            {msg.parsed.payload.text}
          </div>
        )}

        {msg.parsed.type === "thinking" && (
          <button
            type="button"
            data-bubble="thinking"
            onClick={() => toggle(taskId, msg.id)}
            className="group inline-flex items-start gap-1.5 text-left w-full px-3 py-1.5 rounded-xl text-[12.5px] transition-colors bg-white/30 hover:bg-white/45 border border-white/40"
            aria-expanded={expanded}
          >
            <span className="shrink-0 mt-0.5 text-ink-3 group-hover:text-ink-2">
              {expanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
            </span>
            <span data-thinking-label className="text-[11px] text-ink-3 mt-[2px] shrink-0">思考</span>
            <span data-thinking-text className="flex-1 min-w-0 italic whitespace-pre-wrap break-words text-ink-2">
              {expanded
                ? msg.parsed.payload.text
                : `${msg.parsed.payload.text.slice(0, 100)}${
                    msg.parsed.payload.text.length > 100 ? "…" : ""
                  }`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

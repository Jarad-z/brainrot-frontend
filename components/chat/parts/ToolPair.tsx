/* eslint-disable camelcase -- snake_case identifiers come from backend wire format */
"use client";
import { Wrench, ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import type { ClientMessage } from "@/lib/api/types";
import { useChatUIStore } from "@/lib/store/chat-ui";

interface ToolPairProps {
  useMsg: ClientMessage;
  resultMsg?: ClientMessage;
  taskId: string;
}

export function ToolPair({ useMsg, resultMsg, taskId }: ToolPairProps) {
  const expanded = useChatUIStore(
    (s) => s.byTask[taskId]?.expandedToolBodies.has(useMsg.id) ?? false,
  );
  const toggle = useChatUIStore((s) => s.toggleToolBody);

  if (useMsg.parsed.type !== "tool_use") return null;
  const { tool_name, input } = useMsg.parsed.payload;
  const inp =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  const isError =
    resultMsg?.parsed.type === "tool_result" && resultMsg.parsed.payload.is_error;
  const resultContent: string | null = (() => {
    if (resultMsg?.parsed.type !== "tool_result") return null;
    const c = resultMsg.parsed.payload.content;
    if (c == null) return "";
    if (typeof c === "string") return c;
    try {
      return JSON.stringify(c);
    } catch {
      return String(c);
    }
  })();

  return (
    <div className="chat-indent my-2">
      <div className="tool-card border-2 border-ink-0 bg-paper-2 rounded-lg overflow-hidden shadow-[2px_2px_0_var(--ink-0)]">
        {/* header */}
        <div
          className="tool-head relative flex items-center gap-2 pl-4 pr-3 py-2 cursor-pointer text-sm hover:bg-paper-1 transition-colors"
          onClick={() => toggle(taskId, useMsg.id)}
        >
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-ink-2" aria-hidden />
          <Wrench size={13} className="shrink-0 text-ink-2" />
          <span className="font-bold text-ink-0">{tool_name}</span>
          {typeof inp.file_path === "string" && (
            <span className="font-mono text-xs text-ink-2 truncate min-w-0">· {inp.file_path}</span>
          )}
          <span className="ml-auto shrink-0 text-ink-2">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </div>

        {/* expanded body */}
        {expanded && (
          <div className="tool-body px-4 py-3 text-xs font-mono bg-paper-1 border-t-2 border-hairline leading-relaxed">
            {Object.entries(inp).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-ink-2 shrink-0">{k}:</span>
                <span className="break-all text-ink-0">
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* result row */}
        {resultMsg && resultContent !== null && (
          <div className={`relative flex items-center gap-2 pl-4 pr-3 py-1.5 text-xs border-t-[1.5px] border-hairline ${
            isError ? "bg-state-failed/8 text-state-failed" : "bg-paper-1 text-ink-1"
          }`}>
            <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${isError ? "bg-accent-poppy" : "bg-accent-moss"}`} aria-hidden />
            {isError
              ? <XCircle size={13} className="shrink-0 text-state-failed" />
              : <CheckCircle2 size={13} className="shrink-0 text-accent-moss" />
            }
            <span className="truncate font-mono">{resultContent.slice(0, 200)}</span>
          </div>
        )}

        {/* running indicator */}
        {!resultMsg && (
          <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-ink-2 border-t-2 border-hairline font-mono">
            <span className="w-2 h-2 rounded-none bg-state-running skeleton-pixel shrink-0" />
            运行中…
          </div>
        )}
      </div>
    </div>
  );
}

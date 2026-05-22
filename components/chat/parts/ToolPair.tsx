/* eslint-disable camelcase -- snake_case identifiers come from backend wire format */
"use client";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
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

  const succeeded = resultMsg && !isError;

  return (
    <div className="chat-indent my-1.5">
      {/* System track — monospace, light gray, mid-weight signal */}
      <div
        data-tool-card
        className="border border-hairline rounded-lg overflow-hidden bg-bg-secondary"
      >
        {/* Header row */}
        <button
          type="button"
          data-tool-header
          className="w-full flex items-center gap-2 pl-3 pr-2.5 py-1.5 text-left hover:bg-bg-tertiary transition-colors min-w-0"
          onClick={() => toggle(taskId, useMsg.id)}
        >
          <span data-tool-name className="font-mono text-[12px] text-ink-1 font-medium shrink-0">
            {tool_name}
          </span>
          {typeof inp.file_path === "string" && (
            <span data-tool-path className="font-mono text-[11px] text-ink-3 truncate min-w-0 flex-1">
              · {inp.file_path}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1.5 shrink-0">
            {succeeded && (
              <span
                data-tool-status="ok"
                aria-label="成功"
                title="成功"
                className="inline-block"
              >
                <CheckCircle2 size={12} className="text-accent-moss" />
              </span>
            )}
            {isError && (
              <span
                data-tool-status="err"
                aria-label="失败"
                title="失败"
                className="inline-block"
              >
                <XCircle size={12} className="text-state-failed" />
              </span>
            )}
            {!resultMsg && (
              <span
                data-tool-status="run"
                aria-label="运行中"
                title="运行中"
                className="w-1.5 h-1.5 rounded-full bg-state-running animate-status-pulse"
              />
            )}
            <span className="text-ink-3">
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
          </span>
        </button>

        {/* Expanded input body */}
        {expanded && (
          <div className="px-3 py-2 text-[11px] font-mono bg-bg-tertiary border-t border-hairline leading-relaxed text-ink-1">
            {Object.entries(inp).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-ink-3 shrink-0">{k}:</span>
                <span className="break-all text-ink-0">
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Result row */}
        {resultMsg && resultContent !== null && (
          <div
            data-tool-result
            className={`flex items-center gap-2 pl-3 pr-2.5 py-1 text-[11px] font-mono border-t border-hairline ${
              isError ? "text-state-failed bg-state-failed/5" : "text-ink-2 bg-bg-secondary"
            }`}
          >
            <span className="truncate min-w-0">{resultContent.slice(0, 200)}</span>
          </div>
        )}

        {/* Running indicator */}
        {!resultMsg && (
          <div className="flex items-center gap-2 px-3 py-1 text-[11px] text-ink-3 border-t border-hairline font-mono">
            运行中…
          </div>
        )}
      </div>
    </div>
  );
}

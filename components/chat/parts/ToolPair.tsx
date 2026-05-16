"use client";
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
  const resultContent =
    resultMsg?.parsed.type === "tool_result"
      ? typeof resultMsg.parsed.payload.content === "string"
        ? resultMsg.parsed.payload.content
        : JSON.stringify(resultMsg.parsed.payload.content)
      : null;

  return (
    <div className="ml-12 my-2">
      <div className="tool-card border-[1.5px] border-hairline bg-role-tool rounded-md overflow-hidden">
        <div
          className="tool-head flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm"
          onClick={() => toggle(taskId, useMsg.id)}
        >
          <span className="font-bold">🔧 {tool_name}</span>
          {typeof inp.file_path === "string" && (
            <span className="font-mono text-xs text-ink-2">· {inp.file_path}</span>
          )}
          <span className="ml-auto">{expanded ? "▾" : "▸"}</span>
        </div>
        {expanded && (
          <div className="tool-body px-3 py-2 text-xs font-mono border-t-[1.5px] border-hairline">
            {Object.entries(inp).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-ink-2">{k}:</span>
                <span className="break-all">
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}
        {resultMsg && resultContent !== null && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 text-xs border-t-[1.5px] border-hairline ${
              isError
                ? "bg-state-failed/10 text-state-failed"
                : "bg-state-done/10 text-ink-0"
            }`}
          >
            <span>{isError ? "✗" : "✓"}</span>
            <span className="truncate">{resultContent.slice(0, 200)}</span>
          </div>
        )}
      </div>
      {!resultMsg && <div className="text-xs text-ink-2 mt-1 px-3">正在运行…</div>}
    </div>
  );
}

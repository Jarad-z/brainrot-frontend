/* eslint-disable camelcase -- snake_case identifiers come from backend wire format */
import type { ClientMessage } from "@/lib/api/types";

interface OrphanToolResultProps {
  msg: ClientMessage;
}

export function OrphanToolResult({ msg }: OrphanToolResultProps) {
  if (msg.parsed.type !== "tool_result") return null;
  const { tool_use_id, content } = msg.parsed.payload;
  const summary = typeof content === "string" ? content : JSON.stringify(content);
  return (
    <div className="ml-12 my-2 p-3 border-[1.5px] border-state-warn bg-state-warn/10 rounded-md text-sm">
      <div className="font-bold mb-1">未配对的工具结果</div>
      <div className="font-mono text-xs text-ink-2 mb-1">tool_use_id: {tool_use_id}</div>
      <div>{summary.slice(0, 200)}</div>
    </div>
  );
}

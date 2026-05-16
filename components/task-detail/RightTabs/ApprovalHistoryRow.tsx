/* eslint-disable camelcase -- snake_case identifiers come from backend wire format */
"use client";
import type { ClientMessage } from "@/lib/api/types";
import { StatusChip, type Status } from "@/components/brand/status-chip";
import { useChatUIStore, getDecision } from "@/lib/store/chat-ui";
import { relativeTime } from "@/lib/format";

interface ApprovalHistoryRowProps {
  message: ClientMessage;
}

export function ApprovalHistoryRow({ message }: ApprovalHistoryRowProps) {
  // Hooks must be called unconditionally — compute key defensively before early return.
  const key =
    message.parsed.type === "permission_request"
      ? (message.parsed.payload.approval_id ?? message.parsed.payload.tool_use_id ?? "")
      : "";
  const decision = useChatUIStore((s) => getDecision(s, key));

  if (message.parsed.type !== "permission_request") return null;
  const { tool_name, expires_at } = message.parsed.payload;

  let status: Status = "open";
  let label = "等待中";
  if (decision) {
    if (decision.decision === "approved") {
      status = "done";
      label = "已批准";
    } else if (decision.decision === "approved_with_edits") {
      status = "in_progress";
      label = "已批准（带修改）";
    } else {
      status = "blocked";
      label = "已拒绝";
    }
  } else if (expires_at && Date.parse(expires_at) < Date.now()) {
    status = "archived";
    label = "已超时";
  }

  return (
    <li className="flex items-center gap-2 py-2 px-3 border-b-[1.5px] border-hairline text-sm">
      <span className="flex-1 truncate">
        <strong>{tool_name}</strong>
        <span className="text-ink-2 ml-2">{relativeTime(message.created_at)}</span>
      </span>
      <span className="text-xs text-ink-2 mr-1">{label}</span>
      <StatusChip status={status} />
    </li>
  );
}

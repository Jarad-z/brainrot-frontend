"use client";
import type { ApprovalRecord } from "@/lib/approvals/types";
import { StatusChip, type Status } from "@/components/brand/status-chip";
import { relativeTime } from "@/lib/format";

interface ApprovalHistoryRowProps {
  record: ApprovalRecord;
}

export function ApprovalHistoryRow({ record }: ApprovalHistoryRowProps) {
  let status: Status = "open";
  let label = "等待中";
  if (record.status === "approved") {
    status = "done";
    label = "已批准";
  } else if (record.status === "approved_with_edits") {
    status = "in_progress";
    label = "已批准（带修改）";
  } else if (record.status === "denied") {
    status = "blocked";
    label = "已拒绝";
  } else if (record.status === "timeout") {
    status = "archived";
    label = "已超时";
  } else if (record.expiresAt && Date.parse(record.expiresAt) < Date.now()) {
    status = "archived";
    label = "已超时";
  }

  return (
    <li className="flex items-center gap-2 py-2 px-3 border-b-[1.5px] border-hairline text-sm">
      <span className="flex-1 truncate">
        <strong>{record.toolName}</strong>
        <span className="text-ink-2 ml-2">{relativeTime(record.createdAt)}</span>
      </span>
      <span className="text-xs text-ink-2 mr-1">{label}</span>
      <StatusChip status={status} />
    </li>
  );
}

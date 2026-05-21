/* eslint-disable camelcase -- snake_case identifiers come from backend wire format */
"use client";
import { useState } from "react";
import type { ClientMessage } from "@/lib/api/types";
import { useApprovalDecide } from "@/hooks/useApprovalDecide";
import { useChatUIStore, getDecision } from "@/lib/store/chat-ui";
import { useCountdown } from "@/lib/chat/use-countdown";
import { StatusChip, type Status } from "@/components/brand/status-chip";

interface PermissionRequestCardProps {
  msg: ClientMessage;
  taskId: string;
}

export function PermissionRequestCard({ msg, taskId }: PermissionRequestCardProps) {
  void taskId;
  // Compute approval key BEFORE hooks below so they all run unconditionally
  // and `approvalKey` is stable for the duration of this render.
  const payload =
    msg.parsed.type === "permission_request" ? msg.parsed.payload : null;
  const approvalKey = payload?.approval_id ?? payload?.tool_use_id ?? "";
  const expiresAt = payload?.expires_at;

  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const decide = useApprovalDecide();
  const decision = useChatUIStore((s) => getDecision(s, approvalKey));
  const { label, urgent, expired } = useCountdown(expiresAt);

  if (msg.parsed.type !== "permission_request" || !payload) return null;
  const { tool_name, tool_input } = payload;

  if (decision) {
    const status: Status =
      decision.decision === "approved_with_edits"
        ? "in_progress"
        : decision.decision === "denied"
          ? "blocked"
          : "done";
    const text =
      decision.decision === "approved"
        ? "已批准"
        : decision.decision === "denied"
          ? "已拒绝"
          : "已批准（带修改）";
    return (
      <div className="chat-indent my-2 px-3 py-2 bg-paper-1 border-[1.5px] border-hairline rounded-md flex items-center justify-between text-sm">
        <span>
          <strong>{tool_name}</strong> · {text}
        </span>
        <StatusChip status={status} />
      </div>
    );
  }

  if (expired) {
    return (
      <div className="chat-indent my-2 px-3 py-2 bg-paper-1 border-[1.5px] border-hairline rounded-md opacity-60 flex items-center justify-between text-sm">
        <span>
          <strong>{tool_name}</strong> · 已超时
        </span>
      </div>
    );
  }

  const submit = (d: "approved" | "denied" | "approved_with_edits") => {
    if (!approvalKey) return;
    decide.mutate({
      approvalId: approvalKey,
      input: { decision: d, note: note.trim() || undefined },
    });
  };

  const inputSummary =
    typeof tool_input === "object" && tool_input
      ? "command" in (tool_input as Record<string, unknown>)
        ? String((tool_input as Record<string, unknown>).command)
        : "file_path" in (tool_input as Record<string, unknown>)
          ? String((tool_input as Record<string, unknown>).file_path)
          : JSON.stringify(tool_input)
      : "";

  return (
    <div className="chat-indent my-2 border-[1.5px] border-ink-0 rounded-md overflow-hidden shadow-[var(--shadow-current)] bg-paper-0">
      <div className="flex items-center justify-between px-3 py-1.5 bg-role-approval text-paper-0">
        <span className="font-bold">{tool_name} 请求批准</span>
        <span
          className={`font-mono text-xs ${urgent ? "text-state-failed font-bold animate-pulse" : ""}`}
        >
          {label}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <pre className="font-mono text-xs bg-paper-1 p-2 rounded-sm whitespace-pre-wrap break-all">
          {inputSummary}
        </pre>
        {noteOpen && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={256}
            placeholder="备注（可选,≤256 字）"
            className="border-[1.5px] border-hairline rounded-sm p-2 text-sm min-h-[60px]"
          />
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => submit("denied")}
            className="px-3 py-1 border-[1.5px] border-ink-0 rounded-sm font-semibold"
          >
            拒绝
          </button>
          <button
            onClick={() => {
              setNoteOpen(true);
              submit("approved_with_edits");
            }}
            className="px-3 py-1 border-[1.5px] border-ink-0 rounded-sm font-semibold"
          >
            批准并修改
          </button>
          <button
            onClick={() => submit("approved")}
            className="px-3 py-1 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold shadow-[var(--shadow-current)]"
          >
            批准
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useApprovalDecide } from "@/hooks/useApprovalDecide";
import { useCountdown } from "@/lib/chat/use-countdown";
import type { ApprovalLite } from "@/lib/approvals/types";

interface ApprovalHubCardProps {
  approval: ApprovalLite;
}

function summarizeInput(input: unknown): string {
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (typeof obj.command === "string") return obj.command;
    if (typeof obj.file_path === "string") return obj.file_path;
    try {
      return JSON.stringify(input);
    } catch {
      return "";
    }
  }
  return "";
}

export function ApprovalHubCard({ approval }: ApprovalHubCardProps) {
  const decide = useApprovalDecide();
  const { label, urgent, expired } = useCountdown(approval.expiresAt);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const disabled = expired || decide.isPending;

  function submit(decision: "approved" | "denied" | "approved_with_edits") {
    if (disabled) return;
    decide.mutate({
      approvalId: approval.id,
      input: { decision, note: note.trim() || undefined },
    });
  }

  return (
    <div className="card-lift hover:card-lift-hover border-[1.5px] border-ink-0 rounded-xl overflow-hidden shadow-[var(--shadow-current)] bg-paper-0">
      <div className="pending-stripes flex items-center justify-between px-4 py-2.5 text-paper-0">
        <span className="font-bold">{approval.toolName} 请求批准</span>
        <span
          className={`font-mono text-xs ${urgent ? "text-state-failed font-bold animate-pulse" : "text-paper-0/85"}`}
        >
          {label}
        </span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">
        <div className="text-xs text-ink-2">
          {approval.projectName} · {approval.taskTitle}
        </div>
        <pre className="font-mono text-xs bg-paper-1 p-2 rounded-sm whitespace-pre-wrap break-all">
          {summarizeInput(approval.toolInput)}
        </pre>
        {noteOpen && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={256}
            placeholder="备注（可选，≤256 字）"
            className="border-[1.5px] border-hairline rounded-sm p-2 text-sm min-h-[60px]"
          />
        )}
        <div className="flex justify-end gap-2">
          {!noteOpen && (
            <>
              <button
                onClick={() => submit("denied")}
                disabled={disabled}
                className="ink-stamp active:ink-stamp-active px-3 py-1 border-[1.5px] border-ink-0 rounded-sm font-semibold disabled:opacity-50 bg-paper-0"
              >
                拒绝
              </button>
              <button
                onClick={() => setNoteOpen(true)}
                disabled={disabled}
                className="ink-stamp active:ink-stamp-active px-3 py-1 border-[1.5px] border-ink-0 rounded-sm font-semibold disabled:opacity-50 bg-paper-0"
              >
                批准并修改
              </button>
              <button
                onClick={() => submit("approved")}
                disabled={disabled}
                className="ink-stamp active:ink-stamp-active px-3 py-1 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold shadow-[var(--shadow-current)] disabled:opacity-50"
              >
                批准
              </button>
            </>
          )}
          {noteOpen && (
            <button
              onClick={() => submit("approved_with_edits")}
              disabled={disabled}
              className="px-3 py-1 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold shadow-[var(--shadow-current)] disabled:opacity-50"
            >
              提交
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

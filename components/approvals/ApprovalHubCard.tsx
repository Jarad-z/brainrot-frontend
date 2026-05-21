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
    <div className="card-lift hover:card-lift-hover border border-hairline rounded-xl overflow-hidden shadow-[var(--shadow-1)] bg-paper-0">
      <div className="pending-stripes flex items-center justify-between px-4 py-2.5 border-b border-accent-wash-2">
        <span className="font-semibold text-sm text-ink-0">
          <span className="text-accent">●</span> {approval.toolName} 请求批准
        </span>
        <span
          className={`font-mono text-xs ${
            urgent
              ? "text-countdown-urgent font-bold animate-pulse"
              : "text-ink-2"
          }`}
        >
          {label}
        </span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">
        <div className="text-xs text-ink-2">
          {approval.projectName} · {approval.taskTitle}
        </div>
        <pre className="font-mono text-xs bg-paper-1 border border-hairline px-3 py-2 rounded-lg whitespace-pre-wrap break-all text-ink-1">
          {summarizeInput(approval.toolInput)}
        </pre>
        {noteOpen && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={256}
            placeholder="备注（可选，≤256 字）"
            className="border border-hairline rounded-lg p-2.5 text-sm min-h-[60px] bg-paper-0 focus:border-accent/60 focus:outline-none"
          />
        )}
        <div className="flex justify-end gap-2">
          {!noteOpen && (
            <>
              <button
                onClick={() => submit("denied")}
                disabled={disabled}
                className="px-3.5 py-1.5 border border-hairline rounded-lg text-sm font-medium text-ink-1 hover:bg-paper-1 disabled:opacity-50 transition-colors"
              >
                拒绝
              </button>
              <button
                onClick={() => setNoteOpen(true)}
                disabled={disabled}
                className="px-3.5 py-1.5 border border-hairline rounded-lg text-sm font-medium text-ink-1 hover:bg-paper-1 disabled:opacity-50 transition-colors"
              >
                批准并修改
              </button>
              <button
                onClick={() => submit("approved")}
                disabled={disabled}
                className="px-3.5 py-1.5 bg-accent text-accent-fg rounded-lg text-sm font-semibold hover:opacity-90 shadow-[var(--shadow-1)] disabled:opacity-50 transition-opacity"
              >
                批准
              </button>
            </>
          )}
          {noteOpen && (
            <button
              onClick={() => submit("approved_with_edits")}
              disabled={disabled}
              className="px-3.5 py-1.5 bg-accent text-accent-fg rounded-lg text-sm font-semibold hover:opacity-90 shadow-[var(--shadow-1)] disabled:opacity-50 transition-opacity"
            >
              提交
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { RunStatus } from "@/lib/api/types";
import type { TraceRunGroup } from "@/lib/chat/build-agent-trace";
import { TraceStep } from "./TraceStep";

interface TraceRunSectionProps {
  group: TraceRunGroup;
  index: number;
  defaultOpen?: boolean;
}

const RUN_STATUS: Record<RunStatus, { label: string; cls: string; dot: string }> = {
  pending: { label: "等待中", cls: "text-ink-2 border-hairline bg-paper-1", dot: "bg-ink-3" },
  claimed: { label: "已认领", cls: "text-ink-2 border-hairline bg-paper-1", dot: "bg-ink-3" },
  running: { label: "运行中", cls: "text-accent border-accent-wash-2 bg-accent-wash", dot: "bg-accent animate-status-pulse" },
  awaiting_approval: { label: "待批准", cls: "text-accent border-accent-wash-2 bg-accent-wash", dot: "bg-accent animate-status-pulse" },
  done: { label: "完成", cls: "text-ink-2 border-hairline bg-paper-1", dot: "bg-accent-moss" },
  canceled: { label: "已取消", cls: "text-ink-3 border-hairline bg-paper-1", dot: "bg-ink-3" },
  failed: { label: "失败", cls: "text-state-failed border-[color-mix(in_srgb,var(--state-failed)_22%,transparent)] bg-[color-mix(in_srgb,var(--state-failed)_8%,transparent)]", dot: "bg-state-failed" },
};

function hhmm(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toTimeString().slice(0, 5);
}

export function TraceRunSection({ group, index, defaultOpen = false }: TraceRunSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { run, steps } = group;
  const status = run ? RUN_STATUS[run.status] : null;
  const title = group.runId === null ? "未关联运行" : run ? `运行 #${index + 1}` : "运行 (未知)";
  const start = run ? hhmm(run.started_at ?? run.created_at) : "";
  const end = run ? hhmm(run.finished_at) : "";

  return (
    <div className="border border-hairline rounded-lg overflow-hidden bg-bg-secondary">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-tertiary transition-colors"
      >
        <span className="text-ink-3 shrink-0">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <span className="text-[12.5px] font-semibold text-ink-0 shrink-0">{title}</span>
        {status && (
          <span className={`inline-flex items-center gap-1.5 px-2 py-[2px] rounded-md text-[11px] font-medium border ${status.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} aria-hidden />
            {status.label}
          </span>
        )}
        {(start || end) && (
          <span className="text-[11px] text-ink-3">
            {start}{end ? ` → ${end}` : ""}
          </span>
        )}
        <span className="ml-auto text-[11px] text-ink-3 tabular-nums">{steps.length} 步</span>
      </button>
      {open && (
        <div className="border-t border-hairline px-1 py-1.5 divide-y divide-hairline/60">
          {steps.map((s) => (
            <TraceStep key={s.msg.id} step={s} />
          ))}
        </div>
      )}
    </div>
  );
}

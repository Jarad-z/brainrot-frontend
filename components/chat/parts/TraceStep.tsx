/* eslint-disable camelcase -- snake_case identifiers come from backend wire format */
"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import type { TraceStepData } from "@/lib/chat/build-agent-trace";
import { stringifyToolResult } from "@/lib/chat/stringify-tool-result";

interface TraceStepProps {
  step: TraceStepData;
}

function hhmmss(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toTimeString().slice(0, 8);
}

/** Pick the single most useful input field to show inline next to a tool name. */
function summarizeInput(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const o = input as Record<string, unknown>;
  for (const k of ["file_path", "command", "pattern", "query", "url", "path"]) {
    if (typeof o[k] === "string") return o[k] as string;
  }
  return "";
}

export function TraceStep({ step }: TraceStepProps) {
  const { msg, result } = step;
  const [open, setOpen] = useState(false);
  const time = hhmmss(msg.created_at);

  if (msg.parsed.type === "thinking") {
    if (msg.parsed.payload.text === "") return null;
    const text = msg.parsed.payload.text;
    return (
      <div className="flex items-start gap-2 py-1 px-2 text-[12px]">
        <span className="text-ink-3 shrink-0 mt-[1px]">{time}</span>
        <span className="text-ink-3 shrink-0">思考</span>
        <span className="italic text-ink-2 truncate">
          {text.slice(0, 120)}{text.length > 120 ? "…" : ""}
        </span>
      </div>
    );
  }

  if (msg.parsed.type === "assistant_text") {
    return (
      <div className="flex items-start gap-2 py-1 px-2 text-[12.5px]">
        <span className="text-ink-3 shrink-0 mt-[1px]">{time}</span>
        <span className="text-ink-0 whitespace-pre-wrap break-words">{msg.parsed.payload.text}</span>
      </div>
    );
  }

  if (msg.parsed.type === "result") {
    return (
      <div className="flex items-center gap-2 py-1 px-2 text-[12px] text-accent-moss">
        <span className="text-ink-3 shrink-0">{time}</span>
        <CheckCircle2 size={12} className="shrink-0" />
        <span className="truncate">完成 · {String(msg.parsed.payload.result).slice(0, 120)}</span>
      </div>
    );
  }

  if (msg.parsed.type === "permission_request") {
    return (
      <div className="flex items-center gap-2 py-1 px-2 text-[12px] text-ink-2">
        <span className="text-ink-3 shrink-0">{time}</span>
        <span>请求批准：<span className="font-mono">{msg.parsed.payload.tool_name}</span></span>
      </div>
    );
  }

  if (msg.parsed.type === "tool_use") {
    const { tool_name, input } = msg.parsed.payload;
    const summary = summarizeInput(input);
    const inp = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
    const isError = result?.parsed.type === "tool_result" && result.parsed.payload.is_error;
    const succeeded = result && !isError;
    const resultContent = stringifyToolResult(result);

    return (
      <div className="text-[12px]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center gap-2 py-1 px-2 text-left hover:bg-bg-tertiary rounded transition-colors min-w-0"
        >
          <span className="text-ink-3 shrink-0">{time}</span>
          <span className="font-mono text-ink-1 font-medium shrink-0">{tool_name}</span>
          {summary && <span className="font-mono text-ink-3 truncate min-w-0 flex-1">· {summary}</span>}
          <span className="ml-auto flex items-center gap-1.5 shrink-0">
            {succeeded && <CheckCircle2 size={12} className="text-accent-moss" />}
            {isError && <XCircle size={12} className="text-state-failed" />}
            {!result && <span className="w-1.5 h-1.5 rounded-full bg-state-running animate-status-pulse" />}
            {open ? <ChevronDown size={12} className="text-ink-3" /> : <ChevronRight size={12} className="text-ink-3" />}
          </span>
        </button>
        {open && (
          <div className="px-3 py-1.5 ml-6 text-[11px] font-mono bg-bg-tertiary border border-hairline rounded leading-relaxed text-ink-1">
            {Object.entries(inp).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-ink-3 shrink-0">{k}:</span>
                <span className="break-all text-ink-0">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
            {resultContent !== null && (
              <div className={`mt-1 pt-1 border-t border-hairline break-all ${isError ? "text-state-failed" : "text-ink-2"}`}>
                {resultContent.slice(0, 300)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // system / fallback
  const label =
    msg.parsed.type === "system" && typeof msg.parsed.payload === "string"
      ? msg.parsed.payload
      : msg.parsed.type;
  return (
    <div className="flex items-center gap-2 py-1 px-2 text-[11.5px] text-ink-3">
      <span className="shrink-0">{time}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

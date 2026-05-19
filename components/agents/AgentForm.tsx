"use client";

import { useEffect, useState } from "react";
import type { Agent, AgentInput, Runtime } from "@/lib/api/types";
import { messages } from "@/lib/messages";

interface AgentFormProps {
  mode: "create" | "edit";
  initial?: Agent;
  runtimes: Runtime[];
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (input: AgentInput) => void;
}

const MODELS = ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001", "gpt-4o"];
const HANDLE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function tryParse(raw: string): { ok: true; value: unknown } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch {
    return { ok: false };
  }
}

export function AgentForm({
  mode,
  initial,
  runtimes,
  isSubmitting,
  submitError,
  onSubmit,
}: AgentFormProps) {
  const m = messages.agents.form;
  const [handle, setHandle] = useState(initial?.handle ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [model, setModel] = useState(initial?.model ?? MODELS[1]);
  const [runtimeId, setRuntimeId] = useState(initial?.runtime_id ?? runtimes[0]?.id ?? "");

  // runtimes may arrive after first render (loading async). If we still don't
  // have a selection, fall back to the first one — otherwise the <select>
  // *displays* runtimes[0] but state stays "" and submit is silently blocked.
  useEffect(() => {
    if (!runtimeId && runtimes.length > 0 && runtimes[0]) {
      setRuntimeId(runtimes[0].id);
    }
  }, [runtimes, runtimeId]);
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [envRaw, setEnvRaw] = useState(
    initial ? JSON.stringify(initial.custom_env, null, 2) : "",
  );
  const [argsRaw, setArgsRaw] = useState(
    initial ? JSON.stringify(initial.custom_args, null, 2) : "",
  );
  const [mcpRaw, setMcpRaw] = useState(
    initial ? JSON.stringify(initial.mcp_config, null, 2) : "",
  );

  const [envError, setEnvError] = useState(false);
  const [argsError, setArgsError] = useState(false);
  const [mcpError, setMcpError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function validateOnBlur(setter: (b: boolean) => void, raw: string) {
    setter(!tryParse(raw).ok);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!HANDLE_RE.test(handle)) {
      setFormError(m.handleInvalid);
      return;
    }
    if (name.trim() === "") {
      setFormError(m.nameRequired);
      return;
    }
    if (!runtimeId) {
      setFormError(m.runtimeRequired);
      return;
    }

    const env = tryParse(envRaw);
    const args = tryParse(argsRaw);
    const mcp = tryParse(mcpRaw);
    if (!env.ok || !args.ok || !mcp.ok) {
      setEnvError(!env.ok);
      setArgsError(!args.ok);
      setMcpError(!mcp.ok);
      setFormError(m.jsonInvalid);
      return;
    }

    const input: AgentInput = {
      runtime_id: runtimeId,
      handle,
      name: name.trim(),
      model,
      instructions,
      custom_env: (env.value as Record<string, string> | null) ?? {},
      custom_args: (args.value as string[] | null) ?? [],
      mcp_config: (mcp.value as Record<string, unknown> | null) ?? {},
    };
    onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-2xl">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.handle}</span>
        <input
          aria-label={m.handle}
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={m.handlePlaceholder}
          disabled={mode === "edit"}
          className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="text-xs text-ink-2">{m.handleHelp}</span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.name}</span>
        <input
          aria-label={m.name}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={m.namePlaceholder}
          className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.model}</span>
        <select
          aria-label={m.model}
          value={model ?? ""}
          onChange={(e) => setModel(e.target.value)}
          className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
        >
          {MODELS.map((mm) => (
            <option key={mm} value={mm}>
              {mm}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.runtime}</span>
        {runtimes.length === 0 ? (
          <span className="text-xs text-state-failed">{m.noRuntimes}</span>
        ) : (
          <select
            aria-label={m.runtime}
            value={runtimeId}
            onChange={(e) => setRuntimeId(e.target.value)}
            className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
          >
            {runtimes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.host} {r.online ? "(在线)" : "(离线)"}
              </option>
            ))}
          </select>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.instructions}</span>
        <textarea
          aria-label={m.instructions}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.customEnv}</span>
        <textarea
          aria-label={m.customEnv}
          value={envRaw}
          onChange={(e) => {
            setEnvRaw(e.target.value);
            setEnvError(false);
          }}
          onBlur={() => validateOnBlur(setEnvError, envRaw)}
          rows={3}
          placeholder='{"OPENAI_API_KEY":"sk-..."}'
          className={
            envError
              ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm font-mono"
              : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
          }
        />
        {envError ? <span className="text-xs text-state-failed">{m.jsonInvalid}</span> : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.customArgs}</span>
        <textarea
          aria-label={m.customArgs}
          value={argsRaw}
          onChange={(e) => {
            setArgsRaw(e.target.value);
            setArgsError(false);
          }}
          onBlur={() => validateOnBlur(setArgsError, argsRaw)}
          rows={2}
          placeholder='["--verbose"]'
          className={
            argsError
              ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm font-mono"
              : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
          }
        />
        {argsError ? <span className="text-xs text-state-failed">{m.jsonInvalid}</span> : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.mcpConfig}</span>
        <textarea
          aria-label={m.mcpConfig}
          value={mcpRaw}
          onChange={(e) => {
            setMcpRaw(e.target.value);
            setMcpError(false);
          }}
          onBlur={() => validateOnBlur(setMcpError, mcpRaw)}
          rows={4}
          placeholder='{"servers":{}}'
          className={
            mcpError
              ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm font-mono"
              : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
          }
        />
        {mcpError ? <span className="text-xs text-state-failed">{m.jsonInvalid}</span> : null}
      </label>

      {formError ? <p className="text-sm text-state-failed">{formError}</p> : null}
      {submitError ? (
        <p className="text-sm text-state-failed">{submitError}</p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || envError || argsError || mcpError || !HANDLE_RE.test(handle)}
          className="px-4 py-2 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
        >
          {isSubmitting ? m.saving : mode === "create" ? m.saveCreate : m.saveUpdate}
        </button>
      </div>
    </form>
  );
}

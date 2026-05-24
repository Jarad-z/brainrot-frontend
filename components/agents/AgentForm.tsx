"use client";

import { useEffect, useMemo, useReducer } from "react";
import type {
  Agent,
  AgentInput,
  CommandSpec,
  Runtime,
  SkillSpec,
  SubagentSpec,
} from "@/lib/api/types";
import { messages } from "@/lib/messages";
import { useSession } from "@/hooks/useSession";
import { AgentFormSection } from "./AgentFormSection";
import { RepeatableSpecList } from "./RepeatableSpecList";

interface AgentFormProps {
  mode: "create" | "edit";
  initial?: Agent;
  runtimes: Runtime[];
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (input: AgentInput) => void;
}

const MODELS = [
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
  "gpt-4o",
] as const;
const DEFAULT_MODEL: string = MODELS[1];
const HANDLE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Form state is one big reducer instead of 12 useState hooks so the new
// sections don't multiply the existing setter sprawl. Raw JSON strings
// stay in state (we only parse on submit) so the user's whitespace and
// formatting choices survive a re-render.
interface FormState {
  handle: string;
  name: string;
  avatarUrl: string;
  description: string;
  model: string;
  instructions: string;
  envRaw: string;
  argsRaw: string;
  mcpRaw: string;
  hooksRaw: string;
  skills: SkillSpec[];
  commands: CommandSpec[];
  subagents: SubagentSpec[];
  envError: boolean;
  argsError: boolean;
  mcpError: boolean;
  hooksError: boolean;
  formError: string | null;
}

type Action =
  | { type: "set"; key: keyof FormState; value: FormState[keyof FormState] }
  | { type: "rawError"; key: "envError" | "argsError" | "mcpError" | "hooksError"; value: boolean }
  | { type: "skills"; value: SkillSpec[] }
  | { type: "commands"; value: CommandSpec[] }
  | { type: "subagents"; value: SubagentSpec[] };

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case "set":
      // formError stays sticky across edits to other fields so the user
      // sees the message until they actually retry submission.
      return { ...state, [action.key]: action.value };
    case "rawError":
      return { ...state, [action.key]: action.value };
    case "skills":
      return { ...state, skills: action.value };
    case "commands":
      return { ...state, commands: action.value };
    case "subagents":
      return { ...state, subagents: action.value };
  }
}

function tryParse(raw: string): { ok: true; value: unknown } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch {
    return { ok: false };
  }
}

function initialState(initial: Agent | undefined): FormState {
  return {
    handle: initial?.handle ?? "",
    name: initial?.name ?? "",
    avatarUrl: initial?.avatar_url ?? "",
    description: initial?.description ?? "",
    model: initial?.model ?? DEFAULT_MODEL,
    instructions: initial?.instructions ?? "",
    envRaw: initial ? JSON.stringify(initial.custom_env, null, 2) : "",
    argsRaw: initial ? JSON.stringify(initial.custom_args, null, 2) : "",
    mcpRaw: initial ? JSON.stringify(initial.mcp_config, null, 2) : "",
    hooksRaw:
      initial && initial.hooks && Object.keys(initial.hooks).length > 0
        ? JSON.stringify(initial.hooks, null, 2)
        : "",
    skills: initial?.skills ?? [],
    commands: initial?.commands ?? [],
    subagents: initial?.subagents ?? [],
    envError: false,
    argsError: false,
    mcpError: false,
    hooksError: false,
    formError: null,
  };
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
  const { data: me } = useSession();
  const [state, dispatch] = useReducer(reducer, initial, initialState);

  // Agents always run on the caller's own machine; pick the runtime owned by
  // the current user and store its id once we know who we are.
  const myRuntime = useMemo(
    () => (me ? runtimes.find((r) => r.user_id === me.id) ?? null : null),
    [runtimes, me],
  );
  const runtimeId = initial?.runtime_id ?? myRuntime?.id ?? "";

  // Surface "no runtime" warning only after we know who the caller is.
  useEffect(() => {
    if (state.formError && me) {
      // session loaded; safe to keep stale formError as-is.
    }
  }, [state.formError, me]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    dispatch({ type: "set", key, value });

  function validateOnBlur(
    key: "envError" | "argsError" | "mcpError" | "hooksError",
    raw: string,
  ) {
    dispatch({ type: "rawError", key, value: !tryParse(raw).ok });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    set("formError", null);

    if (!HANDLE_RE.test(state.handle)) {
      set("formError", m.handleInvalid);
      return;
    }
    if (state.name.trim() === "") {
      set("formError", m.nameRequired);
      return;
    }
    if (!runtimeId) {
      set("formError", m.runtimeRequired);
      return;
    }

    const env = tryParse(state.envRaw);
    const args = tryParse(state.argsRaw);
    const mcp = tryParse(state.mcpRaw);
    const hooks = tryParse(state.hooksRaw);
    if (!env.ok || !args.ok || !mcp.ok || !hooks.ok) {
      dispatch({ type: "rawError", key: "envError", value: !env.ok });
      dispatch({ type: "rawError", key: "argsError", value: !args.ok });
      dispatch({ type: "rawError", key: "mcpError", value: !mcp.ok });
      dispatch({ type: "rawError", key: "hooksError", value: !hooks.ok });
      set("formError", m.jsonInvalid);
      return;
    }

    const input: AgentInput = {
      runtime_id: runtimeId,
      handle: state.handle,
      name: state.name.trim(),
      avatar_url: state.avatarUrl.trim() || undefined,
      description: state.description.trim(),
      model: state.model,
      instructions: state.instructions,
      custom_env: (env.value as Record<string, string> | null) ?? {},
      custom_args: (args.value as string[] | null) ?? [],
      mcp_config: (mcp.value as Record<string, unknown> | null) ?? {},
      skills: state.skills,
      commands: state.commands,
      subagents: state.subagents,
      // hooks: tryParse returns null for empty string → translate to {} so the
      // backend treats it as "no hooks" rather than "absent" on the wire.
      hooks: (hooks.value as Record<string, unknown> | null) ?? {},
    };
    onSubmit(input);
  }

  // Disable submit only on hard-blocking issues: invalid handle or any
  // currently-flagged JSON parse error. Empty fields are fine — they'll be
  // caught on submit and surface a specific error message.
  const submitDisabled =
    isSubmitting ||
    state.envError ||
    state.argsError ||
    state.mcpError ||
    state.hooksError ||
    !HANDLE_RE.test(state.handle);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-2xl">
      {/* §1 基础信息 — always open. */}
      <AgentFormSection title={m.sectionBasic} defaultOpen>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-1">{m.handle}</span>
          <input
            aria-label={m.handle}
            type="text"
            value={state.handle}
            onChange={(e) => set("handle", e.target.value)}
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
            value={state.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={m.namePlaceholder}
            className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-1">{m.avatarUrl}</span>
          <input
            aria-label={m.avatarUrl}
            type="url"
            value={state.avatarUrl}
            onChange={(e) => set("avatarUrl", e.target.value)}
            placeholder={m.avatarUrlPlaceholder}
            className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-1">{m.description}</span>
          <input
            aria-label={m.description}
            type="text"
            value={state.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={m.descriptionPlaceholder}
            className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-1">{m.model}</span>
          <select
            aria-label={m.model}
            value={state.model}
            onChange={(e) => set("model", e.target.value)}
            className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
          >
            {MODELS.map((mm) => (
              <option key={mm} value={mm}>
                {mm}
              </option>
            ))}
          </select>
        </label>

        {mode === "create" && !myRuntime && runtimes.length >= 0 && (
          <p className="text-xs text-state-failed">{m.noRuntimes}</p>
        )}
      </AgentFormSection>

      {/* §2 System Prompt. */}
      <AgentFormSection title={m.sectionSystemPrompt} hint={m.sectionSystemPromptHint}>
        <textarea
          aria-label={m.instructions}
          value={state.instructions}
          onChange={(e) => set("instructions", e.target.value)}
          rows={8}
          className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
        />
      </AgentFormSection>

      {/* §3 Skills. */}
      <AgentFormSection
        title={m.sectionSkills}
        hint={m.sectionSkillsHint}
        badge={state.skills.length > 0 ? state.skills.length : undefined}
      >
        <RepeatableSpecList
          itemLabel={m.itemSkill}
          items={state.skills}
          onChange={(v) => dispatch({ type: "skills", value: v })}
          emptyHint={m.sectionSkillsEmpty}
          contentPlaceholder={m.skillContentPlaceholder}
        />
      </AgentFormSection>

      {/* §4 Commands. */}
      <AgentFormSection
        title={m.sectionCommands}
        hint={m.sectionCommandsHint}
        badge={state.commands.length > 0 ? state.commands.length : undefined}
      >
        <RepeatableSpecList
          itemLabel={m.itemCommand}
          items={state.commands}
          onChange={(v) => dispatch({ type: "commands", value: v })}
          emptyHint={m.sectionCommandsEmpty}
          contentPlaceholder={m.commandContentPlaceholder}
        />
      </AgentFormSection>

      {/* §5 Subagents. */}
      <AgentFormSection
        title={m.sectionSubagents}
        hint={m.sectionSubagentsHint}
        badge={state.subagents.length > 0 ? state.subagents.length : undefined}
      >
        <RepeatableSpecList
          itemLabel={m.itemSubagent}
          items={state.subagents}
          onChange={(v) => dispatch({ type: "subagents", value: v })}
          emptyHint={m.sectionSubagentsEmpty}
          contentPlaceholder={m.subagentContentPlaceholder}
        />
      </AgentFormSection>

      {/* §6 Hooks — red warning required. */}
      <AgentFormSection
        title={m.sectionHooks}
        hint={m.sectionHooksHint}
        warning={
          <p
            role="alert"
            className="text-xs text-state-failed bg-state-failed/10 border-[1.5px] border-state-failed rounded-sm px-2 py-2"
          >
            {m.sectionHooksWarning}
          </p>
        }
      >
        <textarea
          aria-label={m.sectionHooks}
          value={state.hooksRaw}
          onChange={(e) => {
            set("hooksRaw", e.target.value);
            dispatch({ type: "rawError", key: "hooksError", value: false });
          }}
          onBlur={() => validateOnBlur("hooksError", state.hooksRaw)}
          rows={6}
          placeholder='{"PostToolUse":[{"matcher":"Edit","hooks":[{"type":"command","command":"echo edited"}]}]}'
          className={
            state.hooksError
              ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm font-mono"
              : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
          }
        />
        {state.hooksError ? (
          <span className="text-xs text-state-failed">{m.jsonInvalid}</span>
        ) : null}
      </AgentFormSection>

      {/* §7 MCP. */}
      <AgentFormSection title={m.sectionMCP} hint={m.sectionMCPHint}>
        <textarea
          aria-label={m.mcpConfig}
          value={state.mcpRaw}
          onChange={(e) => {
            set("mcpRaw", e.target.value);
            dispatch({ type: "rawError", key: "mcpError", value: false });
          }}
          onBlur={() => validateOnBlur("mcpError", state.mcpRaw)}
          rows={5}
          placeholder='{"mcpServers":{"filesystem":{"command":"npx","args":["-y","@modelcontextprotocol/server-filesystem","/tmp"]}}}'
          className={
            state.mcpError
              ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm font-mono"
              : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
          }
        />
        {state.mcpError ? (
          <span className="text-xs text-state-failed">{m.jsonInvalid}</span>
        ) : null}
      </AgentFormSection>

      {/* §8 高级. */}
      <AgentFormSection title={m.sectionAdvanced} hint={m.sectionAdvancedHint}>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-1">{m.customEnv}</span>
          <textarea
            aria-label={m.customEnv}
            value={state.envRaw}
            onChange={(e) => {
              set("envRaw", e.target.value);
              dispatch({ type: "rawError", key: "envError", value: false });
            }}
            onBlur={() => validateOnBlur("envError", state.envRaw)}
            rows={3}
            placeholder='{"ANTHROPIC_API_KEY":"sk-..."}'
            className={
              state.envError
                ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm font-mono"
                : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
            }
          />
          {state.envError ? (
            <span className="text-xs text-state-failed">{m.jsonInvalid}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-1">{m.customArgs}</span>
          <textarea
            aria-label={m.customArgs}
            value={state.argsRaw}
            onChange={(e) => {
              set("argsRaw", e.target.value);
              dispatch({ type: "rawError", key: "argsError", value: false });
            }}
            onBlur={() => validateOnBlur("argsError", state.argsRaw)}
            rows={2}
            placeholder='["--verbose"]'
            className={
              state.argsError
                ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm font-mono"
                : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
            }
          />
          {state.argsError ? (
            <span className="text-xs text-state-failed">{m.jsonInvalid}</span>
          ) : null}
        </label>
      </AgentFormSection>

      {state.formError ? (
        <p className="text-sm text-state-failed">{state.formError}</p>
      ) : null}
      {submitError ? <p className="text-sm text-state-failed">{submitError}</p> : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitDisabled}
          className="px-4 py-2 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
        >
          {isSubmitting ? m.saving : mode === "create" ? m.saveCreate : m.saveUpdate}
        </button>
      </div>
    </form>
  );
}

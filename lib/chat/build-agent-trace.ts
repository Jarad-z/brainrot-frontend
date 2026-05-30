import type { ClientMessage, RunView } from "@/lib/api/types";
import { pairToolMessages } from "./pair-tool-messages";
import { isSystemNoise } from "./system-noise";

export interface TraceStepData {
  msg: ClientMessage;
  /** Only set for tool_use steps: the paired tool_result, if it arrived. */
  result?: ClientMessage;
}

export interface TraceRunGroup {
  /** task_run_id of this group, or null for the "unassigned" group. */
  runId: string | null;
  /** Run metadata from the runs list, or null if not found / unassigned. */
  run: RunView | null;
  /** Steps in seq ascending order (created_at fallback). */
  steps: TraceStepData[];
}

function orderKey(m: ClientMessage): number {
  if (typeof m.seq === "number") return m.seq;
  const t = Date.parse(m.created_at);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Derive an agent's per-run execution trace for a single task card. Pure: no
 * fetching, no React. Filters messages to the target agent, pairs tool_use ↔
 * tool_result (the result is absorbed into its use step, not listed
 * separately), drops system noise, then groups by task_run_id.
 *
 * Group ordering: by earliest step in the group. The null-run group always
 * sorts last regardless of timing. Within a group steps are seq-ascending.
 */
export function buildAgentTrace(
  messages: ReadonlyArray<ClientMessage>,
  runs: ReadonlyArray<RunView>,
  agentId: string | null,
): TraceRunGroup[] {
  if (!agentId) return [];

  const mine = messages.filter((m) => m.author_agent_id === agentId);
  const { useToResult, consumed } = pairToolMessages(mine);

  const visible = mine.filter((m) => !consumed.has(m.id) && !isSystemNoise(m));

  const runById = new Map(runs.map((r) => [r.id, r] as const));

  // Group key: task_run_id, or a sentinel for null.
  const NULL_KEY = " null";
  const byRun = new Map<string, ClientMessage[]>();
  for (const m of visible) {
    const key = m.task_run_id ?? NULL_KEY;
    const arr = byRun.get(key);
    if (arr) arr.push(m);
    else byRun.set(key, [m]);
  }

  const groups: TraceRunGroup[] = [];
  for (const [key, msgs] of byRun) {
    const sorted = [...msgs].sort((a, b) => orderKey(a) - orderKey(b));
    const steps: TraceStepData[] = sorted.map((m) => {
      if (m.parsed.type === "tool_use") {
        return { msg: m, result: useToResult.get(m.parsed.payload.tool_use_id) };
      }
      return { msg: m };
    });
    const runId = key === NULL_KEY ? null : key;
    groups.push({
      runId,
      run: runId ? (runById.get(runId) ?? null) : null,
      steps,
    });
  }

  groups.sort((a, b) => {
    // null-run group always last.
    if (a.runId === null) return 1;
    if (b.runId === null) return -1;
    return orderKey(a.steps[0]!.msg) - orderKey(b.steps[0]!.msg);
  });

  return groups;
}

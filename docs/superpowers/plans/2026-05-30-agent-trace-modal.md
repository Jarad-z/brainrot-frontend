# Agent Trace Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 点击聊天流里某条 agent 消息的头像，弹出模态弹窗，按 run 分组展示该 agent 在本 card 内全部 run 的完整执行 trace（工具调用/思考/助手文本/结果）。

**Architecture:** 纯前端、零后端改动。复用已有的 `useTaskMessages` 与 `tasks.runs` 两个 TanStack Query 缓存。点头像 → 写 chat-ui store 的 `traceAgentId` → 页面级单例 `AgentTraceModal`（挂在 `ChatPane`）打开。核心派生逻辑放纯函数 `lib/chat/build-agent-trace.ts`（满足 `lib/**` 80% 覆盖门槛），UI 拆成 modal / run section / step 三个组件。

**Tech Stack:** Next.js 15 · React 19 · TypeScript strict · Zustand · TanStack Query v5 · Radix Dialog (`components/brand/dialog.tsx`) · Vitest + Testing Library.

工作目录：所有路径相对 `D:\brainrot-workspace\frontend`。命令在该目录下运行。

---

### Task 1: 抽出共享的 system-noise 判断

当前 `MessageList.tsx` 内联了 `SYSTEM_NOISE_SUBTYPES` 和 `isSystemNoise`。trace 也要用同一规则，抽到 `lib/chat/system-noise.ts` 单一来源，避免两份漂移。

**Files:**
- Create: `lib/chat/system-noise.ts`
- Create: `lib/chat/system-noise.test.ts`
- Modify: `components/chat/MessageList.tsx` (移除内联定义，改 import)

- [ ] **Step 1: 写失败测试**

`lib/chat/system-noise.test.ts`:

```ts
/* eslint-disable camelcase -- snake_case from backend wire format */
import { describe, it, expect } from "vitest";
import { isSystemNoise } from "./system-noise";
import type { ClientMessage } from "@/lib/api/types";

function mk(parsed: ClientMessage["parsed"]): ClientMessage {
  return {
    id: "m1", task_card_id: "t1", role: "system",
    author_user_id: null, author_agent_id: null,
    content: {}, task_run_id: "r1", seq: 1, metadata: {},
    created_at: "2026-05-30T10:00:00Z", parsed, meta: {},
  };
}

describe("isSystemNoise", () => {
  it("flags hook_started / hook_response / init / notification system payloads", () => {
    for (const subtype of ["hook_started", "hook_response", "init", "notification"]) {
      expect(isSystemNoise(mk({ type: "system", payload: JSON.stringify({ subtype }) }))).toBe(false);
    }
  });

  it("non-system message is never noise", () => {
    expect(isSystemNoise(mk({ type: "assistant_text", payload: { text: "hi" } }))).toBe(false);
  });

  it("system message without a noisy subtype is not noise", () => {
    expect(isSystemNoise(mk({ type: "system", payload: "some note" }))).toBe(false);
  });
});
```

注意：`parsed.system.payload` 是 `string`（见 `lib/parse-message.ts`）。`isSystemNoise` 当前实现读 `msg.parsed.payload` 并尝试取 `.subtype` —— 但 `system` 的 payload 是 string，`(payload as Record).subtype` 在 string 上是 `undefined`。**先验证现有行为**：原 `MessageList` 的 `isSystemNoise` 检查的是 `msg.parsed.payload` 作为对象的 `subtype`。由于 `summarizeSyntheticUserEvent` 把 `user`-envelope 压成 string，且 `system` payload 也是 string，实际命中靠的是 raw 尚未 parse 的形态。**保持与原实现逐字一致**（见 Step 3），测试只断言"非 system 不是 noise"和"普通 system string 不是 noise"，第一个用例断言当前实现对 string payload 返回 false（记录真实行为，不臆造）。

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run lib/chat/system-noise.test.ts`
Expected: FAIL —— `Cannot find module './system-noise'`。

- [ ] **Step 3: 实现（逐字搬运原逻辑）**

`lib/chat/system-noise.ts`:

```ts
import type { ClientMessage } from "@/lib/api/types";

// Hook/session metadata from claude CLI that should not be shown in the chat
// stream or in an agent trace.
export const SYSTEM_NOISE_SUBTYPES = new Set([
  "hook_started",
  "hook_response",
  "init",
  "notification",
]);

export function isSystemNoise(msg: ClientMessage): boolean {
  if (msg.parsed.type !== "system") return false;
  const payload = msg.parsed.payload;
  if (payload && typeof payload === "object") {
    const subtype = (payload as Record<string, unknown>).subtype;
    if (typeof subtype === "string" && SYSTEM_NOISE_SUBTYPES.has(subtype)) return true;
  }
  return false;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run lib/chat/system-noise.test.ts`
Expected: PASS (3 tests)。

- [ ] **Step 5: 改 `MessageList.tsx` 用共享实现**

删除 `MessageList.tsx` 顶部的 `SYSTEM_NOISE_SUBTYPES` 常量（行 16-21）和 `isSystemNoise` 函数（行 39-47）。在 import 区加：

```ts
import { isSystemNoise } from "@/lib/chat/system-noise";
```

其余使用处（`visible` 的 filter）不变。

- [ ] **Step 6: 验证 typecheck + 全量测试**

Run: `pnpm typecheck && pnpm vitest run lib/chat/system-noise.test.ts`
Expected: typecheck 0 errors；测试 PASS。

- [ ] **Step 7: Commit**

```bash
git add lib/chat/system-noise.ts lib/chat/system-noise.test.ts components/chat/MessageList.tsx
git commit -m "refactor: extract shared isSystemNoise to lib/chat/system-noise"
```

---

### Task 2: trace 派生纯函数 `buildAgentTrace`

把"过滤 agent → 配对工具 → 去噪 → 按 run 分组排序"全部逻辑放进一个纯函数，便于单测且满足覆盖门槛。

**Files:**
- Create: `lib/chat/build-agent-trace.ts`
- Create: `lib/chat/build-agent-trace.test.ts`

- [ ] **Step 1: 写失败测试**

`lib/chat/build-agent-trace.test.ts`:

```ts
/* eslint-disable camelcase -- snake_case from backend wire format */
import { describe, it, expect } from "vitest";
import { buildAgentTrace } from "./build-agent-trace";
import type { ClientMessage, RunView } from "@/lib/api/types";

function msg(
  over: Partial<ClientMessage> & { parsed: ClientMessage["parsed"] },
): ClientMessage {
  return {
    id: "m", task_card_id: "t1", role: "agent",
    author_user_id: null, author_agent_id: "agentA",
    content: {}, task_run_id: "r1", seq: 1, metadata: {},
    created_at: "2026-05-30T10:00:00Z", meta: {},
    ...over,
  };
}

function run(over: Partial<RunView> & { id: string }): RunView {
  return {
    workspace_id: "w1", task_card_id: "t1", agent_id: "agentA",
    runtime_id: "rt1", trigger_message_id: null, session_id: null,
    status: "done", error: null, created_at: "2026-05-30T10:00:00Z",
    claimed_at: null, started_at: null, finished_at: null,
    ...over,
  };
}

describe("buildAgentTrace", () => {
  it("returns empty groups when agentId is null", () => {
    const r = buildAgentTrace(
      [msg({ id: "m1", parsed: { type: "assistant_text", payload: { text: "hi" } } })],
      [],
      null,
    );
    expect(r).toEqual([]);
  });

  it("filters to the target agent only", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "m1", author_agent_id: "agentA", parsed: { type: "assistant_text", payload: { text: "A" } } }),
        msg({ id: "m2", author_agent_id: "agentB", parsed: { type: "assistant_text", payload: { text: "B" } } }),
      ],
      [run({ id: "r1" })],
      "agentA",
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]!.steps).toHaveLength(1);
    expect(groups[0]!.steps[0]!.msg.id).toBe("m1");
  });

  it("groups by task_run_id and attaches run metadata", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "m1", task_run_id: "r1", seq: 1, parsed: { type: "assistant_text", payload: { text: "first" } } }),
        msg({ id: "m2", task_run_id: "r2", seq: 5, parsed: { type: "assistant_text", payload: { text: "second" } } }),
      ],
      [run({ id: "r1", status: "done" }), run({ id: "r2", status: "running" })],
      "agentA",
    );
    expect(groups).toHaveLength(2);
    expect(groups[0]!.runId).toBe("r1");
    expect(groups[0]!.run?.status).toBe("done");
    expect(groups[1]!.runId).toBe("r2");
    expect(groups[1]!.run?.status).toBe("running");
  });

  it("orders groups by earliest step seq ascending", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "m2", task_run_id: "r2", seq: 10, parsed: { type: "assistant_text", payload: { text: "late" } } }),
        msg({ id: "m1", task_run_id: "r1", seq: 2, parsed: { type: "assistant_text", payload: { text: "early" } } }),
      ],
      [run({ id: "r1" }), run({ id: "r2" })],
      "agentA",
    );
    expect(groups.map((g) => g.runId)).toEqual(["r1", "r2"]);
  });

  it("sorts steps within a run by seq ascending", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "m2", task_run_id: "r1", seq: 3, parsed: { type: "assistant_text", payload: { text: "b" } } }),
        msg({ id: "m1", task_run_id: "r1", seq: 1, parsed: { type: "assistant_text", payload: { text: "a" } } }),
      ],
      [run({ id: "r1" })],
      "agentA",
    );
    expect(groups[0]!.steps.map((s) => s.msg.id)).toEqual(["m1", "m2"]);
  });

  it("pairs tool_use with its tool_result and consumes the result", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "u1", task_run_id: "r1", seq: 1, parsed: { type: "tool_use", payload: { tool_name: "Bash", tool_use_id: "tu1", input: {} } } }),
        msg({ id: "res1", task_run_id: "r1", seq: 2, parsed: { type: "tool_result", payload: { tool_use_id: "tu1", is_error: false, content: "ok" } } }),
      ],
      [run({ id: "r1" })],
      "agentA",
    );
    expect(groups[0]!.steps).toHaveLength(1);
    expect(groups[0]!.steps[0]!.msg.id).toBe("u1");
    expect(groups[0]!.steps[0]!.result?.id).toBe("res1");
  });

  it("puts task_run_id=null messages in a trailing 'unassigned' group", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "m1", task_run_id: "r1", seq: 1, parsed: { type: "assistant_text", payload: { text: "a" } } }),
        msg({ id: "m2", task_run_id: null, seq: 2, parsed: { type: "assistant_text", payload: { text: "loose" } } }),
      ],
      [run({ id: "r1" })],
      "agentA",
    );
    expect(groups).toHaveLength(2);
    expect(groups[groups.length - 1]!.runId).toBeNull();
  });

  it("creates a group with run=null when the run id is not in the runs list", () => {
    const groups = buildAgentTrace(
      [msg({ id: "m1", task_run_id: "rX", seq: 1, parsed: { type: "assistant_text", payload: { text: "a" } } })],
      [],
      "agentA",
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]!.runId).toBe("rX");
    expect(groups[0]!.run).toBeNull();
  });

  it("filters out system-noise messages", () => {
    const groups = buildAgentTrace(
      [
        msg({ id: "m1", task_run_id: "r1", seq: 1, parsed: { type: "assistant_text", payload: { text: "real" } } }),
        msg({ id: "n1", task_run_id: "r1", seq: 2, parsed: { type: "system", payload: { subtype: "init" } as unknown as string } }),
      ],
      [run({ id: "r1" })],
      "agentA",
    );
    expect(groups[0]!.steps).toHaveLength(1);
    expect(groups[0]!.steps[0]!.msg.id).toBe("m1");
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run lib/chat/build-agent-trace.test.ts`
Expected: FAIL —— `Cannot find module './build-agent-trace'`。

- [ ] **Step 3: 实现纯函数**

`lib/chat/build-agent-trace.ts`:

```ts
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
  const NULL_KEY = " null";
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run lib/chat/build-agent-trace.test.ts`
Expected: PASS (10 tests)。

- [ ] **Step 5: Commit**

```bash
git add lib/chat/build-agent-trace.ts lib/chat/build-agent-trace.test.ts
git commit -m "feat: buildAgentTrace pure derivation for per-run agent trace"
```

---

### Task 3: 共享的 `fetchTaskRuns` + `useTaskRuns` hook

`useActiveRuns` 内联了 `apiFetch<RunView[]>(.../runs)`。把 fetch 抽到 `lib/api/task.ts`，让 trace 和 active-runs 共用同一 queryFn（同一 query key → 同一缓存）。

**Files:**
- Modify: `lib/api/task.ts` (加 `fetchTaskRuns`)
- Modify: `hooks/useActiveRuns.ts` (改用 `fetchTaskRuns`)
- Create: `hooks/useTaskRuns.ts`

- [ ] **Step 1: 加 `fetchTaskRuns` 到 `lib/api/task.ts`**

在文件末尾追加：

```ts
import type { RunView } from "./types";

export function fetchTaskRuns(taskId: string): Promise<RunView[]> {
  return apiFetch<RunView[]>(`/api/v1/tasks/${taskId}/runs`);
}
```

注意：`apiFetch` 已在文件顶部 import；`RunView` 需要加到 import（与现有 `import type { TaskCard } from "./types";` 合并或单列）。改为：

```ts
import type { RunView, TaskCard } from "./types";
```

并删掉末尾重复的 `import type { RunView }`（import 必须在顶部）。最终顶部 import 区：

```ts
import { apiFetch, ApiError } from "./client";
import type { RunView, TaskCard } from "./types";
```

末尾只保留函数：

```ts
export function fetchTaskRuns(taskId: string): Promise<RunView[]> {
  return apiFetch<RunView[]>(`/api/v1/tasks/${taskId}/runs`);
}
```

- [ ] **Step 2: 改 `useActiveRuns.ts` 用 `fetchTaskRuns`**

把 `queryFn: () => apiFetch<RunView[]>(`/api/v1/tasks/${taskId}/runs`)` 改为 `queryFn: () => fetchTaskRuns(taskId)`，并把 import 从 `apiFetch` 改为 `fetchTaskRuns`：

替换 `import { apiFetch } from "@/lib/api/client";` → `import { fetchTaskRuns } from "@/lib/api/task";`
（`RunView` import 保留，仍用于 `ActiveRun` 类型/泛型；若 lint 报未使用则删除）。

- [ ] **Step 3: 创建 `hooks/useTaskRuns.ts`**

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchTaskRuns } from "@/lib/api/task";
import { queryKeys } from "@/lib/api/keys";

/** Read-only access to a task's runs cache (same key as useActiveRuns, so they
 *  share fetches and the 5s poll started by useActiveRuns). */
export function useTaskRuns(taskId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.runs(taskId),
    queryFn: () => fetchTaskRuns(taskId),
    enabled: enabled && !!taskId,
  });
}
```

- [ ] **Step 4: 验证 typecheck + lint + 相关测试**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 errors。
Run: `pnpm vitest run`
Expected: 既有测试全 PASS（无回归）。

- [ ] **Step 5: Commit**

```bash
git add lib/api/task.ts hooks/useActiveRuns.ts hooks/useTaskRuns.ts
git commit -m "refactor: share fetchTaskRuns; add useTaskRuns read hook"
```

---

### Task 4: `useAgentTrace` hook（组合 query + 纯函数）

**Files:**
- Create: `hooks/useAgentTrace.ts`

- [ ] **Step 1: 实现**

```ts
"use client";
import { useMemo } from "react";
import { useTaskMessages } from "./useTaskMessages";
import { useTaskRuns } from "./useTaskRuns";
import { buildAgentTrace, type TraceRunGroup } from "@/lib/chat/build-agent-trace";

export interface AgentTraceResult {
  groups: TraceRunGroup[];
  isPending: boolean;
}

/** Derives an agent's per-run trace for a task from already-cached messages and
 *  runs. No new requests; disabled (returns empty) when agentId is null. */
export function useAgentTrace(taskId: string, agentId: string | null): AgentTraceResult {
  const { data: messages = [], isPending: msgsPending } = useTaskMessages(taskId);
  const { data: runs = [], isPending: runsPending } = useTaskRuns(taskId, agentId !== null);

  const groups = useMemo(
    () => buildAgentTrace(messages, runs, agentId),
    [messages, runs, agentId],
  );

  return { groups, isPending: agentId !== null && (msgsPending || runsPending) };
}
```

- [ ] **Step 2: typecheck**

Run: `pnpm typecheck`
Expected: 0 errors。

- [ ] **Step 3: Commit**

```bash
git add hooks/useAgentTrace.ts
git commit -m "feat: useAgentTrace hook composing messages + runs"
```

---

### Task 5: chat-ui store 加 `traceAgentId` + actions

**Files:**
- Modify: `lib/store/chat-ui.ts`
- Modify: `lib/store/chat-ui.test.ts`

- [ ] **Step 1: 写失败测试**

在 `lib/store/chat-ui.test.ts` 的 `describe("ChatUIStore", ...)` 内追加：

```ts
  it("openTrace sets traceAgentId, closeTrace clears it", () => {
    useChatUIStore.getState().openTrace("t1", "agentA");
    expect(useChatUIStore.getState().byTask["t1"]!.traceAgentId).toBe("agentA");
    useChatUIStore.getState().closeTrace("t1");
    expect(useChatUIStore.getState().byTask["t1"]!.traceAgentId).toBeNull();
  });

  it("traceAgentId defaults to null on a fresh task", () => {
    useChatUIStore.getState().setActiveTab("t9", "artifacts");
    expect(useChatUIStore.getState().byTask["t9"]!.traceAgentId).toBeNull();
  });
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run lib/store/chat-ui.test.ts`
Expected: FAIL —— `openTrace is not a function` / `traceAgentId` undefined。

- [ ] **Step 3: 实现**

在 `lib/store/chat-ui.ts`:

`TaskUIState` 加字段：

```ts
export interface TaskUIState {
  expandedToolBodies: Set<string>;
  expandedThinkings: Set<string>;
  scrollAnchor: "bottom" | "manual";
  activeTab: "artifacts" | "assets" | "approvals";
  decisions: Record<string, DecisionRecord>;
  traceAgentId: string | null;
}
```

`ChatUIStore` 接口加：

```ts
  openTrace: (taskId: string, agentId: string) => void;
  closeTrace: (taskId: string) => void;
```

`DEFAULT_TASK` 加 `traceAgentId: null`:

```ts
const DEFAULT_TASK = (): TaskUIState => ({
  expandedToolBodies: new Set(),
  expandedThinkings: new Set(),
  scrollAnchor: "bottom",
  activeTab: "artifacts",
  decisions: {},
  traceAgentId: null,
});
```

在 store 实现里（`clearTask` 之前）加两个 action：

```ts
  openTrace: (taskId, agentId) =>
    set((state) => {
      const byTask = ensureTask(state.byTask, taskId);
      return {
        byTask: { ...byTask, [taskId]: { ...byTask[taskId]!, traceAgentId: agentId } },
      };
    }),

  closeTrace: (taskId) =>
    set((state) => {
      const byTask = ensureTask(state.byTask, taskId);
      return {
        byTask: { ...byTask, [taskId]: { ...byTask[taskId]!, traceAgentId: null } },
      };
    }),
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run lib/store/chat-ui.test.ts`
Expected: PASS（含新增 2 个）。

- [ ] **Step 5: Commit**

```bash
git add lib/store/chat-ui.ts lib/store/chat-ui.test.ts
git commit -m "feat: chat-ui store traceAgentId open/closeTrace actions"
```

---

### Task 6: `TraceStep` 组件（单条 trace 行）

**Files:**
- Create: `components/chat/parts/TraceStep.tsx`
- Create: `components/chat/parts/TraceStep.test.tsx`

- [ ] **Step 1: 写失败测试**

`components/chat/parts/TraceStep.test.tsx`:

```ts
/* eslint-disable camelcase -- snake_case from backend wire format */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TraceStep } from "./TraceStep";
import type { ClientMessage } from "@/lib/api/types";
import type { TraceStepData } from "@/lib/chat/build-agent-trace";

function step(parsed: ClientMessage["parsed"], result?: ClientMessage): TraceStepData {
  const msg: ClientMessage = {
    id: "m1", task_card_id: "t1", role: "agent",
    author_user_id: null, author_agent_id: "a1",
    content: {}, task_run_id: "r1", seq: 1, metadata: {},
    created_at: "2026-05-30T10:00:00Z", parsed, meta: {},
  };
  return { msg, result };
}

describe("TraceStep", () => {
  it("renders a tool_use step with the tool name", () => {
    const { getByText } = render(
      <TraceStep step={step({ type: "tool_use", payload: { tool_name: "WebSearch", tool_use_id: "tu1", input: { query: "x" } } })} />,
    );
    expect(getByText("WebSearch")).toBeInTheDocument();
  });

  it("renders assistant_text content", () => {
    const { getByText } = render(
      <TraceStep step={step({ type: "assistant_text", payload: { text: "hello world" } })} />,
    );
    expect(getByText(/hello world/)).toBeInTheDocument();
  });

  it("renders a thinking step label", () => {
    const { getByText } = render(
      <TraceStep step={step({ type: "thinking", payload: { text: "pondering" } })} />,
    );
    expect(getByText(/思考/)).toBeInTheDocument();
  });

  it("renders nothing for empty thinking", () => {
    const { container } = render(
      <TraceStep step={step({ type: "thinking", payload: { text: "" } })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a result step", () => {
    const { getByText } = render(
      <TraceStep step={step({ type: "result", payload: { duration_ms: 1200, result: "done summary" } })} />,
    );
    expect(getByText(/done summary/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run components/chat/parts/TraceStep.test.tsx`
Expected: FAIL —— 模块不存在。

- [ ] **Step 3: 实现**

`components/chat/parts/TraceStep.tsx`:

```tsx
/* eslint-disable camelcase -- snake_case identifiers come from backend wire format */
"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import type { TraceStepData } from "@/lib/chat/build-agent-trace";

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
    const resultContent: string | null = (() => {
      if (result?.parsed.type !== "tool_result") return null;
      const c = result.parsed.payload.content;
      if (c == null) return "";
      return typeof c === "string" ? c : JSON.stringify(c);
    })();

    return (
      <div className="text-[12px]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run components/chat/parts/TraceStep.test.tsx`
Expected: PASS (5 tests)。

- [ ] **Step 5: Commit**

```bash
git add components/chat/parts/TraceStep.tsx components/chat/parts/TraceStep.test.tsx
git commit -m "feat: TraceStep renders one trace line per message type"
```

---

### Task 7: `TraceRunSection` 组件（单 run 折叠区）

**Files:**
- Create: `components/chat/parts/TraceRunSection.tsx`
- Create: `components/chat/parts/TraceRunSection.test.tsx`

- [ ] **Step 1: 写失败测试**

`components/chat/parts/TraceRunSection.test.tsx`:

```ts
/* eslint-disable camelcase -- snake_case from backend wire format */
import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { TraceRunSection } from "./TraceRunSection";
import type { TraceRunGroup } from "@/lib/chat/build-agent-trace";
import type { ClientMessage } from "@/lib/api/types";

function textStep(id: string, text: string) {
  const msg: ClientMessage = {
    id, task_card_id: "t1", role: "agent",
    author_user_id: null, author_agent_id: "a1",
    content: {}, task_run_id: "r1", seq: 1, metadata: {},
    created_at: "2026-05-30T10:00:00Z",
    parsed: { type: "assistant_text", payload: { text } }, meta: {},
  };
  return { msg };
}

const group: TraceRunGroup = {
  runId: "r1",
  run: {
    id: "r1", workspace_id: "w1", task_card_id: "t1", agent_id: "a1",
    runtime_id: "rt1", trigger_message_id: null, session_id: null,
    status: "done", error: null, created_at: "2026-05-30T10:00:00Z",
    claimed_at: null, started_at: "2026-05-30T10:00:00Z", finished_at: "2026-05-30T10:01:00Z",
  },
  steps: [textStep("m1", "step one")],
};

describe("TraceRunSection", () => {
  it("shows the run number and step count, expanded by default shows steps", () => {
    const { getByText } = render(<TraceRunSection group={group} index={0} defaultOpen />);
    expect(getByText(/运行 #1/)).toBeInTheDocument();
    expect(getByText(/step one/)).toBeInTheDocument();
  });

  it("collapses and expands on header click", () => {
    const { getByText, queryByText, getByRole } = render(
      <TraceRunSection group={group} index={0} defaultOpen={false} />,
    );
    expect(queryByText(/step one/)).toBeNull();
    fireEvent.click(getByRole("button"));
    expect(getByText(/step one/)).toBeInTheDocument();
  });

  it("renders '运行 (未知)' when run metadata is missing", () => {
    const { getByText } = render(
      <TraceRunSection group={{ ...group, runId: "rX", run: null }} index={1} defaultOpen />,
    );
    expect(getByText(/运行 \(未知\)/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run components/chat/parts/TraceRunSection.test.tsx`
Expected: FAIL —— 模块不存在。

- [ ] **Step 3: 实现**

`components/chat/parts/TraceRunSection.tsx`:

```tsx
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run components/chat/parts/TraceRunSection.test.tsx`
Expected: PASS (3 tests)。

- [ ] **Step 5: Commit**

```bash
git add components/chat/parts/TraceRunSection.tsx components/chat/parts/TraceRunSection.test.tsx
git commit -m "feat: TraceRunSection collapsible per-run trace block"
```

---

### Task 8: `AgentTraceModal` 组件（页面级单例）

**Files:**
- Create: `components/chat/AgentTraceModal.tsx`
- Create: `components/chat/AgentTraceModal.test.tsx`

- [ ] **Step 1: 写失败测试**

`components/chat/AgentTraceModal.test.tsx`:

```ts
/* eslint-disable camelcase -- snake_case from backend wire format */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AgentTraceModal } from "./AgentTraceModal";
import { useChatUIStore } from "@/lib/store/chat-ui";

// Trace + agents hooks are network-backed; stub them to isolate the modal shell.
vi.mock("@/hooks/useAgentTrace", () => ({
  useAgentTrace: () => ({ groups: [], isPending: false }),
}));
vi.mock("@/hooks/useWorkspaceAgents", () => ({
  useWorkspaceAgents: () => ({ data: [{ id: "agentA", name: "Writer", handle: "writer" }] }),
}));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  useChatUIStore.setState({ byTask: {} });
});

describe("AgentTraceModal", () => {
  it("is closed (renders no dialog) when traceAgentId is null", () => {
    const { queryByRole } = wrap(<AgentTraceModal taskId="t1" wsId="w1" />);
    expect(queryByRole("dialog")).toBeNull();
  });

  it("opens and shows the agent name + empty state when traceAgentId is set", () => {
    useChatUIStore.getState().openTrace("t1", "agentA");
    const { getByRole, getByText } = wrap(<AgentTraceModal taskId="t1" wsId="w1" />);
    expect(getByRole("dialog")).toBeInTheDocument();
    expect(getByText(/Writer/)).toBeInTheDocument();
    expect(getByText(/还没有/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run components/chat/AgentTraceModal.test.tsx`
Expected: FAIL —— 模块不存在。

- [ ] **Step 3: 实现**

`components/chat/AgentTraceModal.tsx`:

```tsx
"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/brand/dialog";
import { agentColor } from "@/components/brand/avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { useChatUIStore } from "@/lib/store/chat-ui";
import { useAgentTrace } from "@/hooks/useAgentTrace";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { TraceRunSection } from "./parts/TraceRunSection";

interface AgentTraceModalProps {
  taskId: string;
  wsId: string;
}

export function AgentTraceModal({ taskId, wsId }: AgentTraceModalProps) {
  const traceAgentId = useChatUIStore((s) => s.byTask[taskId]?.traceAgentId ?? null);
  const closeTrace = useChatUIStore((s) => s.closeTrace);
  const { data: agents = [] } = useWorkspaceAgents(wsId);
  const { groups, isPending } = useAgentTrace(taskId, traceAgentId);

  const agent = agents.find((a) => a.id === traceAgentId);
  const name = agent?.name ?? "Agent";
  const handle = agent?.handle ?? "agent";
  const color = agentColor(handle);
  const open = traceAgentId !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closeTrace(taskId); }}>
      <DialogContent className="max-w-2xl w-full max-h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-hairline">
          <span
            className="grid place-items-center text-white font-semibold shrink-0"
            style={{
              width: 34, height: 34, borderRadius: 11, fontSize: 14,
              background: `linear-gradient(180deg, color-mix(in srgb, ${color} 60%, white) 0%, ${color} 100%)`,
              border: "1px solid rgba(255,255,255,0.55)",
            }}
            aria-hidden
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-[15px] font-bold text-ink-0 page-title m-0">
              「{name}」的执行轨迹
            </DialogTitle>
            <div className="text-[12px] text-ink-3">
              @{handle} · 本任务共 {groups.length} 个运行
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {isPending && groups.length === 0 ? (
            <div className="text-[12px] text-ink-3 py-8 text-center">加载中…</div>
          ) : groups.length === 0 ? (
            <EmptyState
              title="还没有执行记录"
              description="这个 agent 还没有在本任务里执行过。"
            />
          ) : (
            groups.map((g, i) => (
              <TraceRunSection
                key={g.runId ?? `null-${i}`}
                group={g}
                index={i}
                defaultOpen={i === 0}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run components/chat/AgentTraceModal.test.tsx`
Expected: PASS (2 tests)。

- [ ] **Step 5: Commit**

```bash
git add components/chat/AgentTraceModal.tsx components/chat/AgentTraceModal.test.tsx
git commit -m "feat: AgentTraceModal page-level singleton trace dialog"
```

---

### Task 9: 头像可点击 — `AssistantMessage` + `MessageItem` 接线

**Files:**
- Modify: `components/chat/MessageItem.tsx`
- Modify: `components/chat/parts/AssistantMessage.tsx`
- Modify: `components/chat/parts/AssistantMessage.test.tsx`

- [ ] **Step 1: 改 `MessageItem.tsx` 透传 agentId**

把 `assistant_text`/`thinking` 分支改为传 `agentId={msg.author_agent_id}`：

```tsx
    case "assistant_text":
    case "thinking": {
      const a = msg.author_agent_id ? authors.agents[msg.author_agent_id] : undefined;
      const agent = a ?? { name: "agent", handle: "agent" };
      inner = (
        <AssistantMessage
          msg={msg}
          taskId={taskId}
          agent={agent}
          agentId={msg.author_agent_id}
          isFirstInGroup={isFirstInGroup}
        />
      );
      break;
    }
```

- [ ] **Step 2: 改 `AssistantMessage.tsx` 头像为可点击 button**

- props 接口加 `agentId?: string | null;`：

```tsx
interface AssistantMessageProps {
  msg: ClientMessage;
  taskId: string;
  agent: { name: string; handle: string };
  agentId?: string | null;
  isFirstInGroup?: boolean;
}
```

- 解构加 `agentId`，并从 store 取 `openTrace`（文件已 import `useChatUIStore`）：

```tsx
export function AssistantMessage({
  msg,
  taskId,
  agent,
  agentId,
  isFirstInGroup = true,
}: AssistantMessageProps) {
  const expanded = useChatUIStore(
    (s) => s.byTask[taskId]?.expandedThinkings.has(msg.id) ?? false,
  );
  const toggle = useChatUIStore((s) => s.toggleThinking);
  const openTrace = useChatUIStore((s) => s.openTrace);
```

- 把头像 `<span data-chat="avatar" ... aria-hidden>` 换成 `<button>`，去掉 `aria-hidden`，加交互。原 `<span>` 块（行 51-67）替换为：

```tsx
          <button
            type="button"
            data-chat="avatar"
            onClick={() => { if (agentId) openTrace(taskId, agentId); }}
            disabled={!agentId}
            aria-label={`查看 ${agent.name} 的执行轨迹`}
            title={`查看 ${agent.name} 的执行轨迹`}
            className="grid place-items-center text-white font-semibold transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default cursor-pointer"
            style={{
              width: avatarSize,
              height: avatarSize,
              background: `linear-gradient(180deg, color-mix(in srgb, ${color} 60%, white) 0%, ${color} 100%)`,
              borderRadius: 10,
              fontSize: 12,
              border: "1px solid rgba(255,255,255,0.55)",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.15), 0 1px 2px ${color}55, 0 4px 10px ${color}33`,
              textShadow: "0 -1px 0 rgba(0,0,0,0.2)",
            }}
          >
            {agent.name.slice(0, 1).toUpperCase()}
          </button>
```

- [ ] **Step 3: 更新现有 `AssistantMessage.test.tsx`（避免回归 + 测交互）**

现有三个测试不传 `agentId`（默认 undefined → 头像 disabled，不影响断言）。新增一个交互测试，在 `describe` 内追加：

```ts
  it("clicking the avatar opens the trace for that agent", async () => {
    const { useChatUIStore } = await import("@/lib/store/chat-ui");
    useChatUIStore.setState({ byTask: {} });
    const { getByLabelText } = render(
      <AssistantMessage msg={textMsg} taskId="t1" agent={baseAuthor} agentId="a1" />,
    );
    fireEvent.click(getByLabelText(/执行轨迹/));
    expect(useChatUIStore.getState().byTask["t1"]!.traceAgentId).toBe("a1");
  });
```

（`fireEvent` 已在文件顶部 import。）

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run components/chat/parts/AssistantMessage.test.tsx`
Expected: PASS（原 3 + 新 1 = 4 tests）。

- [ ] **Step 5: typecheck**

Run: `pnpm typecheck`
Expected: 0 errors。

- [ ] **Step 6: Commit**

```bash
git add components/chat/MessageItem.tsx components/chat/parts/AssistantMessage.tsx components/chat/parts/AssistantMessage.test.tsx
git commit -m "feat: clickable agent avatar opens trace modal"
```

---

### Task 10: 在 `ChatPane` 挂载 modal

**Files:**
- Modify: `components/task-detail/ChatPane.tsx`

- [ ] **Step 1: 挂载 `AgentTraceModal`**

import：

```tsx
import { AgentTraceModal } from "@/components/chat/AgentTraceModal";
```

在 `<section>` 内最后一个子元素后（`Composer` 的 `<div>` 之后、`</section>` 之前）加：

```tsx
      <AgentTraceModal taskId={taskId} wsId={wsId} />
```

（Radix Dialog 用 Portal 渲染到 body，放哪都行；放这里是因为 ChatPane 持有 `taskId`+`wsId` 且只渲染一次。）

- [ ] **Step 2: typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 errors。

- [ ] **Step 3: Commit**

```bash
git add components/task-detail/ChatPane.tsx
git commit -m "feat: mount AgentTraceModal singleton in ChatPane"
```

---

### Task 11: 全量验证 + 覆盖率

**Files:** 无（验证关）

- [ ] **Step 1: 全量 pre-commit gate**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: typecheck/lint 0 errors；所有测试 PASS。

- [ ] **Step 2: 覆盖率检查（lib/** 门槛 80%）**

Run: `pnpm test:coverage`
Expected: `lib/chat/build-agent-trace.ts` 与 `lib/chat/system-noise.ts` 行/分支/函数/语句 ≥ 80%（已由 Task 1/2 的测试覆盖）。若某行未覆盖，补一条针对性断言。

- [ ] **Step 3: 手动冒烟（可选，需起全栈）**

按 `CLAUDE.md` 启动全栈（4 进程 + Electron 或浏览器开 `:3001`），进一个有 agent 跑过的 task card，点 agent 头像 → modal 弹出 → 按 run 分组显示 trace → 点工具行展开看 input/result → Esc/点遮罩关闭。

- [ ] **Step 4: 无新增 commit（验证关）**

若 Step 2 补了断言，单独 commit：

```bash
git add lib/chat
git commit -m "test: tighten trace coverage to threshold"
```

---

## Self-Review 结论

**Spec 覆盖：**
- §2 数据来源 → Task 3/4（fetchTaskRuns + useAgentTrace 复用缓存）✅
- §2 边界（run 查不到 / null run / 空 agent）→ Task 2 测试 + Task 7/8 渲染 ✅
- §3.1 store → Task 5；MessageItem/AssistantMessage → Task 9 ✅
- §3.2 useAgentTrace → Task 4；AgentTraceModal → Task 8；TraceRunSection → Task 7；TraceStep → Task 6；system-noise 抽出 → Task 1 ✅
- §3.2 build-agent-trace.ts 纯函数 → Task 2 ✅
- §5 mount 点 ChatPane → Task 10 ✅
- §6 测试（覆盖门槛）→ Task 1/2 纯函数测 + 组件测 + Task 11 覆盖率 ✅

**类型一致性：** `TraceStepData`/`TraceRunGroup`（Task 2 定义）在 Task 4/6/7/8 一致引用；`buildAgentTrace` 签名 `(messages, runs, agentId)` 一致；`openTrace`/`closeTrace`/`traceAgentId`（Task 5）在 Task 8/9 一致；`fetchTaskRuns`（Task 3）在 Task 3/4 一致。✅

**无 placeholder：** 每个代码步骤均含完整代码与确切命令/预期输出。✅

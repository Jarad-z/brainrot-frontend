# S3 Approvals — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approvals hub (`/w/[wsId]/approvals`) + dynamic bell badge + task-header cancel-run button + task-detail approvals-history double path + TaskRow agent avatars, all per `docs/superpowers/specs/2026-05-17-s3-approvals-design.md`.

**Architecture:** Three subsystems with strict layering — (A) approval data layer composed of pure derive function + 3 React Query hooks reading the existing `tasks.messages` cache; (B) hub route + container + card + filter input; (C) scattered UI in the existing topbar / TaskHeader / TaskRow. No new WebSocket handler (the existing `message.appended` handler already feeds the cache that the derive functions read); no new zustand state (decisions reuse `chat-ui.recordDecision`).

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, TanStack React Query, zustand, Radix Dialog (existing brand primitive), Tailwind, Vitest + React Testing Library + msw.

**Branch:** `s3-approvals`, based on `main` (S2 already merged, commit `87d175c`). Create with `git checkout -b s3-approvals` before starting T1.

**Conventions:**
- All commit messages follow Conventional Commits, no emoji, no AI attribution (matches S2 history).
- `apiFetch` already throws `ApiError(status, body)` and returns `undefined` for 204 — assume that contract.
- `useTaskMessages(taskId)` returns `useQuery<ClientMessage[]>`; data may be `undefined` (assume `data ?? []`).
- Decisions read via `getDecision(state, approvalId)` (already exported from `lib/store/chat-ui.ts`); record via `chat-ui.recordDecision(approvalId, { decision, note?, at })`.
- `WSClient.subscribe(scope, id)` and `unsubscribe(scope, id)` take **positional args** (not object). They are idempotent.
- Brand `Dialog` (Radix-wrapped) lives at `components/brand/dialog.tsx` and exports `Dialog`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`. Compose, do not create a new primitive.
- New files use 2-space indent, double quotes, named exports. Match style of `hooks/useTaskMessages.ts`.

**Pre-flight check (run once before T1):**
```bash
git checkout main && git pull && git checkout -b s3-approvals
npm install
npm run lint && npm run typecheck && npm test -- --run
```
Expected: clean working tree on `s3-approvals`, all checks pass against S2 baseline.

---

## File Map

**New files (12):**
- `lib/approvals/types.ts` — `ApprovalLite`, `ApprovalRecord` shapes
- `lib/approvals/derive.ts` — `deriveApprovalsFromMessages`, `normalizeApprovalRequest`
- `lib/approvals/derive.test.ts` — unit tests for derive
- `hooks/useWorkspacePendingApprovals.ts` — cross-task derived list
- `hooks/useWorkspacePendingApprovals.test.tsx` — hook test
- `hooks/usePendingApprovalsCount.ts` — `.length` selector
- `hooks/useTaskApprovalsHistory.ts` — double-path: try fetch, fallback derive
- `hooks/useTaskApprovalsHistory.test.tsx` — hook test
- `hooks/useCancelRun.ts` — mutation
- `app/(app)/w/[wsId]/approvals/page.tsx` — route entry
- `components/approvals/ApprovalsHubPage.tsx` — hub container
- `components/approvals/ApprovalHubCard.tsx` — hub-mode approval card
- `components/approvals/ApprovalHubCard.test.tsx`
- `components/approvals/ToolFilterInput.tsx` — debounced filter input
- `components/task-detail/CancelRunButton.tsx`
- `components/task-detail/CancelRunButton.test.tsx`
- `components/layout/NotificationBell.tsx`
- `components/layout/NotificationBell.test.tsx`
- `components/brand/confirm-dialog.tsx` — composed `<ConfirmDialog>` (Radix Dialog wrapper)
- `docs/S3-T-MANUAL.md` — manual QA checklist (created in T12)
- `docs/superpowers/reports/2026-05-17-s3-acceptance-report.md` (created in T13)

**Modified files (7):**
- `lib/api/types.ts` — add `busy` and `agents` to `TaskCard`
- `lib/api/keys.ts` — add `queryKeys.approvals.task(taskId)`
- `lib/api/approvals.ts` — add `fetchTaskApprovals(taskId)` with 404 sentinel
- `components/nav/ThreeColumnShell.tsx` — replace static `<IconButton badge={3} disabled>` with `<NotificationBell wsId={...} />`; also unwrap from the `Tooltip "S3 上线后启用"`
- `components/task-detail/TaskHeader.tsx` — insert `<CancelRunButton taskId={taskId} busy={!!task?.busy} />` before the existing tooltip-disabled `⋯` button
- `components/task-detail/TaskRow.tsx` — append 5-line agent avatars block
- `docs/BACKEND_GAPS.md` — add #14 (`GET /me/pending-approvals?count_only=1`); mark #6, #13 as resolved

**Replaced (move + rewrite):**
- `hooks/useApprovalsHistory.ts` — S2 derived-only hook; replaced by `useTaskApprovalsHistory.ts` (T5). After T5 lands, T5's last step removes the old file and updates the one importer (`components/task-detail/RightTabs.tsx` — verify the importer with `grep` in T5 Step 7).

---

## Task 1: TaskCard schema update + approvals queryKey

**Files:**
- Modify: `lib/api/types.ts:32-43`
- Modify: `lib/api/keys.ts:12-15`

- [ ] **Step 1: Add `busy` and `agents` to `TaskCard` interface**

Edit `lib/api/types.ts`, replace the existing `TaskCard` interface (lines 32–43) with:

```ts
export interface TaskCard {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  status: TaskStatus;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  done_at: string | null;
  // BACKEND_GAPS #6 (resolved 2026-05-17): true when an active run exists for this task
  busy?: boolean;
  // BACKEND_GAPS #13 (resolved 2026-05-17): agent uuids associated with this task
  agents?: string[];
}
```

Both fields are optional (`?`) for forwards-compatibility — if older responses omit them, downstream code uses `Boolean(task.busy)` and `task.agents ?? []` guards.

- [ ] **Step 2: Add approvals queryKey**

Edit `lib/api/keys.ts`. Replace the `tasks` block with:

```ts
  tasks: {
    detail: (taskId: string) => ["tasks", taskId] as const,
    messages: (taskId: string) => ["tasks", taskId, "messages"] as const,
  },
  approvals: {
    task: (taskId: string) => ["approvals", "task", taskId] as const,
  },
```

Place `approvals` between `tasks` and the closing `} as const;`.

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS. (No consumers reference the new fields yet.)

- [ ] **Step 4: Commit**

```bash
git add lib/api/types.ts lib/api/keys.ts
git commit -m "feat(s3): add busy/agents to TaskCard, approvals queryKey"
```

---

## Task 2: Approval types + derive function (with tests)

**Files:**
- Create: `lib/approvals/types.ts`
- Create: `lib/approvals/derive.ts`
- Create: `lib/approvals/derive.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/approvals/derive.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  deriveApprovalsFromMessages,
  normalizeApprovalRequest,
} from "./derive";
import type { ClientMessage, ApprovalRequest } from "@/lib/api/types";
import type { DecisionRecord } from "@/lib/store/chat-ui";

function permMsg(opts: {
  id?: string;
  approvalId?: string;
  toolUseId?: string;
  toolName?: string;
  expiresAt?: string;
  toolInput?: unknown;
  createdAt?: string;
}): ClientMessage {
  return {
    id: opts.id ?? "m1",
    task_card_id: "t1",
    role: "agent",
    author_user_id: null,
    author_agent_id: "a1",
    content: "",
    task_run_id: "r1",
    seq: 1,
    metadata: "",
    created_at: opts.createdAt ?? "2026-05-17T10:00:00Z",
    meta: {},
    parsed: {
      type: "permission_request",
      payload: {
        approval_id: opts.approvalId,
        tool_use_id: opts.toolUseId,
        tool_name: opts.toolName ?? "Bash",
        tool_input: opts.toolInput ?? { command: "ls" },
        expires_at: opts.expiresAt,
      },
    } as ClientMessage["parsed"],
  };
}

function userMsg(id = "u1"): ClientMessage {
  return {
    id,
    task_card_id: "t1",
    role: "user",
    author_user_id: "u",
    author_agent_id: null,
    content: "",
    task_run_id: null,
    seq: null,
    metadata: "",
    created_at: "2026-05-17T09:00:00Z",
    meta: {},
    parsed: { type: "user", payload: { text: "hi", mentions: [] } } as ClientMessage["parsed"],
  };
}

const CTX = {
  projectId: "p1",
  projectName: "Launch Plan",
  taskId: "t1",
  taskTitle: "Write press release",
} as const;

describe("deriveApprovalsFromMessages", () => {
  it("returns empty for empty input", () => {
    expect(deriveApprovalsFromMessages([], new Map(), CTX)).toEqual([]);
  });

  it("returns one pending ApprovalLite for one permission_request", () => {
    const out = deriveApprovalsFromMessages(
      [permMsg({ approvalId: "ap1", expiresAt: "2026-05-17T11:00:00Z" })],
      new Map(),
      CTX,
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: "ap1",
      taskId: "t1",
      taskTitle: "Write press release",
      projectId: "p1",
      projectName: "Launch Plan",
      toolName: "Bash",
      status: "pending",
      expiresAt: "2026-05-17T11:00:00Z",
    });
  });

  it("excludes approvals already decided (via decisions map)", () => {
    const decisions = new Map<string, DecisionRecord>([
      ["ap1", { decision: "approved", at: Date.now() }],
    ]);
    const out = deriveApprovalsFromMessages(
      [permMsg({ approvalId: "ap1" })],
      decisions,
      CTX,
    );
    expect(out).toEqual([]);
  });

  it("falls back to tool_use_id when approval_id is absent", () => {
    const out = deriveApprovalsFromMessages(
      [permMsg({ approvalId: undefined, toolUseId: "tu1" })],
      new Map(),
      CTX,
    );
    expect(out[0]?.id).toBe("tu1");
  });

  it("falls back to message.id when both approval_id and tool_use_id absent", () => {
    const out = deriveApprovalsFromMessages(
      [permMsg({ id: "msgX", approvalId: undefined, toolUseId: undefined })],
      new Map(),
      CTX,
    );
    expect(out[0]?.id).toBe("msgX");
  });

  it("ignores non-permission_request messages", () => {
    const out = deriveApprovalsFromMessages(
      [userMsg("u1"), permMsg({ approvalId: "ap1" }), userMsg("u2")],
      new Map(),
      CTX,
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe("ap1");
  });

  it("preserves expiresAt as undefined when payload omits it", () => {
    const out = deriveApprovalsFromMessages(
      [permMsg({ approvalId: "ap1", expiresAt: undefined })],
      new Map(),
      CTX,
    );
    expect(out[0]?.expiresAt).toBeUndefined();
  });
});

describe("normalizeApprovalRequest", () => {
  it("maps ApprovalRequest to ApprovalRecord", () => {
    const req: ApprovalRequest = {
      id: "ap1",
      run_id: "r1",
      task_card_id: "t1",
      tool_name: "Bash",
      tool_input: "eyJjb21tYW5kIjoibHMifQ==",
      status: "approved",
      decided_by: "u1",
      decided_at: "2026-05-17T10:30:00Z",
      decision_note: "ok",
      created_at: "2026-05-17T10:00:00Z",
      expires_at: "2026-05-17T11:00:00Z",
    };
    const out = normalizeApprovalRequest(req, {
      projectId: "p1",
      projectName: "Launch Plan",
      taskId: "t1",
      taskTitle: "Write press release",
    });
    expect(out).toMatchObject({
      id: "ap1",
      status: "approved",
      decidedBy: "u1",
      decidedAt: "2026-05-17T10:30:00Z",
      decisionNote: "ok",
      toolName: "Bash",
      expiresAt: "2026-05-17T11:00:00Z",
    });
    // tool_input is base64-decoded JSON
    expect(out.toolInput).toEqual({ command: "ls" });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/approvals/derive.test.ts --run`
Expected: FAIL — "Cannot find module './derive'".

- [ ] **Step 3: Create `lib/approvals/types.ts`**

```ts
import type { ApprovalDecision, ApprovalStatus } from "@/lib/api/types";

export interface ApprovalContext {
  projectId: string;
  projectName: string;
  taskId: string;
  taskTitle: string;
}

export interface ApprovalLite extends ApprovalContext {
  id: string;
  toolName: string;
  toolInput: unknown;
  expiresAt: string | undefined;
  status: ApprovalStatus;
  decidedAt?: number;
}

export interface ApprovalRecord extends ApprovalContext {
  id: string;
  runId: string;
  toolName: string;
  toolInput: unknown;
  status: ApprovalStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
  expiresAt: string;
}

export type { ApprovalDecision, ApprovalStatus };
```

- [ ] **Step 4: Create `lib/approvals/derive.ts`**

```ts
import type { ClientMessage, ApprovalRequest } from "@/lib/api/types";
import type { DecisionRecord } from "@/lib/store/chat-ui";
import type { ApprovalLite, ApprovalRecord, ApprovalContext } from "./types";

function decodeBase64Json(s: string): unknown {
  if (!s) return null;
  try {
    if (typeof atob === "function") {
      return JSON.parse(atob(s));
    }
    return JSON.parse(Buffer.from(s, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function deriveApprovalsFromMessages(
  messages: ClientMessage[],
  decisions: Map<string, DecisionRecord>,
  ctx: ApprovalContext,
): ApprovalLite[] {
  const out: ApprovalLite[] = [];
  for (const m of messages) {
    if (m.parsed.type !== "permission_request") continue;
    const p = m.parsed.payload;
    const id = p.approval_id ?? p.tool_use_id ?? m.id;
    const decided = decisions.get(id);
    out.push({
      id,
      taskId: ctx.taskId,
      taskTitle: ctx.taskTitle,
      projectId: ctx.projectId,
      projectName: ctx.projectName,
      toolName: p.tool_name,
      toolInput: p.tool_input,
      expiresAt: p.expires_at,
      status: decided ? decided.decision : "pending",
      decidedAt: decided?.at,
    });
  }
  // Hub view only shows pending (Q7).
  return out.filter((a) => a.status === "pending");
}

export function normalizeApprovalRequest(
  req: ApprovalRequest,
  ctx: ApprovalContext,
): ApprovalRecord {
  return {
    id: req.id,
    runId: req.run_id,
    toolName: req.tool_name,
    toolInput: decodeBase64Json(req.tool_input),
    status: req.status,
    decidedBy: req.decided_by,
    decidedAt: req.decided_at,
    decisionNote: req.decision_note,
    createdAt: req.created_at,
    expiresAt: req.expires_at,
    projectId: ctx.projectId,
    projectName: ctx.projectName,
    taskId: ctx.taskId,
    taskTitle: ctx.taskTitle,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/approvals/derive.test.ts --run`
Expected: PASS — 8 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/approvals/
git commit -m "feat(s3): approval derive pure functions + types"
```

---

## Task 3: `fetchTaskApprovals` API client (404 sentinel)

**Files:**
- Modify: `lib/api/approvals.ts`

- [ ] **Step 1: Append `fetchTaskApprovals`**

Append to `lib/api/approvals.ts` (after `decideApproval`):

```ts
import { ApiError } from "./client";

/**
 * Fetch approvals for a task. Returns null on 404 so callers can fall back to
 * a derive-from-messages path while BACKEND_GAPS #11 is still open.
 */
export async function fetchTaskApprovals(
  taskId: string,
): Promise<ApprovalRequest[] | null> {
  try {
    return await apiFetch<ApprovalRequest[]>(`/api/v1/tasks/${taskId}/approvals`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
```

Note: `ApiError` is already exported from `lib/api/client.ts`. The existing `apiFetch` import at the top of the file is preserved.

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/api/approvals.ts
git commit -m "feat(s3): fetchTaskApprovals with 404 sentinel"
```

---

## Task 4: `useWorkspacePendingApprovals` + `usePendingApprovalsCount`

**Files:**
- Create: `hooks/useWorkspacePendingApprovals.ts`
- Create: `hooks/usePendingApprovalsCount.ts`
- Create: `hooks/useWorkspacePendingApprovals.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `hooks/useWorkspacePendingApprovals.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useWorkspacePendingApprovals } from "./useWorkspacePendingApprovals";
import { useChatUIStore } from "@/lib/store/chat-ui";
import { queryKeys } from "@/lib/api/keys";
import type { ClientMessage, Project, TaskCard } from "@/lib/api/types";

function makeMsg(taskId: string, approvalId: string, expiresAt: string): ClientMessage {
  return {
    id: `m-${approvalId}`,
    task_card_id: taskId,
    role: "agent",
    author_user_id: null,
    author_agent_id: "a1",
    content: "",
    task_run_id: "r1",
    seq: 1,
    metadata: "",
    created_at: "2026-05-17T10:00:00Z",
    meta: {},
    parsed: {
      type: "permission_request",
      payload: {
        approval_id: approvalId,
        tool_name: "Bash",
        tool_input: { command: "ls" },
        expires_at: expiresAt,
      },
    } as ClientMessage["parsed"],
  };
}

function makeProject(id: string, wsId: string): Project {
  return {
    id, workspace_id: wsId, name: `proj-${id}`, description: "",
    archived: false, created_by: "u",
    created_at: "2026-05-17T00:00:00Z", updated_at: "2026-05-17T00:00:00Z",
  };
}

function makeTask(id: string, projectId: string, title = `task-${id}`): TaskCard {
  return {
    id, project_id: projectId, title, summary: "",
    status: "open", sort_order: 0, created_by: "u",
    created_at: "2026-05-17T00:00:00Z", updated_at: "2026-05-17T00:00:00Z",
    done_at: null,
  };
}

function setupCache(qc: QueryClient, wsId: string) {
  qc.setQueryData<Project[]>(queryKeys.workspaces.projects(wsId), [
    makeProject("p1", wsId),
    makeProject("p2", wsId),
  ]);
  qc.setQueryData<TaskCard[]>(queryKeys.projects.tasks("p1"), [
    makeTask("t1", "p1"), makeTask("t2", "p1"),
  ]);
  qc.setQueryData<TaskCard[]>(queryKeys.projects.tasks("p2"), [makeTask("t3", "p2")]);
  qc.setQueryData<ClientMessage[]>(queryKeys.tasks.messages("t1"), [
    makeMsg("t1", "ap1", "2026-05-17T11:00:00Z"),
  ]);
  qc.setQueryData<ClientMessage[]>(queryKeys.tasks.messages("t2"), [
    makeMsg("t2", "ap2", "2026-05-17T10:30:00Z"),
  ]);
  qc.setQueryData<ClientMessage[]>(queryKeys.tasks.messages("t3"), [
    makeMsg("t3", "ap3", "2026-05-17T11:30:00Z"),
  ]);
}

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useWorkspacePendingApprovals", () => {
  beforeEach(() => {
    useChatUIStore.setState({ byTask: {} });
  });

  it("returns empty when no projects in cache", () => {
    const qc = new QueryClient();
    const { result } = renderHook(() => useWorkspacePendingApprovals("ws1"), {
      wrapper: wrapper(qc),
    });
    expect(result.current).toEqual([]);
  });

  it("aggregates approvals across projects and tasks, sorted by expiresAt", () => {
    const qc = new QueryClient();
    setupCache(qc, "ws1");
    const { result } = renderHook(() => useWorkspacePendingApprovals("ws1"), {
      wrapper: wrapper(qc),
    });
    expect(result.current.map((a) => a.id)).toEqual(["ap2", "ap1", "ap3"]);
  });

  it("filters out approvals already decided in chat-ui store", () => {
    const qc = new QueryClient();
    setupCache(qc, "ws1");
    useChatUIStore.getState().recordDecision("ap2", {
      decision: "approved",
      at: Date.now(),
    });
    const { result } = renderHook(() => useWorkspacePendingApprovals("ws1"), {
      wrapper: wrapper(qc),
    });
    expect(result.current.map((a) => a.id)).toEqual(["ap1", "ap3"]);
  });
});
```

`vi.mock` is intentionally not used — this test pre-populates the React Query cache directly so the upstream hooks (`useProjects`, `useProjectTasks`, `useTaskMessages`) read from it without making network calls.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- hooks/useWorkspacePendingApprovals.test.tsx --run`
Expected: FAIL — "Cannot find module './useWorkspacePendingApprovals'".

- [ ] **Step 3: Create `hooks/useWorkspacePendingApprovals.ts`**

```ts
"use client";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProjects } from "@/hooks/useProjects";
import { queryKeys } from "@/lib/api/keys";
import { useChatUIStore, getDecision } from "@/lib/store/chat-ui";
import type { ClientMessage, Project, TaskCard } from "@/lib/api/types";
import type { DecisionRecord } from "@/lib/store/chat-ui";
import { deriveApprovalsFromMessages } from "@/lib/approvals/derive";
import type { ApprovalLite } from "@/lib/approvals/types";

export function useWorkspacePendingApprovals(wsId: string): ApprovalLite[] {
  const qc = useQueryClient();
  const { data: projects = [] } = useProjects(wsId);

  // Subscribe to the chat-ui store so the hook re-renders when a decision is recorded.
  const decisionsSlot = useChatUIStore((s) => s.byTask);
  void decisionsSlot;

  return useMemo(() => {
    const decisions = new Map<string, DecisionRecord>();
    // Use getDecision via the store state snapshot once per approval id we encounter.
    const state = useChatUIStore.getState();

    const collected: ApprovalLite[] = [];
    for (const project of projects as Project[]) {
      const tasks =
        qc.getQueryData<TaskCard[]>(queryKeys.projects.tasks(project.id)) ?? [];
      for (const task of tasks) {
        const messages =
          qc.getQueryData<ClientMessage[]>(queryKeys.tasks.messages(task.id)) ?? [];
        if (messages.length === 0) continue;
        // Build a partial decisions map limited to ids we see in this task.
        for (const m of messages) {
          if (m.parsed.type !== "permission_request") continue;
          const p = m.parsed.payload;
          const id = p.approval_id ?? p.tool_use_id ?? m.id;
          const d = getDecision(state, id);
          if (d) decisions.set(id, d);
        }
        collected.push(
          ...deriveApprovalsFromMessages(messages, decisions, {
            projectId: project.id,
            projectName: project.name,
            taskId: task.id,
            taskTitle: task.title,
          }),
        );
      }
    }
    // Sort ascending by expiresAt (undefined → end of list).
    collected.sort((a, b) => {
      if (!a.expiresAt) return 1;
      if (!b.expiresAt) return -1;
      return a.expiresAt.localeCompare(b.expiresAt);
    });
    return collected;
    // qc and projects refs are stable per render; decisionsSlot re-triggers on store change.
  }, [qc, projects, decisionsSlot]);
}
```

- [ ] **Step 4: Create `hooks/usePendingApprovalsCount.ts`**

```ts
"use client";
import { useWorkspacePendingApprovals } from "./useWorkspacePendingApprovals";

export function usePendingApprovalsCount(wsId: string): number {
  return useWorkspacePendingApprovals(wsId).length;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- hooks/useWorkspacePendingApprovals.test.tsx --run`
Expected: PASS — 3 tests.

- [ ] **Step 6: Commit**

```bash
git add hooks/useWorkspacePendingApprovals.ts hooks/usePendingApprovalsCount.ts hooks/useWorkspacePendingApprovals.test.tsx
git commit -m "feat(s3): useWorkspacePendingApprovals + usePendingApprovalsCount"
```

---

## Task 5: `useTaskApprovalsHistory` (double-path) and remove legacy `useApprovalsHistory`

**Files:**
- Create: `hooks/useTaskApprovalsHistory.ts`
- Create: `hooks/useTaskApprovalsHistory.test.tsx`
- Remove: `hooks/useApprovalsHistory.ts`
- Modify: importers of `useApprovalsHistory` (verify with grep in Step 7)

- [ ] **Step 1: Write the failing test**

Create `hooks/useTaskApprovalsHistory.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTaskApprovalsHistory } from "./useTaskApprovalsHistory";
import { queryKeys } from "@/lib/api/keys";
import type { ApprovalRequest, ClientMessage, Project, TaskCard } from "@/lib/api/types";
import * as approvalsApi from "@/lib/api/approvals";

function makeReq(id: string, status: ApprovalRequest["status"]): ApprovalRequest {
  return {
    id, run_id: "r1", task_card_id: "t1",
    tool_name: "Bash", tool_input: "eyJjb21tYW5kIjoibHMifQ==",
    status,
    decided_by: status === "pending" ? null : "u1",
    decided_at: status === "pending" ? null : "2026-05-17T10:30:00Z",
    decision_note: status === "pending" ? null : "ok",
    created_at: "2026-05-17T10:00:00Z",
    expires_at: "2026-05-17T11:00:00Z",
  };
}

function permMsg(approvalId: string): ClientMessage {
  return {
    id: `m-${approvalId}`,
    task_card_id: "t1",
    role: "agent", author_user_id: null, author_agent_id: "a1",
    content: "", task_run_id: "r1", seq: 1, metadata: "",
    created_at: "2026-05-17T10:00:00Z", meta: {},
    parsed: {
      type: "permission_request",
      payload: {
        approval_id: approvalId, tool_name: "Bash",
        tool_input: { command: "ls" },
        expires_at: "2026-05-17T11:00:00Z",
      },
    } as ClientMessage["parsed"],
  };
}

function seedTaskCtx(qc: QueryClient) {
  qc.setQueryData<TaskCard>(queryKeys.tasks.detail("t1"), {
    id: "t1", project_id: "p1", title: "Write release",
    summary: "", status: "open", sort_order: 0, created_by: "u",
    created_at: "2026-05-17T00:00:00Z", updated_at: "2026-05-17T00:00:00Z",
    done_at: null,
  });
  qc.setQueryData<Project>(queryKeys.projects.detail("p1"), {
    id: "p1", workspace_id: "ws1", name: "Launch Plan",
    description: "", archived: false, created_by: "u",
    created_at: "2026-05-17T00:00:00Z", updated_at: "2026-05-17T00:00:00Z",
  });
}

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useTaskApprovalsHistory", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes 200 response from fetchTaskApprovals", async () => {
    vi.spyOn(approvalsApi, "fetchTaskApprovals").mockResolvedValue([
      makeReq("ap1", "approved"),
      makeReq("ap2", "denied"),
    ]);
    const qc = new QueryClient();
    seedTaskCtx(qc);
    const { result } = renderHook(() => useTaskApprovalsHistory("t1"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data?.length).toBe(2));
    expect(result.current.data?.[0]?.status).toBe("approved");
    expect(result.current.source).toBe("api");
  });

  it("falls back to messages-derive when fetchTaskApprovals returns null (404)", async () => {
    vi.spyOn(approvalsApi, "fetchTaskApprovals").mockResolvedValue(null);
    const qc = new QueryClient();
    seedTaskCtx(qc);
    qc.setQueryData<ClientMessage[]>(queryKeys.tasks.messages("t1"), [
      permMsg("ap1"),
    ]);
    const { result } = renderHook(() => useTaskApprovalsHistory("t1"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.source).toBe("derive"));
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0]?.id).toBe("ap1");
  });

  it("filters by status when filter argument provided", async () => {
    vi.spyOn(approvalsApi, "fetchTaskApprovals").mockResolvedValue([
      makeReq("ap1", "approved"),
      makeReq("ap2", "denied"),
    ]);
    const qc = new QueryClient();
    seedTaskCtx(qc);
    const { result } = renderHook(() => useTaskApprovalsHistory("t1", "denied"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data?.length).toBe(1));
    expect(result.current.data?.[0]?.id).toBe("ap2");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- hooks/useTaskApprovalsHistory.test.tsx --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `hooks/useTaskApprovalsHistory.ts`**

```ts
"use client";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTaskApprovals } from "@/lib/api/approvals";
import { queryKeys } from "@/lib/api/keys";
import { useTaskMessages } from "./useTaskMessages";
import { useChatUIStore, getDecision } from "@/lib/store/chat-ui";
import {
  deriveApprovalsFromMessages,
  normalizeApprovalRequest,
} from "@/lib/approvals/derive";
import type { ApprovalRecord, ApprovalLite, ApprovalStatus } from "@/lib/approvals/types";
import type { ClientMessage, Project, TaskCard } from "@/lib/api/types";

type StatusFilter = ApprovalStatus | "all";

export interface UseTaskApprovalsHistoryResult {
  data: ApprovalRecord[] | undefined;
  isLoading: boolean;
  source: "api" | "derive" | "loading";
}

function liteToRecord(a: ApprovalLite, runId: string): ApprovalRecord {
  return {
    id: a.id,
    runId,
    toolName: a.toolName,
    toolInput: a.toolInput,
    status: a.status,
    decidedBy: null,
    decidedAt: null,
    decisionNote: null,
    createdAt: a.expiresAt ?? "",
    expiresAt: a.expiresAt ?? "",
    projectId: a.projectId,
    projectName: a.projectName,
    taskId: a.taskId,
    taskTitle: a.taskTitle,
  };
}

export function useTaskApprovalsHistory(
  taskId: string,
  filter: StatusFilter = "all",
): UseTaskApprovalsHistoryResult {
  const qc = useQueryClient();

  const apiQuery = useQuery({
    queryKey: queryKeys.approvals.task(taskId),
    queryFn: () => fetchTaskApprovals(taskId),
    enabled: !!taskId,
    // null means 404 -> caller falls back. Cache the null so we don't refetch repeatedly.
    staleTime: 30_000,
  });

  const { data: messages = [] } = useTaskMessages(taskId);
  const decisionsSlot = useChatUIStore((s) => s.byTask);
  void decisionsSlot;

  const task = qc.getQueryData<TaskCard>(queryKeys.tasks.detail(taskId));
  const project = task
    ? qc.getQueryData<Project>(queryKeys.projects.detail(task.project_id))
    : undefined;

  const ctx = useMemo(() => ({
    projectId: task?.project_id ?? "",
    projectName: project?.name ?? "",
    taskId,
    taskTitle: task?.title ?? "",
  }), [task, project, taskId]);

  return useMemo<UseTaskApprovalsHistoryResult>(() => {
    if (apiQuery.isLoading) {
      return { data: undefined, isLoading: true, source: "loading" };
    }
    // 200 path
    if (Array.isArray(apiQuery.data)) {
      const normalized = apiQuery.data.map((r) => normalizeApprovalRequest(r, ctx));
      return {
        data: filter === "all" ? normalized : normalized.filter((r) => r.status === filter),
        isLoading: false,
        source: "api",
      };
    }
    // Fallback derive path (null = 404)
    const state = useChatUIStore.getState();
    const decisions = new Map();
    for (const m of messages as ClientMessage[]) {
      if (m.parsed.type !== "permission_request") continue;
      const p = m.parsed.payload;
      const id = p.approval_id ?? p.tool_use_id ?? m.id;
      const d = getDecision(state, id);
      if (d) decisions.set(id, d);
    }
    // We need ALL statuses (not just pending) — call derive without the pending filter.
    // The exported derive filters pending; for history we re-derive inline.
    const liteAll: ApprovalLite[] = [];
    for (const m of messages as ClientMessage[]) {
      if (m.parsed.type !== "permission_request") continue;
      const p = m.parsed.payload;
      const id = p.approval_id ?? p.tool_use_id ?? m.id;
      const decided = decisions.get(id);
      liteAll.push({
        id,
        taskId: ctx.taskId, taskTitle: ctx.taskTitle,
        projectId: ctx.projectId, projectName: ctx.projectName,
        toolName: p.tool_name, toolInput: p.tool_input,
        expiresAt: p.expires_at,
        status: decided ? decided.decision : "pending",
        decidedAt: decided?.at,
      });
    }
    const records = liteAll.map((a) => liteToRecord(a, ""));
    const filtered = filter === "all" ? records : records.filter((r) => r.status === filter);
    return { data: filtered, isLoading: false, source: "derive" };
  }, [apiQuery.data, apiQuery.isLoading, messages, ctx, filter, decisionsSlot]);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- hooks/useTaskApprovalsHistory.test.tsx --run`
Expected: PASS — 3 tests.

- [ ] **Step 5: Locate consumers of the legacy `useApprovalsHistory`**

Run: `grep -rn "useApprovalsHistory" components/ app/ hooks/`

Expected: one or more hits in `components/task-detail/RightTabs/` (S2 right-panel approvals tab) and the legacy hook file itself.

- [ ] **Step 6: Migrate each consumer to `useTaskApprovalsHistory`**

For each call site that does `const items = useApprovalsHistory(taskId)`:
1. Change the import: `import { useTaskApprovalsHistory } from "@/hooks/useTaskApprovalsHistory";`
2. Adjust the call site. The legacy hook returned `ClientMessage[]`; the new hook returns `{ data: ApprovalRecord[] | undefined, isLoading, source }`. Replace the consumer's render with mapping over `data ?? []` and using `ApprovalRecord` fields (`r.toolName`, `r.status`, `r.expiresAt`, `r.decisionNote`).
3. If the consumer previously read `m.parsed.payload.tool_name`, replace with `r.toolName`. If it read `m.created_at`, replace with `r.createdAt`.

If the existing consumer uses fields beyond what `ApprovalRecord` exposes, add them to `ApprovalRecord` in `lib/approvals/types.ts` rather than reverting to the legacy hook.

- [ ] **Step 7: Remove the legacy hook**

```bash
git rm hooks/useApprovalsHistory.ts
```

- [ ] **Step 8: Run all tests + typecheck**

```bash
npm run typecheck
npm test -- --run
```
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(s3): useTaskApprovalsHistory double-path; remove legacy useApprovalsHistory"
```

---

## Task 6: `<ApprovalHubCard>` + `<ToolFilterInput>`

**Files:**
- Create: `components/approvals/ApprovalHubCard.tsx`
- Create: `components/approvals/ApprovalHubCard.test.tsx`
- Create: `components/approvals/ToolFilterInput.tsx`

- [ ] **Step 1: Write the failing card test**

Create `components/approvals/ApprovalHubCard.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApprovalHubCard } from "./ApprovalHubCard";
import type { ApprovalLite } from "@/lib/approvals/types";
import * as approvalsApi from "@/lib/api/approvals";

const FUTURE = new Date(Date.now() + 30 * 60_000).toISOString();

function lite(overrides: Partial<ApprovalLite> = {}): ApprovalLite {
  return {
    id: "ap1",
    taskId: "t1",
    taskTitle: "Write release",
    projectId: "p1",
    projectName: "Launch Plan",
    toolName: "Bash",
    toolInput: { command: "rm -rf node_modules" },
    expiresAt: FUTURE,
    status: "pending",
    ...overrides,
  };
}

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("ApprovalHubCard", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders tool name, project, task, and command", () => {
    wrap(<ApprovalHubCard approval={lite()} />);
    expect(screen.getByText(/Bash/)).toBeInTheDocument();
    expect(screen.getByText(/Launch Plan/)).toBeInTheDocument();
    expect(screen.getByText(/Write release/)).toBeInTheDocument();
    expect(screen.getByText(/rm -rf node_modules/)).toBeInTheDocument();
  });

  it("calls decideApproval on Approve click", async () => {
    const spy = vi.spyOn(approvalsApi, "decideApproval").mockResolvedValue({} as never);
    wrap(<ApprovalHubCard approval={lite()} />);
    fireEvent.click(screen.getByRole("button", { name: "批准" }));
    expect(spy).toHaveBeenCalledWith("ap1", { decision: "approved", note: undefined });
  });

  it("calls decideApproval(denied) on Deny click", async () => {
    const spy = vi.spyOn(approvalsApi, "decideApproval").mockResolvedValue({} as never);
    wrap(<ApprovalHubCard approval={lite()} />);
    fireEvent.click(screen.getByRole("button", { name: "拒绝" }));
    expect(spy).toHaveBeenCalledWith("ap1", { decision: "denied", note: undefined });
  });

  it("opens textarea and submits approved_with_edits with note", () => {
    const spy = vi.spyOn(approvalsApi, "decideApproval").mockResolvedValue({} as never);
    wrap(<ApprovalHubCard approval={lite()} />);
    fireEvent.click(screen.getByRole("button", { name: "批准并修改" }));
    const textarea = screen.getByPlaceholderText(/备注/);
    fireEvent.change(textarea, { target: { value: "tweak args" } });
    fireEvent.click(screen.getByRole("button", { name: "提交" }));
    expect(spy).toHaveBeenCalledWith("ap1", {
      decision: "approved_with_edits",
      note: "tweak args",
    });
  });

  it("disables buttons when expired", () => {
    wrap(<ApprovalHubCard approval={lite({ expiresAt: "2000-01-01T00:00:00Z" })} />);
    expect(screen.getByRole("button", { name: "批准" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "拒绝" })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/approvals/ApprovalHubCard.test.tsx --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `components/approvals/ApprovalHubCard.tsx`**

```tsx
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
    <div className="border-[1.5px] border-ink-0 rounded-md overflow-hidden shadow-[var(--shadow-current)] bg-paper-0">
      <div className="flex items-center justify-between px-4 py-2 bg-role-approval text-paper-0">
        <span className="font-bold">{approval.toolName} 请求批准</span>
        <span
          className={`font-mono text-xs ${urgent ? "text-state-failed font-bold animate-pulse" : ""}`}
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
                className="px-3 py-1 border-[1.5px] border-ink-0 rounded-sm font-semibold disabled:opacity-50"
              >
                拒绝
              </button>
              <button
                onClick={() => setNoteOpen(true)}
                disabled={disabled}
                className="px-3 py-1 border-[1.5px] border-ink-0 rounded-sm font-semibold disabled:opacity-50"
              >
                批准并修改
              </button>
              <button
                onClick={() => submit("approved")}
                disabled={disabled}
                className="px-3 py-1 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold shadow-[var(--shadow-current)] disabled:opacity-50"
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
```

- [ ] **Step 4: Create `components/approvals/ToolFilterInput.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/brand/input";

interface ToolFilterInputProps {
  onChange: (value: string) => void;
  delayMs?: number;
}

export function ToolFilterInput({ onChange, delayMs = 100 }: ToolFilterInputProps) {
  const [local, setLocal] = useState("");
  useEffect(() => {
    const t = setTimeout(() => onChange(local.trim().toLowerCase()), delayMs);
    return () => clearTimeout(t);
  }, [local, delayMs, onChange]);

  return (
    <Input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder="按工具名过滤"
      className="min-w-[180px]"
    />
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- components/approvals/ApprovalHubCard.test.tsx --run`
Expected: PASS — 5 tests.

- [ ] **Step 6: Commit**

```bash
git add components/approvals/
git commit -m "feat(s3): ApprovalHubCard + ToolFilterInput"
```

---

## Task 7: `/w/[wsId]/approvals` route + `<ApprovalsHubPage>`

**Files:**
- Create: `app/(app)/w/[wsId]/approvals/page.tsx`
- Create: `components/approvals/ApprovalsHubPage.tsx`

- [ ] **Step 1: Create the route entry**

Create `app/(app)/w/[wsId]/approvals/page.tsx`:

```tsx
import { ApprovalsHubPage } from "@/components/approvals/ApprovalsHubPage";

export default function Page({ params }: { params: { wsId: string } }) {
  return <ApprovalsHubPage wsId={params.wsId} />;
}
```

- [ ] **Step 2: Create the hub container**

Create `components/approvals/ApprovalsHubPage.tsx`:

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWS } from "@/lib/ws/provider";
import { useProjects } from "@/hooks/useProjects";
import { queryKeys } from "@/lib/api/keys";
import { useWorkspacePendingApprovals } from "@/hooks/useWorkspacePendingApprovals";
import { ApprovalHubCard } from "./ApprovalHubCard";
import { ToolFilterInput } from "./ToolFilterInput";
import type { TaskCard } from "@/lib/api/types";

interface ApprovalsHubPageProps {
  wsId: string;
}

export function ApprovalsHubPage({ wsId }: ApprovalsHubPageProps) {
  const qc = useQueryClient();
  const ws = useWS();
  const { data: projects = [] } = useProjects(wsId);
  const [filter, setFilter] = useState("");

  // Collect all task IDs in the current workspace from cache.
  const taskIds = useMemo(() => {
    const ids: string[] = [];
    for (const p of projects) {
      const tasks = qc.getQueryData<TaskCard[]>(queryKeys.projects.tasks(p.id)) ?? [];
      for (const t of tasks) ids.push(t.id);
    }
    return ids;
  }, [qc, projects]);

  // Subscribe to every task in the workspace while the hub is open.
  // The dependency uses join(",") so stable id-set arrays don't churn subscriptions.
  const taskIdsKey = taskIds.join(",");
  useEffect(() => {
    const ids = taskIdsKey ? taskIdsKey.split(",") : [];
    ids.forEach((id) => ws.client.subscribe("task", id));
    return () => {
      ids.forEach((id) => ws.client.unsubscribe("task", id));
    };
  }, [taskIdsKey, ws.client]);

  const approvals = useWorkspacePendingApprovals(wsId);
  const visible = useMemo(
    () =>
      filter
        ? approvals.filter((a) => a.toolName.toLowerCase().includes(filter))
        : approvals,
    [approvals, filter],
  );

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-accent rounded-full" />
            <h1 className="text-2xl font-extrabold text-ink-0 page-title">
              待审批 · {visible.length} 件
            </h1>
          </div>
          <p className="text-sm text-ink-2 mt-1">所有待你决定的工具调用</p>
        </div>
        <ToolFilterInput onChange={setFilter} />
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-20 text-ink-2">
          <div className="text-4xl mb-2">✓</div>
          <div>全部处理完了</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-3xl">
          {visible.map((a) => (
            <ApprovalHubCard key={a.id} approval={a} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Important:** `useWS` and `ws.client.subscribe` must already exist in `lib/ws/provider`. If they don't, this task is blocked — verify at Step 3 before proceeding. The expected shape is `useWS(): { client: WSClient; status: "connecting"|"connected"|"offline" }`. If the actual shape differs, adjust this file accordingly but do **not** change `WSClient`.

- [ ] **Step 3: Verify ws provider exposes `client`**

Run: `grep -n "useWS\|client" lib/ws/provider.tsx`
Expected: a function `useWS()` returning an object with a `client` field of type `WSClient`. If absent, read the provider file and adjust the import / call in `ApprovalsHubPage.tsx` to use whatever shape exists.

- [ ] **Step 4: Typecheck and run lint**

```bash
npm run typecheck
npm run lint
```
Expected: PASS.

- [ ] **Step 5: Smoke-test in browser (optional but recommended)**

```bash
npm run dev
```
Open `http://localhost:3000/w/05c5f4a0-4ce2-4350-b8df-86dc518dded7/approvals` (logged in as `qa@brainrot.local`).
Expected: page renders with "待审批 · 0 件" + empty-state checkmark (Demo tasks have no permission_request messages in fixture).

- [ ] **Step 6: Commit**

```bash
git add app/(app)/w/[wsId]/approvals/ components/approvals/ApprovalsHubPage.tsx
git commit -m "feat(s3): /approvals hub route + ApprovalsHubPage"
```

---

## Task 8: `<ConfirmDialog>` brand component

**Files:**
- Create: `components/brand/confirm-dialog.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  knownIssueNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  knownIssueNote,
  confirmLabel = "确认",
  cancelLabel = "取消",
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
        {knownIssueNote && (
          <p className="text-xs text-ink-2 italic mt-3 border-l-2 border-hairline pl-3">
            {knownIssueNote}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={
              destructive
                ? "px-3 py-1.5 bg-state-failed text-paper-0 border-[1.5px] border-state-failed rounded-sm font-semibold text-sm"
                : "px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm shadow-[var(--shadow-current)]"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/brand/confirm-dialog.tsx
git commit -m "feat(s3): ConfirmDialog composed brand component"
```

---

## Task 9: `useCancelRun` + `<CancelRunButton>`

**Files:**
- Create: `hooks/useCancelRun.ts`
- Create: `components/task-detail/CancelRunButton.tsx`
- Create: `components/task-detail/CancelRunButton.test.tsx`
- Modify: `components/task-detail/TaskHeader.tsx`

- [ ] **Step 1: Manual verify cancel-run queue behavior**

Spec §9 Open Items requires verifying BACKEND_GAPS #18 behavior before finalizing the dialog copy. Do this before writing the test so the dialog text matches reality.

```bash
# In a separate shell:
curl -c $TEMP\br_cookie.txt -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"qa@brainrot.local","password":"qa-tester-pw-1"}'

# Send two messages quickly (paste the task_id from BACKEND_GAPS or the seeded one):
TASK_ID="2c01e9de-dfcd-449b-8146-1c2f04caf789"
curl -b $TEMP\br_cookie.txt -X POST http://localhost:8080/api/v1/tasks/$TASK_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"content":{"text":"@writer 写开头","mentions":["<writer-uuid>"]}}'
curl -b $TEMP\br_cookie.txt -X POST http://localhost:8080/api/v1/tasks/$TASK_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"content":{"text":"@writer 加结尾","mentions":["<writer-uuid>"]}}'
# Wait 2 seconds, then cancel:
curl -b $TEMP\br_cookie.txt -X POST http://localhost:8080/api/v1/tasks/$TASK_ID/cancel-run
# Wait 5 seconds, then fetch messages:
curl -b $TEMP\br_cookie.txt http://localhost:8080/api/v1/tasks/$TASK_ID/messages | jq '.[] | {id, role, metadata}'
```

Expected (per BACKEND_GAPS #18 description): second message remains with `metadata.queued=true` and never promotes. If you observe different behavior, update the dialog copy in Step 4 to match what actually happens.

If the workspace agents are not seeded (writer-uuid unknown), skip this step and just trust the documented #18 behavior. Note in the commit message whether the manual check was performed.

- [ ] **Step 2: Write the failing button test**

Create `components/task-detail/CancelRunButton.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CancelRunButton } from "./CancelRunButton";
import * as client from "@/lib/api/client";

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("CancelRunButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("does not render when busy=false", () => {
    wrap(<CancelRunButton taskId="t1" busy={false} />);
    expect(screen.queryByRole("button", { name: /取消运行/ })).not.toBeInTheDocument();
  });

  it("renders when busy=true and shows known-issue note in dialog", () => {
    wrap(<CancelRunButton taskId="t1" busy={true} />);
    fireEvent.click(screen.getByRole("button", { name: /取消运行/ }));
    expect(screen.getByText(/已知后端问题/)).toBeInTheDocument();
    expect(screen.getByText(/重新发送/)).toBeInTheDocument();
  });

  it("posts cancel and locks button for 5s on confirm", async () => {
    const spy = vi.spyOn(client, "apiFetch").mockResolvedValue(undefined as never);
    wrap(<CancelRunButton taskId="t1" busy={true} />);
    fireEvent.click(screen.getByRole("button", { name: /取消运行/ }));
    fireEvent.click(screen.getByRole("button", { name: /^确认/ }));
    expect(spy).toHaveBeenCalledWith("/api/v1/tasks/t1/cancel-run", { method: "POST" });

    // Button is disabled during cooldown
    const btn = screen.getByRole("button", { name: /取消运行/ });
    expect(btn).toBeDisabled();

    // After 5s, button is re-enabled
    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(btn).not.toBeDisabled();
  });

  it("ignores second click during cooldown", async () => {
    const spy = vi.spyOn(client, "apiFetch").mockResolvedValue(undefined as never);
    wrap(<CancelRunButton taskId="t1" busy={true} />);
    fireEvent.click(screen.getByRole("button", { name: /取消运行/ }));
    fireEvent.click(screen.getByRole("button", { name: /^确认/ }));
    // Try to open the dialog again while cooldown active:
    fireEvent.click(screen.getByRole("button", { name: /取消运行/ }));
    expect(screen.queryByText(/已知后端问题/)).not.toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Create `hooks/useCancelRun.ts`**

```ts
"use client";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export function useCancelRun(taskId: string) {
  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/api/v1/tasks/${taskId}/cancel-run`, { method: "POST" }),
  });
}
```

No optimistic update; WS `run.completed` (already wired in S2) invalidates the project tasks query, which re-reads `task.busy=false`.

- [ ] **Step 4: Create `components/task-detail/CancelRunButton.tsx`**

The dialog copy below assumes #18 behavior is unfixed. If Step 1 manual check showed different behavior, edit the `knownIssueNote` literal accordingly.

```tsx
"use client";
import { useState } from "react";
import { useCancelRun } from "@/hooks/useCancelRun";
import { ConfirmDialog } from "@/components/brand/confirm-dialog";

interface CancelRunButtonProps {
  taskId: string;
  busy: boolean;
}

const COOLDOWN_MS = 5_000;

export function CancelRunButton({ taskId, busy }: CancelRunButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const cancel = useCancelRun(taskId);

  if (!busy) return null;

  const cooling = Date.now() < lockedUntil;
  const disabled = cooling || cancel.isPending;

  function openDialog() {
    if (disabled) return;
    setDialogOpen(true);
  }

  function confirm() {
    cancel.mutate();
    setLockedUntil(Date.now() + COOLDOWN_MS);
    // Trigger re-render when cooldown ends.
    setTimeout(() => setLockedUntil(0), COOLDOWN_MS + 50);
  }

  return (
    <>
      <button
        onClick={openDialog}
        disabled={disabled}
        className="px-3 py-1.5 border-[1.5px] border-ink-0 rounded-sm text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        取消运行
      </button>
      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="取消当前运行？"
        description="后端将立即终止当前正在跑的 run。"
        knownIssueNote="已知后端问题 #18：取消之后，本任务排队中的后续消息会卡住，需重新发送一次才能继续。"
        confirmLabel="确认取消"
        cancelLabel="返回"
        onConfirm={confirm}
        destructive
      />
    </>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- components/task-detail/CancelRunButton.test.tsx --run`
Expected: PASS — 4 tests.

- [ ] **Step 6: Wire into `TaskHeader`**

Edit `components/task-detail/TaskHeader.tsx`. Replace lines 23–34 (the right-side action group containing the disabled `⋯` button) with:

```tsx
      <div className="flex items-center gap-2 shrink-0">
        <CancelRunButton taskId={taskId} busy={Boolean(task?.busy)} />
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <IconButton disabled aria-label="更多">
                ⋯
              </IconButton>
            </span>
          </TooltipTrigger>
          <TooltipContent>S3 上线后启用</TooltipContent>
        </Tooltip>
      </div>
```

Add the import at the top: `import { CancelRunButton } from "./CancelRunButton";`

- [ ] **Step 7: Typecheck + lint**

```bash
npm run typecheck && npm run lint
```
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add hooks/useCancelRun.ts components/task-detail/CancelRunButton.tsx components/task-detail/CancelRunButton.test.tsx components/task-detail/TaskHeader.tsx
git commit -m "feat(s3): CancelRunButton + useCancelRun mutation; wire into TaskHeader"
```

---

## Task 10: `<NotificationBell>` + Topbar integration

**Files:**
- Create: `components/layout/NotificationBell.tsx`
- Create: `components/layout/NotificationBell.test.tsx`
- Modify: `components/nav/ThreeColumnShell.tsx`

- [ ] **Step 1: Write the failing bell test**

Create `components/layout/NotificationBell.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationBell } from "./NotificationBell";
import { queryKeys } from "@/lib/api/keys";
import type { Project, TaskCard, ClientMessage } from "@/lib/api/types";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function wrap(qc: QueryClient, ui: React.ReactNode) {
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

function seed(qc: QueryClient, opts: { tasks: number; approvalsPerTask: number }) {
  qc.setQueryData<Project[]>(queryKeys.workspaces.projects("ws1"), [
    { id: "p1", workspace_id: "ws1", name: "P1", description: "",
      archived: false, created_by: "u",
      created_at: "2026-05-17T00:00:00Z", updated_at: "2026-05-17T00:00:00Z" },
  ]);
  const tasks: TaskCard[] = Array.from({ length: opts.tasks }, (_, i) => ({
    id: `t${i}`, project_id: "p1", title: `T${i}`, summary: "",
    status: "open" as const, sort_order: i, created_by: "u",
    created_at: "2026-05-17T00:00:00Z", updated_at: "2026-05-17T00:00:00Z", done_at: null,
  }));
  qc.setQueryData<TaskCard[]>(queryKeys.projects.tasks("p1"), tasks);
  tasks.forEach((t, ti) => {
    const msgs: ClientMessage[] = Array.from({ length: opts.approvalsPerTask }, (_, j) => ({
      id: `m-${ti}-${j}`, task_card_id: t.id, role: "agent",
      author_user_id: null, author_agent_id: "a1", content: "",
      task_run_id: "r1", seq: j, metadata: "",
      created_at: "2026-05-17T10:00:00Z", meta: {},
      parsed: {
        type: "permission_request",
        payload: {
          approval_id: `ap-${ti}-${j}`, tool_name: "Bash",
          tool_input: { command: "ls" },
          expires_at: "2026-05-17T11:00:00Z",
        },
      } as ClientMessage["parsed"],
    }));
    qc.setQueryData<ClientMessage[]>(queryKeys.tasks.messages(t.id), msgs);
  });
}

describe("NotificationBell", () => {
  it("shows no badge digit when count=0", () => {
    const qc = new QueryClient();
    seed(qc, { tasks: 0, approvalsPerTask: 0 });
    wrap(qc, <NotificationBell wsId="ws1" />);
    // The IconButton renders a badge span only when badge > 0
    expect(screen.queryByText(/^\d+/)).not.toBeInTheDocument();
  });

  it("renders count when between 1 and 99", () => {
    const qc = new QueryClient();
    seed(qc, { tasks: 3, approvalsPerTask: 1 });
    wrap(qc, <NotificationBell wsId="ws1" />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders 99+ when count > 99", () => {
    const qc = new QueryClient();
    seed(qc, { tasks: 100, approvalsPerTask: 2 });
    wrap(qc, <NotificationBell wsId="ws1" />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("navigates to /w/<wsId>/approvals on click", () => {
    const qc = new QueryClient();
    seed(qc, { tasks: 0, approvalsPerTask: 0 });
    wrap(qc, <NotificationBell wsId="ws1" />);
    fireEvent.click(screen.getByRole("button", { name: "通知" }));
    expect(pushMock).toHaveBeenCalledWith("/w/ws1/approvals");
  });
});
```

- [ ] **Step 2: Create `components/layout/NotificationBell.tsx`**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/brand/icon-button";
import { usePendingApprovalsCount } from "@/hooks/usePendingApprovalsCount";

interface NotificationBellProps {
  wsId: string;
}

function clampBadge(n: number): { value: number; label: string } | undefined {
  if (n <= 0) return undefined;
  if (n > 99) return { value: 100, label: "99+" };
  return { value: n, label: String(n) };
}

export function NotificationBell({ wsId }: NotificationBellProps) {
  const router = useRouter();
  const count = usePendingApprovalsCount(wsId);
  const badge = clampBadge(count);

  return (
    <IconButton
      aria-label="通知"
      onClick={() => router.push(`/w/${wsId}/approvals`)}
      badge={badge?.value}
      title={badge ? `${badge.label} 件待审批` : "暂无待审批"}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </svg>
      {badge && badge.label === "99+" && (
        <span className="absolute -top-1 -right-1 min-w-[26px] h-[18px] px-[5px] rounded-full bg-accent text-accent-fg text-[10px] font-bold grid place-items-center border-[1.5px] border-paper-0">
          99+
        </span>
      )}
    </IconButton>
  );
}
```

Note: `IconButton` renders the numeric badge when `badge>0`. For `99+` we render an extra span overlay; the numeric badge from `IconButton` will display "100", which is overlapped by the explicit span. Verify visually in Step 5. If overlap is wrong, refactor `IconButton` to accept a string `badge` — but that is a brand-level change; see Step 5 fallback.

- [ ] **Step 3: Run tests**

Run: `npm test -- components/layout/NotificationBell.test.tsx --run`
Expected: PASS — 4 tests.

If the "renders 99+" test fails because `IconButton` renders "100", refactor the test to assert that "99+" is present and "100" is absent **OR** widen `IconButton.badge` to accept `number | string` and remove the overlay span. Pick the simpler change.

- [ ] **Step 4: Wire into `ThreeColumnShell`**

Edit `components/nav/ThreeColumnShell.tsx`. Locate the `<Tooltip>...<IconButton disabled aria-label="通知" badge={3}>` block (lines 45–66). The tooltip wraps the bell with `S3 上线后启用` text. Replace the entire `<Tooltip>...</Tooltip>` for the bell with:

```tsx
              <NotificationBell wsId={currentWsId} />
```

Add the imports at the top of the file:

```tsx
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useParams } from "next/navigation";
```

And inside `ThreeColumnShell` before the `return`, add:

```tsx
  const params = useParams<{ wsId?: string }>();
  const currentWsId = params?.wsId ?? "";
```

If `currentWsId` is empty (not under `/w/[wsId]/...`), render a disabled placeholder instead — wrap the `<NotificationBell />` in `{currentWsId ? <NotificationBell wsId={currentWsId} /> : null}`. The (app) group always has `wsId` under `/w/[wsId]`, but root pages like `/onboarding` won't — hide the bell there.

- [ ] **Step 5: Visual smoke-test**

```bash
npm run dev
```
- Navigate to `/w/<wsId>/p/<projectId>` — bell is present, no badge digit (Demo tasks have no permission_request messages).
- Click bell — navigates to `/w/<wsId>/approvals`.
- If a numeric "100" leak shows next to "99+", refactor per Step 3 fallback.

- [ ] **Step 6: Typecheck + lint**

```bash
npm run typecheck && npm run lint
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/layout/NotificationBell.tsx components/layout/NotificationBell.test.tsx components/nav/ThreeColumnShell.tsx
git commit -m "feat(s3): NotificationBell with dynamic count; topbar integration"
```

---

## Task 11: TaskRow agent avatars unlock

**Files:**
- Modify: `components/task-detail/TaskRow.tsx`

- [ ] **Step 1: Add the avatars block**

Edit `components/task-detail/TaskRow.tsx`. Add imports at the top:

```tsx
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { Avatar } from "@/components/brand/avatar";
```

Inside the component (after `export function TaskRow(...)` declaration), insert:

```tsx
  const { data: agents = [] } = useWorkspaceAgents(wsId);
  const agentsMap = new Map(agents.map((a) => [a.id, a]));
```

Replace the bottom flex row (currently `<div className="flex items-center gap-2"><StatusChip ... /></div>`) with:

```tsx
      <div className="flex items-center justify-between gap-2">
        <StatusChip status={task.status} />
        {task.agents && task.agents.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.agents.slice(0, 3).map((id) => {
              const a = agentsMap.get(id);
              return a ? <Avatar key={id} name={a.name} size={18} /> : null;
            })}
          </div>
        )}
      </div>
```

- [ ] **Step 2: Verify the brand Avatar size prop**

Run: `grep -n "size" components/brand/avatar.tsx`
Expected: `Avatar` accepts a numeric `size` prop. If the prop name differs (e.g., `dimension`), adapt accordingly.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: PASS.

- [ ] **Step 4: Visual smoke-test**

`npm run dev`, navigate to a task list with a task that has `agents` populated. (Demo tasks have empty arrays, so no avatar group renders — this is expected, not a bug.)

- [ ] **Step 5: Commit**

```bash
git add components/task-detail/TaskRow.tsx
git commit -m "feat(s3): TaskRow agent avatars unlock"
```

---

## Task 12: Manual QA checklist

**Files:**
- Create: `docs/S3-T-MANUAL.md`

- [ ] **Step 1: Write the checklist file**

Create `docs/S3-T-MANUAL.md` with this exact content:

```markdown
# S3 Manual QA Checklist

> Run before merging the S3 PR. Mark each item ✅ (passed) / ⚠️ (passed with caveat) / ❌ (failed).
> Tester: ___________  Date: 2026-05-17

**Environment:**
- Backend running on :8080 (Postgres docker on :5433)
- Frontend `npm run dev` on :3000
- Logged in as qa@brainrot.local in workspace 05c5f4a0-4ce2-4350-b8df-86dc518dded7

## Happy path

- [ ] **1. Bell badge shows current ws pending count.** Sign in. Top-right bell shows digit equal to total pending approvals across all tasks in current ws.
- [ ] **2. Bell click navigates to hub.** Click bell → URL becomes `/w/{wsId}/approvals`.
- [ ] **3. Hub lists all pending sorted by urgency.** Cards ordered by expires_at ascending. Card with countdown < 5 min displays urgent (red + blink) styling.
- [ ] **4. Approve removes card and decrements bell.** Click "批准" → card disappears from hub → bell badge decrements by 1.
- [ ] **5. Deny removes card.** Same as 4 with "拒绝".
- [ ] **6. Approve-with-edits flow.** Click "批准并修改" → textarea appears → type note → click "提交" → card disappears.
- [ ] **7. Tool filter narrows list.** Type "Bash" → only Bash cards visible. Clear → all return.
- [ ] **8. Cancel-run button visible only when busy.** Enter a task with active run → "取消运行" button visible. Enter task without run → button absent.
- [ ] **9. Cancel-run dialog displays #18 note.** Click "取消运行" → dialog opens → italic note text contains "已知后端问题 #18" and "重新发送" appears.
- [ ] **10. Cancel-run cooldown.** Click confirm in dialog → button disabled. Wait 5s → button re-enabled. Within 5s, clicking is a no-op (dialog does not re-open).
- [ ] **11. TaskCard agent avatars render.** A task with `agents: [<uuid>]` shows the avatar(s) in TaskRow next to StatusChip.
- [ ] **12. Hub realtime new approvals.** Stay on hub. Trigger a new permission_request from another shell (e.g., post a message that causes Bash tool use). New card appears in hub within 1s.
- [ ] **13. Countdown expiry disables buttons.** Find a pending approval close to expiry (or wait it out). When countdown hits 0:00, hub card buttons disable and label changes to "已超时".

## Known harmless

- Demo tasks have `agents: []` so no avatars render on seeded data — this is expected.
- WS 405 task-GET warning in console (carried over from S2, documented).

## Outcomes

Pass: __  Caveat: __  Fail: __  Total: 13
```

- [ ] **Step 2: Run the checklist**

Manually run each item against `npm run dev`. Annotate the file with ✅ / ⚠️ / ❌ inline (replace `[ ]` with the marker).

- [ ] **Step 3: Commit**

```bash
git add docs/S3-T-MANUAL.md
git commit -m "test(s3): manual QA checklist (S3-T-MANUAL.md)"
```

---

## Task 13: Visual acceptance + screenshots

**Files:**
- Create: `docs/superpowers/reports/2026-05-17-s3-acceptance-report.md`

- [ ] **Step 1: Capture 5 screenshots**

Use the existing screenshot workflow (see S2 acceptance report for reference). Capture:

| Filename | View |
|---|---|
| `screenshots/s3-01-hub-3-pending.png` | Hub with 3+ pending cards |
| `screenshots/s3-02-hub-empty.png` | Hub empty state |
| `screenshots/s3-03-bell-badge.png` | Topbar with bell + badge digit |
| `screenshots/s3-04-cancel-dialog.png` | Cancel-run ConfirmDialog open |
| `screenshots/s3-05-task-avatars.png` | TaskRow with avatar group |

If no real fixture produces 3 pending approvals, manually inject permission_request messages via SQL or `POST /messages` with the right shape.

- [ ] **Step 2: Write the report**

Create `docs/superpowers/reports/2026-05-17-s3-acceptance-report.md`:

```markdown
# S3 Acceptance Report

> Date: 2026-05-17
> Branch: s3-approvals
> Tester: ___________

## Visual comparison

| # | Capture | Reference | Result | Notes |
|---|---|---|---|---|
| 1 | s3-01-hub-3-pending.png | ui_design/screens/ApprovalsHub.jsx | ✅/⚠️/❌ | |
| 2 | s3-02-hub-empty.png | S1 EmptyState pattern | ✅/⚠️/❌ | |
| 3 | s3-03-bell-badge.png | prototype topbar mockup | ✅/⚠️/❌ | |
| 4 | s3-04-cancel-dialog.png | (new — no prototype) | ✅/⚠️/❌ | internal review |
| 5 | s3-05-task-avatars.png | screenshots/13 (S0 prototype) | ✅/⚠️/❌ | |

## Manual QA outcome

See `docs/S3-T-MANUAL.md`.

## Known harmless

- (carry-over from S2)

## Known issues blocking merge

- (list, or "none")
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/reports/ screenshots/
git commit -m "docs(s3): visual acceptance report + 5 screenshots"
```

---

## Task 14: Documentation updates

**Files:**
- Modify: `docs/BACKEND_GAPS.md`
- Modify: `docs/FRONTEND.md` (if M4 milestone tracking exists there)

- [ ] **Step 1: Add BACKEND_GAPS #14**

Append to `docs/BACKEND_GAPS.md`:

```markdown
## #14 缺 `GET /api/v1/me/pending-approvals?count_only=1`（跨工作区 pending count）

- **状态**：缺失
- **发现**：2026-05-17，S3 设计阶段
- **影响**：S3 阶段 bell badge / hub 仅能展示"当前工作区"内的 pending count。多 ws 全局视图（S4 workspace switcher）需要这个 endpoint 才能给一个跨 ws 的总数。
- **Workaround（S3）**：bell 接 `usePendingApprovalsCount(currentWsId)`，从已 cache 的 task messages 派生当前 ws 内 count；进 hub 时并行触发 N≤20 task 的 `useTaskMessages` 拉取。
- **Need**：`GET /api/v1/me/pending-approvals?count_only=1` → `{ count: number }`，或 `GET /api/v1/me/pending-approvals` → `ApprovalRequest[]`（带 workspace_id 字段）让前端自己 group。S4 接入。
```

- [ ] **Step 2: Mark #6 and #13 as resolved**

Edit `docs/BACKEND_GAPS.md` entries #6 and #13. Change `**状态**：schema 不一致 ...` (or `缺失 / 待 mock`) to `**状态**：✅ 已 resolved（2026-05-17，S3 实测后端已返）`. Keep the entry body intact for historical context.

- [ ] **Step 3: Update FRONTEND.md M4**

Run: `grep -n "M4\|S3" docs/FRONTEND.md`
If the file tracks milestones, change `M4 / S3` row from `进行中` / `未开始` to `✅ 完成（PR #N）` where `#N` is the PR number (left blank if PR not yet open).

- [ ] **Step 4: Commit**

```bash
git add docs/BACKEND_GAPS.md docs/FRONTEND.md
git commit -m "docs(s3): mark #6/#13 resolved; add gap #14 for cross-ws count"
```

---

## Task 15: Open PR

**Files:**
- None (PR operation only)

- [ ] **Step 1: Push branch**

```bash
git push -u origin s3-approvals
```

- [ ] **Step 2: Run final pre-PR checks**

```bash
npm run lint
npm run typecheck
npm test -- --run
```
Expected: all PASS.

- [ ] **Step 3: Open the PR**

```bash
gh pr create --title "S3: Approvals hub + bell badge + cancel-run + agent avatars" --body "$(cat <<'EOF'
## Summary
- New `/w/[wsId]/approvals` hub aggregates pending approvals across current ws; sort by urgency; tool-name filter.
- Topbar bell badge wired to live count (派生自 task messages cache).
- TaskHeader cancel-run button with 5s cooldown + ConfirmDialog (含 BACKEND_GAPS #18 注脚).
- TaskRow agent avatars unlock (BACKEND_GAPS #13 resolved).
- Task detail right-panel approvals tab upgraded to double-path (`GET /tasks/{id}/approvals` + 404 fallback derive).

## Out of scope
- artifacts/assets list endpoints (BACKEND_GAPS #9 #10 still missing) — push to S3.2
- multi-ws global pending count (BACKEND_GAPS #14, new) — push to S4
- 已处理审批历史 hub view — push to S5

## Test plan
- [ ] `npm test -- --run` passes (~40+ tests including new S3 ones)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Manual QA checklist `docs/S3-T-MANUAL.md` walked through, all items ✅ or ⚠️ with documented caveat
- [ ] Visual acceptance report `docs/superpowers/reports/2026-05-17-s3-acceptance-report.md` filled in, 5/5 screenshots compared

## Spec / plan
- Spec: `docs/superpowers/specs/2026-05-17-s3-approvals-design.md`
- Plan: `docs/superpowers/plans/2026-05-17-s3-approvals.md`
EOF
)"
```

- [ ] **Step 4: Return PR URL to user**

Paste the URL printed by `gh pr create`. Done — await user review/merge.

---

## Self-Review checklist (run before handoff)

- [ ] Spec §3 architecture diagram — every box mapped to at least one task (T1–T11)
- [ ] Spec §5.1 new files (~11) — all created across T2/T3/T4/T5/T6/T7/T8/T9/T10
- [ ] Spec §5.2 modified files — T1 (types/keys), T9 (TaskHeader), T10 (ThreeColumnShell), T11 (TaskRow)
- [ ] Spec §6 error scenarios — covered: 404 fallback (T3, T5), cancel 500 (T9 step 5 mock), cooldown (T9), badge clamp (T10)
- [ ] Spec §7 test counts roughly hit: derive ~7-10 (T2 → 8), workspace pending ~4-5 (T4 → 3), task history ~3-4 (T5 → 3), cancel ~3-4 (T9 → 4), card ~5 (T6 → 5), bell ~4 (T10 → 4) — total ~27 new tests
- [ ] Manual checklist T12 mirrors spec §7.3 (13 items, matches)
- [ ] Open items from spec §9: cancel-run queue verification → T9 Step 1; useCurrentWsId existence check → T10 Step 4 (verified via `useParams`); doc updates → T14
- [ ] No placeholder text remaining (search this file for "TBD"/"TODO" — should be zero)

---

**End of plan.**

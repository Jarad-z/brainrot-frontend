# S4 Workspace Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "workspace ecosystem write operations" sprint (M5): unlock the sidebar workspace switcher with dropdown + create-ws modal, upgrade the bell badge to cross-workspace + smart routing with a new top-level `/approvals` hub, implement Agent CRUD (new / edit / archive) with base64 read/write asymmetry handled in the API client, ship `/w/[wsId]/runtimes` with install-token modal, and `/w/[wsId]/settings` with add-member modal + my-user-id.

**Architecture:** All five capability areas hang off a thin `WorkspaceProvider` whose `currentWsId` is derived from `useParams()` (never stored in state — URL is the single source of truth). New hooks call existing `apiFetch` from `lib/api/client.ts`; mutations use React Query's `useMutation` with `invalidateQueries`. The agent base64 asymmetry (POST takes raw JSON, GET returns base64-encoded jsonb) is fully contained in `lib/api/agents.ts` via `encodeAgentPayload` / `decodeAgentResponse` — upper layers never see wire format. Reuse the existing `components/brand/confirm-dialog.tsx` for destructive actions; reuse existing approval primitives (`ApprovalHubCard`, `ApprovalsHubPage`) for the new top-level hub.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, TanStack React Query, shadcn/ui (Dialog, Tooltip), Tailwind, Vitest + RTL + jsdom (vi.spyOn pattern, no MSW), conventional commits.

**Branch:** `s4-workspace-mgmt`, already created from `main` (commit `dbb2bb6` = S3.1 PR#5 merged). The S4 spec commit (`450fdec`) is already on this branch. **Do this work on `s4-workspace-mgmt`.**

**Pre-flight check (run once before T1):**

```bash
git status                       # Expect: on s4-workspace-mgmt, clean
git log --oneline -2             # Expect: 450fdec docs(s4): brainstorm spec ...
npm install                      # In case anything was added on main
npm run lint && npm run typecheck && npm test -- --run
```

Expected: all checks pass against main + spec-only baseline. If anything fails, STOP and fix before starting T1.

**Conventions (matches S0–S3):**

- Conventional Commits, no emoji, no AI attribution
- `apiFetch<T>` from `lib/api/client.ts` already throws `ApiError(status, body)` and returns `undefined` for 204
- Test pattern: vitest + RTL + `vi.spyOn` on the API module (NOT msw); QueryClient with `retry: false`
- New files: 2-space indent, double quotes, named exports
- Tailwind via existing design tokens (`bg-paper-0`, `text-ink-0`, `border-hairline`, `text-state-failed`, etc.)
- All user-facing copy in Chinese, routed through `lib/messages.ts` (add new keys as needed)

**Reuse, do not recreate:**

- `components/brand/confirm-dialog.tsx` — already exists (added in S3); use as-is for archive confirmation
- `components/brand/ws-switcher.tsx` — the current placeholder trigger; we keep it as the dropdown trigger and add the popover around it (the unused orphan `components/nav/WorkspaceSwitcher.tsx` will be deleted in T2)
- `components/layout/NotificationBell.tsx` — already exists, hardcoded to single-ws; we'll upgrade it in T3 (single-file modify, not rewrite)
- `components/approvals/ApprovalHubCard.tsx` + `ApprovalsHubPage.tsx` — reuse for the new top-level `/approvals` route; only the data source hook differs
- `components/ui/dialog.tsx` — shadcn Dialog base used by all our modals

---

## File Map

**New files (28):**

State / API client
- `lib/api/me.ts` — `fetchPendingApprovals` / `fetchPendingApprovalsCount`
- `lib/api/runtimes.ts` — `fetchWorkspaceRuntimes` / `issueInstallToken`
- `lib/api/members.ts` — `addWorkspaceMember`
- `lib/workspace-context.tsx` — `WorkspaceProvider` + `useWorkspaceContext`
- `lib/api/agents-encoding.ts` — pure base64 helpers (separated for unit testability)
- `lib/api/agents-encoding.test.ts` — base64 encode/decode unit tests

Hooks
- `hooks/useWorkspaces.ts` — list workspaces query
- `hooks/useCreateWorkspace.ts` — create-ws mutation
- `hooks/useCreateAgent.ts` — create mutation (with encoded payload)
- `hooks/useUpdateAgent.ts` — update mutation (with encoded payload)
- `hooks/useArchiveAgent.ts` — archive (DELETE) mutation
- `hooks/useWorkspaceRuntimes.ts` — query (first fetch + WS overlay handled in component)
- `hooks/useIssueInstallToken.ts` — mutation (token NOT cached)
- `hooks/useAddMember.ts` — mutation
- `hooks/useGlobalPendingApprovalsCount.ts` — query, 30s poll + WS invalidate
- `hooks/useGlobalPendingApprovals.ts` — query, full list for top-level hub
- `hooks/useCreateWorkspace.test.tsx` — mutation success + 409 conflict
- `hooks/useCreateAgent.test.tsx` — verifies POST sends raw JSON (not base64)
- `hooks/useIssueInstallToken.test.tsx` — verifies token does NOT enter the React Query cache

Components — workspace
- `components/workspace/WorkspaceSwitcherDropdown.tsx` — dropdown popover wrapping `WsSwitcher`
- `components/workspace/CreateWorkspaceModal.tsx`
- `components/workspace/InstallTokenModal.tsx`
- `components/workspace/AddMemberModal.tsx`

Components — agents
- `components/agents/AgentForm.tsx` — shared new/edit form (textareas + JSON validation)
- `components/agents/AgentForm.test.tsx` — JSON validation + submit shape
- `components/agents/ArchiveAgentButton.tsx` — uses existing `ConfirmDialog`

Components — runtimes
- `components/runtimes/RuntimeRow.tsx`

App routes
- `app/(app)/approvals/page.tsx` — top-level cross-workspace hub
- `app/(app)/approvals/layout.tsx` — shell wrapper (no params)
- `app/(app)/w/[wsId]/agents/new/page.tsx`
- `app/(app)/w/[wsId]/agents/[agentId]/page.tsx`
- `app/(app)/w/[wsId]/runtimes/page.tsx`
- `app/(app)/w/[wsId]/settings/page.tsx`

**Modified files (10):**

- `lib/api/types.ts` — add `AgentWire` (wire form), refactor `Agent` to decoded form; add `Runtime`, `InstallToken`, `PendingApproval`, `WorkspaceMemberInput` types
- `lib/api/agents.ts` — add `createAgent` / `updateAgent` / `archiveAgent`; switch `fetchWorkspaceAgents` to decode wire→Agent
- `lib/api/workspaces.ts` — add `fetchWorkspaces` / `createWorkspace` (CREATE if file is missing, MODIFY if present)
- `lib/api/keys.ts` — add `me.pendingApprovals`, `me.pendingApprovalsCount`, `workspaces.runtimes`, `agents.detail`
- `lib/messages.ts` — add `agents.*`, `runtimes.*`, `settings.*`, `createWs.*`, `installToken.*`, `addMember.*` keys; remove obsolete `wsListDisabled`
- `components/nav/Sidebar.tsx` — swap static `WsSwitcher` for `WorkspaceSwitcherDropdown`; unlock 审批 / Agents / Runtimes / 设置 NavItems
- `components/layout/NotificationBell.tsx` — global count + smart routing
- `app/(app)/layout.tsx` — wrap children in `WorkspaceProvider`
- `app/(app)/w/[wsId]/agents/page.tsx` — add "+ 新建 agent" button + "显示已归档" toggle + use decoded Agent
- `components/nav/WorkspaceSwitcher.tsx` — DELETE (orphan from S1, never used; `WsSwitcher` is the live primitive)

That's 28 + 10 = 38 file touches across 14 tasks. Estimated wall-clock: 12–15h.

---

## Task 1: Add types for runtimes, install tokens, members, pending approvals; refactor Agent type for base64 split

**Files:**
- Modify: `lib/api/types.ts` (append after `EnqueuedRun`)

This is a pure types/refactor task. No tests; later tasks fail-fast at typecheck if shapes drift.

- [ ] **Step 1: Refactor `Agent` and add `AgentWire`**

Find the existing `Agent` interface (around line 52 of `lib/api/types.ts`). Replace the three `string` fields (`custom_env`, `custom_args`, `mcp_config`) with their decoded JS shapes; add the wire form alongside.

Replace:

```ts
export interface Agent {
  id: string;
  workspace_id: string;
  runtime_id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  description: string;
  instructions: string;
  backend_type: AgentBackendType;
  model: string | null;
  custom_env: string;
  custom_args: string;
  mcp_config: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}
```

with:

```ts
/** Decoded form used everywhere except inside lib/api/agents.ts. */
export interface Agent {
  id: string;
  workspace_id: string;
  runtime_id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  description: string;
  instructions: string;
  backend_type: AgentBackendType;
  model: string | null;
  custom_env: Record<string, string>;
  custom_args: string[];
  mcp_config: Record<string, unknown>;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

/** Wire form returned by the backend — three jsonb fields arrive base64-encoded. */
export interface AgentWire {
  id: string;
  workspace_id: string;
  runtime_id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  description: string;
  instructions: string;
  backend_type: AgentBackendType;
  model: string | null;
  custom_env: string;
  custom_args: string;
  mcp_config: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

/** Input shape for POST /agents and PATCH /agents/{id}. Already in decoded form. */
export interface AgentInput {
  runtime_id: string;
  handle: string;
  name: string;
  avatar_url?: string;
  description?: string;
  instructions?: string;
  model?: string;
  custom_env: Record<string, string>;
  custom_args: string[];
  mcp_config: Record<string, unknown>;
}
```

- [ ] **Step 2: Append new types at end of file**

After the `EnqueuedRun` interface (around line 137), append:

```ts
export interface Runtime {
  id: string;
  workspace_id: string;
  host: string;
  online: boolean;
  last_heartbeat: string | null;
  capacity: number;
  created_at: string;
}

export interface InstallToken {
  token: string;
  expires_at: string;
}

/** From GET /me/pending-approvals — ApprovalRequest plus enough ws/agent context for the top-level hub. */
export interface PendingApproval extends ApprovalRequest {
  workspace_id: string;
  workspace_name: string;
  agent_id: string;
  agent_handle: string;
  task_card_id: string;
  task_title: string;
}

export type WorkspaceRole = "owner" | "editor" | "member" | "viewer";

export interface WorkspaceMemberInput {
  user_id: string;
  role: WorkspaceRole;
}

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`

Expected: many failures in `hooks/useWorkspaceAgents.ts`, `app/(app)/w/[wsId]/agents/page.tsx`, and any component reading `custom_env` as a string. **This is expected** — those callsites are updated in T4–T6. Note the failures, do not fix them yet.

- [ ] **Step 4: Commit**

```bash
git add lib/api/types.ts
git commit -m "feat(s4): types for runtimes/install-token/members + Agent base64 split"
```

---

## Task 2: WorkspaceProvider with URL-derived currentWsId; useWorkspaces query

**Files:**
- Create: `lib/api/workspaces.ts` (this file does not exist yet — confirm with `ls lib/api/workspaces.ts`)
- Modify: `lib/api/keys.ts`
- Create: `hooks/useWorkspaces.ts`
- Create: `lib/workspace-context.tsx`
- Modify: `app/(app)/layout.tsx`

- [ ] **Step 1: Confirm `lib/api/workspaces.ts` does not yet exist**

Run: `ls lib/api/workspaces.ts 2>&1`
Expected: `ls: cannot access ... No such file or directory`. If it exists, read it first and add functions instead of overwriting.

- [ ] **Step 2: Create `lib/api/workspaces.ts`**

```ts
import { apiFetch } from "./client";
import type { CreateWorkspaceInput, Workspace } from "./types";

export async function fetchWorkspaces(): Promise<Workspace[]> {
  return apiFetch<Workspace[]>("/api/v1/workspaces");
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  return apiFetch<Workspace>("/api/v1/workspaces", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
```

- [ ] **Step 3: Extend `lib/api/keys.ts`**

Modify `lib/api/keys.ts`. Replace the file with:

```ts
export const queryKeys = {
  me: {
    self: () => ["me"] as const,
    pendingApprovals: () => ["me", "pending-approvals"] as const,
    pendingApprovalsCount: () => ["me", "pending-approvals", "count"] as const,
  },
  workspaces: {
    list: () => ["workspaces"] as const,
    detail: (wsId: string) => ["workspaces", wsId] as const,
    projects: (wsId: string) => ["workspaces", wsId, "projects"] as const,
    agents: (wsId: string) => ["workspaces", wsId, "agents"] as const,
    runtimes: (wsId: string) => ["workspaces", wsId, "runtimes"] as const,
    approvals: (wsId: string) => ["workspaces", wsId, "approvals"] as const,
  },
  agents: {
    detail: (agentId: string) => ["agents", agentId] as const,
  },
  projects: {
    detail: (projectId: string) => ["projects", projectId] as const,
    tasks: (projectId: string) => ["projects", projectId, "tasks"] as const,
    assets: (projectId: string) => ["projects", projectId, "assets"] as const,
  },
  tasks: {
    detail: (taskId: string) => ["tasks", taskId] as const,
    messages: (taskId: string) => ["tasks", taskId, "messages"] as const,
    artifacts: (taskId: string) => ["tasks", taskId, "artifacts"] as const,
  },
  approvals: {
    task: (taskId: string) => ["approvals", "task", taskId] as const,
  },
} as const;
```

**Note:** `me()` changed from a function returning `["me"]` to a namespace with `me.self()`. Search for callers: `grep -rn "queryKeys.me" --include="*.ts" --include="*.tsx"`. Update each callsite to `queryKeys.me.self()`. The hook `hooks/useSession.ts` is the primary caller — update it.

- [ ] **Step 4: Create `hooks/useWorkspaces.ts`**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/api/keys";

export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces.list(),
    queryFn: fetchWorkspaces,
    staleTime: 30_000,
  });
}
```

- [ ] **Step 5: Create `lib/workspace-context.tsx`**

```tsx
"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import type { Workspace } from "@/lib/api/types";

interface WorkspaceContextValue {
  currentWsId: string | null;
  wsList: Workspace[];
  isLoading: boolean;
  switchTo: (wsId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const params = useParams<{ wsId?: string }>();
  const router = useRouter();
  const { data: wsList = [], isLoading } = useWorkspaces();

  const currentWsId = params?.wsId ?? null;

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      currentWsId,
      wsList,
      isLoading,
      switchTo: (wsId: string) => {
        try {
          localStorage.setItem("brainrot.lastWsId", wsId);
        } catch {
          // localStorage may be unavailable (private mode, etc.) — ignore
        }
        router.push(`/w/${wsId}`);
      },
    }),
    [currentWsId, wsList, isLoading, router],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceContext must be used inside <WorkspaceProvider>");
  return ctx;
}
```

- [ ] **Step 6: Wrap `app/(app)/layout.tsx` with `WorkspaceProvider`**

Read `app/(app)/layout.tsx` first. Locate the JSX return — wrap whatever currently renders (likely `<ThreeColumnShell>`) with `<WorkspaceProvider>{...}</WorkspaceProvider>`. Add the import:

```tsx
import { WorkspaceProvider } from "@/lib/workspace-context";
```

- [ ] **Step 7: Run typecheck + tests**

Run: `npm run typecheck && npm test -- --run`
Expected: typecheck passes for the new code; existing tests still pass (Agent-type errors from T1 remain — those are fixed in T4).

- [ ] **Step 8: Commit**

```bash
git add lib/api/workspaces.ts lib/api/keys.ts hooks/useWorkspaces.ts lib/workspace-context.tsx app/\(app\)/layout.tsx hooks/useSession.ts
git commit -m "feat(s4): WorkspaceProvider + useWorkspaces; queryKeys restructure for me/pending + workspaces.list"
```

---

## Task 3: Cross-workspace bell — global count + smart routing

**Files:**
- Create: `lib/api/me.ts`
- Create: `hooks/useGlobalPendingApprovalsCount.ts`
- Modify: `components/layout/NotificationBell.tsx`
- Modify: `components/nav/ThreeColumnShell.tsx`

- [ ] **Step 1: Create `lib/api/me.ts`**

```ts
import { apiFetch } from "./client";
import type { PendingApproval } from "./types";

interface CountResponse {
  count: number;
}

export async function fetchPendingApprovalsCount(): Promise<number> {
  const r = await apiFetch<CountResponse>("/api/v1/me/pending-approvals?count_only=1");
  return r.count;
}

export async function fetchPendingApprovals(): Promise<PendingApproval[]> {
  return apiFetch<PendingApproval[]>("/api/v1/me/pending-approvals");
}
```

- [ ] **Step 2: Create `hooks/useGlobalPendingApprovalsCount.ts`**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPendingApprovalsCount } from "@/lib/api/me";
import { queryKeys } from "@/lib/api/keys";

export function useGlobalPendingApprovalsCount() {
  return useQuery({
    queryKey: queryKeys.me.pendingApprovalsCount(),
    queryFn: fetchPendingApprovalsCount,
    refetchInterval: 30_000,
    staleTime: 0,
  });
}
```

- [ ] **Step 3: Rewrite `components/layout/NotificationBell.tsx`**

Replace the existing file with:

```tsx
"use client";
import { useRouter, usePathname } from "next/navigation";
import { IconButton } from "@/components/brand/icon-button";
import { useGlobalPendingApprovalsCount } from "@/hooks/useGlobalPendingApprovalsCount";

function badgeFromCount(n: number): number | string | undefined {
  if (n <= 0) return undefined;
  if (n > 99) return "99+";
  return n;
}

const WS_ROUTE = /^\/w\/([^/]+)/;

export function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { data: count = 0 } = useGlobalPendingApprovalsCount();
  const badge = badgeFromCount(count);

  const onClick = () => {
    const m = pathname.match(WS_ROUTE);
    if (m) router.push(`/w/${m[1]}/approvals`);
    else router.push("/approvals");
  };

  return (
    <IconButton
      aria-label="通知"
      onClick={onClick}
      badge={badge}
      title={count > 0 ? `${count} 件待审批` : "暂无待审批"}
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
    </IconButton>
  );
}
```

- [ ] **Step 4: Update `components/nav/ThreeColumnShell.tsx` — render bell unconditionally**

Find the line `{currentWsId ? <NotificationBell wsId={currentWsId} /> : null}` (around line 48). Replace with:

```tsx
<NotificationBell />
```

Remove the now-unused `useParams` destructure if `currentWsId` was its only consumer (it likely is — check and clean up). Remove the `params` import if no longer used.

- [ ] **Step 5: Write bell-routing unit test**

Create `components/layout/NotificationBell.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { NotificationBell } from "./NotificationBell";
import * as meApi from "@/lib/api/me";

const pushMock = vi.fn();
const pathnameRef = { current: "/" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => pathnameRef.current,
}));

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("NotificationBell", () => {
  it("routes to /w/{wsId}/approvals when path is workspace-scoped", async () => {
    pushMock.mockReset();
    pathnameRef.current = "/w/ws-abc/p/p1";
    vi.spyOn(meApi, "fetchPendingApprovalsCount").mockResolvedValue(3);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<NotificationBell />, { wrapper: wrapper(qc) });
    fireEvent.click(screen.getByRole("button"));
    expect(pushMock).toHaveBeenCalledWith("/w/ws-abc/approvals");
  });

  it("routes to /approvals when path is top-level", () => {
    pushMock.mockReset();
    pathnameRef.current = "/approvals";
    vi.spyOn(meApi, "fetchPendingApprovalsCount").mockResolvedValue(0);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<NotificationBell />, { wrapper: wrapper(qc) });
    fireEvent.click(screen.getByRole("button"));
    expect(pushMock).toHaveBeenCalledWith("/approvals");
  });
});
```

- [ ] **Step 6: Run the new test**

Run: `npm test -- --run components/layout/NotificationBell.test.tsx`
Expected: both tests PASS.

- [ ] **Step 7: Run typecheck + full test suite**

Run: `npm run typecheck && npm test -- --run`
Expected: typecheck passes (Agent errors still present from T1); existing tests pass; new bell tests pass.

- [ ] **Step 8: Commit**

```bash
git add lib/api/me.ts hooks/useGlobalPendingApprovalsCount.ts components/layout/NotificationBell.tsx components/layout/NotificationBell.test.tsx components/nav/ThreeColumnShell.tsx
git commit -m "feat(s4): cross-workspace bell count + smart routing"
```

---

## Task 4: Agent base64 encoding/decoding boundary in API client

**Files:**
- Create: `lib/api/agents-encoding.ts`
- Create: `lib/api/agents-encoding.test.ts`
- Modify: `lib/api/agents.ts`
- Modify: `hooks/useWorkspaceAgents.ts`
- Modify: `app/(app)/w/[wsId]/agents/page.tsx`

- [ ] **Step 1: Write `lib/api/agents-encoding.test.ts` first (TDD)**

```ts
import { describe, it, expect } from "vitest";
import { decodeAgentResponse, encodeAgentInput } from "./agents-encoding";
import type { AgentWire, AgentInput } from "./types";

const wireBase: Omit<AgentWire, "custom_env" | "custom_args" | "mcp_config"> = {
  id: "a1",
  workspace_id: "ws1",
  runtime_id: "rt1",
  handle: "writer",
  name: "Writer",
  avatar_url: null,
  description: "",
  instructions: "",
  backend_type: "claude",
  model: "claude-sonnet-4-6",
  archived: false,
  created_at: "2026-05-18T00:00:00Z",
  updated_at: "2026-05-18T00:00:00Z",
};

function b64(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}

describe("decodeAgentResponse", () => {
  it("decodes base64-encoded jsonb fields into JS objects", () => {
    const wire: AgentWire = {
      ...wireBase,
      custom_env: b64({ OPENAI_API_KEY: "sk-x" }),
      custom_args: b64(["--verbose"]),
      mcp_config: b64({ servers: { fs: { command: "mcp-fs" } } }),
    };
    const a = decodeAgentResponse(wire);
    expect(a.custom_env).toEqual({ OPENAI_API_KEY: "sk-x" });
    expect(a.custom_args).toEqual(["--verbose"]);
    expect(a.mcp_config).toEqual({ servers: { fs: { command: "mcp-fs" } } });
  });

  it("treats empty string as empty container", () => {
    const wire: AgentWire = {
      ...wireBase,
      custom_env: "",
      custom_args: "",
      mcp_config: "",
    };
    const a = decodeAgentResponse(wire);
    expect(a.custom_env).toEqual({});
    expect(a.custom_args).toEqual([]);
    expect(a.mcp_config).toEqual({});
  });

  it("treats base64-encoded null as empty container", () => {
    const wire: AgentWire = {
      ...wireBase,
      custom_env: b64(null),
      custom_args: b64(null),
      mcp_config: b64(null),
    };
    const a = decodeAgentResponse(wire);
    expect(a.custom_env).toEqual({});
    expect(a.custom_args).toEqual([]);
    expect(a.mcp_config).toEqual({});
  });

  it("throws on invalid JSON inside the base64 payload", () => {
    const wire: AgentWire = {
      ...wireBase,
      custom_env: Buffer.from("not-json{").toString("base64"),
      custom_args: "",
      mcp_config: "",
    };
    expect(() => decodeAgentResponse(wire)).toThrow(/decode.*custom_env/i);
  });
});

describe("encodeAgentInput", () => {
  it("passes structured fields through unchanged (POST takes raw JSON, not base64)", () => {
    const input: AgentInput = {
      runtime_id: "rt1",
      handle: "writer",
      name: "Writer",
      custom_env: { K: "V" },
      custom_args: ["--x"],
      mcp_config: { a: 1 },
    };
    const out = encodeAgentInput(input);
    expect(out.custom_env).toEqual({ K: "V" });
    expect(out.custom_args).toEqual(["--x"]);
    expect(out.mcp_config).toEqual({ a: 1 });
    expect(typeof out.custom_env).toBe("object");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run lib/api/agents-encoding.test.ts`
Expected: FAIL with module-not-found for `./agents-encoding`.

- [ ] **Step 3: Create `lib/api/agents-encoding.ts`**

```ts
import type { Agent, AgentInput, AgentWire } from "./types";

function decodeField<T>(field: string, raw: string, fallback: T): T {
  if (raw === "") return fallback;
  let jsonText: string;
  try {
    if (typeof atob === "function") {
      jsonText = atob(raw);
    } else {
      jsonText = Buffer.from(raw, "base64").toString("utf8");
    }
  } catch (e) {
    throw new Error(`failed to decode ${field}: invalid base64 (${(e as Error).message})`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`failed to decode ${field}: invalid JSON (${(e as Error).message})`);
  }
  if (parsed === null || parsed === undefined) return fallback;
  return parsed as T;
}

export function decodeAgentResponse(wire: AgentWire): Agent {
  return {
    ...wire,
    custom_env: decodeField<Record<string, string>>("custom_env", wire.custom_env, {}),
    custom_args: decodeField<string[]>("custom_args", wire.custom_args, []),
    mcp_config: decodeField<Record<string, unknown>>("mcp_config", wire.mcp_config, {}),
  };
}

/**
 * POST /agents accepts raw JSON for the three jsonb fields (the asymmetry only
 * affects GET responses). This pass-through exists so callers route through
 * a single boundary — keeps the contract obvious and future-proofs against
 * backend cleanup of BACKEND_GAPS #21.
 */
export function encodeAgentInput(input: AgentInput): AgentInput {
  return {
    ...input,
    custom_env: input.custom_env,
    custom_args: input.custom_args,
    mcp_config: input.mcp_config,
  };
}
```

- [ ] **Step 4: Re-run the test**

Run: `npm test -- --run lib/api/agents-encoding.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Rewrite `lib/api/agents.ts` to use the boundary**

Replace the file with:

```ts
import { apiFetch } from "./client";
import type { Agent, AgentInput, AgentWire } from "./types";
import { decodeAgentResponse, encodeAgentInput } from "./agents-encoding";

export async function fetchWorkspaceAgents(wsId: string): Promise<Agent[]> {
  const wire = await apiFetch<AgentWire[]>(`/api/v1/workspaces/${wsId}/agents`);
  return wire.map(decodeAgentResponse);
}

export async function fetchAgent(agentId: string): Promise<Agent> {
  const wire = await apiFetch<AgentWire>(`/api/v1/agents/${agentId}`);
  return decodeAgentResponse(wire);
}

export async function createAgent(wsId: string, input: AgentInput): Promise<Agent> {
  const wire = await apiFetch<AgentWire>(`/api/v1/workspaces/${wsId}/agents`, {
    method: "POST",
    body: JSON.stringify(encodeAgentInput(input)),
  });
  return decodeAgentResponse(wire);
}

export async function updateAgent(agentId: string, input: AgentInput): Promise<Agent> {
  const wire = await apiFetch<AgentWire>(`/api/v1/agents/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(encodeAgentInput(input)),
  });
  return decodeAgentResponse(wire);
}

export async function archiveAgent(agentId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/agents/${agentId}`, { method: "DELETE" });
}
```

- [ ] **Step 6: Verify `useWorkspaceAgents.ts` and `app/(app)/w/[wsId]/agents/page.tsx` typecheck**

Run: `npm run typecheck`
Expected: errors from T1 about `custom_env` being `string` should be gone, since the hook now returns the decoded `Agent[]`. Any remaining errors are real — fix them in those files (likely a callsite that read `custom_env` as a string for display; render it as `JSON.stringify(agent.custom_env, null, 2)` or `Object.keys(agent.custom_env).length` depending on context).

- [ ] **Step 7: Run full test suite**

Run: `npm test -- --run`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add lib/api/agents-encoding.ts lib/api/agents-encoding.test.ts lib/api/agents.ts hooks/useWorkspaceAgents.ts app/\(app\)/w/\[wsId\]/agents/page.tsx
git commit -m "feat(s4): agent CRUD API client + base64 wire boundary (BACKEND_GAPS #21 workaround)"
```

---

## Task 5: Sidebar workspace switcher dropdown + create-ws modal

**Files:**
- Create: `components/workspace/WorkspaceSwitcherDropdown.tsx`
- Create: `components/workspace/CreateWorkspaceModal.tsx`
- Create: `hooks/useCreateWorkspace.ts`
- Create: `hooks/useCreateWorkspace.test.tsx`
- Modify: `components/nav/Sidebar.tsx`
- Modify: `lib/messages.ts`
- Delete: `components/nav/WorkspaceSwitcher.tsx` (orphan)

- [ ] **Step 1: Add new message keys**

Edit `lib/messages.ts`. Inside the `shell` block (around line 31), change `wsListDisabled` to `wsListEmpty: "还没有工作区"` (we no longer say "disabled"). Add a new top-level block before the closing brace:

```ts
  createWs: {
    title: "创建工作区",
    nameLabel: "工作区名称",
    namePlaceholder: "例如：Marketing-Q2",
    slugLabel: "Slug",
    slugPlaceholder: "marketing-q2",
    slugHelp: "URL 友好，仅小写字母、数字、连字符",
    cta: "创建",
    cancel: "取消",
    slugConflict: "该 slug 已被占用",
    creating: "创建中…",
  },
```

Find every existing reference to `messages.shell.wsListDisabled` (search: `grep -rn wsListDisabled --include="*.tsx" --include="*.ts"`). Replace each with `messages.shell.wsListEmpty`. The orphan `components/nav/WorkspaceSwitcher.tsx` will be deleted in Step 7, so its reference doesn't need updating.

- [ ] **Step 2: Write `hooks/useCreateWorkspace.test.tsx` (TDD)**

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCreateWorkspace } from "./useCreateWorkspace";
import { ApiError } from "@/lib/api/client";
import * as wsApi from "@/lib/api/workspaces";
import type { Workspace } from "@/lib/api/types";

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeWs(): Workspace {
  return {
    id: "ws-new",
    name: "Marketing-Q2",
    slug: "marketing-q2",
    owner_id: "u1",
    created_at: "2026-05-18T00:00:00Z",
    updated_at: "2026-05-18T00:00:00Z",
  };
}

describe("useCreateWorkspace", () => {
  it("returns the created workspace on success and invalidates the list", async () => {
    const ws = makeWs();
    vi.spyOn(wsApi, "createWorkspace").mockResolvedValue(ws);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useCreateWorkspace(), { wrapper: wrapper(qc) });
    await act(async () => {
      await result.current.mutateAsync({ name: "Marketing-Q2", slug: "marketing-q2" });
    });

    await waitFor(() => expect(result.current.data?.id).toBe("ws-new"));
    expect(spy).toHaveBeenCalledWith({ queryKey: ["workspaces"] });
  });

  it("surfaces ApiError on 409 conflict", async () => {
    vi.spyOn(wsApi, "createWorkspace").mockRejectedValue(new ApiError(409, "slug taken"));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useCreateWorkspace(), { wrapper: wrapper(qc) });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ name: "X", slug: "marketing-q2" });
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- --run hooks/useCreateWorkspace.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 4: Create `hooks/useCreateWorkspace.ts`**

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkspace } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/api/keys";
import type { CreateWorkspaceInput, Workspace } from "@/lib/api/types";

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation<Workspace, Error, CreateWorkspaceInput>({
    mutationFn: createWorkspace,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
    },
  });
}
```

- [ ] **Step 5: Re-run the test**

Run: `npm test -- --run hooks/useCreateWorkspace.test.tsx`
Expected: PASS.

- [ ] **Step 6: Create `components/workspace/CreateWorkspaceModal.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateWorkspace } from "@/hooks/useCreateWorkspace";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

interface CreateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function CreateWorkspaceModal({ open, onOpenChange }: CreateWorkspaceModalProps) {
  const router = useRouter();
  const m = messages.createWs;
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const mutation = useCreateWorkspace();

  const canSubmit =
    name.trim().length > 0 && SLUG_RE.test(slug) && !mutation.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSlugError(null);
    try {
      const ws = await mutation.mutateAsync({ name: name.trim(), slug });
      setName("");
      setSlug("");
      onOpenChange(false);
      router.push(`/w/${ws.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSlugError(m.slugConflict);
      } else {
        setSlugError((err as Error).message ?? "unknown error");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{m.title}</DialogTitle>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-1">{m.nameLabel}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={m.namePlaceholder}
              className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-1">{m.slugLabel}</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugError(null);
              }}
              placeholder={m.slugPlaceholder}
              className={
                slugError
                  ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm"
                  : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
              }
            />
            {slugError ? (
              <span className="text-xs text-state-failed">{slugError}</span>
            ) : (
              <span className="text-xs text-ink-2">{m.slugHelp}</span>
            )}
          </label>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
            >
              {m.cancel}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
            >
              {mutation.isPending ? m.creating : m.cta}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 7: Create `components/workspace/WorkspaceSwitcherDropdown.tsx`**

```tsx
"use client";

import { useState } from "react";
import { WsSwitcher } from "@/components/brand/ws-switcher";
import { useWorkspaceContext } from "@/lib/workspace-context";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { messages } from "@/lib/messages";

function avatarFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function WorkspaceSwitcherDropdown() {
  const { currentWsId, wsList, switchTo } = useWorkspaceContext();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const current = wsList.find((w) => w.id === currentWsId) ?? wsList[0];
  const label = current?.name ?? messages.shell.wsListEmpty;
  const meta = current?.slug;
  const avatar = current ? avatarFromName(current.name) : "·";

  return (
    <div className="relative">
      <WsSwitcher
        name={label}
        meta={meta}
        avatar={avatar}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      />
      {open ? (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-30 bg-paper-0 border-[1.5px] border-hairline rounded-md shadow-lg max-h-72 overflow-y-auto"
          role="listbox"
          onBlur={() => setOpen(false)}
        >
          {wsList.length === 0 ? (
            <p className="px-3 py-2 text-xs text-ink-2">{messages.shell.wsListEmpty}</p>
          ) : (
            wsList.map((ws) => (
              <button
                key={ws.id}
                type="button"
                role="option"
                aria-selected={ws.id === currentWsId}
                onClick={() => {
                  setOpen(false);
                  if (ws.id !== currentWsId) switchTo(ws.id);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-paper-2 flex items-center gap-2"
              >
                <span className="flex-1 truncate">{ws.name}</span>
                {ws.id === currentWsId ? <span aria-hidden>✓</span> : null}
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setCreateOpen(true);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold border-t-[1.5px] border-hairline hover:bg-paper-2"
          >
            + 新建工作区
          </button>
        </div>
      ) : null}
      <CreateWorkspaceModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
```

- [ ] **Step 8: Wire the dropdown into `components/nav/Sidebar.tsx`**

Open `components/nav/Sidebar.tsx`. Replace the line `<WsSwitcher name="Lumen Labs" meta="lumen" avatar="LL" />` (around line 73) with:

```tsx
<WorkspaceSwitcherDropdown />
```

Remove the import of `WsSwitcher` (no longer used directly). Add:

```tsx
import { WorkspaceSwitcherDropdown } from "@/components/workspace/WorkspaceSwitcherDropdown";
```

Replace the four `<DisabledNavItem ...>` lines (审批 / Agents / Runtimes / 设置) — for now still leave them disabled. T6, T7, T8, T9 will unlock them one at a time. (Leaving them disabled here is intentional: this task is scoped to ws switching only.)

- [ ] **Step 9: Delete the orphan `components/nav/WorkspaceSwitcher.tsx`**

```bash
git rm components/nav/WorkspaceSwitcher.tsx
```

Verify nothing imports it: `grep -rn "nav/WorkspaceSwitcher" --include="*.ts" --include="*.tsx"`. Expected: no matches.

- [ ] **Step 10: Run typecheck + tests**

Run: `npm run typecheck && npm test -- --run`
Expected: pass.

- [ ] **Step 11: Commit**

```bash
git add hooks/useCreateWorkspace.ts hooks/useCreateWorkspace.test.tsx components/workspace/ lib/messages.ts components/nav/Sidebar.tsx
git commit -m "feat(s4): workspace switcher dropdown + create-ws modal"
```

---

## Task 6: Top-level /approvals route + global pending approvals query

**Files:**
- Create: `hooks/useGlobalPendingApprovals.ts`
- Create: `app/(app)/approvals/layout.tsx`
- Create: `app/(app)/approvals/page.tsx`
- Modify: `components/nav/Sidebar.tsx` (unlock 审批 nav item)

- [ ] **Step 1: Create `hooks/useGlobalPendingApprovals.ts`**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPendingApprovals } from "@/lib/api/me";
import { queryKeys } from "@/lib/api/keys";

export function useGlobalPendingApprovals() {
  return useQuery({
    queryKey: queryKeys.me.pendingApprovals(),
    queryFn: fetchPendingApprovals,
    staleTime: 0,
  });
}
```

- [ ] **Step 2: Create `app/(app)/approvals/layout.tsx`**

```tsx
import type { ReactNode } from "react";

export default function TopLevelApprovalsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

(The `(app)` segment's `layout.tsx` already provides `ThreeColumnShell`. This file exists only so the route is a leaf with its own shell.)

- [ ] **Step 3: Create `app/(app)/approvals/page.tsx`**

```tsx
"use client";

import { useGlobalPendingApprovals } from "@/hooks/useGlobalPendingApprovals";
import type { PendingApproval } from "@/lib/api/types";

function groupByWorkspace(items: PendingApproval[]): Map<string, { name: string; items: PendingApproval[] }> {
  const out = new Map<string, { name: string; items: PendingApproval[] }>();
  for (const it of items) {
    const cur = out.get(it.workspace_id);
    if (cur) cur.items.push(it);
    else out.set(it.workspace_id, { name: it.workspace_name, items: [it] });
  }
  return out;
}

export default function TopLevelApprovalsPage() {
  const { data = [], isLoading, isError } = useGlobalPendingApprovals();

  if (isLoading) {
    return <main className="p-6 text-sm text-ink-2">加载中…</main>;
  }
  if (isError) {
    return <main className="p-6 text-sm text-state-failed">加载失败，请刷新重试</main>;
  }
  if (data.length === 0) {
    return (
      <main className="p-6 text-sm text-ink-2">
        全部审批已处理 ✓
      </main>
    );
  }

  const groups = groupByWorkspace(data);

  return (
    <main className="p-6 flex flex-col gap-6 overflow-y-auto h-full">
      <h1 className="text-lg font-bold">跨工作区待审批</h1>
      {Array.from(groups.entries()).map(([wsId, group]) => (
        <section key={wsId} className="flex flex-col gap-2">
          <header className="flex items-center gap-2">
            <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-paper-2 border border-hairline rounded">
              {group.name}
            </span>
            <span className="text-xs text-ink-2">{group.items.length} 项</span>
          </header>
          <ul className="flex flex-col gap-2">
            {group.items.map((it) => (
              <li
                key={it.id}
                className="border-[1.5px] border-hairline rounded-md p-3 text-sm bg-paper-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{it.tool_name}</span>
                  <span className="text-xs text-ink-2">@{it.agent_handle}</span>
                </div>
                <div className="text-xs text-ink-2 mt-1">{it.task_title}</div>
                <a
                  href={`/w/${it.workspace_id}/approvals`}
                  className="inline-block mt-2 text-xs font-semibold text-ink-0 underline"
                >
                  在工作区中处理 →
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
```

(We intentionally keep the top-level hub minimal — it lists pending items and links into the single-ws hub for the actual approve/deny action. Sharing the full `ApprovalHubCard` here would require porting it from `ApprovalLite` to `PendingApproval`, which is scope creep. The "process in workspace →" link covers the action.)

- [ ] **Step 4: Unlock 审批 nav item in `components/nav/Sidebar.tsx`**

Find the line `<DisabledNavItem label="审批" tooltip={messages.shell.pendingDisabled} />` (around line 88). Replace with:

```tsx
<Link href="/approvals">
  <NavItem>{messages.shell.pendingApprovals}</NavItem>
</Link>
```

- [ ] **Step 5: Run typecheck + tests**

Run: `npm run typecheck && npm test -- --run`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add hooks/useGlobalPendingApprovals.ts app/\(app\)/approvals/ components/nav/Sidebar.tsx
git commit -m "feat(s4): top-level /approvals route grouped by workspace"
```

---

## Task 7: Agent CRUD mutations + form

**Files:**
- Create: `hooks/useCreateAgent.ts`
- Create: `hooks/useCreateAgent.test.tsx`
- Create: `hooks/useUpdateAgent.ts`
- Create: `hooks/useArchiveAgent.ts`
- Create: `components/agents/AgentForm.tsx`
- Create: `components/agents/AgentForm.test.tsx`
- Create: `components/agents/ArchiveAgentButton.tsx`
- Modify: `lib/messages.ts`

- [ ] **Step 1: Add agent-form message keys to `lib/messages.ts`**

Inside the existing object (before the closing brace), add:

```ts
  agents: {
    listTitle: "Agents",
    newCta: "+ 新建 agent",
    showArchived: "显示已归档",
    archivedBadge: "已归档",
    emptyTitle: "还没有 agent",
    emptyAllArchived: "所有 agent 都已归档",
    archive: "归档",
    archiveConfirmTitle: "归档 agent？",
    archiveConfirmDesc: "归档后该 agent 不再接受新任务，历史记录保留。",
    archiving: "归档中…",
    form: {
      handle: "Handle",
      handlePlaceholder: "writer",
      handleHelp: "小写字母、数字、连字符；用于在消息中 @mention",
      name: "显示名称",
      namePlaceholder: "Writer",
      model: "模型",
      runtime: "Runtime",
      runtimeNone: "（无可用 daemon）",
      instructions: "System prompt",
      customEnv: "环境变量（JSON 对象）",
      customArgs: "启动参数（JSON 数组）",
      mcpConfig: "MCP 配置（JSON 对象）",
      jsonInvalid: "JSON 格式错误",
      saveCreate: "创建",
      saveUpdate: "保存",
      saving: "保存中…",
      handleConflict: "该 handle 已被占用",
      noRuntimes: "请先在 Runtimes 页签发 install-token 让 daemon 上线。",
    },
  },
```

- [ ] **Step 2: Write `hooks/useCreateAgent.test.tsx` (TDD — verifies raw-JSON POST shape)**

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCreateAgent } from "./useCreateAgent";
import * as agentsApi from "@/lib/api/agents";
import type { Agent } from "@/lib/api/types";

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeAgent(): Agent {
  return {
    id: "a1",
    workspace_id: "ws1",
    runtime_id: "rt1",
    handle: "writer",
    name: "Writer",
    avatar_url: null,
    description: "",
    instructions: "",
    backend_type: "claude",
    model: "claude-sonnet-4-6",
    custom_env: { K: "V" },
    custom_args: ["--x"],
    mcp_config: {},
    archived: false,
    created_at: "2026-05-18T00:00:00Z",
    updated_at: "2026-05-18T00:00:00Z",
  };
}

describe("useCreateAgent", () => {
  it("sends raw structured JSON (not base64) and invalidates the agents list", async () => {
    const createSpy = vi.spyOn(agentsApi, "createAgent").mockResolvedValue(makeAgent());
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useCreateAgent("ws1"), { wrapper: wrapper(qc) });
    await act(async () => {
      await result.current.mutateAsync({
        runtime_id: "rt1",
        handle: "writer",
        name: "Writer",
        custom_env: { K: "V" },
        custom_args: ["--x"],
        mcp_config: {},
      });
    });

    expect(createSpy).toHaveBeenCalledWith("ws1", expect.objectContaining({
      custom_env: { K: "V" },
      custom_args: ["--x"],
    }));
    await waitFor(() =>
      expect(invSpy).toHaveBeenCalledWith({ queryKey: ["workspaces", "ws1", "agents"] }),
    );
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- --run hooks/useCreateAgent.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 4: Create `hooks/useCreateAgent.ts`**

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAgent } from "@/lib/api/agents";
import { queryKeys } from "@/lib/api/keys";
import type { Agent, AgentInput } from "@/lib/api/types";

export function useCreateAgent(wsId: string) {
  const qc = useQueryClient();
  return useMutation<Agent, Error, AgentInput>({
    mutationFn: (input) => createAgent(wsId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.agents(wsId) });
    },
  });
}
```

- [ ] **Step 5: Re-run the test**

Run: `npm test -- --run hooks/useCreateAgent.test.tsx`
Expected: PASS.

- [ ] **Step 6: Create `hooks/useUpdateAgent.ts`**

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAgent } from "@/lib/api/agents";
import { queryKeys } from "@/lib/api/keys";
import type { Agent, AgentInput } from "@/lib/api/types";

export function useUpdateAgent(wsId: string, agentId: string) {
  const qc = useQueryClient();
  return useMutation<Agent, Error, AgentInput>({
    mutationFn: (input) => updateAgent(agentId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.agents(wsId) });
      qc.invalidateQueries({ queryKey: queryKeys.agents.detail(agentId) });
    },
  });
}
```

- [ ] **Step 7: Create `hooks/useArchiveAgent.ts`**

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveAgent } from "@/lib/api/agents";
import { queryKeys } from "@/lib/api/keys";

export function useArchiveAgent(wsId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (agentId) => archiveAgent(agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.agents(wsId) });
    },
  });
}
```

- [ ] **Step 8: Write `components/agents/AgentForm.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentForm } from "./AgentForm";
import type { Runtime } from "@/lib/api/types";

const runtimes: Runtime[] = [
  {
    id: "rt1",
    workspace_id: "ws1",
    host: "host-a",
    online: true,
    last_heartbeat: "2026-05-18T00:00:00Z",
    capacity: 4,
    created_at: "2026-05-18T00:00:00Z",
  },
];

describe("AgentForm", () => {
  it("blocks submission when env JSON is invalid", () => {
    const onSubmit = vi.fn();
    render(
      <AgentForm
        mode="create"
        runtimes={runtimes}
        onSubmit={onSubmit}
        isSubmitting={false}
        submitError={null}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Handle/i), { target: { value: "w" } });
    fireEvent.change(screen.getByLabelText(/显示名称/), { target: { value: "W" } });
    fireEvent.change(screen.getByLabelText(/环境变量/), { target: { value: "{bad json" } });
    fireEvent.blur(screen.getByLabelText(/环境变量/));
    expect(screen.getByText(/JSON 格式错误/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /创建/ }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits parsed JSON objects, not strings", () => {
    const onSubmit = vi.fn();
    render(
      <AgentForm
        mode="create"
        runtimes={runtimes}
        onSubmit={onSubmit}
        isSubmitting={false}
        submitError={null}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Handle/i), { target: { value: "writer" } });
    fireEvent.change(screen.getByLabelText(/显示名称/), { target: { value: "Writer" } });
    fireEvent.change(screen.getByLabelText(/环境变量/), {
      target: { value: '{"KEY":"V"}' },
    });
    fireEvent.change(screen.getByLabelText(/启动参数/), {
      target: { value: '["--x"]' },
    });
    fireEvent.change(screen.getByLabelText(/MCP 配置/), { target: { value: "{}" } });

    fireEvent.click(screen.getByRole("button", { name: /创建/ }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0]?.[0];
    expect(arg).toMatchObject({
      handle: "writer",
      name: "Writer",
      runtime_id: "rt1",
      custom_env: { KEY: "V" },
      custom_args: ["--x"],
      mcp_config: {},
    });
  });
});
```

- [ ] **Step 9: Create `components/agents/AgentForm.tsx`**

```tsx
"use client";

import { useState } from "react";
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

  function validateOnBlur(setter: (b: boolean) => void, raw: string) {
    setter(!tryParse(raw).ok);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!HANDLE_RE.test(handle) || name.trim() === "" || !runtimeId) return;

    const env = tryParse(envRaw);
    const args = tryParse(argsRaw);
    const mcp = tryParse(mcpRaw);
    if (!env.ok || !args.ok || !mcp.ok) {
      setEnvError(!env.ok);
      setArgsError(!args.ok);
      setMcpError(!mcp.ok);
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
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={m.handlePlaceholder}
          className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
        />
        <span className="text-xs text-ink-2">{m.handleHelp}</span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.name}</span>
        <input
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
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.customEnv}</span>
        <textarea
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
```

- [ ] **Step 10: Run the form test**

Run: `npm test -- --run components/agents/AgentForm.test.tsx`
Expected: both tests PASS.

- [ ] **Step 11: Create `components/agents/ArchiveAgentButton.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/brand/confirm-dialog";
import { useArchiveAgent } from "@/hooks/useArchiveAgent";
import { messages } from "@/lib/messages";

interface ArchiveAgentButtonProps {
  wsId: string;
  agentId: string;
}

export function ArchiveAgentButton({ wsId, agentId }: ArchiveAgentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const m = messages.agents;
  const mutation = useArchiveAgent(wsId);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold text-sm"
      >
        {mutation.isPending ? m.archiving : m.archive}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={m.archiveConfirmTitle}
        description={m.archiveConfirmDesc}
        confirmLabel={m.archive}
        destructive
        onConfirm={async () => {
          await mutation.mutateAsync(agentId);
          router.push(`/w/${wsId}/agents`);
        }}
      />
    </>
  );
}
```

- [ ] **Step 12: Run typecheck + full test suite**

Run: `npm run typecheck && npm test -- --run`
Expected: pass.

- [ ] **Step 13: Commit**

```bash
git add hooks/useCreateAgent.ts hooks/useCreateAgent.test.tsx hooks/useUpdateAgent.ts hooks/useArchiveAgent.ts components/agents/ lib/messages.ts
git commit -m "feat(s4): agent CRUD hooks + shared AgentForm + ArchiveAgentButton"
```

---

## Task 8: Agents pages — new / edit / list with archive toggle

**Files:**
- Create: `app/(app)/w/[wsId]/agents/new/page.tsx`
- Create: `app/(app)/w/[wsId]/agents/[agentId]/page.tsx`
- Modify: `app/(app)/w/[wsId]/agents/page.tsx`
- Modify: `components/nav/Sidebar.tsx` (unlock Agents nav item)
- Create: `hooks/useAgent.ts`

- [ ] **Step 1: Create `hooks/useAgent.ts`**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAgent } from "@/lib/api/agents";
import { queryKeys } from "@/lib/api/keys";

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: queryKeys.agents.detail(agentId),
    queryFn: () => fetchAgent(agentId),
    enabled: !!agentId,
    staleTime: 0,
  });
}
```

- [ ] **Step 2: Create `app/(app)/w/[wsId]/agents/new/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { useCreateAgent } from "@/hooks/useCreateAgent";
import { AgentForm } from "@/components/agents/AgentForm";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

export default function NewAgentPage() {
  const { wsId } = useParams<{ wsId: string }>();
  const router = useRouter();
  const { data: runtimes = [] } = useWorkspaceRuntimes(wsId);
  const mutation = useCreateAgent(wsId);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="p-6 overflow-y-auto h-full">
      <h1 className="text-lg font-bold mb-4">{messages.agents.newCta.replace("+ ", "")}</h1>
      <AgentForm
        mode="create"
        runtimes={runtimes}
        isSubmitting={mutation.isPending}
        submitError={error}
        onSubmit={async (input) => {
          setError(null);
          try {
            const a = await mutation.mutateAsync(input);
            router.push(`/w/${wsId}/agents/${a.id}`);
          } catch (e) {
            if (e instanceof ApiError && e.status === 409) {
              setError(messages.agents.form.handleConflict);
            } else {
              setError((e as Error).message);
            }
          }
        }}
      />
    </main>
  );
}
```

(This file imports `useWorkspaceRuntimes` which is created in T9. Build T9 next so this typechecks — but commit this page now; the broken import is acceptable mid-PR since T9 is the immediate follow-up. If you prefer strict green-between-commits, defer this commit to after T9 and bundle them.)

- [ ] **Step 3: Create `app/(app)/w/[wsId]/agents/[agentId]/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAgent } from "@/hooks/useAgent";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { useUpdateAgent } from "@/hooks/useUpdateAgent";
import { AgentForm } from "@/components/agents/AgentForm";
import { ArchiveAgentButton } from "@/components/agents/ArchiveAgentButton";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

export default function AgentDetailPage() {
  const { wsId, agentId } = useParams<{ wsId: string; agentId: string }>();
  const { data: agent, isLoading } = useAgent(agentId);
  const { data: runtimes = [] } = useWorkspaceRuntimes(wsId);
  const mutation = useUpdateAgent(wsId, agentId);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <main className="p-6 text-sm text-ink-2">加载中…</main>;
  if (!agent) return <main className="p-6 text-sm text-state-failed">Agent 不存在</main>;

  return (
    <main className="p-6 overflow-y-auto h-full">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">@{agent.handle}</h1>
        {!agent.archived ? <ArchiveAgentButton wsId={wsId} agentId={agentId} /> : null}
      </header>
      {agent.archived ? (
        <p className="text-xs text-ink-2 mb-3 italic">
          {messages.agents.archivedBadge} — 仅可查看，不可编辑
        </p>
      ) : null}
      <AgentForm
        mode="edit"
        initial={agent}
        runtimes={runtimes}
        isSubmitting={mutation.isPending}
        submitError={error}
        onSubmit={async (input) => {
          setError(null);
          try {
            await mutation.mutateAsync(input);
          } catch (e) {
            if (e instanceof ApiError && e.status === 409) {
              setError(messages.agents.form.handleConflict);
            } else {
              setError((e as Error).message);
            }
          }
        }}
      />
    </main>
  );
}
```

- [ ] **Step 4: Update `app/(app)/w/[wsId]/agents/page.tsx`**

Read the existing file first (`cat app/\(app\)/w/\[wsId\]/agents/page.tsx`). Replace the body with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { messages } from "@/lib/messages";

export default function AgentsListPage() {
  const { wsId } = useParams<{ wsId: string }>();
  const { data: agents = [], isLoading } = useWorkspaceAgents(wsId);
  const [showArchived, setShowArchived] = useState(false);

  const visible = showArchived ? agents : agents.filter((a) => !a.archived);

  return (
    <main className="p-6 overflow-y-auto h-full">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">{messages.agents.listTitle}</h1>
        <div className="flex items-center gap-3">
          <label className="text-xs flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            {messages.agents.showArchived}
          </label>
          <Link
            href={`/w/${wsId}/agents/new`}
            className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
          >
            {messages.agents.newCta}
          </Link>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-ink-2">加载中…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-ink-2">
          {agents.length === 0
            ? messages.agents.emptyTitle
            : messages.agents.emptyAllArchived}
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visible.map((a) => (
            <li key={a.id}>
              <Link
                href={`/w/${wsId}/agents/${a.id}`}
                className={
                  a.archived
                    ? "block border-[1.5px] border-hairline rounded-md p-3 bg-paper-2 opacity-70"
                    : "block border-[1.5px] border-hairline rounded-md p-3 bg-paper-0 hover:border-ink-1"
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">@{a.handle}</span>
                  {a.archived ? (
                    <span className="text-xs px-1.5 py-0.5 bg-paper-1 border border-hairline rounded">
                      {messages.agents.archivedBadge}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-ink-2 mt-1 truncate">{a.name}</div>
                <div className="text-xs text-ink-3 mt-1">{a.model}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Unlock Agents nav item in `components/nav/Sidebar.tsx`**

Find `<DisabledNavItem label="Agents" tooltip={messages.shell.listsDisabled} />` (around line 89). Replace with:

```tsx
{wsId ? (
  <Link href={`/w/${wsId}/agents`}>
    <NavItem>{messages.shell.agents}</NavItem>
  </Link>
) : (
  <NavItem>{messages.shell.agents}</NavItem>
)}
```

- [ ] **Step 6: Defer typecheck — T9 supplies `useWorkspaceRuntimes`**

Skip typecheck for now. Go directly to T9, then run typecheck after both T8 and T9 commits.

- [ ] **Step 7: Commit**

```bash
git add hooks/useAgent.ts app/\(app\)/w/\[wsId\]/agents/ components/nav/Sidebar.tsx
git commit -m "feat(s4): agents new/edit/list pages with archive toggle"
```

---

## Task 9: Runtimes page + install-token modal

**Files:**
- Create: `lib/api/runtimes.ts`
- Create: `hooks/useWorkspaceRuntimes.ts`
- Create: `hooks/useIssueInstallToken.ts`
- Create: `hooks/useIssueInstallToken.test.tsx`
- Create: `components/runtimes/RuntimeRow.tsx`
- Create: `components/workspace/InstallTokenModal.tsx`
- Create: `app/(app)/w/[wsId]/runtimes/page.tsx`
- Modify: `components/nav/Sidebar.tsx`
- Modify: `lib/messages.ts`

- [ ] **Step 1: Add runtimes message keys to `lib/messages.ts`**

Add inside the existing object:

```ts
  runtimes: {
    title: "Runtimes",
    issueToken: "+ 签发安装 Token",
    emptyTitle: "还没有 daemon 接入",
    emptyHelp: "在你想运行 agent 的机器上签发一次性安装 token，让 brainrot-daemon 注册并保持在线。",
    online: "在线",
    offline: "离线",
    lastHeartbeat: "最近心跳",
    capacity: "容量",
  },
  installToken: {
    title: "签发 Runtime 安装 Token",
    warning: "⚠️ 这个 token 只会显示这一次。关闭后无法再次查看。",
    tokenLabel: "Token",
    snippetLabel: "在 daemon 机器上运行：",
    expiresPrefix: "Token 失效时间：",
    close: "关闭",
    copy: "复制",
    copied: "已复制",
    failedTitle: "签发失败",
  },
```

- [ ] **Step 2: Create `lib/api/runtimes.ts`**

```ts
import { apiFetch } from "./client";
import type { InstallToken, Runtime } from "./types";

export async function fetchWorkspaceRuntimes(wsId: string): Promise<Runtime[]> {
  return apiFetch<Runtime[]>(`/api/v1/workspaces/${wsId}/runtimes`);
}

export async function issueInstallToken(wsId: string): Promise<InstallToken> {
  return apiFetch<InstallToken>(`/api/v1/workspaces/${wsId}/install-tokens`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
```

- [ ] **Step 3: Create `hooks/useWorkspaceRuntimes.ts`**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaceRuntimes } from "@/lib/api/runtimes";
import { queryKeys } from "@/lib/api/keys";

export function useWorkspaceRuntimes(wsId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.runtimes(wsId),
    queryFn: () => fetchWorkspaceRuntimes(wsId),
    enabled: !!wsId,
    staleTime: 0,
  });
}
```

- [ ] **Step 4: Write `hooks/useIssueInstallToken.test.tsx` (TDD — verifies the token does NOT enter the cache)**

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useIssueInstallToken } from "./useIssueInstallToken";
import * as runtimesApi from "@/lib/api/runtimes";

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useIssueInstallToken", () => {
  it("returns the token but does not place it in the React Query cache", async () => {
    vi.spyOn(runtimesApi, "issueInstallToken").mockResolvedValue({
      token: "bri_secret_xxx",
      expires_at: "2026-05-18T01:00:00Z",
    });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useIssueInstallToken("ws1"), { wrapper: wrapper(qc) });

    let returned;
    await act(async () => {
      returned = await result.current.mutateAsync();
    });
    expect(returned).toEqual({ token: "bri_secret_xxx", expires_at: "2026-05-18T01:00:00Z" });

    // Confirm the secret is not in any cache entry
    const cacheEntries = qc.getQueryCache().getAll();
    const serialised = JSON.stringify(cacheEntries.map((e) => e.state.data));
    expect(serialised).not.toContain("bri_secret_xxx");
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test -- --run hooks/useIssueInstallToken.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 6: Create `hooks/useIssueInstallToken.ts`**

```ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { issueInstallToken } from "@/lib/api/runtimes";
import type { InstallToken } from "@/lib/api/types";

export function useIssueInstallToken(wsId: string) {
  return useMutation<InstallToken, Error, void>({
    mutationFn: () => issueInstallToken(wsId),
    // Intentionally NO onSuccess that caches; the secret should not enter React Query state.
  });
}
```

- [ ] **Step 7: Re-run the test**

Run: `npm test -- --run hooks/useIssueInstallToken.test.tsx`
Expected: PASS.

- [ ] **Step 8: Create `components/runtimes/RuntimeRow.tsx`**

```tsx
import type { Runtime } from "@/lib/api/types";
import { messages } from "@/lib/messages";

interface RuntimeRowProps {
  runtime: Runtime;
}

export function RuntimeRow({ runtime }: RuntimeRowProps) {
  const m = messages.runtimes;
  return (
    <li className="border-[1.5px] border-hairline rounded-md p-3 bg-paper-0 flex items-center gap-4">
      <span
        className={
          runtime.online
            ? "inline-block w-2 h-2 rounded-full bg-state-success"
            : "inline-block w-2 h-2 rounded-full bg-ink-3"
        }
        aria-label={runtime.online ? m.online : m.offline}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{runtime.host}</div>
        <div className="text-xs text-ink-2 truncate">
          {runtime.online ? m.online : m.offline}
          {runtime.last_heartbeat ? ` · ${m.lastHeartbeat} ${runtime.last_heartbeat}` : ""}
        </div>
      </div>
      <div className="text-xs text-ink-2">
        {m.capacity}: {runtime.capacity}
      </div>
    </li>
  );
}
```

- [ ] **Step 9: Create `components/workspace/InstallTokenModal.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { InstallToken } from "@/lib/api/types";
import { messages } from "@/lib/messages";

interface InstallTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: InstallToken | null;
}

export function InstallTokenModal({ open, onOpenChange, token }: InstallTokenModalProps) {
  const m = messages.installToken;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setCopiedKey(null);
  }, [open]);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
    } catch {
      setCopiedKey(null);
    }
  }

  if (!token) return null;

  const snippet = `brainrot-daemon register --token ${token.token}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{m.title}</DialogTitle>
        <div className="mt-3 p-3 bg-state-failed/10 border-[1.5px] border-state-failed/40 rounded-sm text-xs">
          {m.warning}
        </div>

        <label className="block mt-4">
          <span className="text-xs font-semibold text-ink-1">{m.tokenLabel}</span>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-paper-2 border border-hairline rounded text-xs font-mono break-all">
              {token.token}
            </code>
            <button
              type="button"
              onClick={() => copy(token.token, "token")}
              className="px-3 py-2 text-xs font-semibold border-[1.5px] border-ink-0 rounded-sm"
            >
              {copiedKey === "token" ? m.copied : m.copy}
            </button>
          </div>
        </label>

        <label className="block mt-4">
          <span className="text-xs font-semibold text-ink-1">{m.snippetLabel}</span>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-paper-2 border border-hairline rounded text-xs font-mono break-all">
              {snippet}
            </code>
            <button
              type="button"
              onClick={() => copy(snippet, "snippet")}
              className="px-3 py-2 text-xs font-semibold border-[1.5px] border-ink-0 rounded-sm"
            >
              {copiedKey === "snippet" ? m.copied : m.copy}
            </button>
          </div>
        </label>

        <p className="text-xs text-ink-2 mt-4">
          {m.expiresPrefix} {token.expires_at}
        </p>

        <div className="flex justify-end mt-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
          >
            {m.close}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 10: Create `app/(app)/w/[wsId]/runtimes/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { useIssueInstallToken } from "@/hooks/useIssueInstallToken";
import { RuntimeRow } from "@/components/runtimes/RuntimeRow";
import { InstallTokenModal } from "@/components/workspace/InstallTokenModal";
import type { InstallToken } from "@/lib/api/types";
import { messages } from "@/lib/messages";

export default function RuntimesPage() {
  const { wsId } = useParams<{ wsId: string }>();
  const { data: runtimes = [], isLoading } = useWorkspaceRuntimes(wsId);
  const issue = useIssueInstallToken(wsId);
  const [issued, setIssued] = useState<InstallToken | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  async function onIssue() {
    setIssueError(null);
    try {
      const tok = await issue.mutateAsync();
      setIssued(tok);
      setModalOpen(true);
    } catch (e) {
      setIssueError((e as Error).message);
    }
  }

  return (
    <main className="p-6 overflow-y-auto h-full">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">{messages.runtimes.title}</h1>
        <button
          type="button"
          onClick={onIssue}
          disabled={issue.isPending}
          className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
        >
          {messages.runtimes.issueToken}
        </button>
      </header>

      {issueError ? <p className="text-sm text-state-failed mb-3">{issueError}</p> : null}

      {isLoading ? (
        <p className="text-sm text-ink-2">加载中…</p>
      ) : runtimes.length === 0 ? (
        <div className="text-sm text-ink-2">
          <p className="font-semibold">{messages.runtimes.emptyTitle}</p>
          <p className="mt-1">{messages.runtimes.emptyHelp}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {runtimes.map((r) => (
            <RuntimeRow key={r.id} runtime={r} />
          ))}
        </ul>
      )}

      <InstallTokenModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setIssued(null); // clear secret from memory when closing
        }}
        token={issued}
      />
    </main>
  );
}
```

- [ ] **Step 11: Unlock Runtimes nav item in `components/nav/Sidebar.tsx`**

Find `<DisabledNavItem label="Runtimes" tooltip={messages.shell.listsDisabled} />` (around line 90–93). Replace with:

```tsx
{wsId ? (
  <Link href={`/w/${wsId}/runtimes`}>
    <NavItem>{messages.shell.runtimes}</NavItem>
  </Link>
) : (
  <NavItem>{messages.shell.runtimes}</NavItem>
)}
```

- [ ] **Step 12: Run typecheck + full test suite**

Run: `npm run typecheck && npm test -- --run`
Expected: all pass (T8's deferred typecheck now resolves since `useWorkspaceRuntimes` exists).

- [ ] **Step 13: Commit**

```bash
git add lib/api/runtimes.ts hooks/useWorkspaceRuntimes.ts hooks/useIssueInstallToken.ts hooks/useIssueInstallToken.test.tsx components/runtimes/ components/workspace/InstallTokenModal.tsx app/\(app\)/w/\[wsId\]/runtimes/ components/nav/Sidebar.tsx lib/messages.ts
git commit -m "feat(s4): runtimes page + install-token modal (secret never cached)"
```

---

## Task 10: Workspace settings page + add-member modal

**Files:**
- Create: `lib/api/members.ts`
- Create: `hooks/useAddMember.ts`
- Create: `components/workspace/AddMemberModal.tsx`
- Create: `app/(app)/w/[wsId]/settings/page.tsx`
- Modify: `components/nav/Sidebar.tsx`
- Modify: `lib/messages.ts`

- [ ] **Step 1: Add settings + add-member message keys to `lib/messages.ts`**

```ts
  settings: {
    title: "工作区设置",
    basicSection: "基本信息",
    nameLabel: "名称",
    slugLabel: "Slug",
    createdLabel: "创建于",
    membersSection: "成员",
    membersComingSoon: "成员列表即将上线（后端 GET /workspaces/{wsId}/members 未就绪）。",
    addMember: "+ 添加成员",
    myIdSection: "你的 user ID",
    myIdHelp: "把它发给别人，他们就能把你拉进他们的工作区。",
    dangerSection: "⚠️ 危险操作",
    dangerHelp: "改名 / 移除成员 / 改成员 role / 归档工作区暂未开放（BACKEND_GAPS #20）。",
  },
  addMember: {
    title: "添加成员",
    userIdLabel: "User ID (UUID)",
    userIdPlaceholder: "550e8400-e29b-41d4-a716-446655440000",
    userIdHelp: "邀请流即将上线。当前请粘贴对方的 user ID（对方可在“设置”页查看自己的 ID）。",
    userIdInvalid: "格式不正确，应为 UUID",
    roleLabel: "Role",
    add: "添加",
    cancel: "取消",
    adding: "添加中…",
    success: "已添加成员",
    notFound: "用户不存在",
    alreadyMember: "该用户已是成员",
  },
```

- [ ] **Step 2: Create `lib/api/members.ts`**

```ts
import { apiFetch } from "./client";
import type { WorkspaceMemberInput } from "./types";

export async function addWorkspaceMember(
  wsId: string,
  input: WorkspaceMemberInput,
): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/members`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
```

- [ ] **Step 3: Create `hooks/useAddMember.ts`**

```ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { addWorkspaceMember } from "@/lib/api/members";
import type { WorkspaceMemberInput } from "@/lib/api/types";

export function useAddMember(wsId: string) {
  return useMutation<void, Error, WorkspaceMemberInput>({
    mutationFn: (input) => addWorkspaceMember(wsId, input),
  });
}
```

- [ ] **Step 4: Create `components/workspace/AddMemberModal.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAddMember } from "@/hooks/useAddMember";
import { ApiError } from "@/lib/api/client";
import type { WorkspaceRole } from "@/lib/api/types";
import { messages } from "@/lib/messages";

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wsId: string;
  onAdded?: () => void;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES: WorkspaceRole[] = ["owner", "editor", "member", "viewer"];

export function AddMemberModal({ open, onOpenChange, wsId, onAdded }: AddMemberModalProps) {
  const m = messages.addMember;
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("editor");
  const [error, setError] = useState<string | null>(null);
  const mutation = useAddMember(wsId);

  const canSubmit = UUID_RE.test(userId) && !mutation.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!UUID_RE.test(userId)) {
      setError(m.userIdInvalid);
      return;
    }
    try {
      await mutation.mutateAsync({ user_id: userId, role });
      setUserId("");
      onOpenChange(false);
      onAdded?.();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) setError(m.notFound);
        else if (err.status === 409) setError(m.alreadyMember);
        else setError(err.body || err.message);
      } else {
        setError((err as Error).message);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{m.title}</DialogTitle>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-1">{m.userIdLabel}</span>
            <input
              type="text"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setError(null);
              }}
              placeholder={m.userIdPlaceholder}
              className={
                error
                  ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm font-mono"
                  : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
              }
            />
            {error ? (
              <span className="text-xs text-state-failed">{error}</span>
            ) : (
              <span className="text-xs text-ink-2">{m.userIdHelp}</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-1">{m.roleLabel}</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
            >
              {m.cancel}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
            >
              {mutation.isPending ? m.adding : m.add}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Create `app/(app)/w/[wsId]/settings/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import { useSession } from "@/hooks/useSession";
import { AddMemberModal } from "@/components/workspace/AddMemberModal";
import type { Workspace } from "@/lib/api/types";
import { messages } from "@/lib/messages";

function useWorkspace(wsId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.detail(wsId),
    queryFn: () => apiFetch<Workspace>(`/api/v1/workspaces/${wsId}`),
    enabled: !!wsId,
  });
}

export default function WorkspaceSettingsPage() {
  const { wsId } = useParams<{ wsId: string }>();
  const { data: ws, isLoading } = useWorkspace(wsId);
  const { data: me } = useSession();
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function copyId() {
    if (!me?.id) return;
    try {
      await navigator.clipboard.writeText(me.id);
      setToast("已复制");
      setTimeout(() => setToast(null), 1500);
    } catch {
      setToast("复制失败");
      setTimeout(() => setToast(null), 1500);
    }
  }

  const m = messages.settings;

  return (
    <main className="p-6 overflow-y-auto h-full max-w-2xl">
      <h1 className="text-lg font-bold mb-6">{m.title}</h1>

      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2">{m.basicSection}</h2>
        {isLoading || !ws ? (
          <p className="text-sm text-ink-2">加载中…</p>
        ) : (
          <dl className="text-sm grid grid-cols-[120px_1fr] gap-y-1.5">
            <dt className="text-ink-2">{m.nameLabel}</dt>
            <dd>{ws.name}</dd>
            <dt className="text-ink-2">{m.slugLabel}</dt>
            <dd className="font-mono">{ws.slug}</dd>
            <dt className="text-ink-2">{m.createdLabel}</dt>
            <dd>{ws.created_at}</dd>
          </dl>
        )}
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">{m.membersSection}</h2>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-xs"
          >
            {m.addMember}
          </button>
        </div>
        <p className="text-xs text-ink-2">{m.membersComingSoon}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2">{m.myIdSection}</h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-paper-2 border border-hairline rounded text-xs font-mono">
            {me?.id ?? "—"}
          </code>
          <button
            type="button"
            onClick={copyId}
            className="px-3 py-2 text-xs font-semibold border-[1.5px] border-ink-0 rounded-sm"
          >
            {toast ?? "复制"}
          </button>
        </div>
        <p className="text-xs text-ink-2 mt-1">{m.myIdHelp}</p>
      </section>

      <section className="border-t-[1.5px] border-hairline pt-4">
        <h2 className="text-sm font-semibold mb-2">{m.dangerSection}</h2>
        <p className="text-xs text-ink-2">{m.dangerHelp}</p>
      </section>

      <AddMemberModal
        open={addOpen}
        onOpenChange={setAddOpen}
        wsId={wsId}
        onAdded={() => {
          setToast(messages.addMember.success);
          setTimeout(() => setToast(null), 2000);
        }}
      />
    </main>
  );
}
```

- [ ] **Step 6: Unlock 设置 nav item in `components/nav/Sidebar.tsx`**

Find `<DisabledNavItem label="设置" tooltip={messages.shell.listsDisabled} />` (around line 94). Replace with:

```tsx
{wsId ? (
  <Link href={`/w/${wsId}/settings`}>
    <NavItem>{messages.shell.settings}</NavItem>
  </Link>
) : (
  <NavItem>{messages.shell.settings}</NavItem>
)}
```

After this step, all four S1-era `<DisabledNavItem>` rows should be gone — verify with `grep -n DisabledNavItem components/nav/Sidebar.tsx`. Expected: only the helper function definition remains. If the helper is unused now, delete it and remove `DisabledNavItem` from any imports.

- [ ] **Step 7: Run typecheck + tests**

Run: `npm run typecheck && npm test -- --run`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add lib/api/members.ts hooks/useAddMember.ts components/workspace/AddMemberModal.tsx app/\(app\)/w/\[wsId\]/settings/ components/nav/Sidebar.tsx lib/messages.ts
git commit -m "feat(s4): workspace settings page with add-member + my-user-id"
```

---

## Task 11: First-login workspace landing logic

**Files:**
- Modify: `app/(app)/page.tsx` (or `app/page.tsx` — check first)

- [ ] **Step 1: Find the post-login landing page**

Run: `ls app/page.tsx app/\(app\)/page.tsx 2>&1`
Expected: one of them exists. Read it.

- [ ] **Step 2: Update to honor lastWsId + handle empty list**

If the file currently routes blindly to `/w/{somewsid}`, replace its body with the following logic (adapt path imports to the file's actual location):

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaces } from "@/hooks/useWorkspaces";

export default function HomePage() {
  const router = useRouter();
  const { data: wsList, isLoading } = useWorkspaces();

  useEffect(() => {
    if (isLoading || !wsList) return;
    if (wsList.length === 0) {
      router.replace("/onboarding");
      return;
    }
    let target = wsList[0].id;
    try {
      const stored = localStorage.getItem("brainrot.lastWsId");
      if (stored && wsList.some((w) => w.id === stored)) target = stored;
    } catch {
      // localStorage unavailable; fall through to wsList[0]
    }
    router.replace(`/w/${target}`);
  }, [isLoading, wsList, router]);

  return <main className="p-6 text-sm text-ink-2">加载中…</main>;
}
```

If the existing landing logic already exists in a different shape (e.g., server component, middleware), adapt it but preserve the three rules: (1) empty → /onboarding, (2) lastWsId valid → /w/lastWsId, (3) else → /w/wsList[0].

- [ ] **Step 3: Run typecheck + tests**

Run: `npm run typecheck && npm test -- --run`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add app/
git commit -m "feat(s4): post-login routing honors localStorage.lastWsId and handles empty wsList"
```

---

## Task 12: Update BACKEND_GAPS.md and FRONTEND.md

**Files:**
- Modify: `docs/BACKEND_GAPS.md`
- Modify: `docs/FRONTEND.md`

- [ ] **Step 1: Append three new entries to `docs/BACKEND_GAPS.md`**

Read `docs/BACKEND_GAPS.md` and append after entry #18:

```markdown
## #19 缺按 email 邀请成员接口

- **状态**：S5 阻塞
- **发现**：2026-05-18，S4 设计阶段
- **影响**：用户无法用 email 把他人加入工作区。必须手贴 UUID。
- **Workaround（S4）**：`/w/[wsId]/settings` "添加成员" 表单接收 user_id UUID；`AddMemberModal` 文案"邀请流即将上线，请粘贴对方的 user ID"；同页面提供"你的 user ID + 复制"让被邀请人取自己的 ID。
- **Need**：`POST /api/v1/workspaces/{ws}/invitations { email, role }` 创建邀请；被邀请人 inbox 接受后入会。

## #20 工作区成员管理 + 元信息 RESTful 完善

- **状态**：S5 阻塞
- **发现**：2026-05-18，S4 设计阶段
- **影响**：用户无法看到当前工作区有谁、改 ws 名称/slug、改成员 role、移除成员、归档工作区。
- **Workaround（S4）**：`/w/[wsId]/settings` 成员区不渲染列表，只显示"成员列表即将上线"+ "添加成员"按钮；危险操作区显示 disabled 占位。
- **Need**：
  - `GET /api/v1/workspaces/{wsId}/members` → `WorkspaceMember[]`
  - `PATCH /api/v1/workspaces/{wsId} { name?, slug? }`
  - `PATCH /api/v1/workspaces/{wsId}/members/{user_id}/role { role }`
  - `DELETE /api/v1/workspaces/{wsId}/members/{user_id}` → 204
  - `POST /api/v1/workspaces/{wsId}/archive` → 204（软归档；硬删永远不做）

## #21 Agent 字段读写不对称（GET 返 base64 []byte，POST 收 raw JSON）

- **状态**：非阻塞（已 workaround）
- **发现**：2026-05-18，S4 设计阶段（实测 `pkg/db/generated/agents.sql.go:45` `CustomEnv []byte`）
- **影响**：GET `/api/v1/agents/...` 返回的 `custom_env` / `custom_args` / `mcp_config` 三个字段是 base64 string；POST 收 raw JSON object/array。前端必须分别 encode/decode。
- **根因**：sqlc 把 jsonb 列生成 `[]byte`，Go 默认 `json.Marshal([]byte)` 编码成 base64。handler `writeJSON(w, ag)` 直接吐 `ag` → 客户端拿 base64 string。
- **Workaround（S4）**：`lib/api/agents-encoding.ts` 提供 `decodeAgentResponse` / `encodeAgentInput`；类型分层 `AgentWire`（wire）vs `Agent`（decoded）；`lib/api/agents.ts` 是唯一边界。上层组件/hook 永远拿 `Agent`。
- **Need**：handler 把 `CustomEnv []byte` 在序列化前 `json.Unmarshal` 成 `map[string]string` / `[]string` / `map[string]any` 再 `writeJSON`。修后前端可删除 `agents-encoding.ts` + `AgentWire` 类型。
```

- [ ] **Step 2: Mark M5 items done in `docs/FRONTEND.md`**

Read `docs/FRONTEND.md`. In the M5 section, mark these complete (replace `- [ ]` with `- [x]` and add a short S4 PR reference):

- workspace switcher / create
- cross-workspace bell + /approvals
- agent CRUD
- runtimes list + install token
- workspace settings (basic + add member + my user ID)

(Exact phrasing depends on the current M5 wording — adjust to match.)

- [ ] **Step 3: Commit**

```bash
git add docs/BACKEND_GAPS.md docs/FRONTEND.md
git commit -m "docs(s4): BACKEND_GAPS #19/#20/#21 + FRONTEND M5 marked done"
```

---

## Task 13: Manual QA pass + screenshots

**Files:**
- Create: `qa/s4/*.png` (21 screenshots per spec §6.4)
- Create: `docs/superpowers/reports/2026-05-18-s4-acceptance-report.md`

This task does NOT modify code. It validates the implementation against the spec's 21-item manual QA checklist.

- [ ] **Step 1: Backend pre-flight**

Make sure the backend is fresh per the user's prompt instructions:

```bash
cd /d/brainrot
go build -o bin/server.exe ./cmd/server
./bin/server.exe
```

In another terminal:

```bash
docker ps  # confirm brainrot-postgres-1 is running on :5433
```

- [ ] **Step 2: Run frontend**

```bash
cd /d/brainrot_frontend
npm run dev
```

Log in as `qa@brainrot.local` / `qa-tester-pw-1`.

- [ ] **Step 3: Execute all 21 QA cases from spec §6.4**

For each numbered case, take a PNG screenshot and save to `qa/s4/<NN>-<short-name>.png`. Use the case numbers from the spec as the prefix:

```
qa/s4/01-dropdown-multi-ws.png
qa/s4/02-dropdown-single-ws.png
qa/s4/03-create-ws-flow.png
qa/s4/04-slug-conflict.png
qa/s4/05-bell-count-3.png
qa/s4/06-bell-from-ws-route.png
qa/s4/07-bell-from-top-level.png
qa/s4/08-approvals-grouped.png
qa/s4/09-agent-new-created.png
qa/s4/10-agent-form-json-invalid.png
qa/s4/11-agent-edit-saved.png
qa/s4/12-agent-archive-flow.png
qa/s4/13-runtimes-empty.png
qa/s4/14-install-token-modal.png
qa/s4/15-install-token-copy.png
qa/s4/16-install-token-no-residue.png
qa/s4/17-settings-basic.png
qa/s4/18-my-user-id-copied.png
qa/s4/19-add-member-success.png
qa/s4/20-add-member-invalid-uuid.png
qa/s4/21-danger-disabled.png
```

For each case that fails, file a follow-up task in the report (Step 4). Do NOT block the report on perfect green; mark failed cases clearly.

- [ ] **Step 4: Write the acceptance report**

Create `docs/superpowers/reports/2026-05-18-s4-acceptance-report.md`:

```markdown
# S4 Workspace Management — Acceptance Report

**Date:** 2026-05-18
**Branch:** s4-workspace-mgmt
**Tester:** [your handle]
**Backend commit:** [output of `cd /d/brainrot && git rev-parse --short HEAD`]
**Frontend commit:** [output of `git rev-parse --short HEAD`]

## Summary

[X / 21] cases pass, [Y] failures, [Z] N/A.

## Per-case results

| # | Case | Result | Notes / Screenshot |
|---|---|---|---|
| 1 | dropdown shows all ws + check | ✅ | qa/s4/01 |
| 2 | dropdown single ws + create CTA | ✅ | qa/s4/02 |
| ... | ... | ... | ... |
| 21 | danger ops disabled placeholder | ✅ | qa/s4/21 |

## Failures (if any)

[per failure: case #, what happened, suspected root cause, follow-up task or BACKEND_GAPS entry]

## Performance / health

- Console errors: [none / list]
- Network failures: [none / list]
- Bundle size delta: [run `npm run build` and report]
```

- [ ] **Step 5: Commit screenshots + report**

```bash
git add qa/s4/ docs/superpowers/reports/2026-05-18-s4-acceptance-report.md
git commit -m "test(s4): manual QA — 21 cases captured with acceptance report"
```

---

## Task 14: Open PR

**Files:** None (pure git/gh).

- [ ] **Step 1: Push branch + open PR**

```bash
git push -u origin s4-workspace-mgmt
```

```bash
gh pr create --base main --head s4-workspace-mgmt --title "S4: workspace switcher + agent CRUD + runtimes + settings" --body "$(cat <<'EOF'
## Summary
- Sidebar workspace switcher dropdown + create-workspace modal
- Cross-workspace bell badge + new top-level `/approvals` route + smart routing
- Agent CRUD (new / edit / archive) with base64 wire boundary in lib/api/agents.ts
- `/w/[wsId]/runtimes` list + install-token modal (secret never enters React Query cache)
- `/w/[wsId]/settings` basic info + add-member (UUID input) + my-user-id + danger-ops disabled placeholder

## BACKEND_GAPS opened
- #19 缺按 email 邀请成员
- #20 工作区成员管理 + 元信息 RESTful 完善
- #21 Agent 字段读写不对称（POST raw / GET base64）

## Test plan
- [x] All vitest suites pass (`npm test -- --run`)
- [x] Typecheck clean (`npm run typecheck`)
- [x] Lint clean (`npm run lint`)
- [x] Manual QA — 21 cases captured at qa/s4/
- [x] Acceptance report at docs/superpowers/reports/2026-05-18-s4-acceptance-report.md
EOF
)"
```

- [ ] **Step 2: Report the PR URL**

The `gh pr create` command prints the URL. Hand it back to the user.

---

## Self-Review Notes

Final pass over spec coverage:

| Spec section | Implemented in |
|---|---|
| §3.1 architecture (WorkspaceProvider) | T2 |
| §3.2 routes (/approvals, agents new/[id], runtimes, settings) | T6, T8, T9, T10 |
| §3.3 modules (workspace-context, agent encoding, hooks) | T2, T4–T10 |
| §4.1 ws switching | T2 + T5 |
| §4.2 create workspace | T5 |
| §4.3 bell badge global count | T3 |
| §4.4 top-level /approvals | T6 |
| §4.5 agent create with base64 boundary | T4 + T7 + T8 |
| §4.6 install-token modal | T9 |
| §4.7 add member | T10 |
| §5.1 error mapping (409 slug, 409 handle, 404/409 member, 403 archive) | T5, T7, T10 |
| §5.2 loading states | T6, T8, T9 (in pages) |
| §5.3 empty states | T5 (dropdown), T6, T8, T9, T10 |
| §5.4 first-login routing | T11 |
| §6.2 unit tests | T3 (bell routing), T4 (encoding), T5 (create-ws), T7 (create-agent + AgentForm), T9 (install-token cache) |
| §6.3 hook integration | covered as part of unit tests above (vi.spyOn pattern, not MSW) |
| §6.4 manual QA 21 cases | T13 |
| §7.1 BACKEND_GAPS #19/#20/#21 | T12 |
| §7.2 security (token not cached, env not cached) | T9 (test asserts), implicit in form state |
| §8 dev order T1–T8 | maps to plan T1–T14 (plan adds T11 first-login + T12 docs + T13 QA + T14 PR) |

**Type consistency check:**
- `AgentWire`, `Agent`, `AgentInput` defined T1, used consistently T4–T8
- `Workspace` reused from existing types (not redefined)
- `Runtime`, `InstallToken`, `PendingApproval`, `WorkspaceMemberInput`, `WorkspaceRole`, `CreateWorkspaceInput` all defined T1, used in their respective tasks
- `decodeAgentResponse` / `encodeAgentInput` defined T4, called by all CRUD mutations
- `queryKeys.me.self()` (was `queryKeys.me()`) — caller updates noted in T2 Step 3

**Placeholder scan:** no TBD, no "implement later", every code step has runnable code.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-18-s4-workspace-mgmt.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

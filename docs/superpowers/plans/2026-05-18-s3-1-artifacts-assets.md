# S3.1 Artifacts/Assets Right-Panel Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder "S3 上线后启用" EmptyStates in the task-detail right panel's `产出 (artifacts)` and `素材 (assets)` tabs with live data fetched from `GET /api/v1/tasks/{id}/artifacts` and `GET /api/v1/projects/{id}/assets` (both endpoints went live in backend commit `811bab1`, 2026-05-17).

**Architecture:** Two small fetcher modules + two thin tabs. Same shape: list endpoint → React Query hook → presentational tab. Asset list scope is project; artifact list scope is task. The right panel passes both ids down. No new state, no WS event handlers (assets/artifacts mutate via upload, which is out of S3.1 scope — the WS events `asset.added` / `artifact.added` are documented in API.md but not yet consumed; we'll invalidate the query keys when we add upload UX in a later milestone).

**Tech Stack:** Next.js 14/15 App Router, React 18, TypeScript, TanStack React Query, Tailwind, Vitest + RTL + msw.

**Branch:** `s3-1-artifacts-assets`, based on `main`. **Do NOT base on `s3-approvals`** — S3 PR is still open and S3.1 is logically independent. After `s3-approvals` merges, `s3-1-artifacts-assets` can be rebased on top, or just merged after S3 with a benign 3-way merge (no overlapping files).

**Pre-flight check (run once before T1):**
```bash
git checkout main && git pull
git checkout -b s3-1-artifacts-assets
npm install
npm run lint && npm run typecheck && npm test -- --run
```
Expected: clean working tree on `s3-1-artifacts-assets`, all checks pass against main baseline.

**Conventions (matches S2 / S3):**
- Conventional Commits, no emoji, no AI attribution
- `apiFetch` already throws `ApiError(status, body)` and returns `undefined` for 204
- New files use 2-space indent, double quotes, named exports
- Test pattern: vitest + RTL + msw — but for these small fetchers prefer direct hook tests with `vi.spyOn` on `apiFetch` (matches T3 of S3)
- Right panel inherits the same single-responsibility decomposition as the approvals tab

---

## File Map

**New files (8):**
- `lib/api/artifacts.ts` — `fetchTaskArtifacts(taskId)`
- `lib/api/assets.ts` — `fetchProjectAssets(projectId)`
- `hooks/useTaskArtifacts.ts` — `useQuery<Artifact[]>`
- `hooks/useTaskArtifacts.test.tsx` — 3 tests
- `hooks/useProjectAssets.ts` — `useQuery<Asset[]>`
- `hooks/useProjectAssets.test.tsx` — 3 tests
- `components/task-detail/RightTabs/AssetRow.tsx` — single-line row presenter
- `components/task-detail/RightTabs/ArtifactRow.tsx` — single-line row presenter

**Modified files (5):**
- `lib/api/types.ts` — add `Artifact` and `Asset` interfaces
- `lib/api/keys.ts` — add `queryKeys.tasks.artifacts(taskId)` and `queryKeys.projects.assets(projectId)`
- `components/task-detail/RightTabs/ArtifactsTab.tsx` — replace EmptyState with real list
- `components/task-detail/RightTabs/AssetsTab.tsx` — replace EmptyState with real list (accepts `projectId` prop)
- `components/task-detail/RightPanel.tsx` — accept `projectId` prop and pass to `AssetsTab`
- `app/(app)/w/[wsId]/p/[projectId]/t/[taskId]/page.tsx` — pass `projectId` to `<RightPanel>`

That's 8 + 5 = 13 file touches across 8 tasks. Estimated wall-clock: 4–5h.

---

## Task 1: API types for Artifact and Asset

**Files:**
- Modify: `lib/api/types.ts` (append after the existing `ApprovalRequest` block)

- [ ] **Step 1: Add the two interfaces**

Open `lib/api/types.ts`. Below the `ApprovalRequest` interface (around line 100), append:

```ts
// Shared base shape — both Asset and Artifact have these fields.
interface BlobBase {
  id: string;
  project_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  blob_key: string;
  sha256: string;
  created_at: string;
}

// Project-scoped, uploaded by a human user.
export interface Asset extends BlobBase {
  uploaded_by: string;
}

// Task-scoped, produced by an agent run; excluded=true rows are filtered
// server-side (see API.md §列出任务产出).
export interface Artifact extends BlobBase {
  task_card_id: string;
  task_run_id: string | null;
  source: string;
  excluded: boolean;
}
```

The `BlobBase` interface is intentionally NOT exported — it's an implementation detail for sharing the common fields.

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/api/types.ts
git commit -m "feat(s3.1): add Asset and Artifact interfaces"
```

---

## Task 2: Query keys

**Files:**
- Modify: `lib/api/keys.ts`

- [ ] **Step 1: Add the two keys**

Open `lib/api/keys.ts`. Current shape:

```ts
export const queryKeys = {
  me: () => ["me"] as const,
  workspaces: { ... },
  projects: {
    detail: (projectId: string) => ["projects", projectId] as const,
    tasks: (projectId: string) => ["projects", projectId, "tasks"] as const,
  },
  tasks: {
    detail: (taskId: string) => ["tasks", taskId] as const,
    messages: (taskId: string) => ["tasks", taskId, "messages"] as const,
  },
  approvals: { ... },
} as const;
```

Add `assets` under `projects` and `artifacts` under `tasks`:

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/api/keys.ts
git commit -m "feat(s3.1): add artifacts/assets query keys"
```

---

## Task 3: `fetchTaskArtifacts` API client

**Files:**
- Create: `lib/api/artifacts.ts`

- [ ] **Step 1: Write the function**

Create `lib/api/artifacts.ts`:

```ts
import { apiFetch } from "./client";
import type { Artifact } from "./types";

/**
 * GET /api/v1/tasks/{task_id}/artifacts
 *
 * Returns the task's artifacts ordered by created_at DESC. Server filters
 * excluded=true rows (see docs/API.md §列出任务产出).
 */
export async function fetchTaskArtifacts(taskId: string): Promise<Artifact[]> {
  return apiFetch<Artifact[]>(`/api/v1/tasks/${taskId}/artifacts`);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/api/artifacts.ts
git commit -m "feat(s3.1): fetchTaskArtifacts API client"
```

---

## Task 4: `fetchProjectAssets` API client

**Files:**
- Create: `lib/api/assets.ts`

- [ ] **Step 1: Write the function**

Create `lib/api/assets.ts`:

```ts
import { apiFetch } from "./client";
import type { Asset } from "./types";

/**
 * GET /api/v1/projects/{project_id}/assets
 *
 * Returns project assets ordered by created_at DESC (see docs/API.md §资产 ·
 * 列出项目素材).
 */
export async function fetchProjectAssets(projectId: string): Promise<Asset[]> {
  return apiFetch<Asset[]>(`/api/v1/projects/${projectId}/assets`);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/api/assets.ts
git commit -m "feat(s3.1): fetchProjectAssets API client"
```

---

## Task 5: `useTaskArtifacts` hook (with tests)

**Files:**
- Create: `hooks/useTaskArtifacts.ts`
- Create: `hooks/useTaskArtifacts.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `hooks/useTaskArtifacts.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTaskArtifacts } from "./useTaskArtifacts";
import type { Artifact } from "@/lib/api/types";
import * as artifactsApi from "@/lib/api/artifacts";

function makeArtifact(id: string): Artifact {
  return {
    id,
    project_id: "p1",
    task_card_id: "t1",
    task_run_id: "r1",
    filename: `out-${id}.txt`,
    mime_type: "text/plain",
    size_bytes: 128,
    blob_key: `blob/${id}`,
    sha256: "deadbeef",
    source: "claude_write",
    excluded: false,
    created_at: "2026-05-18T10:00:00Z",
  };
}

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useTaskArtifacts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns artifacts on 200", async () => {
    vi.spyOn(artifactsApi, "fetchTaskArtifacts").mockResolvedValue([
      makeArtifact("a1"),
      makeArtifact("a2"),
    ]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useTaskArtifacts("t1"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data?.length).toBe(2));
    expect(result.current.data?.[0]?.id).toBe("a1");
  });

  it("does not fetch when taskId is empty", () => {
    const spy = vi.spyOn(artifactsApi, "fetchTaskArtifacts").mockResolvedValue([]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useTaskArtifacts(""), { wrapper: wrapper(qc) });
    expect(spy).not.toHaveBeenCalled();
  });

  it("surfaces fetch errors", async () => {
    vi.spyOn(artifactsApi, "fetchTaskArtifacts").mockRejectedValue(
      new Error("500 boom"),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useTaskArtifacts("t1"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run hooks/useTaskArtifacts.test.tsx`
Expected: FAIL — "Cannot find module './useTaskArtifacts'".

- [ ] **Step 3: Create the hook**

Create `hooks/useTaskArtifacts.ts`:

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchTaskArtifacts } from "@/lib/api/artifacts";
import { queryKeys } from "@/lib/api/keys";

export function useTaskArtifacts(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.artifacts(taskId),
    queryFn: () => fetchTaskArtifacts(taskId),
    enabled: !!taskId,
  });
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run hooks/useTaskArtifacts.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add hooks/useTaskArtifacts.ts hooks/useTaskArtifacts.test.tsx
git commit -m "feat(s3.1): useTaskArtifacts hook"
```

---

## Task 6: `useProjectAssets` hook (with tests)

**Files:**
- Create: `hooks/useProjectAssets.ts`
- Create: `hooks/useProjectAssets.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `hooks/useProjectAssets.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useProjectAssets } from "./useProjectAssets";
import type { Asset } from "@/lib/api/types";
import * as assetsApi from "@/lib/api/assets";

function makeAsset(id: string): Asset {
  return {
    id,
    project_id: "p1",
    uploaded_by: "u1",
    filename: `ref-${id}.pdf`,
    mime_type: "application/pdf",
    size_bytes: 2048,
    blob_key: `blob/${id}`,
    sha256: "cafebabe",
    created_at: "2026-05-18T10:00:00Z",
  };
}

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useProjectAssets", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns assets on 200", async () => {
    vi.spyOn(assetsApi, "fetchProjectAssets").mockResolvedValue([
      makeAsset("a1"),
      makeAsset("a2"),
    ]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useProjectAssets("p1"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data?.length).toBe(2));
    expect(result.current.data?.[0]?.id).toBe("a1");
  });

  it("does not fetch when projectId is empty", () => {
    const spy = vi.spyOn(assetsApi, "fetchProjectAssets").mockResolvedValue([]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useProjectAssets(""), { wrapper: wrapper(qc) });
    expect(spy).not.toHaveBeenCalled();
  });

  it("surfaces fetch errors", async () => {
    vi.spyOn(assetsApi, "fetchProjectAssets").mockRejectedValue(
      new Error("500 boom"),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useProjectAssets("p1"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run hooks/useProjectAssets.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the hook**

Create `hooks/useProjectAssets.ts`:

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchProjectAssets } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";

export function useProjectAssets(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.assets(projectId),
    queryFn: () => fetchProjectAssets(projectId),
    enabled: !!projectId,
  });
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run hooks/useProjectAssets.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add hooks/useProjectAssets.ts hooks/useProjectAssets.test.tsx
git commit -m "feat(s3.1): useProjectAssets hook"
```

---

## Task 7: `<ArtifactRow>` and `<AssetRow>` presenters

**Files:**
- Create: `components/task-detail/RightTabs/ArtifactRow.tsx`
- Create: `components/task-detail/RightTabs/AssetRow.tsx`

No tests for these — they're pure presentational rows tested implicitly when the tab integration tests render lists.

- [ ] **Step 1: Create `ArtifactRow`**

Create `components/task-detail/RightTabs/ArtifactRow.tsx`:

```tsx
/* eslint-disable camelcase -- snake_case identifiers come from backend wire format */
"use client";
import type { Artifact } from "@/lib/api/types";
import { relativeTime } from "@/lib/format";

interface ArtifactRowProps {
  artifact: Artifact;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ArtifactRow({ artifact }: ArtifactRowProps) {
  return (
    <li className="flex items-center gap-2 py-2 px-3 border-b-[1.5px] border-hairline text-sm">
      <span className="flex-1 truncate" title={artifact.filename}>
        <strong className="text-ink-0">{artifact.filename}</strong>
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 font-mono">
        {formatBytes(artifact.size_bytes)}
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 ml-1">
        {relativeTime(artifact.created_at)}
      </span>
    </li>
  );
}
```

- [ ] **Step 2: Create `AssetRow`**

Create `components/task-detail/RightTabs/AssetRow.tsx`:

```tsx
/* eslint-disable camelcase -- snake_case identifiers come from backend wire format */
"use client";
import type { Asset } from "@/lib/api/types";
import { relativeTime } from "@/lib/format";

interface AssetRowProps {
  asset: Asset;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AssetRow({ asset }: AssetRowProps) {
  return (
    <li className="flex items-center gap-2 py-2 px-3 border-b-[1.5px] border-hairline text-sm">
      <span className="flex-1 truncate" title={asset.filename}>
        <strong className="text-ink-0">{asset.filename}</strong>
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 font-mono">
        {formatBytes(asset.size_bytes)}
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 ml-1">
        {relativeTime(asset.created_at)}
      </span>
    </li>
  );
}
```

The `formatBytes` helper is duplicated intentionally (YAGNI — 6 lines, 2 callers). If a third file needs it, extract to `lib/format.ts`.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/task-detail/RightTabs/ArtifactRow.tsx components/task-detail/RightTabs/AssetRow.tsx
git commit -m "feat(s3.1): ArtifactRow + AssetRow presenters"
```

---

## Task 8: Wire tabs and RightPanel; pass projectId down

**Files:**
- Modify: `components/task-detail/RightTabs/ArtifactsTab.tsx`
- Modify: `components/task-detail/RightTabs/AssetsTab.tsx`
- Modify: `components/task-detail/RightPanel.tsx`
- Modify: `app/(app)/w/[wsId]/p/[projectId]/t/[taskId]/page.tsx`

This task wires the new hooks into the existing right-panel tabs. The page hands `projectId` down to `RightPanel`, which forwards it to `AssetsTab` (ArtifactsTab only needs taskId, which RightPanel already has).

- [ ] **Step 1: Update `ArtifactsTab`**

Replace the entire content of `components/task-detail/RightTabs/ArtifactsTab.tsx`:

```tsx
"use client";
import { useTaskArtifacts } from "@/hooks/useTaskArtifacts";
import { ArtifactRow } from "./ArtifactRow";
import { EmptyState } from "@/components/common/EmptyState";

interface ArtifactsTabProps {
  taskId: string;
}

export function ArtifactsTab({ taskId }: ArtifactsTabProps) {
  const { data, isLoading, isError } = useTaskArtifacts(taskId);

  if (isLoading) {
    return <div className="text-center text-xs text-ink-2 py-8">加载中…</div>;
  }
  if (isError) {
    return <div className="text-center text-xs text-ink-2 py-8">加载失败</div>;
  }
  const items = data ?? [];
  if (items.length === 0) {
    return <EmptyState title="暂无产出" description="agent 运行后产生的文件会出现在这里" />;
  }
  return (
    <ul className="flex flex-col">
      {items.map((a) => (
        <ArtifactRow key={a.id} artifact={a} />
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Update `AssetsTab`**

Replace the entire content of `components/task-detail/RightTabs/AssetsTab.tsx`:

```tsx
"use client";
import { useProjectAssets } from "@/hooks/useProjectAssets";
import { AssetRow } from "./AssetRow";
import { EmptyState } from "@/components/common/EmptyState";

interface AssetsTabProps {
  projectId: string;
}

export function AssetsTab({ projectId }: AssetsTabProps) {
  const { data, isLoading, isError } = useProjectAssets(projectId);

  if (isLoading) {
    return <div className="text-center text-xs text-ink-2 py-8">加载中…</div>;
  }
  if (isError) {
    return <div className="text-center text-xs text-ink-2 py-8">加载失败</div>;
  }
  const items = data ?? [];
  if (items.length === 0) {
    return <EmptyState title="暂无素材" description="上传到本项目的参考文件会出现在这里" />;
  }
  return (
    <ul className="flex flex-col">
      {items.map((a) => (
        <AssetRow key={a.id} asset={a} />
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Update `RightPanel` to accept projectId**

The current file (`components/task-detail/RightPanel.tsx`) has `interface RightPanelProps { taskId: string }`. Replace its ENTIRE content with:

```tsx
"use client";
import { useChatUIStore } from "@/lib/store/chat-ui";
import { useTaskApprovalsHistory } from "@/hooks/useTaskApprovalsHistory";
import { RightTabs } from "./RightTabs";
import { ArtifactsTab } from "./RightTabs/ArtifactsTab";
import { AssetsTab } from "./RightTabs/AssetsTab";
import { ApprovalsTab } from "./RightTabs/ApprovalsTab";

interface RightPanelProps {
  taskId: string;
  projectId: string;
}

export function RightPanel({ taskId, projectId }: RightPanelProps) {
  const activeTab = useChatUIStore((s) => s.byTask[taskId]?.activeTab ?? "artifacts");
  const setTab = useChatUIStore((s) => s.setActiveTab);
  const { data: approvalsData } = useTaskApprovalsHistory(taskId);

  return (
    <aside className="border-l-[1.5px] border-hairline bg-paper-0 flex flex-col min-h-0">
      <RightTabs
        active={activeTab}
        onChange={(t) => setTab(taskId, t)}
        approvalsCount={approvalsData?.length ?? 0}
      />
      <div className="flex-1 overflow-y-auto">
        {activeTab === "artifacts" && <ArtifactsTab taskId={taskId} />}
        {activeTab === "assets" && <AssetsTab projectId={projectId} />}
        {activeTab === "approvals" && <ApprovalsTab taskId={taskId} />}
      </div>
    </aside>
  );
}
```

**Note:** This file currently exists on `main` referring to `useApprovalsHistory` (the legacy hook). Since S3.1 branches from main, **NOT** from `s3-approvals`, this file imports the LEGACY `useApprovalsHistory`, NOT the new `useTaskApprovalsHistory`. Verify in Step 4 below before editing.

- [ ] **Step 4: Verify which approvals hook is used on main**

Run: `grep -n "useApprovalsHistory\|useTaskApprovalsHistory" components/task-detail/RightPanel.tsx`

Two cases:
- **Case A — file imports `useApprovalsHistory`** (legacy, pre-S3): keep the existing import, but adjust the rest of the file to add `projectId`. Replace the file content with:

```tsx
"use client";
import { useChatUIStore } from "@/lib/store/chat-ui";
import { useApprovalsHistory } from "@/hooks/useApprovalsHistory";
import { RightTabs } from "./RightTabs";
import { ArtifactsTab } from "./RightTabs/ArtifactsTab";
import { AssetsTab } from "./RightTabs/AssetsTab";
import { ApprovalsTab } from "./RightTabs/ApprovalsTab";

interface RightPanelProps {
  taskId: string;
  projectId: string;
}

export function RightPanel({ taskId, projectId }: RightPanelProps) {
  const activeTab = useChatUIStore((s) => s.byTask[taskId]?.activeTab ?? "artifacts");
  const setTab = useChatUIStore((s) => s.setActiveTab);
  const approvals = useApprovalsHistory(taskId);

  return (
    <aside className="border-l-[1.5px] border-hairline bg-paper-0 flex flex-col min-h-0">
      <RightTabs
        active={activeTab}
        onChange={(t) => setTab(taskId, t)}
        approvalsCount={approvals.length}
      />
      <div className="flex-1 overflow-y-auto">
        {activeTab === "artifacts" && <ArtifactsTab taskId={taskId} />}
        {activeTab === "assets" && <AssetsTab projectId={projectId} />}
        {activeTab === "approvals" && <ApprovalsTab taskId={taskId} />}
      </div>
    </aside>
  );
}
```

- **Case B — file imports `useTaskApprovalsHistory`** (post-S3 merge): use the version shown in Step 3.

The only difference is whether `approvalsCount` reads `.length` (Case A) or `data?.length ?? 0` (Case B).

- [ ] **Step 5: Update page to pass projectId to RightPanel**

The current file `app/(app)/w/[wsId]/p/[projectId]/t/[taskId]/page.tsx` already destructures `projectId` (line 15). Find the `<RightPanel taskId={taskId} />` and add `projectId`:

```tsx
      <RightPanel taskId={taskId} projectId={projectId} />
```

- [ ] **Step 6: Typecheck + lint**

```bash
npm run typecheck
npm run lint
```
Expected: PASS both.

- [ ] **Step 7: Run all tests**

```bash
npx vitest run
```
Expected: all PASS — includes the new 6 tests (3 artifacts + 3 assets) plus all pre-existing tests.

- [ ] **Step 8: Manual smoke test**

```bash
npm run dev
```
Login at `http://localhost:3000` as qa@brainrot.local / qa-tester-pw-1. Navigate into a task. Open right panel:
- "产出" tab → expect "暂无产出" empty state (Demo task has no artifacts) OR a list of artifacts if any exist
- "素材" tab → expect "暂无素材" empty state OR a list if assets uploaded
- "审批" tab → unchanged

If you see "加载失败" instead of the empty state, the backend is not running or returned non-2xx. Check `docker compose ps brainrot-postgres-1` and `bin/server.exe` is running.

- [ ] **Step 9: Commit**

```bash
git add components/task-detail/RightTabs/ArtifactsTab.tsx \
        components/task-detail/RightTabs/AssetsTab.tsx \
        components/task-detail/RightPanel.tsx \
        app/(app)/w/[wsId]/p/[projectId]/t/[taskId]/page.tsx
git commit -m "feat(s3.1): wire artifacts/assets tabs; pass projectId through RightPanel"
```

---

## Task 9: Documentation update

**Files:**
- Modify: `docs/BACKEND_GAPS.md` — mark #9, #10 as resolved by frontend in S3.1
- Modify: `docs/FRONTEND.md` — note S3.1 done

- [ ] **Step 1: Mark BACKEND_GAPS #9 #10 as resolved**

Open `docs/BACKEND_GAPS.md`. Find #9 (`GET /api/v1/tasks/{taskId}/artifacts`). It should currently show backend as ✅ ready. Append a line to its "状态" indicating front-end consumption is now wired:

Find this snippet (or similar — exact phrasing varies):

```
## #9 缺 `GET /api/v1/tasks/{taskId}/artifacts`

- **状态**：✅ 已完成 ...
```

Change to:

```
## #9 缺 `GET /api/v1/tasks/{taskId}/artifacts`

- **状态**：✅ 已完成（后端 2026-05-17；前端 S3.1 2026-05-18 已接入：`hooks/useTaskArtifacts.ts`、`components/task-detail/RightTabs/ArtifactsTab.tsx`）
```

Do the same for #10:

```
## #10 缺 `GET /api/v1/projects/{projectId}/assets`

- **状态**：✅ 已完成（后端 2026-05-17；前端 S3.1 2026-05-18 已接入：`hooks/useProjectAssets.ts`、`components/task-detail/RightTabs/AssetsTab.tsx`）
```

Preserve the rest of each entry (发现/影响/Workaround/Need lines) unchanged.

- [ ] **Step 2: Update FRONTEND.md M4 follow-up**

Open `docs/FRONTEND.md`. Find the M4 / S3 section (likely near the milestone list). If there's an "S3 已完成" or "M4 ✅" line, append after it:

```
- S3.1（2026-05-18，artifacts/assets 右栏接入）—— 后端 #9 #10 ready 后补齐。
```

If there's no clear anchor, just leave FRONTEND.md alone — the BACKEND_GAPS update is the load-bearing change.

- [ ] **Step 3: Commit**

```bash
git add docs/BACKEND_GAPS.md docs/FRONTEND.md
git commit -m "docs(s3.1): mark #9/#10 frontend integration done"
```

---

## Task 10: Open PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin s3-1-artifacts-assets
```

- [ ] **Step 2: Final pre-PR checks**

```bash
npm run lint
npm run typecheck
npx vitest run
```
Expected: all PASS.

- [ ] **Step 3: Open PR**

```bash
gh pr create --title "S3.1: Wire artifacts/assets right-panel tabs to live endpoints" --body "$(cat <<'EOF'
## Summary
- Replace the placeholder "S3 上线后启用" EmptyStates in the task-detail right panel's 产出 (artifacts) and 素材 (assets) tabs with live data.
- New: `useTaskArtifacts(taskId)`, `useProjectAssets(projectId)`, plus thin `ArtifactRow` / `AssetRow` presenters.
- `RightPanel` now accepts and forwards `projectId` so the assets tab has its scope.
- 6 new vitest unit tests (3 artifacts + 3 assets).

## Backend dependencies
- ✅ `GET /api/v1/tasks/{id}/artifacts` — backend ready since 2026-05-17 (commit 811bab1)
- ✅ `GET /api/v1/projects/{id}/assets` — backend ready since 2026-05-17 (commit 811bab1)
- No new backend gaps introduced.

## Out of scope
- Upload UX (素材上传按钮、产物排除标记) — handled in later milestone
- WS `asset.added` / `artifact.added` invalidation — handled when upload UX lands
- Download / preview interactions — current rows are filename + size + relative-time only

## Test plan
- [x] `npm test -- --run` passes (6 new tests + all pre-existing)
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [ ] Manual: navigate to a task, open 产出 tab → empty state or list renders; same for 素材

## Relation to S3
S3.1 branches from `main`, not from `s3-approvals`. If `s3-approvals` is merged first, this PR will require a trivial 3-way merge of `RightPanel.tsx` (different hook for the approvals tab — see Task 8 Step 4 in the plan). If S3.1 merges first, `s3-approvals` will need the same trivial adjustment.

## Spec / plan
- Plan: `docs/superpowers/plans/2026-05-18-s3-1-artifacts-assets.md`
EOF
)"
```

- [ ] **Step 4: Return PR URL**

Paste the URL printed by `gh pr create`.

---

## Self-Review checklist (run before handoff)

- [x] All file paths exact (no `path/to/x.ts` placeholders)
- [x] Every step shows complete code, not "similar to above"
- [x] Type consistency: `Asset` has `uploaded_by`; `Artifact` has `task_card_id`/`task_run_id`/`source`/`excluded` — both extend `BlobBase`; matches API.md
- [x] No placeholder text (TBD / TODO / "handle errors appropriately")
- [x] Branch decision documented: based on main, not s3-approvals; merge collision handled in Task 8 Step 4
- [x] Backend dependency stated (live since 811bab1, 2026-05-17)
- [x] TDD followed: tests written before implementation in T5 and T6
- [x] Test count tallied: 3 (artifacts hook) + 3 (assets hook) = 6 new tests
- [x] Commit count: 8 feat commits + 1 docs commit = 9 commits

---

**End of plan.**

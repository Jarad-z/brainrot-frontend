# S6 — Usability & Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land 3 sequential PRs (cleanup → small wins → drag+paste) closing the S6 scope. PR3b (file preview) is intentionally **excluded** from this plan — it depends on BACKEND_GAPS #31 and gets its own plan once the backend is ready.

**Architecture:** PR1 lands directly on `main` in the current working tree (only contains uncommitted S5 cleanup + new BACKEND_GAPS entry). PR2 and PR3a are implemented in an isolated git worktree at `.worktrees/s6/` on separate branches that branch from updated `main`. Each PR is mergeable independently; PR3a depends on PR2 only because both rebase onto an evolving main, not because of code conflicts.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, TanStack Query v5, Tiptap 2 + ProseMirror, vitest + Testing Library, Tailwind v4. Pre-commit gate: `pnpm typecheck && pnpm lint && pnpm test`.

**Spec reference:** `docs/superpowers/specs/2026-05-19-s6-usability-and-completeness-design.md`

**Note on i18n keys:** The spec mentioned "flat keys" but the existing convention in `lib/messages.ts` is **namespaced** (e.g. `messages.assets.uploading`). All new keys in this plan go under appropriate namespaces.

**Note on toasts:** This codebase has no toast library. Inline transient feedback uses local `useState<string|null>` + `setTimeout` (see `components/workspace/MemberRow.tsx` for the canonical pattern). All "toast" references in the spec map to this inline pattern.

---

## PR1 — Pre-S6 cleanup (works in current main, no worktree)

### Task 1.1: Stage and inspect the existing uncommitted changes

**Files:**
- Inspect: `components/agents/AgentForm.tsx` (modified, uncommitted)
- Inspect: `lib/messages.ts` (modified, uncommitted)
- Inspect: `.gitignore` (modified, uncommitted)
- Inspect: `CLAUDE.md` (untracked)

- [ ] **Step 1: View what's already pending**

Run: `git status && git diff -- components/agents/AgentForm.tsx lib/messages.ts .gitignore`
Expected: see the AgentForm `useEffect` runtime-fallback addition, the new lib/messages keys (`handleInvalid`, `nameRequired`, `runtimeRequired`, `jsonInvalid`), the `.gitignore` postmortem exclusion, and untracked `CLAUDE.md`.

- [ ] **Step 2: Sanity check that current main is at origin/main**

Run: `git log --oneline -1 main..origin/main 2>&1 ; git log --oneline -1 origin/main..main 2>&1`
Expected: both empty (in sync).

- [ ] **Step 3: Add BACKEND_GAPS #31 entry**

Append to `docs/BACKEND_GAPS.md` (file ends at the bottom — append):

```markdown
## #31 缺 raw blob endpoints（asset / artifact 文件读路径）

- **状态**：待办（2026-05-19，S6 brainstorm 阶段记录）
- **发现**：S6 brainstorm，对比 D 项文件预览设计 vs API.md 资产章节时
- **影响**：前端目前能列出 asset / artifact 行（filename, mime_type, size, sha256, blob_key），但**没法 fetch 实际文件字节**。`AssetRow` / `ArtifactRow` 只能显示元信息，无法做缩略图、预览、下载。S6 D 项（文件预览：图片 + PDF 首页）阻塞在此。
- **Workaround（S6）**：S6 不做 D 项 PR3b，文件预览推到 S7。
- **Need**：
  - `GET /api/v1/assets/{asset_id}/blob` → raw bytes，`Content-Type` 取自 `mime_type` 列，鉴权 = 任意 ws 成员（403 / 404），SHOULD 支持 `Range` 请求（PDF / 大图懒加载）
  - `GET /api/v1/artifacts/{artifact_id}/blob` → 同上，鉴权同 list 接口（任意 ws 成员）；excluded=true 行也应可访问（用户软删除不应该等同丢失访问权）或返回 410，看后端决策
- **前端 unlock 路径**：实现后 S6 PR3b 即可启动（`lib/api/blob.ts` 加 helper + 在 AssetThumbnail / MediaPreviewModal 直接给 `<img src>` / `<embed src>`）。
```

- [ ] **Step 4: Run pre-commit gate to make sure current diff is clean**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all green. AgentForm uncommitted change uses `useEffect` from `react` — verify import was added.

- [ ] **Step 5: Stage and commit**

```bash
git add components/agents/AgentForm.tsx lib/messages.ts .gitignore CLAUDE.md docs/BACKEND_GAPS.md
git commit -m "chore(s6): pre-S6 cleanup + open BACKEND_GAPS #31

- AgentForm: runtime fallback effect + visible form-level errors
- lib/messages: form-error strings (handleInvalid, nameRequired, runtimeRequired, jsonInvalid)
- CLAUDE.md: add to repo (was untracked)
- .gitignore: skip local pr10 postmortem
- BACKEND_GAPS #31: file raw-blob endpoints (blocks S6 PR3b)"
```

Run: `git status`
Expected: working tree clean except for `docs/superpowers/prompts/` (untracked, intentionally not in PR).

- [ ] **Step 6: Push and open PR**

```bash
git push origin main
```

Note: PR1 commits directly to `main` because (a) it's only cleanup + docs, (b) there's no review gating set up beyond pre-commit hooks. If a feature-branch PR is preferred, branch from `main`, push, open PR, merge. Confirm with maintainer before deviating.

- [ ] **Step 7: Manual smoke test**

Run: `pnpm dev`
In browser:
1. Open `/login` → log in with `qa@brainrot.local` / `qa-tester-pw-1`
2. Navigate to a workspace → Agents page → click "+ 新建 agent"
3. With at least one runtime present, verify Runtime field has a value selected by default (not blank)
4. Submit with empty `name` → verify visible error text appears (form-level), not silent failure
5. Submit with bad JSON in customEnv → verify JSON error text appears
Expected: all four steps pass.

---

## PR2 — A + B + J + K (in S6 worktree)

> **REQUIRED:** Set up the S6 worktree per `superpowers:using-git-worktrees`. From repo root after PR1 lands on origin/main:
>
> ```bash
> git fetch origin
> git checkout main && git pull origin main
> # Confirm .worktrees/ is gitignored — if not, add and commit before proceeding
> grep -q '^\.worktrees/' .gitignore || (echo '.worktrees/' >> .gitignore && git add .gitignore && git commit -m "chore: ignore .worktrees/" && git push origin main)
> git worktree add .worktrees/s6-pr2-small-wins -b s6/pr2-small-wins
> cd .worktrees/s6-pr2-small-wins
> pnpm install
> pnpm test
> ```
>
> All subsequent PR2 tasks run inside the worktree.

### Task 2.A.1: Add `setArtifactExcluded` API client + test

**Files:**
- Modify: `lib/api/artifacts.ts`
- Create: `lib/api/artifacts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/api/artifacts.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setArtifactExcluded } from "./artifacts";
import { ApiError } from "./client";

describe("setArtifactExcluded", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends PATCH with { excluded } body and resolves on 204", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    await expect(setArtifactExcluded("art-1", true)).resolves.toBeUndefined();

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[0]).toBe("/api/v1/artifacts/art-1");
    expect(call?.[1]?.method).toBe("PATCH");
    expect(call?.[1]?.body).toBe(JSON.stringify({ excluded: true }));
  });

  it("throws ApiError on 403", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("forbidden", { status: 403 }),
    );

    await expect(setArtifactExcluded("art-1", true)).rejects.toBeInstanceOf(ApiError);
  });

  it("throws on network failure", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("offline"),
    );

    await expect(setArtifactExcluded("art-1", true)).rejects.toThrow("offline");
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm vitest run lib/api/artifacts.test.ts`
Expected: FAIL — `setArtifactExcluded is not a function`.

- [ ] **Step 3: Implement**

Modify `lib/api/artifacts.ts` — replace the file contents with:

```typescript
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

/**
 * PATCH /api/v1/artifacts/{artifact_id} { excluded }
 *
 * Soft-excludes (or un-excludes) a single artifact. Server returns 204 on
 * success; 403 for viewer role; 404 for unknown id. See BACKEND_GAPS #28.
 */
export async function setArtifactExcluded(
  artifactId: string,
  excluded: boolean,
): Promise<void> {
  await apiFetch<void>(`/api/v1/artifacts/${artifactId}`, {
    method: "PATCH",
    body: JSON.stringify({ excluded }),
  });
}
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `pnpm vitest run lib/api/artifacts.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/api/artifacts.ts lib/api/artifacts.test.ts
git commit -m "feat(api): add setArtifactExcluded for PATCH /artifacts/{id}"
```

### Task 2.A.2: Add `useSetArtifactExcluded` mutation hook

**Files:**
- Create: `hooks/useSetArtifactExcluded.ts`

- [ ] **Step 1: Implement the hook**

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setArtifactExcluded } from "@/lib/api/artifacts";
import { queryKeys } from "@/lib/api/keys";

interface Vars {
  artifactId: string;
  excluded: boolean;
}

export function useSetArtifactExcluded(taskId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, Vars>({
    mutationFn: ({ artifactId, excluded }) =>
      setArtifactExcluded(artifactId, excluded),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.artifacts(taskId) });
    },
  });
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add hooks/useSetArtifactExcluded.ts
git commit -m "feat(hooks): useSetArtifactExcluded mutation"
```

### Task 2.A.3: Add `exclude` keys under `messages.artifacts`

**Files:**
- Modify: `lib/messages.ts`

- [ ] **Step 1: Add a new namespace `artifacts`**

`lib/messages.ts` does not currently have an `artifacts` namespace (only `assets`). Add one. Insert this block immediately after the `assets: {...}` block (before `addMember`):

```typescript
  artifacts: {
    exclude: "排除",
    excludeConfirmTitle: "排除产出？",
    excludeConfirmBody: (filename: string) =>
      `确定要从产出列表里排除 ${filename} 吗？这条不会再显示出来。`,
    excludeConfirm: "排除",
    excludeCancel: "取消",
    excludeFailed: "排除失败",
    excludeForbidden: "需要 editor 或 owner 权限",
  },
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS (`as const` infers the types fine).

- [ ] **Step 3: Commit**

```bash
git add lib/messages.ts
git commit -m "feat(messages): artifacts.exclude* strings"
```

### Task 2.A.4: Wire the exclude button into ArtifactRow

**Files:**
- Modify: `components/task-detail/RightTabs/ArtifactRow.tsx`
- Modify: `components/task-detail/RightTabs/ArtifactsTab.tsx`

The current `ArtifactRow` doesn't know about `taskId`. We need to pass `taskId` down so the row can call `useSetArtifactExcluded(taskId)`. Also add the row-hover button + ConfirmDialog flow.

- [ ] **Step 1: Update ArtifactsTab to pass `taskId` to each row**

Replace `components/task-detail/RightTabs/ArtifactsTab.tsx` contents with:

```typescript
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
        <ArtifactRow key={a.id} artifact={a} taskId={taskId} />
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Rewrite ArtifactRow with hover button + ConfirmDialog**

Replace `components/task-detail/RightTabs/ArtifactRow.tsx` contents with:

```typescript
"use client";

import { useState } from "react";
import type { Artifact } from "@/lib/api/types";
import { relativeTime, formatBytes } from "@/lib/format";
import { ConfirmDialog } from "@/components/brand/confirm-dialog";
import { useSetArtifactExcluded } from "@/hooks/useSetArtifactExcluded";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

interface ArtifactRowProps {
  artifact: Artifact;
  taskId: string;
}

export function ArtifactRow({ artifact, taskId }: ArtifactRowProps) {
  const m = messages.artifacts;
  const exclude = useSetArtifactExcluded(taskId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function onConfirm() {
    exclude.mutate(
      { artifactId: artifact.id, excluded: true },
      {
        onError: (err) => {
          const msg =
            err instanceof ApiError && err.status === 403
              ? m.excludeForbidden
              : m.excludeFailed;
          setToast(msg);
          setTimeout(() => setToast(null), 2000);
        },
      },
    );
  }

  return (
    <li className="group flex items-center gap-2 py-2 px-3 border-b-[1.5px] border-hairline text-sm">
      <span className="flex-1 truncate" title={artifact.filename}>
        <strong className="text-ink-0">{artifact.filename}</strong>
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 font-mono">
        {formatBytes(artifact.size_bytes)}
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 ml-1">
        {relativeTime(artifact.created_at)}
      </span>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={exclude.isPending}
        className="px-2 py-0.5 text-[11px] border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold opacity-0 group-hover:opacity-100 disabled:opacity-50 transition-opacity"
      >
        {m.exclude}
      </button>
      {toast && <span className="text-[11px] text-state-failed shrink-0">{toast}</span>}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={m.excludeConfirmTitle}
        description={m.excludeConfirmBody(artifact.filename)}
        confirmLabel={m.excludeConfirm}
        cancelLabel={m.excludeCancel}
        destructive
        onConfirm={onConfirm}
      />
    </li>
  );
}
```

- [ ] **Step 3: Verify lib/format has formatBytes**

Run: `grep -n "formatBytes" lib/format.ts`
Expected: function exists. (If not, the old `ArtifactRow` had its own local copy at line 9-13 — copy that to `lib/format.ts` as a shared helper.)

If `formatBytes` is missing from `lib/format.ts`:

```typescript
// add to lib/format.ts
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
```

- [ ] **Step 4: Typecheck + lint + tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add components/task-detail/RightTabs/ArtifactRow.tsx components/task-detail/RightTabs/ArtifactsTab.tsx lib/format.ts
git commit -m "feat(artifacts): row-level exclude button with confirm flow"
```

- [ ] **Step 6: Manual smoke test**

Run: `pnpm dev` (and ensure backend is running per CLAUDE.md)
1. Log in, open a task that has artifacts (run an agent if needed)
2. Hover an artifact row → "排除" button appears
3. Click → ConfirmDialog opens with correct filename in body
4. Confirm → row disappears from list immediately
5. Refresh page → row still gone
6. (Optional) test 403: log in as viewer → click → confirm → see "需要 editor 或 owner 权限" inline error
Expected: all pass.

### Task 2.B.1: Add `leaveWorkspace` API client + test

**Files:**
- Modify: `lib/api/members.ts`
- Create: `lib/api/members.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/api/members.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { leaveWorkspace } from "./members";
import { ApiError } from "./client";

describe("leaveWorkspace", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("DELETEs /workspaces/{ws}/members/me and resolves on 204", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    await expect(leaveWorkspace("ws-1")).resolves.toBeUndefined();

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[0]).toBe("/api/v1/workspaces/ws-1/members/me");
    expect(call?.[1]?.method).toBe("DELETE");
  });

  it("throws ApiError 409 when last owner attempts to leave", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("last owner", { status: 409 }),
    );

    await expect(leaveWorkspace("ws-1")).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
    });
  });

  it("throws ApiError 403 when caller isn't a member", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("not member", { status: 403 }),
    );

    await expect(leaveWorkspace("ws-1")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
    });
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm vitest run lib/api/members.test.ts`
Expected: FAIL — `leaveWorkspace is not a function`.

- [ ] **Step 3: Implement**

Append to `lib/api/members.ts`:

```typescript
/**
 * DELETE /api/v1/workspaces/{ws_id}/members/me → 204.
 * 409 if caller is the last remaining owner. 403 if caller isn't a member.
 * See BACKEND_GAPS #29.
 */
export async function leaveWorkspace(wsId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/members/me`, {
    method: "DELETE",
  });
}
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `pnpm vitest run lib/api/members.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/api/members.ts lib/api/members.test.ts
git commit -m "feat(api): leaveWorkspace (DELETE /members/me)"
```

### Task 2.B.2: Add `useLeaveWorkspace` mutation hook

**Files:**
- Create: `hooks/useLeaveWorkspace.ts`

- [ ] **Step 1: Implement**

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveWorkspace } from "@/lib/api/members";
import { queryKeys } from "@/lib/api/keys";

export function useLeaveWorkspace(wsId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => leaveWorkspace(wsId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.detail(wsId) });
    },
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add hooks/useLeaveWorkspace.ts
git commit -m "feat(hooks): useLeaveWorkspace mutation"
```

### Task 2.B.3: Add `leaveWs` keys under `messages.settings`

**Files:**
- Modify: `lib/messages.ts`

- [ ] **Step 1: Add keys to the existing `settings` namespace**

Inside the `settings: { ... }` block in `lib/messages.ts`, add the following keys (after `permissionEditor`):

```typescript
    leaveWs: "离开工作区",
    leaveWsConfirmTitle: "离开工作区？",
    leaveWsConfirmBody: (wsName: string) =>
      `确定要离开 ${wsName} 吗？你将失去对所有项目和产出的访问权限。`,
    leaveWsConfirm: "离开",
    leaveWsCancel: "取消",
    leaveWsLastOwner:
      "你是这个工作区唯一的 owner，先把另一个成员升级为 owner 再离开。",
    leaveWsLastOwnerTitle: "无法离开",
    leaveWsLastOwnerClose: "知道了",
    leaveWsNotMember: "你已经不是这个工作区的成员了",
    leaveWsFailed: "操作失败",
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/messages.ts
git commit -m "feat(messages): settings.leaveWs* strings"
```

### Task 2.B.4: Create `LeaveWorkspaceButton` component

This component owns the entire leave-workspace UX: the trigger button, the confirm dialog, the 409 "last owner" follow-up dialog, the success redirect, and the misc error inline feedback. Keeping it in one component avoids polluting `settings/page.tsx`.

**Files:**
- Create: `components/workspace/LeaveWorkspaceButton.tsx`
- Create: `components/workspace/LeaveWorkspaceButton.test.tsx`

- [ ] **Step 1: Write the failing component test**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LeaveWorkspaceButton } from "./LeaveWorkspaceButton";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: pushMock, push: pushMock }),
}));

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("LeaveWorkspaceButton", () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
    Object.defineProperty(window, "localStorage", {
      value: {
        store: { "brainrot.lastWsId": "ws-1" } as Record<string, string>,
        getItem(k: string) {
          return this.store[k] ?? null;
        },
        setItem(k: string, v: string) {
          this.store[k] = v;
        },
        removeItem(k: string) {
          delete this.store[k];
        },
        clear() {
          this.store = {};
        },
      },
      writable: true,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens confirm dialog and redirects on 204", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    renderWithClient(<LeaveWorkspaceButton wsId="ws-1" wsName="Acme" />);

    fireEvent.click(screen.getByRole("button", { name: "离开工作区" }));
    expect(screen.getByText(/确定要离开 Acme/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "离开" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));
    expect(window.localStorage.getItem("brainrot.lastWsId")).toBeNull();
  });

  it("shows last-owner follow-up dialog on 409 and does not redirect", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("last owner", { status: 409 }),
    );
    renderWithClient(<LeaveWorkspaceButton wsId="ws-1" wsName="Acme" />);

    fireEvent.click(screen.getByRole("button", { name: "离开工作区" }));
    fireEvent.click(screen.getByRole("button", { name: "离开" }));

    await waitFor(() =>
      expect(
        screen.getByText(/你是这个工作区唯一的 owner/),
      ).toBeInTheDocument(),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("redirects with inline note on 403", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("not member", { status: 403 }),
    );
    renderWithClient(<LeaveWorkspaceButton wsId="ws-1" wsName="Acme" />);

    fireEvent.click(screen.getByRole("button", { name: "离开工作区" }));
    fireEvent.click(screen.getByRole("button", { name: "离开" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm vitest run components/workspace/LeaveWorkspaceButton.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/brand/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/brand/dialog";
import { useLeaveWorkspace } from "@/hooks/useLeaveWorkspace";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

interface Props {
  wsId: string;
  wsName: string;
}

export function LeaveWorkspaceButton({ wsId, wsName }: Props) {
  const m = messages.settings;
  const router = useRouter();
  const leave = useLeaveWorkspace(wsId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastOwnerOpen, setLastOwnerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function clearLastWsId() {
    try {
      window.localStorage.removeItem("brainrot.lastWsId");
    } catch {
      // private mode / SSR safety: ignore
    }
  }

  function onConfirm() {
    leave.mutate(undefined, {
      onSuccess: () => {
        clearLastWsId();
        router.replace("/");
      },
      onError: (err) => {
        if (err instanceof ApiError) {
          if (err.status === 409) {
            setLastOwnerOpen(true);
            return;
          }
          if (err.status === 403) {
            clearLastWsId();
            router.replace("/");
            return;
          }
        }
        setToast(m.leaveWsFailed);
        setTimeout(() => setToast(null), 2500);
      },
    });
  }

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={leave.isPending}
          className="px-3 py-1.5 border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold text-sm disabled:opacity-50"
        >
          {m.leaveWs}
        </button>
        {toast && <span className="text-xs text-state-failed">{toast}</span>}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={m.leaveWsConfirmTitle}
        description={m.leaveWsConfirmBody(wsName)}
        confirmLabel={m.leaveWsConfirm}
        cancelLabel={m.leaveWsCancel}
        destructive
        onConfirm={onConfirm}
      />
      <Dialog open={lastOwnerOpen} onOpenChange={setLastOwnerOpen}>
        <DialogContent>
          <DialogTitle>{m.leaveWsLastOwnerTitle}</DialogTitle>
          <DialogDescription>{m.leaveWsLastOwner}</DialogDescription>
          <div className="flex justify-end mt-5">
            <button
              type="button"
              onClick={() => setLastOwnerOpen(false)}
              className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
            >
              {m.leaveWsLastOwnerClose}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

> **Note on the 409 design:** The spec asked "dialog 不关，把 body 文案换成 lastOwner". Because `ConfirmDialog` auto-closes on confirm (see line 53 of `components/brand/confirm-dialog.tsx`), we instead pop a **second** dialog after the confirm dialog closes. Functionally identical to "swapping content"; structurally simpler and doesn't require modifying the shared `ConfirmDialog`.

- [ ] **Step 4: Run the tests, confirm they pass**

Run: `pnpm vitest run components/workspace/LeaveWorkspaceButton.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/workspace/LeaveWorkspaceButton.tsx components/workspace/LeaveWorkspaceButton.test.tsx
git commit -m "feat(workspace): LeaveWorkspaceButton with 409 last-owner follow-up"
```

### Task 2.B.5: Wire LeaveWorkspaceButton into the danger zone

**Files:**
- Modify: `app/(app)/w/[wsId]/settings/page.tsx`

- [ ] **Step 1: Add the button next to the disabled archive button**

Replace the danger-zone Card body in `app/(app)/w/[wsId]/settings/page.tsx` (the inner `<Card>` at the bottom containing only the disabled archive button) with:

```typescript
        <Card
          chunky
          className="p-5"
          style={{ borderColor: "var(--state-failed)" }}
        >
          <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-state-failed font-bold mb-3">
            {m.dangerSection}
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              disabled
              title={m.dangerArchiveSoon}
              className="px-3 py-1.5 border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold text-sm opacity-50"
            >
              {m.dangerArchive}
            </button>
            {ws && <LeaveWorkspaceButton wsId={wsId} wsName={ws.name} />}
          </div>
        </Card>
```

Also add the import at the top:

```typescript
import { LeaveWorkspaceButton } from "@/components/workspace/LeaveWorkspaceButton";
```

- [ ] **Step 2: Typecheck + lint + tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/w/\[wsId\]/settings/page.tsx
git commit -m "feat(settings): render LeaveWorkspaceButton in danger zone"
```

- [ ] **Step 4: Manual smoke test**

Run: `pnpm dev` (backend up)
1. Log in as a workspace **member with another owner present** (or seed two owners), open settings → click 离开工作区 → confirm → land on `/` and the workspace disappears from sidebar.
2. Re-add yourself, become the sole owner, click 离开工作区 → confirm → second dialog shows "你是这个工作区唯一的 owner..." and you stay on settings.
3. (Optional, harder) simulate 403 by manually deleting your membership in another tab first, then clicking → should redirect to `/` silently.
Expected: 1 and 2 pass; 3 best-effort.

### Task 2.J.1: Find and document the base64 fallback sites

**Files (read-only):**
- `lib/parse-message.ts`
- `lib/chat/enrich-message.ts`
- `lib/api/messages.test.ts`

- [ ] **Step 1: Locate the fallback**

Run: `grep -n "coerceContent\|atob\|base64\|fromCharCode" lib/parse-message.ts lib/chat/enrich-message.ts`
Expected: matches in `coerceContent` (in `parse-message.ts`) and metadata handling (in `enrich-message.ts`). Note the line numbers.

Also run: `grep -n "atob\|base64\|fromCharCode" lib/api/messages.test.ts`
Expected: any tests that pass base64 string content into the parser. These must be updated.

- [ ] **Step 2: Read the spec deletion list**

The spec section 4.3 specifies:
- Delete the `typeof content === 'string'` → base64 decode → JSON.parse branch in `coerceContent` (parse-message.ts). Keep the "already an object" path.
- Delete metadata base64-string fallback in `enrich-message.ts`.
- Delete or update any test in `lib/api/messages.test.ts` that explicitly asserts base64 wire decoding.

No code change in this task — this is just orientation. Proceed to Task 2.J.2.

### Task 2.J.2: Delete base64 fallback, update tests

**Files:**
- Modify: `lib/parse-message.ts`
- Modify: `lib/chat/enrich-message.ts`
- Modify: `lib/api/messages.test.ts`

- [ ] **Step 1: Delete fallback in parse-message.ts**

Open `lib/parse-message.ts`. Inside `coerceContent` (or wherever string → base64 → JSON.parse happens), remove the branch. The remaining code should accept only `content` already shaped as an object (`{text, mentions, ...}`). If `content` is a string, treat it as legacy and either:
- assume it's plain text (`return { text: content, mentions: [] }`) — preferred fallback
- or throw (only if no caller path can hit this anymore)

Use the "assume plain text" form for safety.

- [ ] **Step 2: Delete metadata base64 fallback in enrich-message.ts**

Open `lib/chat/enrich-message.ts`. Remove any branch that detects `typeof metadata === 'string'` + atob + JSON.parse. After the change, `metadata` is expected to be an object (or null/undefined). If a string is received, ignore it (treat as no metadata).

- [ ] **Step 3: Update tests**

Open `lib/api/messages.test.ts`. Any test that constructs a wire `Message` with `content: "<base64 string>"` and asserts the parser decodes it: rewrite the test to pass `content: { text: "...", mentions: [...] }` directly. If a test's only purpose was "base64 wire format is handled", delete the test.

- [ ] **Step 4: Run tests**

Run: `pnpm test`
Expected: all green. If a test you didn't expect to fail is failing, check whether it was implicitly relying on the base64 path.

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add lib/parse-message.ts lib/chat/enrich-message.ts lib/api/messages.test.ts
git commit -m "refactor(chat): remove base64 fallback (backend #30 fixed in PR #4)"
```

- [ ] **Step 7: Manual smoke test**

Run: `pnpm dev` (backend must be the post-PR-#4 build, otherwise this test will fail)
1. Open a task, send a message with text + mention
2. Verify the message renders with text content (no empty bubbles)
3. Send another, verify it appears (WS path)
4. Refresh page, verify all messages still render correctly (REST path)
Expected: all 4 pass.

### Task 2.K.1: Fix Composer mention double-space in serializer

**Files:**
- Create: `lib/chat/serialize-editor.test.ts`
- Modify: `lib/chat/serialize-editor.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/chat/serialize-editor.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import type { Editor } from "@tiptap/core";

// We don't import the real Editor; we build a minimal stub that mimics
// what `serializeEditor` uses (editor.state.doc.descendants).

interface StubNode {
  type: { name: string };
  isText?: boolean;
  text?: string;
  attrs?: { handle?: string; id?: string };
}

function makeEditorStub(nodes: StubNode[]): Editor {
  return {
    state: {
      doc: {
        descendants(cb: (node: StubNode) => void) {
          for (const n of nodes) cb(n);
        },
      },
    },
  } as unknown as Editor;
}

import { serializeEditor } from "./serialize-editor";

describe("serializeEditor", () => {
  it("collapses double space after a mention", () => {
    const editor = makeEditorStub([
      { type: { name: "paragraph" } },
      { type: { name: "mention" }, attrs: { handle: "coder", id: "a1" } },
      { type: { name: "text" }, isText: true, text: " " }, // auto-inserted
      { type: { name: "text" }, isText: true, text: " 你好" }, // user typed
    ]);
    expect(serializeEditor(editor)).toEqual({ text: "@coder 你好", mentions: ["a1"] });
  });

  it("leaves a single space alone", () => {
    const editor = makeEditorStub([
      { type: { name: "paragraph" } },
      { type: { name: "mention" }, attrs: { handle: "coder", id: "a1" } },
      { type: { name: "text" }, isText: true, text: " 你好" },
    ]);
    expect(serializeEditor(editor)).toEqual({ text: "@coder 你好", mentions: ["a1"] });
  });

  it("handles no space (mention followed immediately by text)", () => {
    const editor = makeEditorStub([
      { type: { name: "paragraph" } },
      { type: { name: "mention" }, attrs: { handle: "coder", id: "a1" } },
      { type: { name: "text" }, isText: true, text: "你好" },
    ]);
    expect(serializeEditor(editor)).toEqual({ text: "@coder你好", mentions: ["a1"] });
  });

  it("collapses double space after each of two consecutive mentions", () => {
    const editor = makeEditorStub([
      { type: { name: "paragraph" } },
      { type: { name: "mention" }, attrs: { handle: "a", id: "a1" } },
      { type: { name: "text" }, isText: true, text: " " },
      { type: { name: "text" }, isText: true, text: " " }, // user typed extra space
      { type: { name: "mention" }, attrs: { handle: "b", id: "a2" } },
      { type: { name: "text" }, isText: true, text: " " },
      { type: { name: "text" }, isText: true, text: " 你好" },
    ]);
    expect(serializeEditor(editor)).toEqual({
      text: "@a @b 你好",
      mentions: ["a1", "a2"],
    });
  });

  it("does not collapse double spaces elsewhere in the text", () => {
    const editor = makeEditorStub([
      { type: { name: "paragraph" } },
      { type: { name: "text" }, isText: true, text: "hello  world" }, // 2 spaces between words
    ]);
    expect(serializeEditor(editor)).toEqual({ text: "hello  world", mentions: [] });
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm vitest run lib/chat/serialize-editor.test.ts`
Expected: FAIL on the "collapses double space after a mention" case — current serializer outputs `@coder  你好` (2 spaces).

- [ ] **Step 3: Modify serializeEditor**

Replace `lib/chat/serialize-editor.ts` contents with:

```typescript
import type { Editor } from "@tiptap/core";

export function serializeEditor(editor: Editor): { text: string; mentions: string[] } {
  const mentions: string[] = [];
  let text = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ProseMirror Node type is deeply parameterized; we access well-known fields
  editor.state.doc.descendants((node: any) => {
    if (node.type.name === "mention") {
      text += `@${node.attrs.handle}`;
      mentions.push(node.attrs.id);
    } else if (node.isText) {
      text += node.text ?? "";
    } else if (node.type.name === "paragraph") {
      if (text.length > 0 && !text.endsWith("\n")) text += "\n";
    }
    return true;
  });
  // Collapse runs of 2+ spaces that immediately follow a mention handle.
  // The MentionExtension auto-inserts a single space after the picked mention;
  // when the user also types a space, two adjacent text nodes get concatenated
  // and we end up with "@handle  text". We fix it in serialization only —
  // the editor doc itself keeps the auto-space for UX reasons.
  const collapsed = text.replace(/(@[A-Za-z0-9_-]+)  +/g, "$1 ");
  return { text: collapsed.replace(/\n+$/, ""), mentions };
}
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `pnpm vitest run lib/chat/serialize-editor.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Run full test suite**

Run: `pnpm test`
Expected: all green. (Any old test in `lib/chat/` that asserted the buggy double-space output should now be re-examined; if found, update it.)

- [ ] **Step 6: Commit**

```bash
git add lib/chat/serialize-editor.ts lib/chat/serialize-editor.test.ts
git commit -m "fix(chat): collapse double space after mention in serializer"
```

- [ ] **Step 7: Manual smoke test**

Run: `pnpm dev`
1. Open a task, click into Composer
2. Type `@cod`, pick `coder` from popup, type ` 你好` (one space + text)
3. Open DevTools → Network → send → look at the POST body for `/messages` — verify `content.text === "@coder 你好"` (one space, not two)
4. Try `@coder你好` (no space) → verify wire payload is `@coder你好`
5. Try `@a @b 你好` → verify wire payload has single spaces
Expected: all 4 pass.

### Task 2.X: Open PR2

- [ ] **Step 1: Push the branch**

```bash
git push -u origin s6/pr2-small-wins
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "S6 PR2: artifact exclude + leave workspace + base64 cleanup + mention serializer fix" --body "$(cat <<'EOF'
## Summary

S6 small-wins bundle. Closes:
- **A** artifact exclude button (consumes backend #28)
- **B** leave-workspace button (consumes backend #29; 409 last-owner follow-up dialog)
- **J** delete base64 fallback in parse-message / enrich-message (consumes backend #30)
- **K** Composer mention serializer double-space fix

## Test plan

- [ ] hover an artifact row → "排除" button visible
- [ ] click → ConfirmDialog with filename in body
- [ ] confirm → row disappears, persists across refresh
- [ ] settings page, non-last-owner: 离开工作区 → confirm → redirect to /
- [ ] settings page, last owner: 离开工作区 → confirm → second dialog appears with "唯一 owner" message, no redirect
- [ ] send a message in a task; verify no empty bubble; verify text content rendered correctly via both WS push and REST refresh
- [ ] type `@coder 你好` in Composer; verify wire `content.text` is single-spaced

## Notes

- Spec: `docs/superpowers/specs/2026-05-19-s6-usability-and-completeness-design.md`
- 409 last-owner UX: implemented as a follow-up dialog (not in-place body swap) because the shared ConfirmDialog auto-closes on confirm. Functionally identical.
- Base64 fallback deletion assumes backend is post-PR #4 (which it is on prod / staging).
EOF
)"
```

- [ ] **Step 3: Verify CI passes, then merge to main**

After merge:
```bash
cd ../..  # back to main checkout (not the worktree)
git checkout main && git pull origin main
git worktree remove .worktrees/s6-pr2-small-wins
git push origin --delete s6/pr2-small-wins
```

---

## PR3a — I drag-and-drop + paste screenshot (new worktree)

> Create a fresh worktree off the updated main:
>
> ```bash
> git worktree add .worktrees/s6-pr3a-drag-paste -b s6/pr3a-drag-paste
> cd .worktrees/s6-pr3a-drag-paste
> pnpm install
> pnpm test
> ```

### Task 3a.1: Add upload + paste keys under `messages.assets`

**Files:**
- Modify: `lib/messages.ts`

- [ ] **Step 1: Extend the `assets` namespace**

Inside `assets: { ... }` in `lib/messages.ts`, append (after `loadError`):

```typescript
    dropZoneTitle: "拖拽到任意位置上传",
    dropZoneSubtitle: "上传到当前项目的素材",
    pasteUploading: "正在上传截图…",
    pasteUploadedHint: (filename: string) =>
      `已上传 ${filename}（见右栏 Assets）`,
    pasteUploadFailed: "截图上传失败",
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/messages.ts
git commit -m "feat(messages): drop-zone and paste-image strings"
```

### Task 3a.2: Add `useProjectIdFromRoute` hook

**Files:**
- Create: `hooks/useProjectIdFromRoute.ts`
- Create: `hooks/useProjectIdFromRoute.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProjectIdFromRoute } from "./useProjectIdFromRoute";

const pathnameMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

describe("useProjectIdFromRoute", () => {
  it("extracts projectId from /w/ws-1/p/p-2/t/t-3", () => {
    pathnameMock.mockReturnValue("/w/ws-1/p/p-2/t/t-3");
    const { result } = renderHook(() => useProjectIdFromRoute());
    expect(result.current).toBe("p-2");
  });

  it("extracts projectId from /w/ws-1/p/p-2 (no task)", () => {
    pathnameMock.mockReturnValue("/w/ws-1/p/p-2");
    const { result } = renderHook(() => useProjectIdFromRoute());
    expect(result.current).toBe("p-2");
  });

  it("returns null for /approvals", () => {
    pathnameMock.mockReturnValue("/approvals");
    const { result } = renderHook(() => useProjectIdFromRoute());
    expect(result.current).toBeNull();
  });

  it("returns null for /w/ws-1/settings", () => {
    pathnameMock.mockReturnValue("/w/ws-1/settings");
    const { result } = renderHook(() => useProjectIdFromRoute());
    expect(result.current).toBeNull();
  });

  it("returns null for /", () => {
    pathnameMock.mockReturnValue("/");
    const { result } = renderHook(() => useProjectIdFromRoute());
    expect(result.current).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm vitest run hooks/useProjectIdFromRoute.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```typescript
"use client";

import { usePathname } from "next/navigation";

const RE = /^\/w\/[^/]+\/p\/([^/]+)(?:\/|$)/;

export function useProjectIdFromRoute(): string | null {
  const pathname = usePathname();
  if (!pathname) return null;
  const m = pathname.match(RE);
  return m?.[1] ?? null;
}
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `pnpm vitest run hooks/useProjectIdFromRoute.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add hooks/useProjectIdFromRoute.ts hooks/useProjectIdFromRoute.test.ts
git commit -m "feat(hooks): useProjectIdFromRoute"
```

### Task 3a.3: Add `screenshot-filename` utility

**Files:**
- Create: `lib/upload/screenshot-filename.ts`
- Create: `lib/upload/screenshot-filename.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { screenshotFilename } from "./screenshot-filename";

describe("screenshotFilename", () => {
  it("formats from a Date with mime image/png", () => {
    const d = new Date("2026-05-19T15:30:22.123Z");
    expect(screenshotFilename(d, "image/png")).toBe(
      "screenshot-20260519-153022.png",
    );
  });

  it("uses jpg for image/jpeg", () => {
    const d = new Date("2026-01-01T00:00:00Z");
    expect(screenshotFilename(d, "image/jpeg")).toBe(
      "screenshot-20260101-000000.jpg",
    );
  });

  it("falls back to png when mime is unrecognised", () => {
    const d = new Date("2026-05-19T15:30:22Z");
    expect(screenshotFilename(d, "image/webp")).toBe(
      "screenshot-20260519-153022.png",
    );
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm vitest run lib/upload/screenshot-filename.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```typescript
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
};

function pad(n: number, w = 2): string {
  return n.toString().padStart(w, "0");
}

export function screenshotFilename(now: Date, mime: string): string {
  const ext = EXT[mime.toLowerCase()] ?? "png";
  const y = now.getUTCFullYear();
  const mo = pad(now.getUTCMonth() + 1);
  const d = pad(now.getUTCDate());
  const h = pad(now.getUTCHours());
  const mi = pad(now.getUTCMinutes());
  const s = pad(now.getUTCSeconds());
  return `screenshot-${y}${mo}${d}-${h}${mi}${s}.${ext}`;
}
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `pnpm vitest run lib/upload/screenshot-filename.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/upload/screenshot-filename.ts lib/upload/screenshot-filename.test.ts
git commit -m "feat(upload): screenshotFilename utility"
```

### Task 3a.4: Create `DropZoneOverlay` component

`DropZoneOverlay` listens to `document` drag events. When `projectId` is non-null and a file is being dragged in, it shows a full-screen visual overlay. On drop, it calls `useUploadAssets(projectId).start(files)`. The progress UI re-uses the existing assets-tab upload UI (which is already mounted in the right panel); however, when the user is not looking at the right panel, drop progress is invisible — so we also render a minimal status line *inside* the overlay during active drag/upload.

**Files:**
- Create: `components/upload/DropZoneOverlay.tsx`
- Create: `components/upload/DropZoneOverlay.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DropZoneOverlay } from "./DropZoneOverlay";

const pathnameMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

function dragEvent(type: string, types: string[], files: File[] = []) {
  const ev = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(ev, "dataTransfer", {
    value: { types, files } as unknown as DataTransfer,
  });
  return ev;
}

describe("DropZoneOverlay", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders overlay on dragenter when on a project route with Files", () => {
    pathnameMock.mockReturnValue("/w/ws-1/p/p-1/t/t-1");
    renderWithClient(<DropZoneOverlay />);
    act(() => {
      document.dispatchEvent(dragEvent("dragenter", ["Files"]));
    });
    expect(screen.getByText("拖拽到任意位置上传")).toBeInTheDocument();
  });

  it("does NOT render overlay on dragenter when not on a project route", () => {
    pathnameMock.mockReturnValue("/approvals");
    renderWithClient(<DropZoneOverlay />);
    act(() => {
      document.dispatchEvent(dragEvent("dragenter", ["Files"]));
    });
    expect(screen.queryByText("拖拽到任意位置上传")).toBeNull();
  });

  it("ignores non-file drags (text)", () => {
    pathnameMock.mockReturnValue("/w/ws-1/p/p-1");
    renderWithClient(<DropZoneOverlay />);
    act(() => {
      document.dispatchEvent(dragEvent("dragenter", ["text/plain"]));
    });
    expect(screen.queryByText("拖拽到任意位置上传")).toBeNull();
  });

  it("hides overlay on dragleave when counter reaches zero", () => {
    pathnameMock.mockReturnValue("/w/ws-1/p/p-1/t/t-1");
    renderWithClient(<DropZoneOverlay />);
    act(() => {
      document.dispatchEvent(dragEvent("dragenter", ["Files"]));
    });
    expect(screen.getByText("拖拽到任意位置上传")).toBeInTheDocument();
    act(() => {
      document.dispatchEvent(dragEvent("dragleave", ["Files"]));
    });
    expect(screen.queryByText("拖拽到任意位置上传")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm vitest run components/upload/DropZoneOverlay.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { useProjectIdFromRoute } from "@/hooks/useProjectIdFromRoute";
import { useUploadAssets } from "@/hooks/useUploadAssets";
import { messages } from "@/lib/messages";

export function DropZoneOverlay() {
  const m = messages.assets;
  const projectId = useProjectIdFromRoute();
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const upload = useUploadAssets(projectId ?? "");

  useEffect(() => {
    if (!projectId) return;

    function hasFiles(types: ReadonlyArray<string> | DOMStringList | undefined): boolean {
      if (!types) return false;
      // DataTransfer.types can be either array-like or DOMStringList; convert.
      const arr = Array.from(types as ArrayLike<string>);
      return arr.includes("Files");
    }

    function onDragEnter(e: DragEvent) {
      if (!hasFiles(e.dataTransfer?.types)) return;
      e.preventDefault();
      dragCounter.current += 1;
      setIsDragOver(true);
    }
    function onDragOver(e: DragEvent) {
      if (!hasFiles(e.dataTransfer?.types)) return;
      e.preventDefault();
    }
    function onDragLeave(e: DragEvent) {
      if (!hasFiles(e.dataTransfer?.types)) return;
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) setIsDragOver(false);
    }
    function onDrop(e: DragEvent) {
      if (!hasFiles(e.dataTransfer?.types)) return;
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) void upload.start(files);
    }

    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
      dragCounter.current = 0;
    };
  }, [projectId, upload]);

  if (!projectId || !isDragOver) return null;

  return (
    <div
      data-testid="dropzone-overlay"
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-paper-1/95 border-[3px] border-dashed border-ink-0"
    >
      <div className="text-center">
        <p className="text-2xl font-bold text-ink-0">{m.dropZoneTitle}</p>
        <p className="text-sm text-ink-2 mt-2">{m.dropZoneSubtitle}</p>
      </div>
    </div>
  );
}
```

> **Caveat about progress state:** Each call to `useUploadAssets(projectId)` produces an independent `items` array. The right-panel `UploadButton` and this overlay therefore each have their **own** in-progress list. We accept this for S6 — the overlay's job is to **start** the upload; the user's natural place to monitor progress is the assets tab where they'll go to find the file. A future refactor could lift `useUploadAssets` into a context provider, but it's out of scope.

- [ ] **Step 4: Run the test, confirm it passes**

Run: `pnpm vitest run components/upload/DropZoneOverlay.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/upload/DropZoneOverlay.tsx components/upload/DropZoneOverlay.test.tsx
git commit -m "feat(upload): DropZoneOverlay component"
```

### Task 3a.5: Mount DropZoneOverlay in (app) layout

**Files:**
- Modify: `app/(app)/layout.tsx`

- [ ] **Step 1: Read the layout**

Run: `cat app/\(app\)/layout.tsx`
Note where the children are rendered so we can mount the overlay as a sibling (not wrapping children — it's `fixed` positioned).

- [ ] **Step 2: Add the import and the overlay**

Inside `app/(app)/layout.tsx`, in the **authenticated branch** (after the session check passes), render `<DropZoneOverlay />` as a sibling somewhere inside the top-level JSX (the position inside JSX doesn't matter because the overlay is `fixed inset-0`; just keep it adjacent to other layout primitives, e.g. right after `<OfflineBanner />` or similar).

Import at the top:

```typescript
import { DropZoneOverlay } from "@/components/upload/DropZoneOverlay";
```

In the JSX, add `<DropZoneOverlay />` once.

- [ ] **Step 3: Typecheck + lint + tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/layout.tsx
git commit -m "feat(layout): mount DropZoneOverlay in authenticated shell"
```

- [ ] **Step 5: Manual smoke test (DropZone only)**

Run: `pnpm dev`
1. Log in, open a task `/w/ws-1/p/p-1/t/t-1`
2. From your desktop, drag a PNG into the browser window → see full-screen overlay
3. Drop → see assets tab refresh with the new file (or open assets tab and confirm)
4. Drag the same PNG over `/approvals` → no overlay (browser will offer to open the file when you drop)
5. Drag a text selection from another tab into the task page → no overlay (it's not a file drag)
Expected: all 5 pass.

### Task 3a.6: Add `PasteImageExtension` for Composer

**Files:**
- Create: `components/chat/PasteImageExtension.ts`
- Create: `components/chat/PasteImageExtension.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { createPasteImageExtension } from "./PasteImageExtension";

function makePasteEvent(items: Array<{ kind: string; type: string; file: File | null }>): ClipboardEvent {
  const ev = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(ev, "clipboardData", {
    value: {
      items: items.map((it) => ({
        kind: it.kind,
        type: it.type,
        getAsFile: () => it.file,
      })),
    } as unknown as DataTransfer,
  });
  return ev;
}

function pngFile(): File {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "clip.png", {
    type: "image/png",
  });
}

describe("createPasteImageExtension", () => {
  it("invokes onPasteImages with all image files and returns true", () => {
    const onPasteImages = vi.fn();
    const ext = createPasteImageExtension({ onPasteImages });
    // Tiptap Extension exposes its ProseMirror plugins via addProseMirrorPlugins.
    // We invoke handlePaste from the plugin spec directly.
    const plugins = ext.config.addProseMirrorPlugins!.call({} as never);
    const plugin = plugins[0]!;
    // ProseMirror Plugin spec — props.handlePaste exists on its props.
    const handlePaste = plugin.props!.handlePaste as (
      view: unknown,
      event: ClipboardEvent,
    ) => boolean;

    const a = pngFile();
    const b = pngFile();
    const ev = makePasteEvent([
      { kind: "file", type: "image/png", file: a },
      { kind: "file", type: "image/png", file: b },
      { kind: "string", type: "text/plain", file: null },
    ]);

    const result = handlePaste(null, ev);
    expect(result).toBe(true);
    expect(onPasteImages).toHaveBeenCalledWith([a, b]);
  });

  it("returns false when clipboard has no image files", () => {
    const onPasteImages = vi.fn();
    const ext = createPasteImageExtension({ onPasteImages });
    const plugins = ext.config.addProseMirrorPlugins!.call({} as never);
    const plugin = plugins[0]!;
    const handlePaste = plugin.props!.handlePaste as (
      view: unknown,
      event: ClipboardEvent,
    ) => boolean;

    const ev = makePasteEvent([
      { kind: "string", type: "text/plain", file: null },
    ]);

    const result = handlePaste(null, ev);
    expect(result).toBe(false);
    expect(onPasteImages).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm vitest run components/chat/PasteImageExtension.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```typescript
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

interface Options {
  onPasteImages: (files: File[]) => void;
}

export function createPasteImageExtension(opts: Options) {
  return Extension.create({
    name: "pasteImage",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handlePaste(_view, event: ClipboardEvent) {
              const items = Array.from(event.clipboardData?.items ?? []);
              const images: File[] = [];
              for (const item of items) {
                if (item.kind === "file" && item.type.startsWith("image/")) {
                  const f = item.getAsFile();
                  if (f) images.push(f);
                }
              }
              if (images.length === 0) return false;
              opts.onPasteImages(images);
              return true;
            },
          },
        }),
      ];
    },
  });
}
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `pnpm vitest run components/chat/PasteImageExtension.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/chat/PasteImageExtension.ts components/chat/PasteImageExtension.test.ts
git commit -m "feat(chat): PasteImageExtension"
```

### Task 3a.7: Wire PasteImageExtension into Composer

`Composer` currently receives `wsId, taskId`. The project the screenshots should land in is the task's parent project. Let's check whether the task's project id is reachable from Composer's existing props.

**Files:**
- Modify: `components/chat/Composer.tsx`

- [ ] **Step 1: Find how Composer gets task → project linkage**

Run: `grep -rn "Composer" app/ components/ | head -20`
Look for where `<Composer wsId={...} taskId={...} />` is rendered. Find the surrounding scope to see how `projectId` is available. If `projectId` isn't available at the call site, we need to plumb it through:

- Option A: add a `projectId` prop to `Composer` and pass it from the caller
- Option B: fetch task detail inside Composer to get `task.project_id`

Pick A (avoids a second query). The plan continues with A.

- [ ] **Step 2: Add `projectId` prop to Composer**

Replace `components/chat/Composer.tsx` interface and editor extensions block to inject `PasteImageExtension`. Concretely:

1. Update `ComposerProps`:

```typescript
interface ComposerProps {
  wsId: string;
  taskId: string;
  projectId: string;
}
```

2. Inside the component, import:

```typescript
import { useUploadAssets } from "@/hooks/useUploadAssets";
import { createPasteImageExtension } from "./PasteImageExtension";
import { screenshotFilename } from "@/lib/upload/screenshot-filename";
```

3. Get `useUploadAssets`:

```typescript
const { start: startUpload } = useUploadAssets(projectId);
```

4. Build a paste handler:

```typescript
function onPasteImages(files: File[]) {
  // Files coming from clipboard often have empty .name; rename them.
  const now = new Date();
  const named: File[] = files.map((f) =>
    f.name && f.name !== "image.png"
      ? f
      : new File([f], screenshotFilename(now, f.type || "image/png"), { type: f.type }),
  );
  // After upload, insert a hint line per file. We don't have asset ids here
  // synchronously, so we wait for start() to resolve before inserting.
  void (async () => {
    await startUpload(named);
    if (!editor) return;
    for (const f of named) {
      editor
        .chain()
        .focus()
        .insertContent(messages.assets.pasteUploadedHint(f.name) + "\n")
        .run();
    }
  })();
}
```

5. Add the extension to the `extensions` array of `useEditor`:

```typescript
    extensions: [
      Document,
      Paragraph,
      Text,
      Placeholder.configure({ /* unchanged */ }),
      createMentionExtension({ /* unchanged */ }),
      createPasteImageExtension({ onPasteImages }),
    ],
```

6. Add `messages` import if not already imported:

```typescript
import { messages } from "@/lib/messages";
```

- [ ] **Step 3: Update the Composer caller(s) to pass `projectId`**

Find each `<Composer ... />` usage and add `projectId={...}`. The most common caller is the task detail page; the task's project id should be in scope (the route is `/w/[wsId]/p/[projectId]/t/[taskId]`).

Run: `grep -rn "<Composer" app/ components/`
Update each caller. For the task-detail page, the `projectId` comes from `useParams`.

- [ ] **Step 4: Typecheck + lint + tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add components/chat/Composer.tsx app/\(app\)/w/\[wsId\]/p/\[projectId\]/t/\[taskId\]/page.tsx
git commit -m "feat(composer): paste-screenshot upload + hint insertion"
```

> **If grep finds more than one Composer caller:** stage all of them in this commit. There should still be one task-detail page, but verify.

- [ ] **Step 6: Manual smoke test (paste)**

Run: `pnpm dev`
1. Open a task → click into the Composer
2. Take a screenshot to clipboard (OS-level: Win+Shift+S on Windows, Cmd+Shift+Ctrl+4 on macOS, etc.)
3. Cmd/Ctrl+V into Composer
4. Verify: a) the assets tab refreshes with a new `screenshot-YYYYMMDD-HHmmss.png`, b) Composer shows a "已上传 screenshot-... (见右栏 Assets)" line
5. Repeat with two screenshots in one paste (uncommon but try) → expect 2 assets + 2 hint lines
6. Paste a plain text string (not a file) → Composer behaves as normal (no upload triggered)
Expected: all 6 pass.

### Task 3a.8: Update FRONTEND.md

**Files:**
- Modify: `docs/FRONTEND.md`

- [ ] **Step 1: Append a "拖拽 + 粘贴上传" section**

Run: `grep -n "^## " docs/FRONTEND.md | head -20`
Find the upload-related section (or M7 milestone section). Append a subsection. Example content:

```markdown
### 拖拽 + 粘贴上传 (S6 PR3a)

- `<DropZoneOverlay />` 挂在 `app/(app)/layout.tsx`，监听 `document` dragenter/over/leave/drop。仅当 `useProjectIdFromRoute()` 返回非 null 时接管（task / project 路由），否则让浏览器默认行为接管。
- Composer 通过 `PasteImageExtension` 拦截 `image/*` 类剪贴板项，自动以 `screenshot-YYYYMMDD-HHmmss.<ext>` 命名后调用 `useUploadAssets`，上传成功后在编辑器插入 "已上传 …（见右栏 Assets）" 提示行。
- 富文本粘贴里的 `<img>` (data URL / 远程 URL) 与浏览器 tab 间拖 PDF 暂不支持。
```

- [ ] **Step 2: Commit**

```bash
git add docs/FRONTEND.md
git commit -m "docs(frontend): describe drag + paste upload"
```

### Task 3a.9: Open PR3a

- [ ] **Step 1: Push the branch**

```bash
git push -u origin s6/pr3a-drag-paste
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "S6 PR3a: drag-and-drop upload + paste screenshot" --body "$(cat <<'EOF'
## Summary

S6 I — drag-to-upload and paste-screenshot. Built on:
- `DropZoneOverlay` (`components/upload/`): mounted globally in `(app)/layout.tsx`, only activates on `/w/[wsId]/p/[projectId]/...` routes
- `PasteImageExtension` (`components/chat/`): Tiptap extension intercepting `image/*` clipboard items
- `screenshotFilename` utility: deterministic naming for clipboard files

## Test plan

- [ ] drag a PNG from desktop into a task page → overlay appears → drop → asset uploads
- [ ] drag a PNG into /approvals → no overlay, browser default behavior
- [ ] drag a text selection into a task page → no overlay
- [ ] paste a screenshot into Composer → asset uploads with `screenshot-YYYYMMDD-HHmmss.png` filename → Composer shows hint line
- [ ] paste plain text into Composer → normal text paste, no upload

## Notes

- Spec: `docs/superpowers/specs/2026-05-19-s6-usability-and-completeness-design.md`
- `useUploadAssets` is invoked per-component (UploadButton + DropZoneOverlay), so the in-progress UI in the assets tab is the canonical place to monitor upload progress. The overlay only triggers the start.
EOF
)"
```

- [ ] **Step 3: Verify CI passes, merge to main, clean up**

After merge:
```bash
cd ../..
git checkout main && git pull origin main
git worktree remove .worktrees/s6-pr3a-drag-paste
git push origin --delete s6/pr3a-drag-paste
```

---

## Self-Review (against spec)

Run this checklist before declaring the plan complete:

**Spec coverage:**
- A — exclude button: Task 2.A.1 → 2.A.4 ✓
- B — leave workspace: Task 2.B.1 → 2.B.5 ✓
- D — file preview: **intentionally excluded** (PR3b waits for backend #31). Spec §6.5 acknowledges this. Plan §PR1 step 3 adds the gap entry.
- I — drag + paste: Task 3a.1 → 3a.8 ✓
- J — base64 cleanup: Task 2.J.1 → 2.J.2 ✓
- K — mention serializer: Task 2.K.1 ✓
- PR1 cleanup: Task 1.1 ✓
- Worktree management: PR2 / PR3a headers each include worktree setup ✓
- BACKEND_GAPS #31 entry: Task 1.1 step 3 ✓
- FRONTEND.md update for drag+paste: Task 3a.8 ✓
- DoD per PR (typecheck/lint/test + manual smoke): each task ends with verification; each PR has a smoke-test step ✓

**Placeholder scan:** Every task has concrete file paths, complete code blocks where code is required, and concrete commands with expected output. No TODO / TBD / "implement later".

**Type / name consistency:** `setArtifactExcluded(id, excluded)` matches between API client (2.A.1), hook (2.A.2), and component usage (2.A.4). `leaveWorkspace(wsId)` matches between API (2.B.1), hook (2.B.2), and component (2.B.4). `useProjectIdFromRoute()` returns `string | null` consistently in 3a.2 and 3a.4. `screenshotFilename(date, mime)` signature matches between 3a.3 and 3a.7.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-19-s6-usability-and-completeness.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — execute tasks in this session, batch with checkpoints

Which approach?

# S5 — Collaboration & Uploads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the file + collaboration loop — asset uploads, batch approvals, email invites, workspace metadata edits, member management, and the agent-edit / encoding cleanup that S4 left as follow-ups.

**Architecture:** New branch `s5-collab-and-uploads` from `main`. Eight tasks ordered by risk-ascending: docs/typing cleanups first, then plumbing (members/ws), then UI (invite, upload, batch approvals). Each task is its own commit; final squash-merge as one PR.

**Tech Stack:** Next.js 15 App Router, React Query v5, Tailwind, Zustand (existing). New: native XHR for upload progress. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-19-s5-collab-and-uploads-design.md` (commit `e949b42`).

**Smoke-test protocol (mandatory before each task):** Before starting a task, hit the relevant backend endpoint(s) with PowerShell to confirm the actual response shape matches API.md. If the shape diverges, abort the task and append the discrepancy to `docs/BACKEND_GAPS.md`. This is the protocol that S4 lacked when it tripped over #22/#23.

**Backend baseline:** Confirm `D:\brainrot\bin\server.exe` was rebuilt from current `main` before starting. From `D:\brainrot`: `go build -o bin/server.exe ./cmd/server`. Then run `bin\server.exe` against the existing Postgres docker (`brainrot-postgres-1` on :5433). Test user: `qa@brainrot.local / qa-tester-pw-1`. Seed workspace: `29bbd200-1a89-46d3-bfaa-ad4a1af8b32d`.

---

## File Structure

### New files

- `lib/api/upload.ts` — `xhrUpload(url, formData, onProgress)` helper (only place that bypasses `apiFetch` because fetch can't observe upload progress).
- `lib/api/members.ts` — extended (already exists, has `addWorkspaceMember`). Add `listMembers`, `updateMemberRole`, `removeMember`, `inviteByEmail`, `updateWorkspace`.
- `lib/api/types.ts` — extended. Add `WorkspaceMember`, `UpdateWorkspaceInput`, `InviteInput`; tighten `WorkspaceRole` to the three roles backend actually accepts.
- `lib/api/keys.ts` — extended. Add `workspaces.members(wsId)`.
- `hooks/useWorkspaceMembers.ts` — list query.
- `hooks/useUpdateMemberRole.ts` — PATCH mutation, optimistic with rollback.
- `hooks/useRemoveMember.ts` — DELETE mutation.
- `hooks/useUpdateWorkspace.ts` — PATCH ws mutation.
- `hooks/useInviteByEmail.ts` — POST invitations mutation.
- `hooks/useUpdateAgent.ts` — restore (was removed/disabled in S4 follow-up).
- `hooks/useUploadAssets.ts` — orchestrates `File[]` → per-file state machine + serial uploads.
- `components/assets/UploadButton.tsx` — button + multi-file input + progress panel.
- `components/workspace/WorkspaceInfoForm.tsx` — PATCH name/slug form (extracted from settings page so settings page stays small).
- `components/workspace/MembersList.tsx` — list + row controls.
- `components/workspace/MemberRow.tsx` — single row with role dropdown + remove button.
- `components/approvals/BulkActionBar.tsx` — sticky top bar that appears when selection > 0.
- `components/approvals/BulkApprovalsList.tsx` — shared list-with-checkboxes wrapper used by both approval hub pages.
- `hooks/useBulkDecide.ts` — runs N decideOne calls with progress + per-id pass/fail.

### Modified files

- `app/(app)/w/[wsId]/settings/page.tsx` — replace placeholder sections with real forms / list.
- `app/(app)/w/[wsId]/agents/[agentId]/page.tsx` — drop read-only banner, wire `useUpdateAgent`.
- `components/workspace/AddMemberModal.tsx` — replace user_id flow with email flow.
- `components/task-detail/RightTabs/AssetsTab.tsx` — add UploadButton at the top.
- `components/approvals/ApprovalsHubPage.tsx` — wrap list in `BulkApprovalsList`.
- `app/(app)/approvals/page.tsx` — wrap list in `BulkApprovalsList` (passing a `PendingApproval → BulkRow` adapter).
- `lib/messages.ts` — extend the `addMember` and `settings` blocks; add `assets` upload strings, `members` strings, `bulkApprovals` strings.
- `hooks/useAgent.ts` — restore real `useQuery` shape.
- `lib/api/agents.ts` — drop the encoding-layer indirection.
- `lib/api/types.ts` — remove `AgentWire`; `WorkspaceRole` tightening.

### Deleted files

- `lib/api/agents-encoding.ts`
- `lib/api/agents-encoding.test.ts`

---

## Task 1: Verify backend baseline + branch hygiene

**Files:**
- Read: `docs/BACKEND_GAPS.md` (verify #19/#20/#21/#22 marked ✅ — already done in spec phase, this is the runtime confirmation)
- Confirm: working tree clean on branch `s5-collab-and-uploads`

- [ ] **Step 1.1: Confirm branch + clean tree**

```bash
git status
git rev-parse --abbrev-ref HEAD
```

Expected:
- Branch: `s5-collab-and-uploads`
- `nothing to commit, working tree clean`

If not on the branch: `git checkout s5-collab-and-uploads`. If main is ahead and the branch isn't based on the latest, rebase: `git fetch origin && git rebase origin/main`.

- [ ] **Step 1.2: Rebuild backend**

```powershell
Set-Location D:\brainrot
go build -o bin/server.exe ./cmd/server
```

Expected: exits 0, `bin/server.exe` updated.

- [ ] **Step 1.3: Start backend and verify it's up**

In a separate terminal:

```powershell
Set-Location D:\brainrot
.\bin\server.exe
```

In another terminal:

```powershell
Invoke-WebRequest http://localhost:8080/api/v1/healthz | Select-Object -Expand StatusCode
```

Expected: `200`. (If the endpoint name differs, the goal is to confirm the server responds. Adjust path or just `Test-NetConnection -ComputerName localhost -Port 8080`.)

- [ ] **Step 1.4: Log in as QA user, capture session cookie**

```powershell
$sess = $null
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"qa@brainrot.local","password":"qa-tester-pw-1"}' `
  -SessionVariable sess
$sess.Cookies.GetCookies("http://localhost:8080") | Format-List
```

Expected: a `brainrot_session` cookie appears. Keep `$sess` for subsequent smoke tests.

- [ ] **Step 1.5: Smoke test #21 fix — `custom_env` arrives as object**

```powershell
$wsId = "29bbd200-1a89-46d3-bfaa-ad4a1af8b32d"
$agents = Invoke-RestMethod "http://localhost:8080/api/v1/workspaces/$wsId/agents" -WebSession $sess
$agents[0].custom_env.GetType().Name
```

Expected: `Object[]` or `PSCustomObject` (i.e. a real object, not `String`). If `String`, **abort** — #21 isn't actually fixed and the plan must be re-scoped.

- [ ] **Step 1.6: Smoke test #22 — GET / PATCH agent endpoints exist**

```powershell
$aid = $agents[0].id
Invoke-RestMethod "http://localhost:8080/api/v1/agents/$aid" -WebSession $sess | Select id, name, handle
```

Expected: returns the agent (status 200). If 405 or 404, **abort**.

PATCH probe with a no-op body:

```powershell
Invoke-RestMethod "http://localhost:8080/api/v1/agents/$aid" `
  -Method Patch -ContentType "application/json" -Body '{}' -WebSession $sess
```

Expected: 200 with the agent body unchanged.

- [ ] **Step 1.7: Smoke test #20 — member endpoints**

```powershell
Invoke-RestMethod "http://localhost:8080/api/v1/workspaces/$wsId/members" -WebSession $sess
```

Expected: returns an array including `qa@brainrot.local`. Each row has `user_id`, `role`, `joined_at`, `email`, `name`, `avatar_url`.

- [ ] **Step 1.8: Commit nothing yet — this task is verification only**

If all smoke tests pass, proceed to Task 2. If any failed, stop and write a BACKEND_GAPS entry — do not proceed.

---

## Task 2: Remove `agents-encoding` shim (#21 cleanup)

**Files:**
- Delete: `lib/api/agents-encoding.ts`
- Delete: `lib/api/agents-encoding.test.ts`
- Modify: `lib/api/types.ts` — remove `AgentWire`
- Modify: `lib/api/agents.ts` — drop encode/decode calls

- [ ] **Step 2.1: Delete the encoding layer**

```bash
git rm lib/api/agents-encoding.ts lib/api/agents-encoding.test.ts
```

- [ ] **Step 2.2: Remove `AgentWire` from `lib/api/types.ts`**

Open `lib/api/types.ts`. Delete the entire `AgentWire` interface (lines that begin `/** Wire form returned by the backend ... */` and the following `export interface AgentWire { ... }` block). Also update the comment on the `Agent` interface from `Decoded form used everywhere except inside lib/api/agents.ts.` to just `Agent as returned by the backend (jsonb columns are decoded server-side).`

- [ ] **Step 2.3: Rewrite `lib/api/agents.ts` to drop encode/decode**

Replace the entire contents of `lib/api/agents.ts` with:

```ts
import { apiFetch } from "./client";
import type { Agent, AgentInput } from "./types";

export async function fetchWorkspaceAgents(wsId: string): Promise<Agent[]> {
  return apiFetch<Agent[]>(`/api/v1/workspaces/${wsId}/agents`);
}

export async function fetchAgent(agentId: string): Promise<Agent> {
  return apiFetch<Agent>(`/api/v1/agents/${agentId}`);
}

export async function createAgent(wsId: string, input: AgentInput): Promise<Agent> {
  return apiFetch<Agent>(`/api/v1/workspaces/${wsId}/agents`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAgent(
  agentId: string,
  input: Partial<AgentInput>,
): Promise<Agent> {
  return apiFetch<Agent>(`/api/v1/agents/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function archiveAgent(agentId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/agents/${agentId}`, { method: "DELETE" });
}
```

Note `updateAgent` now takes `Partial<AgentInput>` because we only send dirty fields (see Task 4).

- [ ] **Step 2.4: Run type check, fix any stragglers**

```bash
npx tsc --noEmit
```

Expected: any remaining `AgentWire` / `decodeAgentResponse` / `encodeAgentInput` references surface as errors. Open each file and remove the import / call. Likely candidates: any test fixture that built an `AgentWire`. Replace with `Agent` shapes.

- [ ] **Step 2.5: Run lint**

```bash
npx next lint
```

Expected: 0 errors.

- [ ] **Step 2.6: Verify no stragglers in source**

```bash
git grep -n "AgentWire\|decodeAgentResponse\|encodeAgentInput"
```

Expected: no output.

- [ ] **Step 2.7: Commit**

```bash
git add lib/api/agents.ts lib/api/types.ts
git commit -m "refactor(agents): drop agents-encoding shim (BACKEND_GAPS #21 closed)"
```

---

## Task 3: Tighten `WorkspaceRole` to backend's three roles

**Files:**
- Modify: `lib/api/types.ts:201` — drop `"member"` from `WorkspaceRole`
- Modify: `components/workspace/AddMemberModal.tsx:18` — drop `"member"` from ROLES

API.md only documents `owner | editor | viewer`. The S4 `WorkspaceRole` union includes a phantom `"member"`. Remove it before we add UI that surfaces the dropdown to users.

- [ ] **Step 3.1: Edit `lib/api/types.ts`**

Replace:

```ts
export type WorkspaceRole = "owner" | "editor" | "member" | "viewer";
```

with:

```ts
export type WorkspaceRole = "owner" | "editor" | "viewer";
```

- [ ] **Step 3.2: Type check**

```bash
npx tsc --noEmit
```

Expected: errors at any site that referenced `"member"` as a role. Most likely just `AddMemberModal.tsx:18`. Open that and replace:

```ts
const ROLES: WorkspaceRole[] = ["owner", "editor", "member", "viewer"];
```

with:

```ts
const ROLES: WorkspaceRole[] = ["owner", "editor", "viewer"];
```

Re-run `npx tsc --noEmit`. Expected: 0 errors.

- [ ] **Step 3.3: Commit**

```bash
git add lib/api/types.ts components/workspace/AddMemberModal.tsx
git commit -m "refactor(roles): drop phantom 'member' role; align with backend (owner/editor/viewer)"
```

---

## Task 4: Restore real `useAgent` + agent edit page (#22 follow-up)

**Files:**
- Modify: `hooks/useAgent.ts` — back to a real `useQuery`
- Create: `hooks/useUpdateAgent.ts`
- Modify: `app/(app)/w/[wsId]/agents/[agentId]/page.tsx` — drop banner, wire mutation
- Modify: `lib/api/keys.ts` — already has `agents.detail`, no change needed

### 4.1 Rewrite `useAgent`

- [ ] **Step 4.1.1: Replace `hooks/useAgent.ts` with a real `useQuery`**

Replace the entire file with:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAgent } from "@/lib/api/agents";
import { queryKeys } from "@/lib/api/keys";

/**
 * Single-agent query. BACKEND_GAPS #22 closed — GET /api/v1/agents/{id} now exists.
 */
export function useAgent(agentId: string) {
  return useQuery({
    queryKey: queryKeys.agents.detail(agentId),
    queryFn: () => fetchAgent(agentId),
    enabled: !!agentId,
  });
}
```

Note the signature changed from `useAgent(wsId, agentId)` to `useAgent(agentId)` — the wsId arg was only there because S4 derived from the list. Type-check will find the call site (see 4.2.2).

### 4.2 Create `useUpdateAgent`

- [ ] **Step 4.2.1: Create `hooks/useUpdateAgent.ts`**

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAgent } from "@/lib/api/agents";
import { queryKeys } from "@/lib/api/keys";
import type { Agent, AgentInput } from "@/lib/api/types";

export function useUpdateAgent(wsId: string, agentId: string) {
  const qc = useQueryClient();
  return useMutation<Agent, Error, Partial<AgentInput>>({
    mutationFn: (input) => updateAgent(agentId, input),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.agents.detail(agentId), updated);
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.agents(wsId) });
    },
  });
}
```

### 4.3 Wire detail page

- [ ] **Step 4.3.1: Replace `app/(app)/w/[wsId]/agents/[agentId]/page.tsx`**

```tsx
"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useAgent } from "@/hooks/useAgent";
import { useUpdateAgent } from "@/hooks/useUpdateAgent";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { AgentForm } from "@/components/agents/AgentForm";
import { ArchiveAgentButton } from "@/components/agents/ArchiveAgentButton";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";
import type { AgentInput } from "@/lib/api/types";

export default function AgentDetailPage() {
  const { wsId, agentId } = useParams<{ wsId: string; agentId: string }>();
  const { data: agent, isLoading } = useAgent(agentId);
  const { data: runtimes = [] } = useWorkspaceRuntimes(wsId);
  const mutation = useUpdateAgent(wsId, agentId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isLoading) return <main className="p-6 text-sm text-ink-2">加载中…</main>;
  if (!agent) return <main className="p-6 text-sm text-state-failed">Agent 不存在</main>;

  async function onSubmit(input: AgentInput) {
    setSubmitError(null);
    // Send only the editable fields. handle is read-only on PATCH.
    const patch: Partial<AgentInput> = {
      name: input.name,
      avatar_url: input.avatar_url,
      description: input.description,
      instructions: input.instructions,
      model: input.model,
      custom_env: input.custom_env,
      custom_args: input.custom_args,
      mcp_config: input.mcp_config,
    };
    try {
      await mutation.mutateAsync(patch);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError(messages.agents.form.handleConflict);
      } else {
        setSubmitError((err as Error).message);
      }
    }
  }

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
        submitError={submitError}
        onSubmit={onSubmit}
      />
    </main>
  );
}
```

The "编辑暂未开放" banner is gone. `AgentForm` is expected to keep `handle` disabled in `edit` mode — verify quickly in the next step.

- [ ] **Step 4.3.2: Verify `AgentForm` already disables `handle` in edit mode**

```bash
grep -n "handle" components/agents/AgentForm.tsx | head -20
```

If `handle` is editable in edit mode, edit `components/agents/AgentForm.tsx` to add `disabled={mode === "edit"}` on the handle input. If it already is, no change needed.

### 4.4 Smoke + commit

- [ ] **Step 4.4.1: Manual smoke**

Start the frontend (`npm run dev` in `D:\brainrot_frontend`). Log in, navigate to a workspace, open an agent, change the `name` field, click save. Verify a toast or non-error state, then refresh — the new name should persist.

- [ ] **Step 4.4.2: Type check + lint**

```bash
npx tsc --noEmit && npx next lint
```

Expected: 0 errors.

- [ ] **Step 4.4.3: Commit**

```bash
git add hooks/useAgent.ts hooks/useUpdateAgent.ts app/\(app\)/w/\[wsId\]/agents/\[agentId\]/page.tsx components/agents/AgentForm.tsx
git commit -m "feat(agents): restore real useAgent query + wire PATCH from detail page (BACKEND_GAPS #22 closed)"
```

---

## Task 5: Members + workspace metadata API + hooks

**Files:**
- Modify: `lib/api/types.ts` — add `WorkspaceMember`, `UpdateWorkspaceInput`
- Modify: `lib/api/members.ts` — add list/patch/delete + ws update + invite
- Modify: `lib/api/keys.ts` — add `members` key
- Create: `hooks/useWorkspaceMembers.ts`
- Create: `hooks/useUpdateMemberRole.ts`
- Create: `hooks/useRemoveMember.ts`
- Create: `hooks/useUpdateWorkspace.ts`
- Create: `hooks/useInviteByEmail.ts`

### 5.1 Types

- [ ] **Step 5.1.1: Add `WorkspaceMember`, `UpdateWorkspaceInput`, `InviteInput` to `lib/api/types.ts`**

Append to `lib/api/types.ts`:

```ts
export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  email: string;
  name: string;
  avatar_url: string | null;
}

export interface UpdateWorkspaceInput {
  name?: string;
  slug?: string;
}

export interface InviteInput {
  email: string;
  role: WorkspaceRole;
}
```

### 5.2 API surface

- [ ] **Step 5.2.1: Replace `lib/api/members.ts` with the full set**

```ts
import { apiFetch } from "./client";
import type {
  InviteInput,
  UpdateWorkspaceInput,
  Workspace,
  WorkspaceMember,
  WorkspaceMemberInput,
  WorkspaceRole,
} from "./types";

export async function addWorkspaceMember(
  wsId: string,
  input: WorkspaceMemberInput,
): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/members`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listWorkspaceMembers(
  wsId: string,
): Promise<WorkspaceMember[]> {
  return apiFetch<WorkspaceMember[]>(`/api/v1/workspaces/${wsId}/members`);
}

export async function updateMemberRole(
  wsId: string,
  userId: string,
  role: WorkspaceRole,
): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(wsId: string, userId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/members/${userId}`, {
    method: "DELETE",
  });
}

export async function updateWorkspace(
  wsId: string,
  input: UpdateWorkspaceInput,
): Promise<Workspace> {
  return apiFetch<Workspace>(`/api/v1/workspaces/${wsId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function inviteByEmail(
  wsId: string,
  input: InviteInput,
): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/invitations`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
```

### 5.3 Query key

- [ ] **Step 5.3.1: Add `members` key to `lib/api/keys.ts`**

In `queryKeys.workspaces`, after `approvals`:

```ts
members: (wsId: string) => ["workspaces", wsId, "members"] as const,
```

### 5.4 Hooks

- [ ] **Step 5.4.1: Create `hooks/useWorkspaceMembers.ts`**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { listWorkspaceMembers } from "@/lib/api/members";
import { queryKeys } from "@/lib/api/keys";

export function useWorkspaceMembers(wsId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.members(wsId),
    queryFn: () => listWorkspaceMembers(wsId),
    enabled: !!wsId,
  });
}
```

- [ ] **Step 5.4.2: Create `hooks/useUpdateMemberRole.ts` (optimistic with rollback)**

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMemberRole } from "@/lib/api/members";
import { queryKeys } from "@/lib/api/keys";
import type { WorkspaceMember, WorkspaceRole } from "@/lib/api/types";

interface Variables {
  userId: string;
  role: WorkspaceRole;
}

export function useUpdateMemberRole(wsId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, Variables, { prev: WorkspaceMember[] | undefined }>({
    mutationFn: ({ userId, role }) => updateMemberRole(wsId, userId, role),
    onMutate: async ({ userId, role }) => {
      const key = queryKeys.workspaces.members(wsId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WorkspaceMember[]>(key);
      if (prev) {
        qc.setQueryData<WorkspaceMember[]>(
          key,
          prev.map((m) => (m.user_id === userId ? { ...m, role } : m)),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(queryKeys.workspaces.members(wsId), ctx.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.members(wsId) });
    },
  });
}
```

- [ ] **Step 5.4.3: Create `hooks/useRemoveMember.ts`**

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeMember } from "@/lib/api/members";
import { queryKeys } from "@/lib/api/keys";

export function useRemoveMember(wsId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (userId) => removeMember(wsId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.members(wsId) });
    },
  });
}
```

- [ ] **Step 5.4.4: Create `hooks/useUpdateWorkspace.ts`**

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWorkspace } from "@/lib/api/members";
import { queryKeys } from "@/lib/api/keys";
import type { UpdateWorkspaceInput, Workspace } from "@/lib/api/types";

export function useUpdateWorkspace(wsId: string) {
  const qc = useQueryClient();
  return useMutation<Workspace, Error, UpdateWorkspaceInput>({
    mutationFn: (input) => updateWorkspace(wsId, input),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.workspaces.detail(wsId), updated);
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
    },
  });
}
```

- [ ] **Step 5.4.5: Create `hooks/useInviteByEmail.ts`**

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteByEmail } from "@/lib/api/members";
import { queryKeys } from "@/lib/api/keys";
import type { InviteInput } from "@/lib/api/types";

export function useInviteByEmail(wsId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, InviteInput>({
    mutationFn: (input) => inviteByEmail(wsId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.members(wsId) });
    },
  });
}
```

### 5.5 Smoke + commit

- [ ] **Step 5.5.1: Type check + lint**

```bash
npx tsc --noEmit && npx next lint
```

Expected: 0 errors.

- [ ] **Step 5.5.2: Smoke against backend (no UI yet, just verify plumbing)**

In PowerShell with `$sess` from Task 1:

```powershell
$wsId = "29bbd200-1a89-46d3-bfaa-ad4a1af8b32d"
Invoke-RestMethod "http://localhost:8080/api/v1/workspaces/$wsId/members" -WebSession $sess
# Should list qa@brainrot.local
```

- [ ] **Step 5.5.3: Commit**

```bash
git add lib/api/types.ts lib/api/members.ts lib/api/keys.ts hooks/useWorkspaceMembers.ts hooks/useUpdateMemberRole.ts hooks/useRemoveMember.ts hooks/useUpdateWorkspace.ts hooks/useInviteByEmail.ts
git commit -m "feat(members): API + hooks for list/role/remove/update-ws/invite (BACKEND_GAPS #20 closed)"
```

---

## Task 6: Settings page — info form + members list + danger zone

**Files:**
- Create: `components/workspace/WorkspaceInfoForm.tsx`
- Create: `components/workspace/MembersList.tsx`
- Create: `components/workspace/MemberRow.tsx`
- Modify: `app/(app)/w/[wsId]/settings/page.tsx`
- Modify: `lib/messages.ts`

### 6.1 Messages

- [ ] **Step 6.1.1: Update `lib/messages.ts` `settings` + add `members` block**

In `lib/messages.ts`, replace the existing `settings` block with:

```ts
  settings: {
    title: "工作区设置",
    basicSection: "工作区信息",
    nameLabel: "名称",
    slugLabel: "Slug",
    slugHelp: "URL 友好，仅小写字母、数字、连字符",
    slugConflict: "该 slug 已被占用",
    save: "保存",
    saving: "保存中…",
    saved: "已保存",
    membersSection: "成员",
    addMember: "+ 添加成员",
    dangerSection: "危险区",
    dangerArchive: "归档工作区",
    dangerArchiveSoon: "即将上线",
    permissionOwner: "需要 owner 权限",
    permissionEditor: "需要 editor 权限",
  },
  members: {
    you: "你",
    role: {
      owner: "owner",
      editor: "editor",
      viewer: "viewer",
    },
    remove: "移除",
    removeConfirmTitle: "移除成员",
    removeConfirmBody: (email: string) =>
      `确认将 ${email} 从工作区中移除？她/他将立刻失去访问权限。`,
    removeConfirm: "移除",
    removeCancel: "取消",
    roleUpdated: "已更新角色",
    roleUpdateFailed: "角色更新失败",
    removed: "已移除",
    empty: "还没有成员",
    loading: "加载中…",
    loadError: "加载失败",
  },
```

Note this drops `myIdSection` / `myIdHelp` (the user_id flow is gone) and `membersComingSoon`.

### 6.2 Workspace info form

- [ ] **Step 6.2.1: Create `components/workspace/WorkspaceInfoForm.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useUpdateWorkspace } from "@/hooks/useUpdateWorkspace";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";
import type { Workspace } from "@/lib/api/types";

interface Props {
  workspace: Workspace;
}

const SLUG_RE = /^[a-z0-9-]+$/;

export function WorkspaceInfoForm({ workspace }: Props) {
  const m = messages.settings;
  const mutation = useUpdateWorkspace(workspace.id);
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [error, setError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    setName(workspace.name);
    setSlug(workspace.slug);
  }, [workspace.id, workspace.name, workspace.slug]);

  const dirty = name !== workspace.name || slug !== workspace.slug;
  const slugValid = SLUG_RE.test(slug);
  const canSubmit = dirty && name.length > 0 && slugValid && !mutation.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const patch: { name?: string; slug?: string } = {};
    if (name !== workspace.name) patch.name = name;
    if (slug !== workspace.slug) patch.slug = slug;
    try {
      await mutation.mutateAsync(patch);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) setError(m.slugConflict);
        else if (err.status === 403) setError(m.permissionOwner);
        else setError(err.body || err.message);
      } else {
        setError((err as Error).message);
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 max-w-md">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.nameLabel}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.slugLabel}</span>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
        />
        <span className="text-xs text-ink-2">{m.slugHelp}</span>
      </label>
      {error && <p className="text-xs text-state-failed">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
        >
          {mutation.isPending ? m.saving : m.save}
        </button>
        {savedToast && <span className="text-xs text-ink-2">{m.saved}</span>}
      </div>
    </form>
  );
}
```

### 6.3 Members list

- [ ] **Step 6.3.1: Create `components/workspace/MemberRow.tsx`**

```tsx
"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/brand/confirm-dialog";
import { useUpdateMemberRole } from "@/hooks/useUpdateMemberRole";
import { useRemoveMember } from "@/hooks/useRemoveMember";
import { messages } from "@/lib/messages";
import type { WorkspaceMember, WorkspaceRole } from "@/lib/api/types";

interface Props {
  wsId: string;
  member: WorkspaceMember;
  isMe: boolean;
  viewerIsOwner: boolean;
}

const ROLES: WorkspaceRole[] = ["owner", "editor", "viewer"];

export function MemberRow({ wsId, member, isMe, viewerIsOwner }: Props) {
  const m = messages.members;
  const updateRole = useUpdateMemberRole(wsId);
  const remove = useRemoveMember(wsId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const display = member.name || member.email;
  const canMutate = viewerIsOwner && !isMe;

  function onRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as WorkspaceRole;
    updateRole.mutate(
      { userId: member.user_id, role: next },
      {
        onSuccess: () => {
          setToast(m.roleUpdated);
          setTimeout(() => setToast(null), 1500);
        },
        onError: () => {
          setToast(m.roleUpdateFailed);
          setTimeout(() => setToast(null), 2000);
        },
      },
    );
  }

  function onRemoveConfirm() {
    remove.mutate(member.user_id, {
      onSuccess: () => {
        setToast(m.removed);
        setTimeout(() => setToast(null), 1500);
      },
    });
    setConfirmOpen(false);
  }

  return (
    <li className="flex items-center gap-3 py-2 px-3 border-b-[1.5px] border-hairline text-sm">
      <div className="flex-1 min-w-0">
        <div className="truncate">
          <strong className="text-ink-0">{display}</strong>
          {isMe && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-paper-2 border border-hairline rounded text-ink-2">
              {m.you}
            </span>
          )}
        </div>
        <div className="text-xs text-ink-2 truncate">{member.email}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isMe ? (
          <span className="text-xs font-mono text-ink-2 px-2 py-1">{member.role}</span>
        ) : (
          <select
            value={member.role}
            onChange={onRoleChange}
            disabled={!canMutate || updateRole.isPending}
            className="px-2 py-1 border-[1.5px] border-hairline rounded-sm text-xs disabled:opacity-50"
            title={!canMutate ? messages.settings.permissionOwner : undefined}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}
        {!isMe && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!canMutate || remove.isPending}
            className="px-2 py-1 border-[1.5px] border-state-failed text-state-failed rounded-sm text-xs disabled:opacity-50"
            title={!canMutate ? messages.settings.permissionOwner : undefined}
          >
            {m.remove}
          </button>
        )}
      </div>
      {toast && <span className="text-xs text-ink-2 ml-2">{toast}</span>}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={m.removeConfirmTitle}
        description={m.removeConfirmBody(member.email)}
        confirmLabel={m.removeConfirm}
        cancelLabel={m.removeCancel}
        destructive
        onConfirm={onRemoveConfirm}
      />
    </li>
  );
}
```

This assumes `components/brand/confirm-dialog.tsx` exists with a `ConfirmDialog` named export accepting `{ open, onOpenChange, title, description, confirmLabel, cancelLabel, destructive, onConfirm }`. Verify before coding:

```bash
grep -n "export" components/brand/confirm-dialog.tsx
```

If the props differ, adapt the call site to the existing props. Don't refactor the dialog — adapt to it.

- [ ] **Step 6.3.2: Create `components/workspace/MembersList.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { useSession } from "@/hooks/useSession";
import { MemberRow } from "./MemberRow";
import { AddMemberModal } from "./AddMemberModal";
import { messages } from "@/lib/messages";

interface Props {
  wsId: string;
}

export function MembersList({ wsId }: Props) {
  const m = messages.settings;
  const mb = messages.members;
  const { data: members, isLoading, isError } = useWorkspaceMembers(wsId);
  const { data: me } = useSession();
  const [addOpen, setAddOpen] = useState(false);

  const viewerRole = members?.find((mem) => mem.user_id === me?.id)?.role;
  const viewerIsOwner = viewerRole === "owner";

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">{m.membersSection}</h2>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          disabled={!viewerIsOwner}
          title={!viewerIsOwner ? m.permissionOwner : undefined}
          className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-xs disabled:opacity-50"
        >
          {m.addMember}
        </button>
      </div>
      {isLoading ? (
        <p className="text-sm text-ink-2">{mb.loading}</p>
      ) : isError ? (
        <p className="text-sm text-state-failed">{mb.loadError}</p>
      ) : !members || members.length === 0 ? (
        <p className="text-sm text-ink-2">{mb.empty}</p>
      ) : (
        <ul className="border-[1.5px] border-hairline rounded-md overflow-hidden">
          {members.map((member) => (
            <MemberRow
              key={member.user_id}
              wsId={wsId}
              member={member}
              isMe={me?.id === member.user_id}
              viewerIsOwner={viewerIsOwner}
            />
          ))}
        </ul>
      )}
      <AddMemberModal open={addOpen} onOpenChange={setAddOpen} wsId={wsId} />
    </section>
  );
}
```

Note `AddMemberModal` is rewritten in Task 7 — the modal here keeps its existing call shape but loses the `onAdded` callback (the modal will invalidate members itself via `useInviteByEmail`).

### 6.4 Wire settings page

- [ ] **Step 6.4.1: Replace `app/(app)/w/[wsId]/settings/page.tsx`**

```tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import { WorkspaceInfoForm } from "@/components/workspace/WorkspaceInfoForm";
import { MembersList } from "@/components/workspace/MembersList";
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
  const m = messages.settings;
  const { wsId } = useParams<{ wsId: string }>();
  const { data: ws, isLoading } = useWorkspace(wsId);

  return (
    <main className="p-6 overflow-y-auto h-full max-w-2xl flex flex-col gap-8">
      <h1 className="text-lg font-bold">{m.title}</h1>

      <section>
        <h2 className="text-sm font-semibold mb-2">{m.basicSection}</h2>
        {isLoading || !ws ? (
          <p className="text-sm text-ink-2">加载中…</p>
        ) : (
          <WorkspaceInfoForm workspace={ws} />
        )}
      </section>

      <MembersList wsId={wsId} />

      <section className="border-t-[1.5px] border-hairline pt-4">
        <h2 className="text-sm font-semibold mb-2">{m.dangerSection}</h2>
        <button
          type="button"
          disabled
          title={m.dangerArchiveSoon}
          className="px-3 py-1.5 border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold text-sm opacity-50"
        >
          {m.dangerArchive}
        </button>
      </section>
    </main>
  );
}
```

### 6.5 Smoke + commit

- [ ] **Step 6.5.1: Type check + lint**

```bash
npx tsc --noEmit && npx next lint
```

Expected: 0 errors. Note `AddMemberModal` still uses the old user_id flow at this point — Task 7 replaces it; this task should still compile because we haven't broken any imports.

- [ ] **Step 6.5.2: Manual smoke**

`npm run dev`. Log in, go to `/w/29bbd200-.../settings`. Expected:
- Workspace info form prefilled with name+slug. Editing name and saving should show "已保存"; refresh keeps the change; sidebar refreshes the name.
- Members section lists at least `qa@brainrot.local` with role "你 / owner".
- Trying to change own role: select is replaced by static text (no widget). Add a second member via the old modal (still user_id at this point) and verify you can change their role + remove them via ConfirmDialog.

- [ ] **Step 6.5.3: Commit**

```bash
git add components/workspace/WorkspaceInfoForm.tsx components/workspace/MembersList.tsx components/workspace/MemberRow.tsx app/\(app\)/w/\[wsId\]/settings/page.tsx lib/messages.ts
git commit -m "feat(settings): real workspace info form + members list with role/remove (BACKEND_GAPS #20 unlock)"
```

---

## Task 7: Rewrite `AddMemberModal` for email invites

**Files:**
- Modify: `components/workspace/AddMemberModal.tsx`
- Modify: `lib/messages.ts`
- Delete: `hooks/useAddMember.ts` (replaced by `useInviteByEmail` from Task 5)

### 7.1 Messages

- [ ] **Step 7.1.1: Replace `addMember` block in `lib/messages.ts`**

```ts
  addMember: {
    title: "邀请成员",
    emailLabel: "Email",
    emailPlaceholder: "alice@example.com",
    emailInvalid: "请输入有效的邮箱地址",
    roleLabel: "Role",
    invite: "邀请",
    cancel: "取消",
    inviting: "邀请中…",
    success: "已添加成员",
    notFound:
      "这个 email 还没注册 brainrot。让 ta 先访问下方注册链接后再试。",
    copyRegisterLink: "复制注册链接",
    copied: "已复制",
    alreadyMember: "ta 已经是工作区成员了。",
    permissionOwner: "需要 owner 权限",
  },
```

### 7.2 Modal

- [ ] **Step 7.2.1: Replace `components/workspace/AddMemberModal.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useInviteByEmail } from "@/hooks/useInviteByEmail";
import { ApiError } from "@/lib/api/client";
import type { WorkspaceRole } from "@/lib/api/types";
import { messages } from "@/lib/messages";

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wsId: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: WorkspaceRole[] = ["owner", "editor", "viewer"];

type FieldError =
  | { kind: "validation"; message: string }
  | { kind: "notFound" }
  | { kind: "alreadyMember" }
  | { kind: "permission" }
  | { kind: "other"; message: string };

export function AddMemberModal({ open, onOpenChange, wsId }: AddMemberModalProps) {
  const m = messages.addMember;
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("editor");
  const [error, setError] = useState<FieldError | null>(null);
  const [copied, setCopied] = useState(false);
  const mutation = useInviteByEmail(wsId);

  const canSubmit = EMAIL_RE.test(email) && !mutation.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email)) {
      setError({ kind: "validation", message: m.emailInvalid });
      return;
    }
    try {
      await mutation.mutateAsync({ email, role });
      setEmail("");
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) setError({ kind: "notFound" });
        else if (err.status === 409) setError({ kind: "alreadyMember" });
        else if (err.status === 403) setError({ kind: "permission" });
        else setError({ kind: "other", message: err.body || err.message });
      } else {
        setError({ kind: "other", message: (err as Error).message });
      }
    }
  }

  async function copyRegisterLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/register`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{m.title}</DialogTitle>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-1">{m.emailLabel}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder={m.emailPlaceholder}
              className={
                error
                  ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm"
                  : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
              }
            />
            {error?.kind === "validation" && (
              <span className="text-xs text-state-failed">{error.message}</span>
            )}
            {error?.kind === "notFound" && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-state-failed">{m.notFound}</span>
                <button
                  type="button"
                  onClick={copyRegisterLink}
                  className="self-start mt-1 px-2 py-1 border-[1.5px] border-ink-0 rounded-sm text-xs font-semibold"
                >
                  {copied ? m.copied : m.copyRegisterLink}
                </button>
              </div>
            )}
            {error?.kind === "alreadyMember" && (
              <span className="text-xs text-state-warn">{m.alreadyMember}</span>
            )}
            {error?.kind === "permission" && (
              <span className="text-xs text-state-failed">{m.permissionOwner}</span>
            )}
            {error?.kind === "other" && (
              <span className="text-xs text-state-failed">{error.message}</span>
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
              {mutation.isPending ? m.inviting : m.invite}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

If `text-state-warn` is not a defined Tailwind class in this project, replace with `text-state-failed` opacity-70 or an existing warn color. Check with `grep "state-warn\|state-warning" -r tailwind.config* app globals.css` and adapt.

### 7.3 Drop old hook

- [ ] **Step 7.3.1: Delete `hooks/useAddMember.ts`**

```bash
git rm hooks/useAddMember.ts
```

- [ ] **Step 7.3.2: Confirm no stragglers**

```bash
git grep -n "useAddMember\b"
```

Expected: no output (the old `addWorkspaceMember` API helper remains in `members.ts` and is still exported, just unused — leave it; we may need it for a power-user path later).

### 7.4 Smoke + commit

- [ ] **Step 7.4.1: Type check + lint**

```bash
npx tsc --noEmit && npx next lint
```

- [ ] **Step 7.4.2: Manual smoke (multi-account)**

Run a fresh user create:

```powershell
Invoke-RestMethod "http://localhost:8080/api/v1/auth/register" `
  -Method Post -ContentType "application/json" `
  -Body '{"email":"bob@brainrot.local","password":"bobtest12345","name":"Bob"}' `
  -WebSession (New-Object Microsoft.PowerShell.Commands.WebRequestSession)
```

In the UI as qa@brainrot.local, open Settings → Invite. Enter `bob@brainrot.local`, submit. Expected: modal closes, members list now includes Bob. Then:
- Enter `noone@nowhere.local` and submit → expect inline red error + "复制注册链接" button. Click it; clipboard should contain the register URL.
- Enter `bob@brainrot.local` again → expect inline yellow "ta 已经是工作区成员了。"

- [ ] **Step 7.4.3: Commit**

```bash
git add components/workspace/AddMemberModal.tsx lib/messages.ts
git commit -m "feat(invite): replace user_id modal with email invite flow (BACKEND_GAPS #19 closed)"
```

---

## Task 8: Asset upload

**Files:**
- Create: `lib/api/upload.ts`
- Create: `hooks/useUploadAssets.ts`
- Create: `components/assets/UploadButton.tsx`
- Modify: `components/task-detail/RightTabs/AssetsTab.tsx`
- Modify: `lib/messages.ts`

### 8.1 Messages

- [ ] **Step 8.1.1: Add `assets` block to `lib/messages.ts`**

Add a new top-level block:

```ts
  assets: {
    uploadCta: "+ 上传",
    selectFiles: "选择文件",
    pending: "等待中",
    uploading: "上传中",
    done: "已完成",
    failed: "失败",
    dismiss: "关闭",
    tooLarge: "文件过大（>100MB）",
    serverRejectedSize: "文件过大，后端拒绝",
    networkError: "上传失败，请重试",
    forbiddenViewer: "需要 editor 或 owner 权限",
  },
```

### 8.2 XHR upload helper

- [ ] **Step 8.2.1: Create `lib/api/upload.ts`**

```ts
import { ApiError } from "./client";
import type { Asset } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export function xhrUpload(
  path: string,
  formData: FormData,
  onProgress: (loaded: number, total: number) => void,
): Promise<Asset> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}${path}`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded, e.total);
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as Asset);
        } catch (e) {
          reject(new Error(`invalid response JSON: ${(e as Error).message}`));
        }
      } else {
        reject(new ApiError(xhr.status, xhr.responseText));
      }
    };
    xhr.send(formData);
  });
}
```

### 8.3 Upload hook

- [ ] **Step 8.3.1: Create `hooks/useUploadAssets.ts`**

```ts
"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { xhrUpload } from "@/lib/api/upload";
import { queryKeys } from "@/lib/api/keys";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

export type UploadStatus = "pending" | "uploading" | "done" | "failed";

export interface UploadItem {
  id: string;
  filename: string;
  size: number;
  loaded: number;
  status: UploadStatus;
  error?: string;
}

const MAX_BYTES = 100 * 1024 * 1024;

function genId(): string {
  return Math.random().toString(36).slice(2);
}

export function useUploadAssets(projectId: string) {
  const qc = useQueryClient();
  const m = messages.assets;
  const [items, setItems] = useState<UploadItem[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  const start = useCallback(
    async (files: File[]) => {
      const newItems: UploadItem[] = files.map((f) => ({
        id: genId(),
        filename: f.name,
        size: f.size,
        loaded: 0,
        status: "pending",
      }));
      setItems((prev) => [...newItems, ...prev]);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const item = newItems[i];
        if (file.size > MAX_BYTES) {
          updateItem(item.id, { status: "failed", error: m.tooLarge });
          continue;
        }
        updateItem(item.id, { status: "uploading" });
        const fd = new FormData();
        fd.append("file", file);
        try {
          await xhrUpload(
            `/api/v1/projects/${projectId}/assets`,
            fd,
            (loaded) => updateItem(item.id, { loaded }),
          );
          updateItem(item.id, { status: "done", loaded: file.size });
          qc.invalidateQueries({ queryKey: queryKeys.projects.assets(projectId) });
          setTimeout(() => dismiss(item.id), 3000);
        } catch (err) {
          let msg = m.networkError;
          if (err instanceof ApiError) {
            if (err.status === 413) msg = m.serverRejectedSize;
            else if (err.status === 403) msg = m.forbiddenViewer;
            else msg = err.body || err.message;
          }
          updateItem(item.id, { status: "failed", error: msg });
        }
      }
    },
    [projectId, qc, m],
  );

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  return { items, start, dismiss };
}
```

### 8.4 UploadButton

- [ ] **Step 8.4.1: Create `components/assets/UploadButton.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { useUploadAssets } from "@/hooks/useUploadAssets";
import { messages } from "@/lib/messages";

interface Props {
  projectId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function UploadButton({ projectId }: Props) {
  const m = messages.assets;
  const inputRef = useRef<HTMLInputElement>(null);
  const { items, start, dismiss } = useUploadAssets(projectId);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    void start(files);
  }

  return (
    <div className="flex flex-col gap-2 p-2 border-b-[1.5px] border-hairline">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-1">素材</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-2 py-1 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-xs"
        >
          {m.uploadCta}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={onPick}
          className="hidden"
        />
      </div>
      {items.length > 0 && (
        <ul className="flex flex-col gap-1">
          {items.map((it) => (
            <li
              key={it.id}
              className={`flex items-center gap-2 px-2 py-1 text-xs border-[1.5px] rounded-sm ${
                it.status === "failed"
                  ? "border-state-failed"
                  : "border-hairline"
              }`}
            >
              <span className="flex-1 truncate font-mono" title={it.filename}>
                {it.filename}
              </span>
              <span className="text-ink-2 shrink-0">{formatBytes(it.size)}</span>
              {it.status === "pending" && <span className="text-ink-2">{m.pending}</span>}
              {it.status === "uploading" && (
                <span className="text-ink-2 font-mono">
                  {Math.round((it.loaded / Math.max(it.size, 1)) * 100)}%
                </span>
              )}
              {it.status === "done" && <span className="text-state-ok">{m.done}</span>}
              {it.status === "failed" && (
                <>
                  <span className="text-state-failed">{it.error ?? m.failed}</span>
                  <button
                    type="button"
                    onClick={() => dismiss(it.id)}
                    className="ml-1 text-ink-2"
                    aria-label={m.dismiss}
                  >
                    ×
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

If `text-state-ok` isn't a defined Tailwind class, fall back to `text-ink-2`. Check via:

```bash
grep -n "state-ok\|state-success" tailwind.config* app/globals.css 2>$null
```

### 8.5 AssetsTab integration

- [ ] **Step 8.5.1: Modify `components/task-detail/RightTabs/AssetsTab.tsx`**

Replace the existing component body to render the UploadButton at the top and keep the existing list below:

```tsx
"use client";
import { useProjectAssets } from "@/hooks/useProjectAssets";
import { AssetRow } from "./AssetRow";
import { EmptyState } from "@/components/common/EmptyState";
import { UploadButton } from "@/components/assets/UploadButton";

interface AssetsTabProps {
  projectId: string;
}

export function AssetsTab({ projectId }: AssetsTabProps) {
  const { data, isLoading, isError } = useProjectAssets(projectId);
  const items = data ?? [];

  return (
    <div className="flex flex-col">
      <UploadButton projectId={projectId} />
      {isLoading ? (
        <div className="text-center text-xs text-ink-2 py-8">加载中…</div>
      ) : isError ? (
        <div className="text-center text-xs text-ink-2 py-8">加载失败</div>
      ) : items.length === 0 ? (
        <EmptyState title="暂无素材" description="上传到本项目的参考文件会出现在这里" />
      ) : (
        <ul className="flex flex-col">
          {items.map((a) => (
            <AssetRow key={a.id} asset={a} />
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 8.6 Smoke + commit

- [ ] **Step 8.6.1: Type check + lint**

```bash
npx tsc --noEmit && npx next lint
```

- [ ] **Step 8.6.2: Manual smoke**

`npm run dev`. Open any project's task detail right panel → Assets tab. Click "+ 上传", pick 2-3 small files. Expected:
- Progress rows appear at the top of the panel.
- Each transitions pending → uploading (% counter) → done; done rows auto-dismiss after 3s.
- Asset list (below) populates with the new files within ~1s after each done.

Try a file >100MB (if available, fake it by uploading a known-large file or temporarily lower MAX_BYTES to 1KB and try a >1KB file — revert after). Expected: `failed` with `文件过大（>100MB）`.

- [ ] **Step 8.6.3: Smoke test against backend with PowerShell**

```powershell
$pid = (Invoke-RestMethod "http://localhost:8080/api/v1/workspaces/$wsId/projects" -WebSession $sess)[0].id
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"
$file = "D:\brainrot_frontend\package.json"
$content = Get-Content $file -Raw
$body = "--$boundary$LF" `
  + "Content-Disposition: form-data; name=`"file`"; filename=`"package.json`"$LF" `
  + "Content-Type: application/json$LF$LF" `
  + "$content$LF--$boundary--$LF"
Invoke-RestMethod "http://localhost:8080/api/v1/projects/$pid/assets" `
  -Method Post -ContentType "multipart/form-data; boundary=$boundary" `
  -Body $body -WebSession $sess
```

Expected: a JSON object with `id`, `filename: "package.json"`, `size_bytes`. If the response shape differs from `Asset`, abort and update `lib/api/types.ts`.

- [ ] **Step 8.6.4: Commit**

```bash
git add lib/api/upload.ts hooks/useUploadAssets.ts components/assets/UploadButton.tsx components/task-detail/RightTabs/AssetsTab.tsx lib/messages.ts
git commit -m "feat(assets): multi-file upload with per-file progress in AssetsTab"
```

---

## Task 9: Batch approvals

**Files:**
- Create: `components/approvals/BulkActionBar.tsx`
- Create: `components/approvals/BulkApprovalsList.tsx`
- Create: `hooks/useBulkDecide.ts`
- Modify: `components/approvals/ApprovalsHubPage.tsx`
- Modify: `app/(app)/approvals/page.tsx`
- Modify: `lib/messages.ts`

### 9.1 Messages

- [ ] **Step 9.1.1: Add `bulkApprovals` block to `lib/messages.ts`**

```ts
  bulkApprovals: {
    selected: (n: number) => `已选 ${n} 条`,
    approve: "批准选中",
    deny: "拒绝选中",
    clear: "取消选择",
    selectAll: "全选",
    processing: (done: number, total: number) => `处理中 ${done}/${total}…`,
    summarySimple: (ok: number, fail: number) =>
      fail === 0 ? `已处理 ${ok} 条` : `已处理 ${ok} 条，${fail} 条失败`,
  },
```

### 9.2 Bulk hook

- [ ] **Step 9.2.1: Create `hooks/useBulkDecide.ts`**

```ts
"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { decideApproval } from "@/lib/api/approvals";
import { queryKeys } from "@/lib/api/keys";
import type { ApprovalDecision } from "@/lib/api/types";

export interface BulkProgress {
  done: number;
  total: number;
}

export interface BulkResult {
  ok: string[];
  fail: { id: string; error: string }[];
}

export function useBulkDecide() {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<BulkProgress | null>(null);

  const run = useCallback(
    async (ids: string[], decision: ApprovalDecision): Promise<BulkResult> => {
      const total = ids.length;
      setProgress({ done: 0, total });
      const ok: string[] = [];
      const fail: { id: string; error: string }[] = [];
      await Promise.all(
        ids.map(async (id) => {
          try {
            await decideApproval(id, { decision });
            ok.push(id);
          } catch (e) {
            fail.push({ id, error: (e as Error).message });
          } finally {
            setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
          }
        }),
      );
      qc.invalidateQueries({ queryKey: queryKeys.me.pendingApprovals() });
      qc.invalidateQueries({ queryKey: queryKeys.me.pendingApprovalsCount() });
      setProgress(null);
      return { ok, fail };
    },
    [qc],
  );

  return { run, progress };
}
```

### 9.3 BulkActionBar

- [ ] **Step 9.3.1: Create `components/approvals/BulkActionBar.tsx`**

```tsx
"use client";

import { messages } from "@/lib/messages";
import type { BulkProgress } from "@/hooks/useBulkDecide";

interface Props {
  count: number;
  progress: BulkProgress | null;
  onApprove: () => void;
  onDeny: () => void;
  onClear: () => void;
}

export function BulkActionBar({ count, progress, onApprove, onDeny, onClear }: Props) {
  const m = messages.bulkApprovals;
  const busy = progress !== null;
  if (count === 0 && !busy) return null;

  return (
    <div className="sticky top-0 z-10 -mx-6 mb-3 px-6 py-2 bg-paper-1 border-b-[1.5px] border-ink-0 flex items-center justify-between shadow-[var(--shadow-current)]">
      {busy ? (
        <span className="text-sm font-mono text-ink-2">
          {m.processing(progress!.done, progress!.total)}
        </span>
      ) : (
        <>
          <span className="text-sm font-semibold">{m.selected(count)}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onApprove}
              className="px-3 py-1 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-xs"
            >
              {m.approve}
            </button>
            <button
              type="button"
              onClick={onDeny}
              className="px-3 py-1 border-[1.5px] border-ink-0 rounded-sm font-semibold text-xs"
            >
              {m.deny}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1 text-xs text-ink-2"
            >
              {m.clear}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

### 9.4 BulkApprovalsList wrapper

- [ ] **Step 9.4.1: Create `components/approvals/BulkApprovalsList.tsx`**

The shared wrapper exposes a slot-style API: parent gives `items: { id: string }[]` and a `renderRow(item, opts)` function that produces the single-row UI. The wrapper handles selection, the bar, and the "select all" checkbox.

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useBulkDecide } from "@/hooks/useBulkDecide";
import { BulkActionBar } from "./BulkActionBar";
import { messages } from "@/lib/messages";
import type { ApprovalDecision } from "@/lib/api/types";

export interface BulkApprovalsListProps<T extends { id: string }> {
  items: T[];
  renderRow: (item: T, opts: { selected: boolean; onToggle: () => void }) => React.ReactNode;
  onResult?: (result: { ok: string[]; fail: { id: string; error: string }[] }) => void;
}

export function BulkApprovalsList<T extends { id: string }>({
  items,
  renderRow,
  onResult,
}: BulkApprovalsListProps<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { run, progress } = useBulkDecide();
  const m = messages.bulkApprovals;

  // Drop stale selections when the underlying list changes (e.g. after refetch).
  const allIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);
  useEffect(() => {
    setSelected((prev) => {
      const next = new Set<string>();
      for (const id of prev) if (allIds.has(id)) next.add(id);
      return next;
    });
  }, [allIds]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id)),
    );
  }

  async function submit(decision: ApprovalDecision) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const result = await run(ids, decision);
    onResult?.(result);
    // Drop the successful ones from selection; keep failed ids so the user can retry.
    setSelected(new Set(result.fail.map((f) => f.id)));
  }

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="flex flex-col">
      <BulkActionBar
        count={selected.size}
        progress={progress}
        onApprove={() => submit("approved")}
        onDeny={() => submit("denied")}
        onClear={() => setSelected(new Set())}
      />
      {items.length > 0 && (
        <label className="flex items-center gap-2 px-1 py-1 text-xs text-ink-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleAll}
          />
          {m.selectAll}
        </label>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => toggle(item.id)}
              className="mt-3"
            />
            <div className="flex-1 min-w-0">
              {renderRow(item, {
                selected: selected.has(item.id),
                onToggle: () => toggle(item.id),
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 9.5 Wire workspace hub

- [ ] **Step 9.5.1: Modify `components/approvals/ApprovalsHubPage.tsx`**

Replace the existing render block (where `visible.map((a) => <ApprovalHubCard ... />)`) with `BulkApprovalsList`. Add a result toast using local state.

Insert these imports near the top:

```ts
import { useState } from "react";
import { BulkApprovalsList } from "./BulkApprovalsList";
import { messages } from "@/lib/messages";
```

Replace the JSX `visible.length === 0 ? ... : <div className="flex flex-col gap-3 max-w-3xl"> ... </div>` block with:

```tsx
{visible.length === 0 ? (
  <div className="text-center py-20 text-ink-2">
    <div className="text-4xl mb-2">✓</div>
    <div>全部处理完了</div>
  </div>
) : (
  <div className="max-w-3xl">
    <BulkApprovalsList
      items={visible}
      renderRow={(a) => <ApprovalHubCard approval={a} />}
      onResult={(r) => {
        setToast(messages.bulkApprovals.summarySimple(r.ok.length, r.fail.length));
        setTimeout(() => setToast(null), 3000);
      }}
    />
    {toast && (
      <div className="fixed bottom-4 right-4 px-3 py-2 bg-ink-0 text-paper-0 rounded-sm text-sm shadow-[var(--shadow-current)]">
        {toast}
      </div>
    )}
  </div>
)}
```

Add `const [toast, setToast] = useState<string | null>(null);` near the top of the component body (alongside `filter`). Also update the `onResult` callback to use `summarySimple` instead of distinguishing approve/deny:

```tsx
onResult={(r) => {
  setToast(messages.bulkApprovals.summarySimple(r.ok.length, r.fail.length));
  setTimeout(() => setToast(null), 3000);
}}
```

### 9.6 Wire top-level hub

- [ ] **Step 9.6.1: Modify `app/(app)/approvals/page.tsx`**

The top-level page already groups by workspace. Apply `BulkApprovalsList` per group section so users can batch within one workspace at a time (cross-ws batch is fine semantically — same decide endpoint — but UI flow is per-group).

Replace the `<ul ...>{group.items.map(...)}</ul>` body with:

```tsx
<BulkApprovalsList
  items={group.items}
  renderRow={(it) => (
    <div className="border-[1.5px] border-hairline rounded-md p-3 text-sm bg-paper-0">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{it.tool_name}</span>
        <span className="text-xs text-ink-2">@{it.agent_handle}</span>
      </div>
      <div className="text-xs text-ink-2 mt-1">{it.task_title}</div>
      <Link
        href={`/w/${it.workspace_id}/approvals`}
        className="inline-block mt-2 text-xs font-semibold text-ink-0 underline"
      >
        在工作区中处理 →
      </Link>
    </div>
  )}
  onResult={(r) => {
    setToast(messages.bulkApprovals.summarySimple(r.ok.length, r.fail.length));
    setTimeout(() => setToast(null), 3000);
  }}
/>
```

Add the necessary imports (`useState`, `BulkApprovalsList`, `messages`) and the `toast` local state alongside the existing component body, mirroring the workspace hub.

### 9.7 Smoke + commit

- [ ] **Step 9.7.1: Type check + lint**

```bash
npx tsc --noEmit && npx next lint
```

- [ ] **Step 9.7.2: Manual smoke**

This needs pending approvals. Easiest path: in the chat UI as qa@brainrot.local, send a message that triggers a permission_request from an agent. Alternative: use a backend test seed if one exists.

Once pending approvals exist:
- Go to `/w/{wsId}/approvals`. Select 2-3 rows via checkbox. Click "批准选中". Expected: sticky bar shows "处理中 N/total", then disappears; toast appears bottom-right; list shrinks.
- Repeat with "全选" checkbox to verify tri-state behavior.
- Verify cross-ws hub at `/approvals` works similarly per group.

- [ ] **Step 9.7.3: Commit**

```bash
git add components/approvals/BulkActionBar.tsx components/approvals/BulkApprovalsList.tsx hooks/useBulkDecide.ts components/approvals/ApprovalsHubPage.tsx app/\(app\)/approvals/page.tsx lib/messages.ts
git commit -m "feat(approvals): batch approve/deny with sticky action bar"
```

---

## Task 10: Backend gap docs + DoD verification + open PR

**Files:**
- Modify: `docs/BACKEND_GAPS.md`

### 10.1 Log new gaps

- [ ] **Step 10.1.1: Append #28 and #29 to `docs/BACKEND_GAPS.md`**

Add at the bottom of `docs/BACKEND_GAPS.md`:

```markdown
## #28 缺 `PATCH /api/v1/artifacts/{id} { excluded }`

- **状态**：未实现（S5 设计阶段记录）
- **发现**：2026-05-19，S5 design 阶段
- **影响**：前端无法标 artifact 为 excluded。API.md §"列出任务产出" 提到 `excluded=true` 行不返回，但没有写入端点。
- **Workaround（S5）**：整块"排除"UI 不出现在本期。
- **Need**：`PATCH /api/v1/artifacts/{artifact_id} { excluded: bool }` → 200 或 204。鉴权 owner/editor。

## #29 缺非 owner 自离工作区接口

- **状态**：未实现（S5 设计阶段记录）
- **发现**：2026-05-19，S5 design 阶段
- **影响**：editor / viewer 没法主动退出工作区。当前 `DELETE /workspaces/{ws}/members/{user_id}` 仅 owner 可调，所以非 owner 没自助路径。
- **Workaround（S5）**：Settings 页不出 "离开工作区" 按钮。
- **Need**：要么 `DELETE /workspaces/{ws}/members/{user_id}` 允许 user 删自己（status=204），要么单独 `DELETE /workspaces/{ws}/membership` self endpoint。前者更简单。
```

### 10.2 Run DoD checklist

- [ ] **Step 10.2.1: Run final build + lint**

```bash
npx tsc --noEmit
npx next lint
npm run build
```

Expected: 0 errors at each.

- [ ] **Step 10.2.2: grep verification**

```bash
git grep -n "AgentWire\|decodeAgentResponse\|encodeAgentInput\|useAddMember\b"
test -e lib/api/agents-encoding.ts && echo "FAIL: file still exists" || echo "OK"
```

Expected: no matches; `OK` printed.

- [ ] **Step 10.2.3: Walk the DoD list manually**

Verify against `docs/superpowers/specs/2026-05-19-s5-collab-and-uploads-design.md` §9.3 by running each item:

- [ ] Upload 5 files to assets → all 5 rows appear
- [ ] `/approvals` selects 3, batch approve, list shrinks by 3
- [ ] Invite unregistered email → inline red + copy register-link button works
- [ ] Invite registered email → members list grows
- [ ] Rename ws → sidebar updates within 1s
- [ ] Change role to viewer → row updates, refresh persists
- [ ] Remove member triggers ConfirmDialog, row disappears on confirm
- [ ] Agent detail page edits name + saves, list reflects change
- [ ] No `agents-encoding.ts`, no `AgentWire`
- [ ] `npm run build` + `npx next lint` pass

### 10.3 Commit gap log + push

- [ ] **Step 10.3.1: Commit gap log**

```bash
git add docs/BACKEND_GAPS.md
git commit -m "docs: log BACKEND_GAPS #28 (artifact exclude PATCH) and #29 (self-leave)"
```

- [ ] **Step 10.3.2: Push branch**

```bash
git push -u origin s5-collab-and-uploads
```

- [ ] **Step 10.3.3: Open PR**

Use `gh pr create` per the standard workflow. Title and body:

```bash
gh pr create --base main --title "S5: uploads + batch approvals + email invites + member mgmt + agent edit" --body "$(cat <<'EOF'
## Summary
- Asset upload: multi-file picker with per-file progress (XHR for upload-progress events).
- Batch approvals: Gmail-style sticky bar in both `/approvals` and `/w/[wsId]/approvals`.
- Email invites: `AddMemberModal` rewritten; 404/409 inline feedback + "复制注册链接" button.
- Workspace metadata + member management in `/w/[wsId]/settings`: edit name/slug, list members, role dropdown (optimistic + rollback), remove via ConfirmDialog.
- Agent edit restored (BACKEND_GAPS #22 closed): `useAgent` is a real `useQuery` again, detail page wires PATCH.
- Encoding shim removed (BACKEND_GAPS #21 closed): `agents-encoding.ts` + `AgentWire` deleted.

Out of scope (logged as new BACKEND_GAPS):
- #28 artifact exclude PATCH (needed before bringing back the exclude UI)
- #29 self-leave for non-owners
- WS archive (backend already deferred; UI stays disabled)

## Test plan
- [ ] Upload 5 files to assets — all 5 rows appear
- [ ] `/approvals` selects 3, batch approve, list shrinks by 3
- [ ] Invite unregistered email — inline red + copy register-link
- [ ] Invite registered email — members list grows
- [ ] Rename workspace — sidebar updates within 1s
- [ ] Change member role to viewer — row updates, refresh persists
- [ ] Remove member → ConfirmDialog → row disappears
- [ ] Agent detail page edits name + saves; list reflects change
- [ ] `npm run build` + `npx next lint` clean
EOF
)"
```

---

## Self-Review

**Spec coverage check** (against `docs/superpowers/specs/2026-05-19-s5-collab-and-uploads-design.md`):

| Spec section | Plan task |
|---|---|
| §3 工程顺序 | Task ordering 1→9 + Task 10 close-out |
| §4 Asset 上传 | Task 8 |
| §5 批量审批 | Task 9 |
| §6.1 WS 元信息 | Task 6 (`WorkspaceInfoForm`) |
| §6.2 成员列表 | Task 6 (`MembersList`, `MemberRow`) |
| §6.3 Role / remove | Task 6 (MemberRow), Task 5 (hooks) |
| §6.4 邀请 | Task 7 |
| §6.5 Hooks 清单 | Task 5 |
| §7.1 #21 清理 | Task 2 |
| §7.2 #22 收尾 | Task 4 |
| §8.1 Query keys | Task 5 (extends keys.ts) |
| §8.2 错误反馈 | Embedded in each task's UI |
| §9.1 Smoke 协议 | Task 1.5–1.7, Task 5.5.2, Task 8.6.3 |
| §9.3 DoD | Task 10.2 |
| §10 BACKEND_GAPS follow-ups | Task 10.1 |

Gap: `WorkspaceRole` tightening isn't called out in the spec but is a strict prerequisite (the union has `"member"` which the backend doesn't accept). Added as Task 3.

**Placeholder scan:** No "TBD", "TODO", "implement later", "similar to Task N", or "handle edge cases". All code blocks present.

**Type consistency check:**
- `useAgent(agentId)` (Task 4.1) — signature changed from S4's `useAgent(wsId, agentId)`; the only consumer (`AgentDetailPage`) updated in Task 4.3.
- `WorkspaceMember` (Task 5.1) field set (`workspace_id`, `user_id`, `role`, `joined_at`, `email`, `name`, `avatar_url`) matches the API.md description.
- `WorkspaceRole = "owner" | "editor" | "viewer"` consistently used in Task 3, 5, 6, 7.
- `Partial<AgentInput>` in Task 4.3 matches `updateAgent`'s new signature in Task 2.3.
- `bulkApprovals.summary` vs `bulkApprovals.summarySimple` — Task 9.5/9.6 use `summarySimple`. Verified both are defined in 9.1's message block update.

Plan complete.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-19-s5-collab-and-uploads.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Sonnet-class agents work well per-task; you stay in the loop between tasks for go/no-go.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review.

**Which approach?**

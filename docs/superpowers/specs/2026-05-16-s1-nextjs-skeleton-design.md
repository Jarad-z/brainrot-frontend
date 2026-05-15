# S1 · Next.js Skeleton — Design Spec

> **Status**: Brainstormed, awaiting user review before plan writing.
> **Date**: 2026-05-16
> **Scope**: Sub-project of the larger frontend roadmap. Covers FRONTEND.md M1 (skeleton + login) + M2 (workspace/project/task read-only browsing). Does NOT include chat, WS subscriptions, approvals, writes, agent CRUD.
> **Owner**: single developer.
> **Predecessor**: S0 (prototype polish, 2026-05-15 spec) — complete, 23 commits, dda8b32 → 537afbe.
> **Successors**: S2 (M3 chat) → S3 (M4 approvals) → S4 (M5 assets/agents CRUD) → S5 (M6 polish).

---

## 0. Why this exists

S0 delivered a Babel-standalone HTML/JSX prototype with a complete design system (`ui_design/DESIGN.md`, 8 token CSS files, 5 pure-JS lib helpers, 13 screens, 4 production-grade interactions). S1's job is to port that visual + interaction foundation onto a real engineering stack: **Next.js 15 + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui + TanStack Query + Zustand**, and deliver the navigation backbone of the app — login/register, three-column shell, read-only browsing of workspace → project → task — wired to the real REST backend.

S1 stops short of any UX that requires writes or live data:

- No chat composer, no `@mention` runtime, no message rendering (S2).
- No WS subscriptions; WS infrastructure exists only as `connect + offline banner` (S2 introduces `subscribe`).
- No approval cards, countdown, cancel-run (S3).
- No file upload, agent/runtime CRUD, workspace settings (S4).
- No write operations of any kind: every "新建 / 删除 / 邀请" button renders disabled with tooltip "S? 上线后启用".

The shell, the auth flow, the data-fetching plumbing, and the design tokens land in S1 so S2 can spend its budget on chat instead of infrastructure.

---

## 1. Scope (the seven pillars)

1. **Engineering foundation** — pnpm + Next.js 15 App Router at repo root, TypeScript strict, Tailwind v4 + shadcn/ui (10 components), TanStack Query v5, Zustand, Vitest. `ui_design/` becomes archive.
2. **Token migration** — copy S0's 8 `tokens/*.css` files verbatim into `styles/tokens/`, add a Tailwind v4 `@theme` alias layer in `app/globals.css`, fonts via `next/font/google`.
3. **lib/ port** — all 5 S0 pure-JS helpers (codec, mention-parse, countdown, format, keyboard) ported to TypeScript with proper types and Vitest coverage. `parse-message.ts` added (defined but unused — S2 first consumer).
4. **API + state plumbing** — `lib/api/client.ts` (fetch wrapper + `ApiError`), nested `queryKeys` factory, `useAppStore` (selection + ws-connection slices), `useSession`.
5. **WS infrastructure (minimal)** — `WSClient` (connect + exp backoff reconnect, no subscribe abstraction) + `WSProvider` mounted inside `(app)` layout post-session + `<OfflineBanner>` (5s grace).
6. **Six pages delivered** — `/login`, `/register`, `/` (entry redirect), `/onboarding` (wsId paste), `/w/[wsId]` (project grid), `/w/[wsId]/p/[projectId]` (task grid, read-only).
7. **Backend gaps tracked** — new `docs/BACKEND_GAPS.md`, seeded with 5 entries; appended whenever S2-S5 find new gaps.

**Explicit non-goals** (deferred):
- Chat composer + Tiptap (S2)
- WS subscribe/unsubscribe abstraction + handlers (S2)
- Message rendering / `parse-message` consumers (S2)
- Approval cards, countdown integration, cancel-run (S3)
- Asset upload, artifact list, agent/runtime CRUD, workspace settings (S4)
- Dark theme (S5/M6)
- Mobile <768px responsive (S5 — show "桌面使用建议" if needed)
- Virtualized list, Playwright E2E, accessibility scanner (S5)
- Tweaks panel (S5)
- React Hook Form + Zod (S4 — first complex form is `AgentNew`)
- next-intl / i18n framework (literals collected in `lib/messages.ts`, framework deferred)
- sonner / toast library — global error feedback unified through `<ErrorBanner>`
- New project / new task / cancel-run / invite member buttons (writes — disabled with tooltip)

---

## 2. Architecture & directory layout

Next.js 15 (App Router) lives at the repo root. `ui_design/` becomes a frozen archive (not imported, not compiled).

```
D:\brainrot_frontend\
├── app/                       # Next.js App Router
│   ├── layout.tsx             # root: <html lang="zh"> + fonts + Providers
│   ├── globals.css            # @theme + token @imports
│   ├── icon.tsx               # favicon
│   ├── (public)/
│   │   ├── layout.tsx         # centered card shell
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (app)/
│       ├── layout.tsx         # 'use client' — useSession gate + WSProvider + ThreeColumnShell
│       ├── page.tsx           # entry: lastWsId → /w/[id], else /onboarding
│       ├── onboarding/page.tsx
│       └── w/[wsId]/
│           ├── layout.tsx     # injects wsId selection + sidebar projects
│           ├── page.tsx       # workspace home: project grid
│           └── p/[projectId]/
│               ├── layout.tsx # injects projectId selection
│               └── page.tsx   # project home: task grid (read-only)
│
├── components/
│   ├── ui/                    # shadcn/ui generated (10 components)
│   ├── nav/
│   │   ├── Sidebar.tsx
│   │   ├── WorkspaceSwitcher.tsx
│   │   ├── Breadcrumb.tsx
│   │   ├── AccountMenu.tsx
│   │   └── ThreeColumnShell.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── projects/
│   │   ├── ProjectGrid.tsx
│   │   └── ProjectCard.tsx
│   ├── tasks/
│   │   ├── TaskGrid.tsx
│   │   ├── TaskCard.tsx
│   │   └── TaskStatusBadge.tsx
│   └── common/
│       ├── EmptyState.tsx
│       ├── ErrorBanner.tsx
│       ├── OfflineBanner.tsx
│       └── PageSkeleton.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts          # apiFetch + ApiError
│   │   ├── keys.ts            # nested queryKeys factory
│   │   ├── types.ts           # User, Workspace, Project, TaskCard (+ ParsedMessage type alias for re-export)
│   │   ├── auth.ts            # login, register, logout, me
│   │   ├── workspaces.ts      # (nothing concrete in S1 except a type-only stub for future use)
│   │   ├── projects.ts        # listProjects, getProject
│   │   ├── tasks.ts           # listTasks
│   │   └── messages.ts        # type-only stub for S2
│   ├── ws/
│   │   ├── client.ts          # WSClient: connect + reconnect (no subscribe)
│   │   └── provider.tsx       # WSProvider, writes status to useAppStore
│   ├── codec.ts               # port from S0
│   ├── mention-parse.ts       # port
│   ├── countdown.ts           # port (+ useCountdown hook)
│   ├── format.ts              # port
│   ├── keyboard.ts            # port
│   ├── parse-message.ts       # NEW: ParsedMessage discriminated union (S2 first consumer)
│   ├── validation.ts          # isValidEmail, isValidPassword, isValidUuid
│   ├── messages.ts            # literal strings (i18n anchor)
│   └── store.ts               # Zustand: selection + ws-connection
│
├── hooks/
│   ├── useSession.ts          # /me + 401 redirect
│   ├── useProjects.ts         # GET /workspaces/{wsId}/projects
│   ├── useProject.ts          # GET /projects/{projectId}
│   └── useTasks.ts            # GET /projects/{projectId}/tasks
│
├── providers/
│   └── QueryProvider.tsx      # QueryClient + global onError + Devtools
│
├── styles/
│   ├── tokens/                # 8 files copied verbatim from ui_design/tokens/
│   │   ├── palette.css
│   │   ├── typography.css
│   │   ├── spacing.css
│   │   ├── radii.css
│   │   ├── shadow.css
│   │   ├── roles.css
│   │   ├── status.css
│   │   └── tweaks.css
│   └── layout-rules.css       # the "Six locked layout rules" block extracted from ui_design/tokens-cream.css
│
├── tests/
│   ├── lib/                   # codec, mention-parse, countdown, format, validation, parse-message
│   ├── api/                   # keys factory, client error path
│   └── store/                 # Zustand actions
│
├── ui_design/                 # S0 archive — unchanged, excluded from build
├── docs/
│   ├── API.md                 # existing
│   ├── FRONTEND.md            # existing
│   ├── BACKEND_GAPS.md        # NEW — cumulative gap tracker
│   └── superpowers/specs/
│
├── public/                    # logos / og
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts             # rewrites + ui_design exclude
├── tailwind.config.ts         # content paths only
├── postcss.config.mjs
├── vitest.config.ts
├── eslint.config.mjs          # flat config
├── .prettierrc
└── .env.example
```

### 2.1 Routing surface

Six client routes:

| URL | Group | Page | Notes |
|---|---|---|---|
| `/login` | `(public)` | LoginForm | redirect to `next` param on success |
| `/register` | `(public)` | RegisterForm | auto-login on success, then `/` |
| `/` | `(app)` | entry redirect | `lastWsId` → `/w/[id]`, else `/onboarding` |
| `/onboarding` | `(app)` | wsId paste form | tests `GET /workspaces/{wsId}/projects`, writes localStorage on success |
| `/w/[wsId]` | `(app)` | project grid | hero + grid of `<ProjectCard>`; "新建项目" disabled |
| `/w/[wsId]/p/[projectId]` | `(app)` | task grid | hero + grid of `<TaskCard>`; task cards disabled + tooltip; "新建任务" disabled |

URL is the authority for selection state. `useAppStore.selection` mirrors URL for convenience (sidebar highlights, breadcrumb, logout reset).

### 2.2 What we explicitly do NOT add to `app/`

- `/approvals` — S3
- `/w/[wsId]/settings` — S4
- `/w/[wsId]/agents`, `/agents/new`, `/runtimes` — S4
- `/p/[projectId]/assets`, `/artifacts` — S4
- `/w/[wsId]/p/[projectId]/t/[taskId]` — S2

When a user clicks a sidebar nav item or task card whose page doesn't exist yet, the trigger is rendered **disabled with tooltip "S? 上线后启用"**. No 404, no toast, no "coming soon" placeholder page — disabled is the most honest signal.

---

## 3. Token migration & visual baseline

### 3.1 globals.css structure

```css
/* app/globals.css */
@import "tailwindcss";

/* S0 token files moved 1:1 into styles/tokens/ */
@import "../styles/tokens/palette.css";
@import "../styles/tokens/typography.css";
@import "../styles/tokens/spacing.css";
@import "../styles/tokens/radii.css";
@import "../styles/tokens/shadow.css";
@import "../styles/tokens/roles.css";
@import "../styles/tokens/status.css";
@import "../styles/tokens/tweaks.css";
@import "../styles/layout-rules.css";   /* the "Six locked layout rules" */

/* Tailwind v4 @theme alias layer — generates utilities like bg-paper-0 */
@theme {
  /* color */
  --color-paper-0: var(--paper-0);
  --color-paper-1: var(--paper-1);
  --color-paper-2: var(--paper-2);
  --color-ink-0:   var(--ink-0);
  --color-ink-1:   var(--ink-1);
  --color-ink-2:   var(--ink-2);
  --color-ink-3:   var(--ink-3);
  --color-hairline:      var(--hairline);
  --color-accent:        var(--accent);
  --color-accent-fg:     var(--accent-fg);
  --color-accent-poppy:  var(--accent-poppy);
  --color-accent-moss:   var(--accent-moss);
  --color-accent-honey:  var(--accent-honey);
  --color-accent-plum:   var(--accent-plum);
  --color-role-approval-bg:    var(--role-approval-bg);
  --color-role-approval-fg:    var(--role-approval-fg);
  --color-state-failed:        var(--state-failed);
  --color-state-running:       var(--state-running);
  --color-state-queued:        var(--state-queued);
  --color-state-denied:        var(--state-denied);
  --color-state-approved:      var(--state-approved);
  --color-state-timeout:       var(--state-timeout);
  --color-state-archived:      var(--state-archived);
  --color-state-canceled:      var(--state-canceled);
  --color-status-in_progress-bg: var(--status-in_progress-bg);
  --color-status-in_progress-fg: var(--status-in_progress-fg);
  --color-status-done-bg:        var(--status-done-bg);
  --color-status-archived-fg:    var(--status-archived-fg);
  --color-countdown-urgent:      var(--countdown-urgent);

  /* text size */
  --text-xs:   var(--text-xs);
  --text-sm:   var(--text-sm);
  --text-base: var(--text-base);
  --text-lg:   var(--text-lg);
  --text-xl:   var(--text-xl);
  --text-2xl:  var(--text-2xl);
  --text-hero: var(--text-hero);

  /* spacing */
  --spacing-1:  var(--sp-1);
  --spacing-2:  var(--sp-2);
  --spacing-3:  var(--sp-3);
  --spacing-4:  var(--sp-4);
  --spacing-5:  var(--sp-5);
  --spacing-6:  var(--sp-6);
  --spacing-8:  var(--sp-8);
  --spacing-10: var(--sp-10);
  --spacing-12: var(--sp-12);

  /* radii & shadow */
  --radius-sm:  var(--r-sm);
  --radius-md:  var(--r-md);
  --radius-lg:  var(--r-lg);
  --radius-xl:  var(--r-xl);
  --shadow-1:       var(--shadow-1);
  --shadow-2:       var(--shadow-2);
  --shadow-3:       var(--shadow-3);
  --shadow-current: var(--shadow-current);
  --shadow-soft:    var(--shadow-soft);

  /* fonts */
  --font-display: var(--font-display);
  --font-body:    var(--font-body);
  --font-mono:    var(--font-mono);
}
```

### 3.2 Why two layers

- **`:root` raw variables** stay the source of truth (1:1 with `ui_design/tokens/*.css`). Future Tweaks panel rewrites `--accent` at runtime → every derived utility updates automatically. Dark theme (S5) writes a `[data-theme="dark"]` overlay touching the same `:root` variables.
- **`@theme` alias layer** lets Tailwind v4 auto-generate utility classes (`bg-paper-0`, `text-ink-0`, `border-hairline`, `rounded-md`, `shadow-1`, etc.) without binding their values to literal hex codes. shadcn/ui generated components consume these utility classes; if we ever swap `--paper-0`, no shadcn rewrite needed.

### 3.3 Fonts

`next/font/google` loaded in `app/layout.tsx`:

```ts
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
```

`--font-body = var(--font-display)` (DESIGN.md §3 — display + body share Bricolage).

### 3.4 shadcn/ui minimal set (10 components)

Generated via `pnpm dlx shadcn@latest add`:

| Component | Used in S1 by |
|---|---|
| `button` | LoginForm, RegisterForm, onboarding submit, AccountMenu trigger, disabled CTAs |
| `input` | LoginForm, RegisterForm, onboarding |
| `label` | all three forms |
| `card` | LoginForm/RegisterForm/Onboarding container, ProjectCard, TaskCard |
| `avatar` | AccountMenu trigger, sidebar workspace switcher (placeholder) |
| `separator` | sidebar section dividers, AccountMenu items |
| `skeleton` | PageSkeleton, project/task grid loading states |
| `dropdown-menu` | AccountMenu (email + logout) |
| `tooltip` | every disabled CTA explaining "S? 上线后启用" |
| `dialog` | reserved — currently no caller; included because logout confirmation is plausible follow-on |

**Not in S1**: `form` (needs RHF — S4), `select` / `checkbox` / `tabs` / `badge` (S2-S4), `sonner` (砍掉 — `<ErrorBanner>` 统一处理 toast 类需求).

If `dialog` ends up genuinely unused after S1 build, drop it before final commit. YAGNI applies even to the minimal set.

### 3.5 layout-rules.css

The "Six locked layout rules" block from `ui_design/tokens-cream.css` (DESIGN.md §5) is extracted into `styles/layout-rules.css` verbatim. These are visual invariants — hero button never wraps, stat cards near-square, sidebar text never silently truncates, etc. — that survive the framework migration.

---

## 4. lib/ port to TypeScript

All 5 S0 helpers ported with the same public API, minus the `window.BR_LIB` global. Plus 3 new files (`parse-message`, `validation`, `messages`).

### 4.1 codec.ts

```ts
export class CodecError extends Error {
  readonly rawInput: string;
  constructor(message: string, rawInput: string) {
    super(message);
    this.name = "CodecError";
    this.rawInput = rawInput;
  }
}

export function decodeJSON<T = unknown>(b64: string): T {
  if (typeof b64 !== "string") {
    throw new CodecError("expected string", String(b64));
  }
  let raw: string;
  try { raw = atob(b64); } catch (e) {
    throw new CodecError(`invalid base64: ${(e as Error).message}`, b64);
  }
  try { return JSON.parse(raw) as T; } catch (e) {
    throw new CodecError(`invalid JSON: ${(e as Error).message}`, b64);
  }
}

export function encodeJSON(value: unknown): string {
  return btoa(JSON.stringify(value));
}
```

### 4.2 mention-parse.ts

Public API matches S0:

```ts
export interface AgentLike { id: string; handle: string; archived?: boolean; }

export function filterCandidates(prefix: string, agents: ReadonlyArray<AgentLike>): AgentLike[];
export function parseSubmit(text: string, placedMentions: ReadonlyArray<{ id: string; handle: string }>): { text: string; mentions: string[] };
export function activePrefix(text: string, caret: number): string | null;
```

### 4.3 countdown.ts

`computeCountdown` is pure (takes `nowMs`, no `Date.now()` inside). `useCountdown` is the React hook variant.

```ts
export const URGENT_MS = 10 * 60 * 1000;

export interface CountdownState {
  remainingMs: number;
  label: string;
  urgent: boolean;
  expired: boolean;
}

export function computeCountdown(expiresAt: string | number, nowMs: number): CountdownState;
export function useCountdown(expiresAt: string | number): CountdownState;
```

`useCountdown` uses `requestAnimationFrame` + same-second deduplication (port from S0).

### 4.4 format.ts

```ts
export function relativeTime(iso: string, nowMs?: number): string;  // "2 分钟前"
export function formatBytes(n: number): string;                     // "1.4 MB"
```

### 4.5 keyboard.ts

```ts
export function isKey(ev: KeyboardEvent | React.KeyboardEvent, key: string, modifiers?: { meta?: boolean; ctrl?: boolean; shift?: boolean; alt?: boolean }): boolean;
export function focusNext(container: HTMLElement, current: HTMLElement | null, direction: 1 | -1): HTMLElement | null;
```

### 4.6 parse-message.ts (NEW — written, not yet consumed)

```ts
import type { decodeJSON } from "./codec";

export type ParsedMessage =
  | { type: "user"; text: string; mentions: string[] }
  | { type: "system"; payload: string }
  | { type: "assistant_text"; payload: { text: string } }
  | { type: "tool_use"; payload: { tool_name: string; tool_use_id: string; input: unknown } }
  | { type: "tool_result"; payload: { tool_use_id: string; is_error: boolean; content: unknown } }
  | { type: "permission_request"; payload: { tool_use_id: string; tool_name: string } }
  | { type: "thinking"; payload: { text: string } }
  | { type: "result"; payload: { duration_ms: number; result: string } }
  | { type: "rate_limit_event"; payload: { retry_in_seconds: number } };

export function parseMessageContent(b64: string): ParsedMessage;
```

S1 task: write the file with full discriminated union + a stub `parseMessageContent` that calls `decodeJSON` and returns the result. Add Vitest cases covering the union shape (one happy case per variant). S2 will replace the stub with branch normalization when chat lands.

### 4.7 validation.ts (NEW)

```ts
export const isValidEmail = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export const isValidPassword = (s: string): boolean => typeof s === "string" && s.length >= 8;
export const isValidUuid = (s: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
```

### 4.8 messages.ts (NEW)

All user-facing Chinese strings collected here as a future i18n anchor (FRONTEND.md §10). Single object literal, `as const`. No framework — just centralized.

```ts
export const messages = {
  auth: { invalidEmail, shortPassword, loginFailed, registerConflict },
  workspace: { onboardingTitle, onboardingHelp, notMember, notFound, lostWs },
  shell: { pendingApprovals, pendingDisabled, listsDisabled, taskDisabled, logout },
  errors: { genericRetry, networkOffline },
  empty: { noProjects, noTasks },
  offline: "实时连接已断开，正在重连…",
} as const;
```

---

## 5. API + state plumbing

### 5.1 lib/api/client.ts

```ts
export class ApiError extends Error {
  readonly status: number;
  readonly body: string;
  constructor(status: number, body: string) {
    super(`${status} ${body}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new ApiError(resp.status, body);
  }
  if (resp.status === 204) return undefined as T;
  return resp.json() as Promise<T>;
}
```

Empty `NEXT_PUBLIC_API_BASE` → same-origin → goes through Next rewrites in dev (and natively in prod same-origin deploy). Non-empty → direct connection + CORS path.

### 5.2 lib/api/keys.ts

```ts
export const queryKeys = {
  me: () => ["me"] as const,
  workspaces: {
    detail:   (wsId: string) => ["workspaces", wsId] as const,
    projects: (wsId: string) => ["workspaces", wsId, "projects"] as const,
    agents:   (wsId: string) => ["workspaces", wsId, "agents"] as const,  // S4
  },
  projects: {
    detail: (projectId: string) => ["projects", projectId] as const,
    tasks:  (projectId: string) => ["projects", projectId, "tasks"] as const,
  },
  tasks: {
    detail:   (taskId: string) => ["tasks", taskId] as const,                  // S2
    messages: (taskId: string) => ["tasks", taskId, "messages"] as const,      // S2
  },
} as const;
```

Used 4 of these in S1 (`me`, `workspaces.projects`, `projects.detail`, `projects.tasks`); others are placeholders.

### 5.3 lib/api/types.ts (S1 scope)

```ts
export interface User { ID: string; Email: string; Name: string; }   // PascalCase per API.md /me
export interface Workspace { id: string; name: string; slug: string; owner_id: string; created_at: string; updated_at: string; }
export interface Project { id: string; workspace_id: string; name: string; description: string; archived: boolean; created_by: string; created_at: string; updated_at: string; }
export type TaskStatus = "open" | "in_progress" | "done" | "blocked" | "archived";
export interface TaskCard { id: string; project_id: string; title: string; summary: string; status: TaskStatus; sort_order: number; created_by: string; created_at: string; updated_at: string; done_at: string | null; }
```

The `User` PascalCase mismatch is intentional — see BACKEND_GAPS.md #3.

### 5.4 lib/api/auth.ts + workspaces / projects / tasks

```ts
export const auth = {
  login:    (email: string, password: string) =>
    apiFetch<void>("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email: string, name: string, password: string) =>
    apiFetch<User>("/api/v1/auth/register", { method: "POST", body: JSON.stringify({ email, name, password }) }),
  logout:   () => apiFetch<void>("/api/v1/auth/logout", { method: "POST" }),
  me:       () => apiFetch<User>("/api/v1/me"),
};

export const projectsApi = {
  list: (wsId: string)        => apiFetch<Project[]>(`/api/v1/workspaces/${wsId}/projects`),
  get:  (projectId: string)   => apiFetch<Project>(`/api/v1/projects/${projectId}`),
};

export const tasksApi = {
  list: (projectId: string)   => apiFetch<TaskCard[]>(`/api/v1/projects/${projectId}/tasks`),
};
```

`messages.ts` (lib/api/messages.ts) is a type-export-only stub in S1 — no fetcher.

### 5.5 lib/store.ts

```ts
import { create } from "zustand";

interface Selection { wsId: string | null; projectId: string | null; taskId: string | null; }
type WsStatus = "idle" | "connecting" | "connected" | "offline";

interface AppState {
  selection: Selection;
  setSelection: (patch: Partial<Selection>) => void;
  ws: { status: WsStatus; lastConnectedAt: number | null };
  setWsStatus: (status: WsStatus) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selection: { wsId: null, projectId: null, taskId: null },
  setSelection: (patch) => set((s) => ({ selection: { ...s.selection, ...patch } })),
  ws: { status: "idle", lastConnectedAt: null },
  setWsStatus: (status) => set((s) => ({
    ws: {
      status,
      lastConnectedAt: status === "connected" ? Date.now() : s.ws.lastConnectedAt,
    },
  })),
  reset: () => set({
    selection: { wsId: null, projectId: null, taskId: null },
    ws: { status: "idle", lastConnectedAt: null },
  }),
}));
```

**No `persist` middleware** — `selection.wsId` is mirrored to `localStorage.brainrot.lastWsId` by `w/[wsId]/layout.tsx` explicitly. `ws.status` should never persist across reloads.

### 5.6 hooks/useSession.ts

```ts
export function useSession() {
  const router = useRouter();
  const result = useQuery({
    queryKey: queryKeys.me(),
    queryFn:  auth.me,
    retry:    false,
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => {
    if (result.error instanceof ApiError && result.error.status === 401) {
      const next = encodeURIComponent(location.pathname + location.search);
      router.replace(`/login?next=${next}`);
    }
  }, [result.error, router]);
  return result;
}
```

Plus a TanStack Query global `onError` in `QueryProvider` as a fallback for any non-`useSession` 401 (clears cache + Zustand + redirects).

---

## 6. WebSocket infrastructure (minimal)

### 6.1 lib/ws/client.ts

Connect, listen, reconnect with exponential backoff (1s → 2s → 4s → 8s → 16s → 30s cap). No `send`/`addListener` call from S1 code, but the methods exist so S2 doesn't have to widen the class.

```ts
type Listener = (ev: MessageEvent<string>) => void;
type StatusFn = (s: "connecting" | "connected" | "offline") => void;

export class WSClient {
  private socket: WebSocket | null = null;
  private retryDelay = 1000;
  private readonly MAX_DELAY = 30_000;
  private closedByUser = false;
  private listeners = new Set<Listener>();

  constructor(private readonly url: string, private readonly onStatusChange: StatusFn) {}

  connect(): void {
    this.closedByUser = false;
    this.onStatusChange("connecting");
    this.socket = new WebSocket(this.url);
    this.socket.onopen = () => {
      this.retryDelay = 1000;
      this.onStatusChange("connected");
    };
    this.socket.onmessage = (ev) => { this.listeners.forEach((l) => l(ev)); };
    this.socket.onclose = () => {
      this.onStatusChange("offline");
      if (this.closedByUser) return;
      const delay = this.retryDelay;
      this.retryDelay = Math.min(delay * 2, this.MAX_DELAY);
      setTimeout(() => this.connect(), delay);
    };
    // onerror -> close fires too; no scheduling here
  }

  send(payload: object): void {  // S2 will use
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(payload));
  }

  addListener(l: Listener): () => void {  // S2 will use
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  disconnect(): void {
    this.closedByUser = true;
    this.socket?.close();
    this.socket = null;
  }
}
```

### 6.2 lib/ws/provider.tsx

```tsx
"use client";
export function WSProvider({ children }: { children: React.ReactNode }) {
  const setWsStatus = useAppStore((s) => s.setWsStatus);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL
      ?? `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
    const client = new WSClient(url, setWsStatus);
    client.connect();
    return () => client.disconnect();
  }, [setWsStatus]);
  return <>{children}</>;
}
```

### 6.3 Mount placement

`WSProvider` is mounted **inside `(app)/layout.tsx` after `useSession()` resolves to a 200**. Otherwise unauthenticated requests trigger infinite reconnect storms.

```tsx
// app/(app)/layout.tsx
"use client";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isPending, data: user } = useSession();
  if (isPending) return <PageSkeleton />;
  if (!user) return null;  // useSession has already issued router.replace
  return <WSProvider><ThreeColumnShell>{children}</ThreeColumnShell></WSProvider>;
}
```

### 6.4 WS URL handling

`.env.example`:

```
# Same-origin (Next rewrites): leave empty
NEXT_PUBLIC_API_BASE=

# Development with direct backend:
# NEXT_PUBLIC_API_BASE=http://localhost:8080
# NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

Default (no env vars set): WS auto-derives from `location` → same-origin → relies on Next rewrites OR same-origin deploy. **Note**: Next 15 rewrites have known caveats for WebSocket Upgrade — in dev, prefer setting `NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws` explicitly. Production same-origin works natively.

### 6.5 <OfflineBanner>

```tsx
export function OfflineBanner() {
  const status = useAppStore((s) => s.ws.status);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (status !== "offline") { setShow(false); return; }
    const t = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(t);
  }, [status]);
  if (!show) return null;
  return <div className="...">{messages.offline}</div>;
}
```

Mounted at the top of `ThreeColumnShell`. 5-second grace prevents flicker on routine reconnect.

---

## 7. Page-by-page specs

### 7.1 `(public)/layout.tsx`

- Centered: page bg `paper-1`, card 420px wide on `paper-0`, hairline 1.5px, `shadow-1`, padding `--sp-8`.
- Logo top: "Brainrot" Bricolage 800 wdth-88 text-2xl.
- Footer below card: "协作 AI 工作台 · v0.1" ink-2 text-xs.
- No QueryProvider isolation needed — children handle their own queries.

### 7.2 /login

| Element | Spec |
|---|---|
| `<form>` | onSubmit → preventDefault → `auth.login` |
| email | shadcn `<Input type="email">`, label, onBlur validates `isValidEmail` → inline error |
| password | shadcn `<Input type="password">`, label, onBlur validates `isValidPassword` |
| submit | shadcn `<Button>`, disabled while pending, primary inked style |
| "注册 →" link | navigates to `/register` |
| error banner | `<ErrorBanner kind="inline" variant="error">` above form when `auth.login` fails |

Status handling: 401 → "邮箱或密码错误" + focus back to email; 400 → show `ApiError.body`; 5xx → "服务器错误，请稍后重试" + reset button.

On success: `queryClient.invalidateQueries({ queryKey: queryKeys.me() })`, then `router.replace(searchParams.get('next') ?? '/')`.

### 7.3 /register

Same shape as /login plus a `name` field. 400 → "邮箱已被占用或参数非法". On success: `auth.register` returns User → call `auth.login(email, password)` → `router.replace('/')`.

### 7.4 /

```tsx
"use client";
export default function AppEntry() {
  const router = useRouter();
  useEffect(() => {
    const last = localStorage.getItem("brainrot.lastWsId");
    router.replace(last ? `/w/${last}` : "/onboarding");
  }, [router]);
  return <PageSkeleton />;
}
```

That's it. Renders a one-frame skeleton then redirects.

### 7.5 /onboarding

Centered card 480px:

- Title: "进入工作区"
- Help: "工作区列表接口尚未开放，请粘贴工作区 ID（管理员处获取）。"
- Input: wsId (uuid). Validates `isValidUuid` onBlur.
- Checkbox: "记住此选择" (default checked) — note: S1 minimal shadcn set doesn't include `checkbox`, so use a `<label><input type="checkbox" />…</label>` styled with Tailwind utilities.
- Submit "进入" → calls `projectsApi.list(wsId)`:
  - 200 → if remember checked, `localStorage.brainrot.lastWsId = wsId`; `setSelection({ wsId })`; `router.replace('/w/' + wsId)`.
  - 403 → inline "你不是该工作区成员".
  - 404 → inline "工作区不存在".
  - other → inline `<ErrorBanner variant="error">` with status + body.

Note: do not pre-populate the TanStack Query cache from this probe — let `/w/[wsId]/layout` request fresh on entry. Avoids cache poisoning from the probe.

### 7.6 (app)/layout.tsx → ThreeColumnShell

Sidebar (240px fixed, `paper-1` bg, hairline right border):

```
┌─────────┐
│ Brainrot│   logo (Bricolage 800 wdth-88)
│─────────│
│ WS ▼    │   WorkspaceSwitcher — S1 disabled, tooltip
│         │   "工作区列表接口尚未开放（S? 上线后启用）"
│─────────│
│ 项目     │   section heading
│  • 项目A│   <Link> per project, highlighted when params.projectId matches
│  • 项目B│
│  …      │
│─────────│
│ 审批 (0)│   disabled, tooltip "S3 上线后启用"
│ Agents  │   disabled, tooltip "S4 上线后启用"
│ Runtimes│   disabled, tooltip "S4 上线后启用"
│ 设置     │   disabled, tooltip "S4 上线后启用"
└─────────┘
```

Top bar (sticky, `paper-0` bg, hairline bottom):

- Left: Breadcrumb `Workspace ›[Project][›Task]` — each segment a `<Link>` except the current.
- Right: AccountMenu — `<DropdownMenu>` with the user's avatar fallback (initial of `User.Name`). Menu items: read-only email, separator, "登出".

Logout flow: `auth.logout()` → `queryClient.clear()` → `useAppStore.getState().reset()` → `router.replace('/login')`.

OfflineBanner mounts at the very top of the shell (above top bar) when triggered.

### 7.7 /w/[wsId]

- `(layout)` calls `useProjects(wsId)` (Sidebar reads the same query key from cache — single fetch), also writes `localStorage.brainrot.lastWsId = wsId` + `setSelection({ wsId })`.
- 403 → card-level ErrorBanner "你不是该工作区成员" + button "返回引导" (clears lastWsId, navigates to /onboarding).
- 404 → "工作区不存在" + same return button.

`(page)`:

- Hero (`text-hero` Bricolage 800 wdth-88): "{Workspace name}" — *but* we don't have a workspace fetch endpoint that returns `name` directly (no GET /workspaces/{wsId} listed in API.md). For S1, hero shows just the project count: "{N} 个项目" until backend adds a detail endpoint. **BACKEND_GAPS.md #5**.
- "新建项目" button shadcn `<Button>` disabled + tooltip "S4 上线后启用". Located top-right of hero per DESIGN.md §5 layout rule 1.
- Grid: 3 columns on desktop, 2 on tablet, 1 on mobile. Each `<ProjectCard>` `paper-0` + hairline + `shadow-1`.
- Empty: `<EmptyState icon title="还没有项目" description="请联系管理员创建" />`.
- Loading: 3 skeleton cards.

### 7.8 /w/[wsId]/p/[projectId]

- `(layout)` calls `useProject(projectId)` for hero name + `setSelection({ projectId })`.
- 403/404 handled same as workspace.

`(page)`:

- Hero "{Project name}" + ink-2 description.
- "新建任务" disabled + tooltip "S4 上线后启用".
- Grid: 4 columns on desktop, scaling down. Each `<TaskCard>`:
  - Title (sm bold font-display)
  - Summary (xs ink-2, line-clamp-2)
  - `<TaskStatusBadge status={t.status} />`
  - Relative `created_at` footer
  - Visual: `paper-0` + hairline + `shadow-1` + **opacity-60 + cursor-not-allowed + tooltip "S2 上线后启用"** to signal disabled state. Rendered as plain `<div>` (not wrapped in `<Link>` / `<button>`) — there is no click target at all.
- Empty: "还没有任务".
- Loading: 8 skeleton cards.

### 7.9 <TaskStatusBadge>

Shape-driven per DESIGN.md §6 master table:

- `open` → hollow square stroke 1.5px, no fill, no foreground text inside badge (text label "未开始" next to badge ink-2)
- `in_progress` → filled square + 1s pulse animation, `paper-0` on `--status-in_progress-bg`
- `done` → filled gray dot, `paper-0` on `--status-done-bg`
- `blocked` → diagonal stripe pattern fill, `ink-0` foreground
- `archived` → text only "已归档", faded `--status-archived-fg`

Reuses tokens from `styles/tokens/status.css`.

---

## 8. BACKEND_GAPS.md (seed entries)

Initial 5 entries (created during S1 design):

| # | Gap | Workaround in S1 |
|---|---|---|
| 1 | `GET /api/v1/workspaces` missing | localStorage `brainrot.lastWsId` + `/onboarding` paste form |
| 2 | `GET /api/v1/workspaces/{wsId}/runtimes` missing | runtime indicators disabled in sidebar (S1 doesn't show them anyway) |
| 3 | `/me` returns PascalCase, inconsistent with snake_case schemas | `User.ID` typed as PascalCase, documented inconsistency |
| 4 | No auth matrix doc for write endpoints | S1 doesn't do writes; document for S4 |
| 5 | No `GET /api/v1/workspaces/{wsId}` detail endpoint (returns `name`, `slug`) | Hero on /w/[wsId] omits workspace name in S1; shows project count only |

Format per entry: status, discovered date (start of S1 = 2026-05-16), impact, current workaround, what backend needs to do. Subsequent S2-S5 work appends.

---

## 9. Error handling & loading

### 9.1 Components

- `<ErrorBanner kind variant>` — kind: `inline` | `card`; variant: `info` | `warn` | `error`. (No `toast` kind in S1 — sonner cut.)
- `<EmptyState icon title description action>` — used 2 places in S1 (empty projects, empty tasks).
- `<PageSkeleton>` — top-level shell for routes still resolving session.

### 9.2 TanStack Query global onError

```ts
new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  queryCache: new QueryCache({
    onError: (err) => {
      if (!(err instanceof ApiError)) return;
      if (err.status === 401) {
        // Fallback for non-/me 401 — useSession handles its own
        queryClient.clear();
        useAppStore.getState().reset();
        const next = encodeURIComponent(location.pathname + location.search);
        location.replace(`/login?next=${next}`);
      }
      // 403/404/5xx surfaced inline by individual hooks
    },
  }),
});
```

### 9.3 Loading strategy

- **Initial route load**: PageSkeleton until first query settles.
- **Route transitions** (`/w/a` → `/w/b`): no `keepPreviousData` — show skeleton briefly. Distinct ws context warrants a clean reset.
- **Cached navigation** (back to a project already visited within `staleTime`): TanStack Query serves cache instantly, no skeleton.

### 9.4 Form submission states

Submit buttons disable on pending. Pending state visualized via shadcn `<Button>` with internal spinner or text swap ("登录中…"). Double-submit prevented by the disabled state + a debounce safety net (200ms) inside the submit handler.

---

## 10. Testing

### 10.1 Vitest unit (target 80% coverage on `lib/`)

| File | Min cases |
|---|---|
| `lib/codec.ts` | 6: valid b64→JSON, malformed b64, non-JSON content, empty string, non-string input, encode/decode round-trip |
| `lib/mention-parse.ts` | 5: empty prefix returns all non-archived, prefix match, case-insensitive, archived filtered, parseSubmit dedupe |
| `lib/countdown.ts` | 5: >10min not urgent, <10min urgent, expired returns `expired:true`, negative remainder coerced to 0, label format `MM:SS` |
| `lib/format.ts` | 4: relativeTime past/future, formatBytes B/KB/MB |
| `lib/validation.ts` | 6: email valid/invalid, password ≥8/<8, uuid valid/invalid |
| `lib/parse-message.ts` | 9: one happy case per ParsedMessage variant (decoded shape matches discriminant) |
| `lib/api/keys.ts` | 4: each factory returns expected tuple, `as const` preserves literal types |
| `lib/api/client.ts` | 3: 2xx returns parsed JSON, 204 returns undefined, !ok throws ApiError with status + body |
| `lib/store.ts` | 4: setSelection patches partial, setWsStatus updates lastConnectedAt only on "connected", reset clears all, setSelection independent of ws |

No tests for React components in S1 (S2 will add component tests when chat rendering arrives — that's where they pay back).

Configuration: `vitest.config.ts` with `jsdom` environment for codec/countdown (browser globals), `node` for pure logic. Coverage via `@vitest/coverage-v8`, threshold 80% lines + branches on `lib/**`.

### 10.2 No Playwright in S1

Deferred to S5/M6 when the full happy path (login → onboarding → ws → project → task → chat → approval) is implementable end-to-end.

### 10.3 Manual browser checklist

20 items, listed in §11.3 acceptance.

---

## 11. Acceptance (S1 → S2 gate)

S1 is done only when every box is checked. **Any unchecked item blocks S2.**

### 11.1 Static quality

- [ ] `pnpm typecheck` passes (tsc --noEmit, strict + noUncheckedIndexedAccess)
- [ ] `pnpm lint` passes (ESLint flat config + @typescript-eslint)
- [ ] `pnpm build` passes (Next.js production build, no errors, no warnings besides bundler-known ones)
- [ ] `pnpm format:check` passes (Prettier)
- [ ] No `console.log` in committed code (per ~/.claude/rules/coding-style.md)

### 11.2 Vitest

- [ ] All 9 lib files tested per §10.1
- [ ] Coverage on `lib/**` ≥ 80% lines + branches
- [ ] `pnpm test` passes

### 11.3 Manual browser checklist

| # | Scenario | Expected |
|---|---|---|
| 1 | Visit `/w/abc` without session | Redirect `/login?next=/w/abc` |
| 2 | `/login` form, bad email format | onBlur shows "请输入有效的邮箱地址" |
| 3 | `/login` submit wrong password | Inline `<ErrorBanner>` "邮箱或密码错误", focus returns to email |
| 4 | `/login` success | Replace to `/` then `/onboarding` or `/w/[lastWsId]` |
| 5 | `/register` full flow | Register → auto-login → `/` |
| 6 | `/onboarding` non-UUID | Inline "格式不正确" |
| 7 | `/onboarding` UUID for non-member workspace | Inline "你不是该工作区成员" |
| 8 | `/onboarding` valid workspace | localStorage written, replace to `/w/[wsId]` |
| 9 | `/w/[wsId]` render | Hero with project count + project grid OR EmptyState |
| 10 | `/w/[wsId]` 403 | Card-level ErrorBanner + "返回引导" button |
| 11 | Sidebar disabled items hover | tooltip "S? 上线后启用" |
| 12 | Switch workspaces via /onboarding | Sidebar projects refresh, breadcrumb refreshes |
| 13 | Click project card | Navigate to `/w/[wsId]/p/[projectId]`, breadcrumb adds segment |
| 14 | Project page | Hero with project name + task grid OR EmptyState |
| 15 | TaskCard hover | Disabled visual + tooltip "S2 上线后启用"; rendered as plain `<div>`, no click handler at all |
| 16 | AccountMenu → logout | Replace to `/login`; subsequent receivable-page visit redirects again |
| 17 | Disconnect network ≥5s | OfflineBanner appears; reconnect → banner disappears |
| 18 | Console on each page | 0 errors, 0 unexpected warnings |
| 19 | LCP on each page (local backend) | ≤1.5s |
| 20 | Keyboard nav (Tab, Enter on forms) | Focus ring visible, forms submit via Enter |

### 11.4 Docs

- [ ] `docs/BACKEND_GAPS.md` written with 5 seed entries
- [ ] `README.md` updated (or created) with: prereqs, `pnpm i`, `pnpm dev`, `pnpm test`, `.env.example` walkthrough
- [ ] `.env.example` committed

---

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Next 15 rewrites WebSocket caveat in dev | `.env.example` defaults dev WS to direct `ws://localhost:8080/ws` via `NEXT_PUBLIC_WS_URL`; rewrites only cover `/api/*`. Document in README. |
| Token CSS load order (Tailwind preflight vs `:root` vars) | `@import "tailwindcss";` first, then token files. `@theme` block alias references must resolve at build time. Verify in `pnpm build`. |
| `User.ID` PascalCase trips a future contributor | Logged as BACKEND_GAPS #3; ESLint rule `camelcase` set to allow PascalCase on type properties. Comment in `lib/api/types.ts`. |
| Disabled CTAs feel "dead" — UX confusion | Every disabled element carries an explicit tooltip "S? 上线后启用". Pattern is consistent across sidebar, "新建" buttons, and task cards. Honest signaling. |
| `parse-message.ts` written but unused → drift | Vitest covers the type shape; if S2 finds the union wrong, refactor is local. The 9 variants come from API.md §"消息内容" table; low refactor risk. |
| Workspace name missing from hero | Logged as BACKEND_GAPS #5; hero shows "{N} 个项目" only. When backend adds detail endpoint, hero is a trivial edit. |
| WS connect storms if cookie expired between session check and WS handshake | `WSProvider` is inside `(app)` layout after session resolved. If WS handshake fails, exp backoff caps at 30s — bounded blast radius. |
| Coverage threshold blocks merges on test-light files | 80% is the bar; PR can lift specific files if backend changes break coverage temporarily, but must restore by S1 close. |

---

## 13. After S1

When S1 acceptance is fully green:

1. Commit S1 close marker (e.g., `docs(s1): acceptance checklist complete — S1 ready to gate into S2`).
2. Start S2 brainstorming (M3 in FRONTEND.md): chat composer with `@mention` (Tiptap), message rendering (parse-message consumers, tool_use↔tool_result pairing), WS subscribe abstraction (`useSubscribe(scope, id)` + handlers.ts dispatching), task detail page `/w/[wsId]/p/[projectId]/t/[taskId]`.
3. S2 spec lives at `docs/superpowers/specs/YYYY-MM-DD-s2-chat-design.md`.
4. Append to `docs/BACKEND_GAPS.md` whenever a new backend gap surfaces.

S1's lib/, api/, store, WS infrastructure, and shell become the substrate S2 builds chat into.

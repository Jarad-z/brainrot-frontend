# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for **Brainrot**, a collaborative AI workbench. Hierarchy: `workspace → project → task card`. Each task card is a full chat stream where users `@<agent_handle>` to dispatch self-hosted Claude Code agents; agent tool calls require human approval (1h timeout).

Stack: Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 · TanStack Query v5 · Zustand · Tiptap (mentions only) · Vitest + Testing Library.

Pairs with a Go backend at `http://localhost:8080` (REST `/api/v1/*` + WebSocket `/ws`). The full engineering baseline is in `docs/FRONTEND.md` and the API contract is in `docs/API.md` — **read these before non-trivial work**.

## Commands

```bash
pnpm dev               # next dev (http://localhost:3000)
pnpm build             # next build
pnpm lint              # eslint
pnpm typecheck         # tsc --noEmit
pnpm test              # vitest run
pnpm test:watch        # vitest watch
pnpm test:coverage     # coverage; thresholds 80% lines/branches/functions/statements on lib/**
pnpm format            # prettier write
```

Run a single test: `pnpm vitest run path/to/file.test.ts` or filter by name: `pnpm vitest run -t "decodes base64"`.

Pre-commit gate: `pnpm typecheck && pnpm lint && pnpm test`.

## Environment

Two API modes, controlled by `NEXT_PUBLIC_API_BASE`:

- **Empty (default)**: Next dev rewrites proxy `/api/*` → `:8080` (same-origin, no CORS). WS does **not** proxy through rewrites — `NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws` is required.
- **Set to `http://localhost:8080`**: direct CORS path; backend `corsWrap` whitelists `http://localhost:3000` with credentials.

Auth cookie is HttpOnly — login state can only be determined via `GET /api/v1/me`. All fetches go through `lib/api/client.ts`'s `apiFetch`, which sets `credentials: 'include'` and throws `ApiError { status, body }` on non-2xx (errors are `text/plain`, not JSON envelopes).

## Architecture

### Route shell (`app/`)
- `app/(public)/` — login, register (only routes that work unauthenticated).
- `app/(app)/` — protected three-column shell. `layout.tsx` calls `useSession()`; 401 redirects to `/login?next=...`. Do **not** SSR protected pages — they depend on Cookie session + WS.
- `app/(app)/w/[wsId]/p/[projectId]/t/[taskId]/page.tsx` is the main stage (chat stream).
- `app/(app)/approvals/page.tsx` is the cross-workspace approval hub.

### Server state: TanStack Query is the source of truth
- All query keys live in `lib/api/keys.ts` (`queryKeys.workspaces.projects(wsId)` etc.). **Never write inline key strings.**
- WS event handlers (`lib/ws/handlers.ts`) only mutate Query caches via `setQueryData` / `invalidateQueries`. Do not setState business data from WS callbacks.
- One thin REST wrapper per resource in `lib/api/*.ts`, all built on `apiFetch`.

### Client state: Zustand (`lib/store.ts`)
Holds only: current ws/project/task selection, WS connection status, unread/badge counts. Not server data.

### WebSocket (`lib/ws/`)
- **Single connection per SPA** held by `WSProvider`. `WSClient` auto-reconnects with exponential backoff (1s → 30s) and re-sends all active subscriptions on reconnect. Backend pings every 45s; do not send client pings.
- Subscription wire protocol is the literal object `{type:"subscribe", scope:"workspace"|"project"|"task", id:"<uuid>"}` — `scope` is a literal enum, not a composed string.
- Subscriptions are ref-counted across pages via `use-subscribe.ts`; `useEffect` subscribe on mount, unsubscribe on unmount.
- Event → cache mapping (in `handlers.ts`): `message.appended` dedups by message `id` and inserts by `seq`; `approval.requested` may arrive while user is not on the task page (toast + badge); `runtime.online/offline` mutates the runtimes set.

### Wire-format quirks (these will bite if forgotten)
- `Message.content`, `Message.metadata`, `Agent.custom_env`, `Agent.custom_args`, `Agent.mcp_config`, `ApprovalRequest.tool_input` are **base64-encoded JSON**. Always decode through `lib/codec.ts::decodeJSON<T>`. Never `atob()` inline.
- `EnqueuedRun` is **PascalCase** (`{RunID, AgentID, RuntimeID}`); everything else is snake_case. Don't unify.
- Agent jsonb fields have an **asymmetric** wire format on POST/PATCH (see `lib/api/agents-encoding.ts` — single boundary, do not bypass).
- "Is this message queued?" — only trust `message.metadata.queued === true` after decoding. Do **not** infer from `runs[]` length.
- Runtime presence has both a REST seed and a WS delta: fetch via `useWorkspaceRuntimes(wsId)` (REST `GET /workspaces/{wsId}/runtimes`) for the initial set, then `runtime.online`/`runtime.offline` WS events mutate the cache. Components that show online status (e.g. `<AgentCard online={...} />`) must read from the runtimes cache — passing nothing makes `online` undefined and the agent renders as offline regardless of daemon state. `localStorage.lastWsId` is still used as the workspace-selection fallback when the user has no remembered preference.

### Chat stream rendering (`components/chat/`)
`MessageItem.tsx` dispatches by `parsed.type` (from `lib/parse-message.ts`) to subcomponents in `components/chat/parts/`. `tool_use` ↔ `tool_result` are paired by `payload.tool_use_id` and rendered as a parent/child tree; if the result hasn't arrived yet, show a "running…" skeleton. `permission_request` blocks are the most visually prominent (yellow border) and show a live countdown driven by `expires_at` (server time, never local accumulation).

### Codebase conventions
- `pnpm dev` proxies `/api/*` but **not** `/ws` — never assume WS is same-origin in dev.
- The `ui_design/` folder is ignored by webpack (`next.config.ts`) and excluded from coverage — it's a static design sandbox, not runtime code.
- `_design_pkg/` and `D:brainrot_frontendcomponentsruntimes` (yes, with a typo'd no-slash path — windows artifact) are not part of the app.

## Specs & status tracking

Milestone specs live in `docs/superpowers/specs/` (S0 prototype, S1 skeleton, S2 read-only browse, S3 approvals, S4 workspace mgmt, S5 collab+uploads — current branch). Backend gaps discovered during frontend work accumulate in `docs/BACKEND_GAPS.md` — append rather than silently work around. When a behavior seems wrong, check BACKEND_GAPS before assuming it's a frontend bug.

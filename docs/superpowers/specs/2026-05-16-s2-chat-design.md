# S2 Chat — Task Detail Page + Message Stream + Composer

> **Date:** 2026-05-16
> **Parent:** S1 functional (Next.js skeleton + login + read-only workspace browsing) and S1 polish complete (brand component library + visual alignment to prototype, merged commit 9646323). The S0 prototype's `ui_design/chat/*.jsx` is the visual + behavioral reference; `lib/parse-message.ts` typed the message variants at S0; S2 is the first consumer.
> **In scope:** task detail page route, three-pane shell, message rendering (9 ParsedMessage variants), tool_use ↔ tool_result pairing, Tiptap-based Composer with @mention, WebSocket subscribe abstraction, REST history fetch + incremental WS merge, virtualized message list, right-panel tabs (artifacts/assets placeholder + approvals read-only history), chat-internal approval card (interactive).
> **Not in scope:** approvals hub `/approvals` (S3), bell notification badge (S3), cancel-run button (S3), asset upload + artifact/asset list endpoints (S3), agent CRUD / runtimes / settings (S4), real LLM execution (backend mock fine), workspace switcher UI / project creation UI (S4), TaskCard agent avatars (schema undefined), mobile responsive (v1 desktop-only), global keyboard shortcuts (Cmd+K etc.), task list keyboard navigation, cursor-based message pagination (BACKEND_GAPS #8), dark theme (S6).

---

## 1. Problem

Brainrot's product loop is: workspace → project → task card → chat with @agent → tool approval → artifact. After S1 the user can log in and browse workspaces, projects, and the read-only task board. The task card is the unit of work — entering one and actually using it (read messages, send messages, see agent activity, approve tool calls) is the missing 80% of the product. S2 closes this gap.

The current state:

- `app/(app)/w/[wsId]/p/[projectId]/page.tsx` renders TaskCard tiles, each disabled with a tooltip "S2 上线后启用" pointing to the empty route `/w/[wsId]/p/[projectId]/t/[taskId]`. That route does not exist.
- `lib/parse-message.ts` defines `ParsedMessage` as a 9-arm union (`user`, `system`, `assistant_text`, `tool_use`, `tool_result`, `permission_request`, `thinking`, `result`, `rate_limit_event`). Nothing in `components/*` consumes it.
- `lib/ws/client.ts` + `lib/ws/provider.tsx` open one WebSocket per session but expose no subscribe/unsubscribe API and no event router; `handlers.ts` does not exist.
- `lib/api/messages.ts` is a type-only stub (`export type { ParsedMessage } from "@/lib/parse-message"`). No fetcher.
- `ui_design/chat/*.jsx` (10 files: `MessageList`, `MessageItem`, `Composer`, `MentionList`, `ApprovalCard` + 8 parts under `parts/`) is fully written for the prototype window-globals environment. Visual + interaction reference exists; React/TS port does not.
- `screenshots/13-task-detail-empty-chat.png` is the visual truth for the empty-chat state of the new route.

Functional acceptance: from the project board, click a task card, land on `/w/.../t/[taskId]`, see the three-pane shell (task list / chat / right panel), type `@writer hello` into the Composer, send via Ctrl+Enter, see the optimistic message appear, see agent reply stream in via WS, see a tool_use card with nested tool_result, see a permission_request card with working approve/deny buttons, decision succeeds. Visual acceptance: side-by-side with `screenshots/13`, the empty-chat state must be visually indistinguishable.

S1 polish §10 deferred 6 chat primitives (`<ToolCard>`, `<PermCard>`, `<MentionPop>`, `<Composer>`, `<MessageBubble>`, `<ThinkingCard>`) to S2. They are not built as generic brand primitives; their API surface is chat-only and lives under `components/chat/*` directly.

## 2. Approach — decisions

Eleven decisions taken during brainstorming (full Q&A trace lives in conversation; one-line summary here):

| # | Topic | Decision | Why |
|---|---|---|---|
| Q1 | Inline `permission_request` interactivity | Full interactive `ApprovalCard` (approve/deny/note/countdown); bell badge + `/approvals` hub deferred to S3 | Without inline interaction the chat deadlocks: agent writes a file → blocks on approval → user has to navigate away → S2 not dogfoodable. |
| Q2 | Tiptap integration strategy | Minimal core (`@tiptap/core` + Document/Paragraph/Text) + self-written Mention node using `@tiptap/suggestion` plugin; reuse prototype `MentionList` visual | starter-kit bundles ~80KB of bold/italic/heading we don't need; tippy.js popover fights the brand visuals; we control the MentionList anchor and rendering directly. |
| Q3 | 9 variant → React mapping | Dispatch by `switch(msg.parsed.type)` in `MessageItem.tsx`; 8 part files (user / assistant / tool-pair / orphan-result / perm / result / system / rate-limit) | Switch gives TypeScript exhaustiveness; each part 50-120 lines independently testable; assistant_text + thinking share the AssistantMessage chrome (avatar + meta row); tool_use + tool_result render as a single ToolPair (no-avatar indent). |
| Q4 | WS state container | TanStack Query `setQueryData` with optimistic `tempId` and dedupe by `id`; zustand for UI-only state only | FRONTEND.md §15 #4 already mandates "WS handlers only mutate query cache". S2 establishes the baseline for S3/S4. Cache lifecycle (gc, refetch, devtools) comes for free. |
| Q5 | Virtual list | `@tanstack/react-virtual` with dynamic measurement + `scrollMargin` anchor pattern | Messages have unbounded height (markdown + tool body expansion); react-virtual auto-remeasures via ResizeObserver; react-window requires `resetAfterIndex` manual orchestration. ~12KB gz fits the <300KB initial bundle budget. |
| Q6 | History pagination | Full fetch on mount, no pagination; cursor pagination deferred to BACKEND_GAPS #8 | API.md current contract returns the full list. Real-world S2 task volumes are <200 messages. react-virtual handles 1000+ items fine. Adding fake pagination on top of a full fetch is pure complexity for no win. |
| Q7 | tool_use ↔ tool_result pairing | Client-side pure function `pairToolMessages`; O(N) one-pass build of `Map<tool_use_id, useMsg>`; orphan / running / out-of-order all handled in UI | Keeps `ParsedMessage` union pure; pairing is a derived view, not a cache mutation; WS handler stays stateless. |
| Q8 | Mention candidate source | `GET /workspaces/{wsId}/agents` (already exists, no backend gap), filter `archived` on client, staleTime 0 | Product semantics align: any ws agent can be @'d (FRONTEND.md §16); endpoint and queryKey both already present. |
| Q9 | Right-panel tab data strategy | Approvals tab derives history from `useTaskMessages` filter (zero new endpoints); artifacts/assets tabs are placeholder EmptyState "S3 上线后启用"; BACKEND_GAPS #9/#10/#11 logged for S3 | One of the three tabs is meaningfully real and useful for dogfood; the other two stay placeholders consistent with S1's tooltip-disabled pattern. |
| Q10 | 3-pane shell composition | Nest inside `ThreeColumnShell`; change main from `overflow-y-auto` → `flex-1 min-h-0 overflow-hidden`; page owns its overflow; S1 pages add `h-full overflow-y-auto` fallback | Preserves Sidebar/Topbar/Breadcrumb consistency; one-line ThreeColumnShell change; cleaner contract for S3/S4 pages. Desktop-first (<1280px drawer behavior deferred). |
| Q11 | Keyboard / a11y contract | (a) popover-open Enter/Tab = pick; (b) Esc = close popover only, preserve text; (c) mention chip Backspace = two-step (select then delete) via `selectable: true`; (d) post-send focus returns to Composer end; (e) S2 introduces no global shortcuts (search → "S3 上线后启用"); (f) task list is mouse-only | Matches Slack/GitHub/Linear baseline; avoids opening new scope (sidebar collapse, command palette). |

## 3. Architecture — three subsystems

```
┌─────────────────────────────────────────────────────────────────┐
│  Subsystem 3: Task detail page (route shell + 3-pane grid)      │
│  - app/(app)/w/[wsId]/p/[projectId]/t/[taskId]/page.tsx          │
│  - components/task-detail/{TaskListPane,TaskRow,ChatPane,        │
│      TaskHeader,ThinkingBar,RightPanel,RightTabs/*}.tsx          │
│  - Modify: components/nav/{ThreeColumnShell,Breadcrumb}.tsx      │
├─────────────────────────────────────────────────────────────────┤
│  Subsystem 2: Chat (message stream + pairing + virtual list +    │
│                     Composer)                                    │
│  - components/chat/{MessageList,MessageItem,Composer,            │
│      MentionList,MentionExtension,MentionedText}.tsx             │
│  - components/chat/parts/{UserMessage,AssistantMessage,          │
│      ToolPair,OrphanToolResult,PermissionRequestCard,            │
│      ResultBanner,SystemLine,RateLimitBanner}.tsx                │
│  - lib/chat/{pair-tool-messages,mention-filter,                  │
│      serialize-editor,sort-messages,upsert-message,              │
│      enrich-message}.ts                                          │
│  - lib/store/chat-ui.ts                                          │
│  - hooks/{useTaskMessages,useToolPairing,useSendMessage,         │
│      useWorkspaceAgents,useApprovalDecide,useActiveRuns,         │
│      useApprovalsHistory,useTask}.ts                             │
├─────────────────────────────────────────────────────────────────┤
│  Subsystem 1: WS subscribe + REST messaging infrastructure       │
│  - Modify: lib/ws/client.ts (add subscribe/unsubscribe +         │
│    activeSubs + reconnect resubscription)                        │
│  - lib/ws/use-subscribe.ts (new)                                 │
│  - lib/ws/handlers.ts (new, 5 event types)                       │
│  - Modify: lib/api/messages.ts (real fetcher list + send)        │
│  - lib/api/agents.ts (new)                                       │
│  - lib/api/approvals.ts (new, decide)                            │
│  - Modify: lib/api/types.ts (ClientMessage, Agent,               │
│    ApprovalRequest, EnqueuedRun)                                 │
│  - Modify: lib/parse-message.ts (permission_request payload      │
│    schema expansion)                                             │
└─────────────────────────────────────────────────────────────────┘
```

**Build order** is strict bottom-up. Subsystem 1 compiles and unit-tests independently (no React). Subsystem 2 compiles against subsystem 1 + mocked agents; each part renders with a hand-crafted ParsedMessage instance via Vitest. Subsystem 3 wires it all together at the route.

**Brand reuse**: S2 directly consumes 23 brand components from S1 polish (Avatar, StatusChip, Card, Button, Tooltip, Tag, Dialog, …). S2 introduces no new files under `components/brand/`; chat-specific surfaces live under `components/chat/` and `components/task-detail/` where their API is consumed once.

**Bundle increment estimate**: ~50KB gz (Tiptap core ~12KB + Suggestion ~8KB + react-virtual ~12KB + nanoid ~1KB used for optimistic-insert `tempId` generation + parts components ~17KB). FRONTEND.md §11 budget is <300KB initial JS gz; S1 current bundle is well within.

## 4. Subsystem 1 — WS + REST infrastructure

### 4.1 `lib/api/types.ts` additions

```ts
// Already exists: User, Workspace, Project, TaskStatus, TaskCard.
// Add for S2:

export type AgentBackendType = "claude";

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
  custom_env: string;     // base64 jsonb, not decoded in S2
  custom_args: string;    // base64 jsonb, not decoded in S2
  mcp_config: string;     // base64 jsonb, not decoded in S2
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  task_card_id: string;
  role: "user" | "agent" | "system";
  author_user_id: string | null;
  author_agent_id: string | null;
  content: string;        // base64 jsonb
  task_run_id: string | null;
  seq: number | null;
  metadata: string;       // base64 jsonb
  created_at: string;
}

// Client-side enrichment of Message; never sent to server.
export interface ClientMessage extends Message {
  parsed: ParsedMessage;            // decoded + parsed content
  meta: { queued?: boolean };       // decoded metadata
  tempId?: string;                  // optimistic insert marker
}

export type ApprovalDecision = "approved" | "denied" | "approved_with_edits";
export type ApprovalStatus = ApprovalDecision | "pending" | "timeout";

export interface ApprovalRequest {
  id: string;
  run_id: string;
  task_card_id: string;
  tool_name: string;
  tool_input: string;        // base64 jsonb
  status: ApprovalStatus;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
  expires_at: string;
}

// PascalCase per API.md note on Go field marshalling.
export interface EnqueuedRun {
  RunID: string;
  AgentID: string;
  RuntimeID: string;
}
```

### 4.2 `lib/parse-message.ts` schema expansion

The current `permission_request` variant has only `{ tool_use_id, tool_name }`. S2 widens to carry `approval_id` and `tool_input` so the inline ApprovalCard can render full context and route the decide call. The expansion is additive (both fields optional) — falls back to `tool_use_id` lookup when `approval_id` is absent (BACKEND_GAPS #12). `result` keeps the existing `{ duration_ms, result }` shape; the prototype's "used N tools" suffix is dropped from `ResultBanner` since no schema field carries it.

```ts
export type ParsedMessage =
  | { type: "user"; text: string; mentions: string[] }
  | { type: "system"; payload: string }
  | { type: "assistant_text"; payload: { text: string } }
  | { type: "tool_use"; payload: { tool_name: string; tool_use_id: string; input: unknown } }
  | { type: "tool_result"; payload: { tool_use_id: string; is_error: boolean; content: unknown } }
  | { type: "permission_request"; payload: {
      tool_use_id: string;
      tool_name: string;
      approval_id?: string;    // ← added (BACKEND_GAPS #12)
      tool_input?: unknown;    // ← added
      expires_at?: string;     // ← added (for countdown)
    } }
  | { type: "thinking"; payload: { text: string } }
  | { type: "result"; payload: { duration_ms: number; result: string } }
  | { type: "rate_limit_event"; payload: { retry_in_seconds: number } };
```

The parse-message decoder reads whatever fields are present in the base64 jsonb without crashing on missing optionals. Type tests in `lib/parse-message.test.ts` cover all 9 arms + each optional field present/absent on permission_request.

### 4.3 `lib/chat/enrich-message.ts`

A pure function that takes a raw `Message` and produces `ClientMessage`. Called once at REST fetch boundary and once per WS `message.appended` event. Centralizes base64 decoding so components never call `atob`.

```ts
export function enrichMessage(raw: Message): ClientMessage {
  const parsed = parseMessageContent(raw.content);
  const meta = raw.metadata ? decodeJSON<{ queued?: boolean }>(raw.metadata) : {};
  return { ...raw, parsed, meta };
}
```

Edge cases: empty `content` → fall back to `{ type: "user", text: "", mentions: [] }` (current parse-message default); empty `metadata` → `{}`; malformed base64 → log to console and return `{ type: "system", payload: "parse error" }` (visible but non-crashing).

### 4.4 `lib/api/messages.ts` real fetcher

```ts
import { api } from "./client";
import type { Message, EnqueuedRun, ClientMessage } from "./types";
import { enrichMessage } from "@/lib/chat/enrich-message";

export async function fetchMessages(taskId: string): Promise<ClientMessage[]> {
  const raw = await api<Message[]>(`/tasks/${taskId}/messages`);
  return raw.map(enrichMessage);
}

export interface SendMessageInput {
  text: string;
  mentions: string[];     // agent uuid array
}

export interface SendMessageResponse {
  message: Message;
  runs: EnqueuedRun[];
}

export async function sendMessage(
  taskId: string,
  input: SendMessageInput
): Promise<SendMessageResponse> {
  return api<SendMessageResponse>(`/tasks/${taskId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: input }),
  });
}
```

### 4.5 `lib/api/agents.ts`

```ts
export async function fetchWorkspaceAgents(wsId: string): Promise<Agent[]> {
  return api<Agent[]>(`/workspaces/${wsId}/agents`);
}
```

### 4.6 `lib/api/approvals.ts`

```ts
export interface DecideInput {
  decision: ApprovalDecision;
  note?: string;
}

export async function decideApproval(
  approvalId: string,
  input: DecideInput
): Promise<ApprovalRequest> {
  return api<ApprovalRequest>(`/approvals/${approvalId}/decide`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
```

### 4.7 `lib/api/keys.ts` extension

Already has `workspaces.agents(wsId)` and `tasks.messages(taskId)` as placeholders; S2 starts using them. No structural change required.

### 4.8 `lib/ws/client.ts` extension

Current client has `connect/send/addListener/disconnect`. S2 adds three things while keeping the existing API intact:

```ts
export type Scope = "workspace" | "project" | "task";

export class WSClient {
  // ... existing fields ...
  private activeSubs = new Set<string>();   // key = "scope:id"

  subscribe(scope: Scope, id: string): void {
    const key = `${scope}:${id}`;
    if (this.activeSubs.has(key)) return;
    this.activeSubs.add(key);
    this.send({ type: "subscribe", scope, id });
  }

  unsubscribe(scope: Scope, id: string): void {
    const key = `${scope}:${id}`;
    if (!this.activeSubs.has(key)) return;
    this.activeSubs.delete(key);
    this.send({ type: "unsubscribe", scope, id });
  }

  // Modify existing onopen: after emitting "connected" status,
  // re-send subscribe for every key currently in activeSubs.
  // This handles reconnection without callers re-subscribing.
}
```

Reference counting (the "one component subscribes, another component subscribes the same scope+id" case) lives at the `useSubscribe` hook layer, not on the client. The client only knows "I should be subscribed to these N scope+id pairs right now".

### 4.9 `lib/ws/use-subscribe.ts`

```ts
"use client";
import { useEffect } from "react";
import { useWSClient } from "./provider";   // new context export

const refCounts = new Map<string, number>();   // module-level, shared across hook callers

export function useSubscribe(scope: Scope, id: string | null): void {
  const client = useWSClient();
  useEffect(() => {
    if (!id || !client) return;
    const key = `${scope}:${id}`;
    refCounts.set(key, (refCounts.get(key) ?? 0) + 1);
    if (refCounts.get(key) === 1) client.subscribe(scope, id);
    return () => {
      const next = (refCounts.get(key) ?? 1) - 1;
      if (next <= 0) {
        refCounts.delete(key);
        client.unsubscribe(scope, id);
      } else {
        refCounts.set(key, next);
      }
    };
  }, [client, scope, id]);
}
```

Module-level ref count is acceptable because WSClient is also a singleton (held by WSProvider). If we later move to multiple WS connections (not planned), this hook must be refactored to use a per-client map.

### 4.10 `lib/ws/handlers.ts`

```ts
import type { QueryClient } from "@tanstack/react-query";
import type { ChatUIStore } from "@/lib/store/chat-ui";
import { queryKeys } from "@/lib/api/keys";
import { enrichMessage } from "@/lib/chat/enrich-message";
import { upsertMessage } from "@/lib/chat/upsert-message";

type WSEvent =
  | { type: "task.created"; scope: "project"; id: string; payload: { task: TaskCard } }
  | { type: "task.updated"; scope: "project"; id: string; payload: { task: TaskCard } }
  | { type: "message.appended"; scope: "task"; id: string; payload: { message: Message } }
  | { type: "run.completed"; scope: "task"; id: string;
      payload: { run_id: string; status: "done" | "failed" | "canceled"; error?: string } }
  | { type: "approval.requested"; scope: "task"; id: string;
      payload: { approval_id: string; run_id: string; tool_name: string; tool_input: string } }
  | { type: "approval.decided"; scope: "task"; id: string;
      payload: { approval_id: string; decision: ApprovalDecision; note?: string } };

export function registerHandlers(
  client: WSClient,
  queryClient: QueryClient,
  chatUI: () => ChatUIStore,
) {
  client.addListener((ev) => {
    let data: WSEvent;
    try { data = JSON.parse(ev.data); } catch { return; }
    switch (data.type) {
      case "message.appended":  return onMessageAppended(data, queryClient);
      case "task.updated":
      case "task.created":      return onTaskMutation(data, queryClient);
      case "run.completed":     return onRunCompleted(data, queryClient);
      case "approval.decided":  return onApprovalDecided(data, chatUI());
      // approval.requested: chat stream's permission_request message carries
      //   the same info; no separate cache to maintain in S2.
      default: return;
    }
  });
}

function onMessageAppended(ev: { id: string; payload: { message: Message } }, qc: QueryClient) {
  const enriched = enrichMessage(ev.payload.message);
  qc.setQueryData<ClientMessage[]>(
    queryKeys.tasks.messages(ev.id),
    (old = []) => upsertMessage(old, enriched)
  );
}

function onTaskMutation(ev: { id: string; payload: { task: TaskCard } }, qc: QueryClient) {
  // ev.id is projectId here
  qc.setQueryData<TaskCard[]>(
    queryKeys.projects.tasks(ev.id),
    (old = []) => {
      const idx = old.findIndex(t => t.id === ev.payload.task.id);
      if (idx === -1) return [...old, ev.payload.task];
      return [...old.slice(0, idx), ev.payload.task, ...old.slice(idx + 1)];
    }
  );
  // If currently viewing this task in detail, refresh its detail cache too.
  qc.setQueryData(queryKeys.tasks.detail(ev.payload.task.id), ev.payload.task);
}

function onRunCompleted(ev: WSEvent & { type: "run.completed" }, qc: QueryClient) {
  // No direct cache mutation needed: the parallel "result" message carries
  // run-end info and useActiveRuns derives liveness from messages. We use
  // this event only to invalidate the project's task list (task.status may
  // have changed). projectId is not in the event payload; we walk all
  // active project caches and invalidate any task list that contains a
  // task referencing the affected run — or, simpler: refetch the parent
  // project task list keyed by the path the user navigated through (via
  // useTaskMessages → derived).
  // Simplest implementation: invalidate all projects.tasks queries.
  qc.invalidateQueries({ queryKey: ["projects"], exact: false });
}

function onApprovalDecided(
  ev: WSEvent & { type: "approval.decided" },
  chatUI: ChatUIStore
) {
  // Idempotent: client may have already recorded the same decision optimistically.
  chatUI.recordDecision(ev.payload.approval_id, {
    decision: ev.payload.decision,
    note: ev.payload.note,
    at: Date.now(),
  });
}
```

Handler registration happens once at `WSProvider` mount.

### 4.11 `lib/ws/provider.tsx` modification

Add a `WSClientContext` so child components (`useSubscribe`, `useWSClient`) can reach the singleton without prop drilling. Add handler registration on the same effect that constructs the client.

### 4.12 `lib/chat/upsert-message.ts` + `sort-messages.ts`

```ts
// upsert-message.ts
export function upsertMessage(
  list: ReadonlyArray<ClientMessage>,
  incoming: ClientMessage,
): ClientMessage[] {
  // 1. Match by tempId via (author, text, time window).
  const tempIdx = list.findIndex(m => m.tempId && messagesMatch(m, incoming));
  if (tempIdx !== -1) {
    return [...list.slice(0, tempIdx), incoming, ...list.slice(tempIdx + 1)];
  }
  // 2. Match by server id (update existing).
  const idIdx = list.findIndex(m => m.id === incoming.id);
  if (idIdx !== -1) {
    return [...list.slice(0, idIdx), incoming, ...list.slice(idIdx + 1)];
  }
  // 3. New message: insert in sort order.
  return insertSorted(list, incoming);
}

function messagesMatch(opt: ClientMessage, srv: ClientMessage): boolean {
  if (opt.role !== srv.role) return false;
  if (opt.author_user_id !== srv.author_user_id) return false;
  if (opt.task_card_id !== srv.task_card_id) return false;
  if (opt.parsed.type !== "user" || srv.parsed.type !== "user") return false;
  if (opt.parsed.text !== srv.parsed.text) return false;
  const dt = Math.abs(Date.parse(opt.created_at) - Date.parse(srv.created_at));
  return dt < 5000;     // 5-second window
}
```

```ts
// sort-messages.ts
export function insertSorted(
  list: ReadonlyArray<ClientMessage>,
  m: ClientMessage,
): ClientMessage[] {
  // Primary key: created_at ascending.
  // Secondary: within the same task_run_id, seq ascending.
  // Tertiary: id (deterministic tiebreaker).
  const idx = list.findIndex(x => compareMessages(x, m) > 0);
  if (idx === -1) return [...list, m];
  return [...list.slice(0, idx), m, ...list.slice(idx)];
}

export function compareMessages(a: ClientMessage, b: ClientMessage): number {
  const ta = Date.parse(a.created_at);
  const tb = Date.parse(b.created_at);
  if (ta !== tb) return ta - tb;
  if (a.task_run_id && a.task_run_id === b.task_run_id) {
    const sa = a.seq ?? 0;
    const sb = b.seq ?? 0;
    if (sa !== sb) return sa - sb;
  }
  return a.id.localeCompare(b.id);
}
```

Unit-test 4 cases for upsert (tempId / id / new / sorted), 3 cases for sort (same time / same run different seq / mixed).

## 5. Subsystem 2 — Chat

### 5.1 `lib/chat/pair-tool-messages.ts`

```ts
export interface ToolPairing {
  useToResult: Map<string, ClientMessage>;
  consumed: Set<string>;
  orphanResults: Set<string>;
}

export function pairToolMessages(
  messages: ReadonlyArray<ClientMessage>,
): ToolPairing {
  const uses = new Map<string, ClientMessage>();
  for (const m of messages) {
    if (m.parsed.type === "tool_use") {
      uses.set(m.parsed.payload.tool_use_id, m);
    }
  }
  const useToResult = new Map<string, ClientMessage>();
  const consumed = new Set<string>();
  const orphanResults = new Set<string>();
  for (const m of messages) {
    if (m.parsed.type !== "tool_result") continue;
    const id = m.parsed.payload.tool_use_id;
    if (uses.has(id)) {
      useToResult.set(id, m);     // multiple results for same id: last wins (prototype default)
      consumed.add(m.id);
    } else {
      orphanResults.add(m.id);
    }
  }
  return { useToResult, consumed, orphanResults };
}
```

Tests (8 cases): empty / 1 pair / N pairs / out-of-order arrival / orphan result / running (use without result) / multiple results same id (last wins) / permission_request mixed in (not paired).

### 5.2 `lib/chat/mention-filter.ts`

```ts
export function filterCandidates(
  query: string,
  agents: ReadonlyArray<Agent>,
): Agent[] {
  const q = query.toLowerCase().trim();
  const active = agents.filter(a => !a.archived);
  if (!q) return active.slice(0, 10);
  return active.filter(a => a.handle.toLowerCase().startsWith(q)).slice(0, 10);
}
```

Tests (4 cases): prefix match / case insensitive / archived filtered / empty query returns first 10.

### 5.3 `lib/chat/serialize-editor.ts`

```ts
import type { Editor } from "@tiptap/core";

export function serializeEditor(editor: Editor): { text: string; mentions: string[] } {
  const mentions: string[] = [];
  let text = "";
  editor.state.doc.descendants((node) => {
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
  return { text: text.trimEnd(), mentions };
}
```

Tests (4 cases): single mention / multiple mentions / multi-paragraph / plain text no mention.

### 5.4 `lib/store/chat-ui.ts`

```ts
import { create } from "zustand";

interface TaskUIState {
  expandedToolBodies: Set<string>;
  expandedThinkings: Set<string>;
  scrollAnchor: "bottom" | "manual";
  activeTab: "artifacts" | "assets" | "approvals";
  decisions: Record<string, { decision: ApprovalDecision; note?: string; at: number }>;
}

interface ChatUIStore {
  byTask: Record<string, TaskUIState>;
  toggleToolBody: (taskId: string, msgId: string) => void;
  toggleThinking: (taskId: string, msgId: string) => void;
  setScrollAnchor: (taskId: string, anchor: "bottom" | "manual") => void;
  setActiveTab: (taskId: string, tab: TaskUIState["activeTab"]) => void;
  recordDecision: (approvalId: string, d: TaskUIState["decisions"][string]) => void;
  clearDecision: (approvalId: string) => void;
  clearTask: (taskId: string) => void;
}

const DEFAULT_TASK: TaskUIState = {
  expandedToolBodies: new Set(),
  expandedThinkings: new Set(),
  scrollAnchor: "bottom",
  activeTab: "artifacts",
  decisions: {},
};

export const useChatUIStore = create<ChatUIStore>((set) => ({
  byTask: {},
  // ... actions implementing immutable updates over byTask[taskId] ...
}));
```

The `decisions` map lives inside `byTask[taskId]` for cheap `clearTask()` cleanup. **Key strategy is deterministic**: write site is `recordDecision(key, d)` where `key` is `permissionRequest.payload.approval_id ?? permissionRequest.payload.tool_use_id`. Read site (`PermissionRequestCard`, `ApprovalHistoryRow`) computes the same key from the same message payload: prefer `approval_id`, fall back to `tool_use_id`. The fallback never changes mid-message (parse-message returns the same payload across re-renders), so both sides agree on the key. Approval_id is globally unique once present; tool_use_id is unique within a task (claude assigns it per stream). The map type stays `Record<string, ...>` — no nested partitioning by key kind needed.

Tests (5 actions): toggle expansions / setScrollAnchor / setActiveTab / recordDecision idempotency / clearTask wipes one task without affecting others.

### 5.5 `components/chat/MessageItem.tsx`

```tsx
import type { ClientMessage } from "@/lib/api/types";
import { UserMessage } from "./parts/UserMessage";
import { AssistantMessage } from "./parts/AssistantMessage";
import { ToolPair } from "./parts/ToolPair";
import { OrphanToolResult } from "./parts/OrphanToolResult";
import { PermissionRequestCard } from "./parts/PermissionRequestCard";
import { ResultBanner } from "./parts/ResultBanner";
import { SystemLine } from "./parts/SystemLine";
import { RateLimitBanner } from "./parts/RateLimitBanner";

interface MessageItemProps {
  msg: ClientMessage;
  pairing: { result?: ClientMessage; orphan?: boolean };
  taskId: string;
}

export function MessageItem({ msg, pairing, taskId }: MessageItemProps) {
  switch (msg.parsed.type) {
    case "user":               return <UserMessage msg={msg} />;
    case "assistant_text":     return <AssistantMessage msg={msg} />;
    case "thinking":           return <AssistantMessage msg={msg} taskId={taskId} />;
    case "tool_use":           return <ToolPair useMsg={msg} resultMsg={pairing.result} taskId={taskId} />;
    case "tool_result":
      return pairing.orphan ? <OrphanToolResult msg={msg} /> : null;
    case "permission_request": return <PermissionRequestCard msg={msg} taskId={taskId} />;
    case "result":             return <ResultBanner msg={msg} />;
    case "system":             return <SystemLine msg={msg} />;
    case "rate_limit_event":   return <RateLimitBanner msg={msg} />;
  }
}
```

TypeScript exhaustiveness on `ParsedMessage["type"]` will fail compilation if a new variant is added without an arm.

### 5.6 8 part files

Each file 50-120 lines, port from `ui_design/chat/parts/*.jsx`. Visual contract:

| Part | Container | Visual | Brand reuse |
|---|---|---|---|
| `UserMessage` | left-aligned, 36px Avatar + meta row + bubble | `bg-role-user`, rounded-2xl 16px, max-width 70%; `MentionedText` renders `@handle` as inline pill | `Avatar` |
| `AssistantMessage` | left-aligned, 36px Avatar + meta + run tag + content; renders both assistant_text and thinking based on `msg.parsed.type` | assistant_text: `bg-role-agent`, markdown via react-markdown (lazy-loaded); thinking: `bg-role-thinking` collapsed gray italic with chevron, expand on click; uses `useChatUIStore.expandedThinkings` for state | `Avatar`, `Tag` |
| `ToolPair` | no-avatar 48px left indent + body | `bg-role-tool` card, header `🔧 {tool_name} · {file_path}`, KV table body collapsed by default (chevron), nested result line at bottom: ok green + ✓ / err red + ✗ + truncated summary; "running…" placeholder if result undefined | self-styled card |
| `OrphanToolResult` | no-avatar indent | warning border + `bg-warning/10`, title "未配对的工具结果" + tool_use_id mono + first 200 chars of content | `Tag` (warning) |
| `PermissionRequestCard` | no-avatar indent | **pending state**: ink-0 + diagonal-stripe header + countdown (mm:ss, <5min red+blink) + tool name + decoded `tool_input` rendered as `<pre>` + optional note textarea + three buttons `[批准] [批准并修改] [拒绝]` (decision values `approved` / `approved_with_edits` / `denied` respectively); **decided state**: collapses to 1-line `"已批准 · note"` / `"已拒绝 · note"` + `StatusChip`, buttons removed; **timeout state**: collapses to 1-line `"已超时"` + `StatusChip` (status `timeout`), buttons removed. Transition is a CSS height transition (`max-height` + opacity) on the state container, not a layout shift; expanding from decided → pending is not supported. | `Button`, `StatusChip` |
| `ResultBanner` | full-width horizontal divider | `· 完成 · 12.4s`, centered ink-2 small text, 1.5px hairline top+bottom | — |
| `SystemLine` | extra-minimal gray line | `text-xs text-ink-3 text-center py-1` | — |
| `RateLimitBanner` | full-width warning bar | `border-danger bg-danger/10 text-danger`, "Rate limit hit, retrying in 30s" countdown | `Tag` (danger) |

Test coverage: each part has at least 1 render snapshot with a hand-built ClientMessage of the matching variant. `ToolPair` additionally tests collapsed/expanded body state. `PermissionRequestCard` additionally tests pending vs decided vs timeout visual modes. `AssistantMessage` additionally tests thinking expand/collapse.

### 5.7 `components/chat/MessageList.tsx`

```tsx
"use client";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useEffect } from "react";
import { MessageItem } from "./MessageItem";
import { useTaskMessages } from "@/hooks/useTaskMessages";
import { useToolPairing } from "@/hooks/useToolPairing";
import { useChatUIStore } from "@/lib/store/chat-ui";
import { EmptyState } from "@/components/common/EmptyState";

interface MessageListProps {
  taskId: string;
}

export function MessageList({ taskId }: MessageListProps) {
  const { data: messages = [], isPending } = useTaskMessages(taskId);
  const { useToResult, consumed, orphanResults } = useToolPairing(messages);
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollAnchor = useChatUIStore(s => s.byTask[taskId]?.scrollAnchor ?? "bottom");
  const setAnchor = useChatUIStore(s => s.setScrollAnchor);

  // Filter out consumed tool_results from the virtualizer's item list.
  const visibleMessages = messages.filter(m => !consumed.has(m.id));

  const virtualizer = useVirtualizer({
    count: visibleMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 8,
    getItemKey: (i) => visibleMessages[i].id,
  });

  // Auto-scroll to bottom when new messages arrive and anchor === "bottom".
  useEffect(() => {
    if (scrollAnchor === "bottom" && visibleMessages.length > 0) {
      virtualizer.scrollToIndex(visibleMessages.length - 1, { align: "end" });
    }
  }, [visibleMessages.length, scrollAnchor, virtualizer]);

  // Detect user scrolling away from bottom → switch to manual.
  function onScroll() {
    const el = parentRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setAnchor(taskId, atBottom ? "bottom" : "manual");
  }

  if (isPending) return <MessageListSkeleton />;
  if (visibleMessages.length === 0) {
    return <EmptyState title="还没有人发言" description="发一条带 @agent 的消息，把一个 agent 拽进来。" />;
  }

  return (
    <div ref={parentRef} onScroll={onScroll} className="h-full overflow-y-auto px-6 py-4"
         aria-live="polite" aria-label="任务消息流">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map(vi => {
          const msg = visibleMessages[vi.index];
          const pairing = msg.parsed.type === "tool_use"
            ? { result: useToResult.get(msg.parsed.payload.tool_use_id) }
            : { orphan: orphanResults.has(msg.id) };
          return (
            <div key={vi.key} ref={virtualizer.measureElement}
                 data-index={vi.index}
                 style={{ position: "absolute", top: vi.start, left: 0, width: "100%" }}>
              <MessageItem msg={msg} pairing={pairing} taskId={taskId} />
            </div>
          );
        })}
      </div>
      {scrollAnchor === "manual" && (
        <NewMessageFloatingButton onClick={() => {
          setAnchor(taskId, "bottom");
          virtualizer.scrollToIndex(visibleMessages.length - 1, { align: "end" });
        }} />
      )}
    </div>
  );
}
```

`aria-live="polite"` per FRONTEND.md §10 — new messages are announced to screen readers without interrupting current speech.

### 5.8 `components/chat/MentionExtension.ts`

Tiptap Node + Suggestion plugin. Custom-written (does not use `@tiptap/extension-mention`) because:

1. Default extension uses `selectable: false` (one-key Backspace delete); Q11(c) wants two-key.
2. Default uses tippy.js positioning; we want our own MentionList anchored to the editor's caret coordinates via `editor.view.coordsAtPos`.
3. Agent list source is a mutable ref (kept in sync with React Query cache).

Approximately 100 lines. Exports `createMentionExtension({ agentsRef, onStateChange })` where `agentsRef` is a `React.MutableRefObject<Agent[]>` and `onStateChange` is `(s: { open: boolean; items: Agent[]; anchorRect: DOMRect | null; onPick: (a: Agent) => void; selectedIndex: number }) => void`. Suggestion plugin config: `char: "@"`, `startOfLine: false`, `items: ({ query }) => filterCandidates(query, agentsRef.current)`, `render: () => ({ onStart, onUpdate, onKeyDown, onExit })` — `onStart/onUpdate` call `onStateChange` with current items + anchor rect (from `editor.view.coordsAtPos(range.from)`), `onExit` calls `onStateChange({ open: false, ... })`, `onKeyDown` delegates to `MentionList.onKeyDown(event)` via a forwarded ref (return `true` if consumed). Mention node attrs: `id` (agent uuid), `handle` (string); `selectable: true` to enable the two-key Backspace behavior (Q11c).

### 5.9 `components/chat/MentionList.tsx`

`forwardRef` exposing imperative `onKeyDown(event): boolean` so the Suggestion plugin's `render.onKeyDown` callback can delegate to it. Visual: 240px wide, paper-0 + ink-0 1.5px border + block shadow, each item Avatar(24px) + @handle + name. Q11(a)(b) keyboard contract: ArrowUp/Down navigate, Enter/Tab pick, Esc closes without text mutation. `role="listbox"` with `aria-selected` per option. ~100 lines.

### 5.10 `components/chat/Composer.tsx`

Main composer component, ~180 lines. Key points:

- Uses `useEditor` from `@tiptap/react` with extensions `[Document, Paragraph, Text, createMentionExtension(...)]`.
- `editorProps.handleKeyDown` intercepts Ctrl/Cmd+Enter for submission.
- `agentsRef` (mutable React ref) holds the latest filtered agent array; passed into Mention extension so the editor is created once but always sees current agents.
- `mentionState` (React state) holds popover open/items/anchorRect/onPick — updated by Suggestion plugin callbacks `onRender/onUpdate/onExit`.
- `MentionList` is rendered inside the Composer's JSX tree when `mentionState.open`, positioned via `position: fixed` against `anchorRect`.
- Send flow uses `useSendMessage(taskId).mutate({ text, mentions })`; on success: `editor.commands.clearContent()` + `editor.commands.focus("end")` (Q11(d)).
- Bottom toolbar: "Ctrl+Enter 发送" hint + `<Button>` send (disabled when editor empty or mutation pending).

### 5.11 `components/chat/MentionedText.tsx`

Renders a plain text string with `@handle` matches replaced by inline pill spans. Used by `UserMessage` (and any other plain-text rendering surface). Does not handle markdown — assistant content rendering with markdown is separate (react-markdown in `AssistantMessage`). Port prototype `MentionedText` from `parts/UserMessage.jsx`. ~30 lines.

### 5.12 Hooks

- `useTaskMessages(taskId)` — `useQuery({ queryKey: queryKeys.tasks.messages(taskId), queryFn: () => fetchMessages(taskId) })`.
- `useToolPairing(messages)` — `useMemo(() => pairToolMessages(messages), [messages])`.
- `useSendMessage(taskId)` — `useMutation` with optimistic insert + dedupe + rollback. `onMutate({ text, mentions })`: build optimistic `ClientMessage` with `tempId = nanoid()`, `id = tempId`, `role: "user"`, `author_user_id` from session, `created_at = new Date().toISOString()`, `parsed = { type: "user", text, mentions }`, `meta = {}`; call `queryClient.setQueryData(queryKeys.tasks.messages(taskId), (old = []) => upsertMessage(old, optimistic))`. `mutationFn`: `sendMessage(taskId, { text, mentions })`. `onSuccess({ message, runs }, _vars, ctx)`: enrich the server `message` via `enrichMessage` and call `upsertMessage` — `messagesMatch` collapses the `tempId` entry onto the server id (5-second window matches the immediate response). `onError(_err, _vars, ctx)`: roll back by filtering out the `tempId` entry; surface error via toast.
- `useWorkspaceAgents(wsId)` — `useQuery({ queryKey: queryKeys.workspaces.agents(wsId), queryFn: () => fetchWorkspaceAgents(wsId), staleTime: 0 })`.
- `useApprovalDecide(taskId)` — `useMutation` calling `decideApproval`; `onMutate` writes optimistic decision to chatUI store; on error rolls back.
- `useActiveRuns(taskId)` — derived from `useTaskMessages` via `useMemo`. Build `Map<task_run_id, { startedAt, agentId, ended }>` by scanning messages: an assistant message with `task_run_id = R` opens run `R` (records earliest `created_at` + `author_agent_id`); a `result` message with `task_run_id = R` (or a WS `run.completed` event for `R`, which has already invalidated the cache) marks `R` ended. Return `Array<{ runId, agentId, startedAt }>` for runs whose `ended` is false. ThinkingBar consumes this directly.
- `useApprovalsHistory(taskId)` — derived: filter messages for `permission_request` type, sort desc.
- `useTask(taskId)` — `useQuery({ queryKey: queryKeys.tasks.detail(taskId), queryFn: () => fetchTask(taskId) })`. If `/api/v1/tasks/{id}` GET is missing (API.md lists path but does not document a direct task GET), fall back to selecting from `useTasks(projectId)` cache by id.

## 6. Subsystem 3 — Task detail page

### 6.1 Route file

`app/(app)/w/[wsId]/p/[projectId]/t/[taskId]/page.tsx`:

```tsx
"use client";
import { use } from "react";
import { TaskListPane } from "@/components/task-detail/TaskListPane";
import { ChatPane } from "@/components/task-detail/ChatPane";
import { RightPanel } from "@/components/task-detail/RightPanel";
import { useTask } from "@/hooks/useTask";
import { useSubscribe } from "@/lib/ws/use-subscribe";

interface PageProps {
  params: Promise<{ wsId: string; projectId: string; taskId: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const { wsId, projectId, taskId } = use(params);
  useSubscribe("task", taskId);
  useSubscribe("project", projectId);
  const { data: task } = useTask(taskId);

  return (
    <div className="h-full grid grid-cols-[260px_1fr_320px] min-h-0 overflow-hidden">
      <TaskListPane projectId={projectId} wsId={wsId} activeTaskId={taskId} />
      <ChatPane wsId={wsId} taskId={taskId} task={task} />
      <RightPanel taskId={taskId} />
    </div>
  );
}
```

### 6.2 `components/nav/ThreeColumnShell.tsx` modification

Single line: change

```tsx
<main className="flex-1 overflow-y-auto">{children}</main>
```

to

```tsx
<main className="flex-1 min-h-0 overflow-hidden">{children}</main>
```

The task page then takes ownership of its own scroll containment (three independently scrolling panes). S1 pages must add a wrapping `h-full overflow-y-auto` to maintain their previous behavior:

- `app/(app)/w/[wsId]/page.tsx` — wrap content
- `app/(app)/w/[wsId]/p/[projectId]/page.tsx` — wrap content
- `app/(app)/onboarding/page.tsx` — wrap content

### 6.3 `components/nav/Breadcrumb.tsx` modification

Existing breadcrumb supports `wsId / projectId`. Add a third segment for `taskId` when present in the route. Task title comes from `useTask(taskId).data?.title`; falls back to `…` while pending.

### 6.4 TaskListPane (260px, left)

Renders `useTasks(projectId)`. Header: back-arrow to project board + project name + task count. List: `TaskRow` per task, active row highlighted (data-active attribute). Click navigates via Next router. No keyboard navigation (Q11f). No agent avatars (no schema field).

### 6.5 ChatPane (1fr, middle)

```tsx
<section className="flex flex-col min-h-0 bg-paper-1">
  <TaskHeader task={task} taskId={taskId} />
  <div className="flex-1 min-h-0 overflow-hidden relative">
    <MessageList taskId={taskId} />
  </div>
  <ThinkingBar taskId={taskId} />
  <div className="border-t-[1.5px] border-hairline bg-paper-0 p-4">
    <Composer wsId={wsId} taskId={taskId} />
  </div>
</section>
```

**TaskHeader**: top row StatusChip + `WK-{taskId.slice(-4)}` mono tag; main row task title (24px font-extrabold); sub row task summary (13px text-ink-2); right side "更多" IconButton (disabled, tooltip "S3 上线后启用"). No cancel-run button (S3).

**ThinkingBar**: `useActiveRuns(taskId)` derived. Renders only when one or more runs are active. Shows pulse dot + agent avatar(s) + "@handle 正在思考…". Disappears when all runs end.

### 6.6 RightPanel (320px, right)

Three tabs: 产出 / 素材 / 审批. Active tab state in `chatUiStore.byTask[taskId].activeTab` (default `"artifacts"`). Approvals tab count badge shows `useApprovalsHistory(taskId).length`.

- **ArtifactsTab / AssetsTab**: render `<EmptyState>` with copy "S3 上线后启用". 15-20 lines each.
- **ApprovalsTab**: filter messages from `useTaskMessages` for `permission_request` type, sort desc by created_at, render `ApprovalHistoryRow` per item. Empty state: "暂无审批历史".
- **ApprovalHistoryRow**: 36px row, tool icon + tool_name + relative time + `StatusChip` reflecting decision state (pending / approved / denied / timeout / approved_with_edits). State derivation: look up `chatUiStore.decisions[approval_id]` first; fall back to checking `expiresAt < now` → timeout; otherwise pending. StatusChip status enum may need a "timeout" or "pending" addition; verify against current `components/brand/status-chip.tsx` at spec implementation time.

### 6.7 Cleanup of S1 "S2 上线后启用" placeholders

Three occurrences (one delete + two retarget):

- `lib/messages.ts:31` — `taskDisabled: "S2 上线后启用"` → delete the entry; no longer used.
- `app/(app)/w/[wsId]/page.tsx:82` — "召唤 agent" button tooltip literal `"S2 上线后启用"` → change to `"S4 上线后启用"` (agent creation is S4 scope).
- `components/nav/ThreeColumnShell.tsx:43` — Topbar search box tooltip literal `"S2 上线后启用"` → change to `"S3 上线后启用"` (global search lands with S3 cross-task views).

`components/tasks/TaskCard.tsx` — remove Tooltip wrapper, wrap card in `<Link href={\`/w/${wsId}/p/${projectId}/t/${task.id}\`}>`, remove disabled styling. Card becomes the entry point to the new route.

## 7. Performance baseline

Per FRONTEND.md §11 targets:

| Scenario | Target | S2 verification |
|---|---|---|
| Task detail TTFR (first message visible) | <400ms | Manual measurement against `pnpm dev` + local backend with seed task; recorded in completion report |
| Long stream (500 messages) scroll FPS | ≥55 | Chrome DevTools Performance, mock 500 messages with mixed variants |
| WS event → DOM update | <50ms | Console timing in dev mode; React Query setQueryData is sync, react-virtual measure is sync |
| Initial JS bundle gzip | <300KB | `pnpm build` `next build` output; budget allows ~50KB increase from S1 |
| `pnpm dev` cold start | <2s | Baseline already tracked from S1 polish |

If any miss, log in "Known limitations" with remediation plan.

## 8. Testing strategy

**Unit (lib/chat, lib/ws, lib/store, lib/api)** — Vitest + jsdom:

| File | Test cases |
|---|---|
| `lib/chat/pair-tool-messages.test.ts` | 8 |
| `lib/chat/mention-filter.test.ts` | 4 |
| `lib/chat/serialize-editor.test.ts` | 4 |
| `lib/chat/upsert-message.test.ts` | 4 |
| `lib/chat/sort-messages.test.ts` | 3 |
| `lib/chat/enrich-message.test.ts` | 4 |
| `lib/ws/client.test.ts` | 4 (subscribe/unsubscribe dedupe, reconnect resubscription) |
| `lib/ws/handlers.test.ts` | 5 (one per event type with mock queryClient) |
| `lib/store/chat-ui.test.ts` | 5 |
| `lib/parse-message.test.ts` (extend) | +5 (permission_request optional fields, all arms) |

**Component (components/chat, components/task-detail)** — Vitest + @testing-library/react:

| Component | Tests |
|---|---|
| 8 parts | 1 render snapshot each + variant-specific (ToolPair collapse/expand, PermissionRequestCard pending/decided/timeout, AssistantMessage thinking expand) |
| `MessageList` | empty / pending / 1 message / virtualizer fallback in jsdom (mocked) |
| `MessageItem` | each of 9 variants dispatches to right component |
| `Composer` | type + Ctrl+Enter mutates; `@` opens popover with candidates; ArrowDown+Enter inserts chip; Esc closes popover; sending disabled state |
| `MentionList` | 5 keyboard cases via forwardRef |
| `MentionedText` | plain text / single mention / multiple mentions |
| `TaskListPane` | renders rows + active state |
| `ApprovalsTab` | empty / N entries / status derivation |

**Integration / e2e** — out of scope for S2 unit. Manual checklist covers:

1. Login → workspace home → click project → click task card → arrive at /t/[taskId]
2. Composer: type "@" → popover opens; ArrowDown navigates; Enter inserts chip; Backspace x2 deletes chip; Ctrl+Enter sends
3. Optimistic insert appears immediately; HTTP 201 replaces tempId; WS message.appended dedupes
4. Mock backend pushes agent assistant_text → renders in chat
5. Mock backend pushes tool_use + tool_result → renders as paired ToolPair card
6. Mock backend pushes permission_request → PermissionRequestCard renders interactive; click 批准 → optimistic UI updates; HTTP success acknowledged
7. Run completes → "正在思考…" bar disappears; ResultBanner appears
8. Switch right tab to "审批" → history list shows decided approval
9. Visual diff vs `screenshots/13-task-detail-empty-chat.png` for empty-chat state

Vitest target: 70 (existing) + ~85 (new, sum of enumerated cases above) ≈ 155 tests. Floor for acceptance: ≥50 new. `lib/chat/*` coverage ≥90%.

## 9. Backend gaps newly logged

S2 surfaces the following new entries in `docs/BACKEND_GAPS.md`. S2 itself is **not blocked** by any of them — each has an in-scope workaround.

- **#8** `GET /api/v1/tasks/{taskId}/messages?before=<created_at>&limit=N` — cursor-based pagination for messages. S2 workaround: full-list fetch (Q6).
- **#9** `GET /api/v1/tasks/{taskId}/artifacts` — list artifacts of a task. S2 workaround: ArtifactsTab placeholder.
- **#10** `GET /api/v1/projects/{projectId}/assets` — list assets of a project. S2 workaround: AssetsTab placeholder.
- **#11** `GET /api/v1/tasks/{taskId}/approvals` — list approval requests by task. S2 workaround: derive from messages filter (no endpoint needed for S2; logged for S3 cross-task views).
- **#12** `parsed.permission_request.payload` schema completeness — current API.md does not specify whether the inline permission_request message carries `approval_id`, `tool_input`, and `expires_at`. S2 implementation reads them if present and falls back to `tool_use_id`-keyed lookup if absent. Spec requests backend confirm schema and update API.md.

Optional: also note that `TaskCard` schema lacks an `agents` field (used in prototype `TaskRow`); S2 omits agent avatars from `TaskRow` rather than logging a gap, since it may be a product question rather than a backend one.

## 10. Out of scope (explicit)

Intentionally deferred:

- `/approvals` cross-workspace hub view — S3.
- Bell notification badge in Topbar — S3.
- cancel-run button + 5s debounce confirmation dialog — S3.
- Asset upload UI + artifact / asset list endpoints — S3 (BACKEND_GAPS #9, #10).
- Workspace switcher UI + project creation UI — S4.
- agent CRUD / runtimes / settings pages — S4.
- Real LLM execution integration — backend mock sufficient for S2 acceptance.
- TaskCard agent avatars in TaskRow — schema undefined.
- Mobile responsive (<768px) — v1 desktop-only per FRONTEND.md §16.
- Global keyboard shortcuts (Cmd+K command palette, etc.) — out of S2 scope.
- Task list keyboard navigation (ArrowUp/Down) — deferred polish.
- Markdown rendering performance optimization (react-markdown + remark-gfm + rehype-highlight bundle lazy-loading) — apply if bundle exceeds budget, otherwise eager-load.
- Cursor-based message pagination + reverse-prepend scroll anchor — BACKEND_GAPS #8, post-S2.
- Dark theme — S6.

## 11. Acceptance criteria

S2 is accepted when every box is checked:

**Subsystem 1 — Infrastructure**
- [ ] Packages installed: `@tiptap/core`, `@tiptap/pm`, `@tiptap/react`, `@tiptap/suggestion`, `@tiptap/extension-document`, `@tiptap/extension-paragraph`, `@tiptap/extension-text`, `@tanstack/react-virtual`, `nanoid`
- [ ] `lib/api/types.ts` adds Agent, Message, ClientMessage, ApprovalDecision, ApprovalStatus, ApprovalRequest, EnqueuedRun
- [ ] `lib/parse-message.ts` permission_request widened (approval_id?, tool_input?, expires_at?)
- [ ] `lib/api/messages.ts` real fetchMessages + sendMessage
- [ ] `lib/api/agents.ts` fetchWorkspaceAgents
- [ ] `lib/api/approvals.ts` decideApproval
- [ ] `lib/ws/client.ts` adds subscribe/unsubscribe/activeSubs/reconnect-resubscription; existing API preserved
- [ ] `lib/ws/use-subscribe.ts` hook with ref-counting
- [ ] `lib/ws/handlers.ts` registers 5 event handlers; mock-queryClient unit tests pass
- [ ] `lib/ws/provider.tsx` exposes WSClient via context and registers handlers on mount

**Subsystem 2 — Chat**
- [ ] `lib/chat/{pair-tool-messages,mention-filter,serialize-editor,upsert-message,sort-messages,enrich-message}.ts` all implemented with unit tests passing
- [ ] `lib/store/chat-ui.ts` zustand store with 5 actions, isolated from S1's `lib/store.ts`
- [ ] `components/chat/MessageItem.tsx` exhaustive switch passes type check
- [ ] 8 part components rendered correctly with handcrafted ClientMessage instances
- [ ] `components/chat/MessageList.tsx` virtualizes; `aria-live="polite"`; "↓ new messages" floating button when scroll anchor manual
- [ ] `components/chat/MentionExtension.ts` Tiptap node + Suggestion plugin operational
- [ ] `components/chat/Composer.tsx` end-to-end: type → @-popover → pick → Ctrl+Enter → mutation
- [ ] `components/chat/MentionList.tsx` keyboard contract per Q11
- [ ] `components/chat/MentionedText.tsx` shared @-pill renderer
- [ ] 8 hooks created and unit-tested

**Subsystem 3 — Task detail page**
- [ ] Route `/w/[wsId]/p/[projectId]/t/[taskId]/page.tsx` loads with three-pane grid
- [ ] `components/task-detail/{TaskListPane,TaskRow,ChatPane,TaskHeader,ThinkingBar,RightPanel,RightTabs,ArtifactsTab,AssetsTab,ApprovalsTab,ApprovalHistoryRow}.tsx` implemented
- [ ] `components/nav/ThreeColumnShell.tsx` main overflow change applied; 3 S1 pages add wrap overflow
- [ ] `components/nav/Breadcrumb.tsx` taskId segment rendering
- [ ] `lib/messages.ts` `taskDisabled` deleted; two tooltip copies updated to "S3/S4 上线后启用"
- [ ] `components/tasks/TaskCard.tsx` Tooltip removed; wrapped in `<Link>` to new route

**Visual acceptance**
- [ ] Side-by-side comparison with `screenshots/13-task-detail-empty-chat.png` for empty chat state (left task list, middle empty chat with EmptyState + Composer, right tabs panel) — visually indistinguishable
- [ ] Visual acceptance report saved to `docs/superpowers/reports/s2-chat-visual-acceptance.md` with 6 sections (task list / chat header / empty chat / Composer / right tabs / breadcrumb)

**Hygiene**
- [ ] No regressions: existing 70 Vitest tests still pass
- [ ] New tests: ≥50 additional Vitest tests (target ~85 per §8 table: lib 41 + parse-message +5 + components 43 minus optional cases)
- [ ] `lib/chat/*` coverage ≥90%
- [ ] `pnpm typecheck && pnpm lint && pnpm test` all green
- [ ] BACKEND_GAPS.md updated with #8-#12
- [ ] Manual checklist: 9 items per §8 walked end-to-end with mock backend
- [ ] Bundle initial JS gzip increment ≤60KB vs S1 baseline
- [ ] Task detail TTFR ≤400ms (or "Known limitation" with remediation plan)

## 12. Effort estimate

Single-person workload, executed bottom-up per §3:

- **Subsystem 1** (lib/api + lib/ws extension + handlers + types): ~1.5 days
- **Subsystem 2** (chat parts × 8 + MessageList + virtualizer + Composer + Mention extension + hooks): ~4–6 days
- **Subsystem 3** (task page + 7 task-detail components + ThreeColumnShell tweak + cleanup): ~1.5 days
- **Test + visual acceptance + manual QA**: ~1–2 days

**Total: 8–11 days.** Carries one S2-chat PR series or one merge commit equivalent to S1 polish's 43-commit shape.

---

**Next:** This spec gets reviewed by zhangtema@gmail.com. After approval, implementation plan is written by `superpowers:writing-plans` skill into `docs/superpowers/plans/2026-05-16-s2-chat.md`. Execution by subagent-driven development per `~/.claude/rules/development-workflow.md`. Branch: `s2-chat` off `main`.

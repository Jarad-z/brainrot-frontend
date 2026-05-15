# S0 · Prototype Polish — Design Spec

> **Status**: Brainstormed, awaiting user review before plan writing.
> **Date**: 2026-05-15
> **Scope**: One sub-project of a larger frontend roadmap. After S0 ships, work continues as S1 (M1+M2 Next.js skeleton) → S2 (M3 chat) → S3 (M4 approvals) → S4 (M5 assets/agents) → S5 (M6 polish), each in its own spec.
> **Owner**: single developer.

---

## 0. Why this exists

The `ui_design/` directory currently holds an HTML/JSX prototype exported from claude.ai/design with the "月光奶冻" (Moonlit Cream) palette. The prototype has working interactivity for the workspace home, project board, task detail with chat, and a Tweaks panel, but:

- Multiple core interactions are demoed but not finished to product quality (mention keyboard path, approval countdown, queued state, tool_use↔tool_result pairing).
- Layout/typography glitches recur across iterations (hero wrap, stat grid aspect, sidebar truncation, project-card title break).
- Six page types from `docs/FRONTEND.md` are missing entirely (login/register, agents list+new, runtimes+install-token, workspace settings, project assets/artifacts, cross-workspace `/approvals`).
- Design tokens are scattered in a 41KB `tokens-cream.css`; there is no `DESIGN.md`; status/role color semantics are not collated.
- Two large files (`screens.jsx` 28KB, `chat.jsx` 13KB) carry many concerns and slow iteration — every prior layout fix has been a needle-in-haystack edit.

S0's job is to take the prototype from "looks roughly right" to a tight, internally-consistent prototype with a written design system, so S1 can migrate to Next.js / Tailwind v4 / shadcn without first untangling visual debt.

S0 does NOT introduce a build tool, real API, real WebSocket, dark theme, mobile breakpoint, virtualization, i18n, or unit-test framework — those belong to S1+.

---

## 1. Scope (the four pillars, agreed with user)

1. **Design system collation** — produce `DESIGN.md`, split `tokens-cream.css` into `tokens/*.css`, define role/status semantics, prepare Tailwind v4 mapping.
2. **Layout/typography fixes** — six recurring glitches enumerated below, written into `DESIGN.md` §5 so they don't re-occur.
3. **Four core interactions to product completeness** — `@mention` full keyboard path, `tool_use`↔`tool_result` pairing+loading, approval countdown+timeout, queued + cancel-run.
4. **Six missing pages** — login/register, agents list, agent new, runtimes+install-token, workspace settings, project assets/artifacts, cross-workspace `/approvals` hub. Fidelity: clickable, forms fillable, no submission to backend.

**Execution order (Plan A: bottom-up)**: `DESIGN.md` & token split → big-file split → layout/typography fixes → four core interactions → six missing pages.

**Not in S0** (explicit non-goals):

- Dark theme (M6)
- Mobile responsive < 768px (just show "桌面使用建议", per FRONTEND.md §16)
- Virtualized list (M3)
- i18n (v1 Chinese only)
- Real REST/WS integration (S1+)
- Vitest/RTL (replaced by `tests/lib.html` in S0)
- Tiptap, Zod, React Hook Form, next-intl (S1+ stack)
- Thinking streaming typewriter (cut by user)
- `mcp_config` rich JSON editor (textarea + basic validation only)
- cancel-run agent selector (M4)
- Server-time skew correction for countdown (M6)

---

## 2. Architecture & directory layout

Stack stays: Babel standalone + CDN React 18, `<script type="text/babel">` per file, no bundler. Module communication via globals on `window.__BRAINROT__` namespace (existing convention extended).

```
ui_design/
├── index v2.html                  # entry; adds 30+ new <script> tags
├── tokens-cream.css               # now a thin file: @imports from tokens/
├── DESIGN.md                      # SINGLE SOURCE OF TRUTH for design system
│
├── tokens/                        # split design tokens (8 files)
│   ├── palette.css                # paper / ink / accent / hairline
│   ├── typography.css             # font stacks, axes, sizes
│   ├── spacing.css                # 4/8/12/16/24/32/48
│   ├── radii.css                  # 6/12/16/20
│   ├── shadow.css                 # block-shadow tiers 1-3 + soft
│   ├── roles.css                  # user/agent/tool/thinking/approval bg+border
│   ├── status.css                 # open/in_progress/done/blocked/queued/timeout/error
│   └── tweaks.css                 # accent variants + density + blockDepth
│
├── data.jsx                       # mock data (unchanged, schema comments added)
├── primitives.jsx                 # atomic components (unchanged)
│
├── chat/                          # was chat.jsx (13KB) — now split
│   ├── _index.jsx                 # re-export bundle
│   ├── MessageList.jsx            # owns the use↔result pairing reducer
│   ├── MessageItem.jsx            # dispatch by parsed.type
│   ├── Composer.jsx               # contentEditable + @mention chip handling
│   ├── MentionList.jsx            # keyboard-driven dropdown
│   ├── ApprovalCard.jsx           # shared by chat parts + ApprovalsHub
│   └── parts/
│       ├── UserMessage.jsx        # owns queued badge
│       ├── AssistantText.jsx
│       ├── Thinking.jsx
│       ├── ToolUse.jsx
│       ├── ToolResult.jsx
│       ├── PermissionRequest.jsx  # uses ApprovalCard mode="inline"
│       ├── ResultBanner.jsx
│       └── SystemLine.jsx
│
├── screens/                       # was screens.jsx (28KB) — now split
│   ├── _index.jsx
│   ├── WorkspaceHome.jsx
│   ├── ProjectBoard.jsx
│   ├── TaskDetail.jsx
│   ├── ApprovalsHub.jsx           # NEW — uses ApprovalCard mode="hub"
│   ├── AgentsList.jsx             # NEW
│   ├── AgentNew.jsx               # NEW
│   ├── RuntimesList.jsx           # NEW
│   ├── WorkspaceSettings.jsx      # NEW
│   ├── ProjectAssets.jsx          # NEW
│   ├── ProjectArtifacts.jsx       # NEW
│   ├── Login.jsx                  # NEW
│   └── Register.jsx               # NEW
│
├── lib/                           # pure JS (no JSX) — easy S1 portability
│   ├── codec.js                   # base64 → JSON, throws CodecError
│   ├── mention-parse.js           # @handle parsing, dedupe, mention ids
│   ├── format.js                  # relative time, byte size
│   ├── countdown.js               # useCountdown(expiresAt) hook
│   └── keyboard.js                # keyboard helpers (key matching, focus mgmt)
│
├── tests/
│   └── lib.html                   # browser-runnable pure-fn tests
│
├── tweaks-panel.jsx               # unchanged
└── app-cream.jsx                  # route dispatcher (state-driven, no router)
```

### 2.1 Routing (no router introduced)

`app-cream.jsx` holds `route = { name, params }` state. Possible `route.name` values:

```
home | project | task | approvals | agents | agents-new |
runtimes | settings | project-assets | project-artifacts |
login | register
```

URL is NOT synced. Browser back button does not work. S1 (Next App Router) supersedes this entirely. Sidebar / breadcrumb / buttons call `setRoute({...})`.

### 2.2 Why this split

- Every prior layout iteration ("布局不一样啊", "stat 是长方形", "待审批改成这种") required hunting through a 28KB single file. Splitting by page is the minimum prerequisite for iteration speed.
- Component file names match `docs/FRONTEND.md` §2 (Next.js target paths) so S1 migration is mostly `.jsx → .tsx` + add types + add `'use client'`.
- `lib/*.js` is pure JS — S1 ports them verbatim, only adding TS types.
- Token CSS variable names will be referenced directly from Tailwind v4 `@theme` in S1.

---

## 3. Design system (DESIGN.md content)

`DESIGN.md` has 10 sections:

1. **Principles** — restraint, form over color, paper feel, "nav icons stay monochrome — no colored chips" (locks the prior "上色 → 太丑 → 回退" loop).
2. **Palette** — paper-0/1/2, ink-0/1/2/3, hairline, accent (poppy default + moss/honey/plum), accent-fg.
3. **Typography** — Bricolage Grotesque + JetBrains Mono. Variable axes `wdth` 88/96/100. Size scale xs/sm/base/lg/xl/2xl/hero with explicit line-heights. Weight scale 400→800. Hard rule: chat msg 16px, UI control 14px, meta 12px.
4. **Spacing / Radii / Shadow** — base 4px, sp-1..12. Radii r-sm/md/lg/xl = 6/12/16/20. Shadow is solid-offset block-style (`Npx Npx 0 var(--ink-0)`), three tiers; soft shadow only for floats (dropdown/toast).
5. **Component visual specs** — buttons (primary inked, ghost hairline-edged, destructive), inputs, cards, badges, chat bubbles, status badges, empty state, error banner. **§5 also locks the six layout fixes** (see §6 below).
6. **Status semantics master table** — single table covering `TaskCard.status` × `RunState` × `ApprovalStatus`. Each row: visual (dot/stripe/pulse/dashed), foreground, background, allowed transitions.
7. **Tweaks panel** — controllable runtime variables and their `localStorage` keys: `brainrot.tweaks.accent`, `brainrot.tweaks.density`, `brainrot.tweaks.blockDepth`, `brainrot.tweaks.theme`.
8. **Dark theme placeholder** — table of every light token with an empty `dark` column. Structure exists; values filled in M6.
9. **Tailwind v4 mapping** — token-by-token table mapping `--paper-0` etc. to `@theme { --color-paper-0 }` for S1 migration.
10. **Acceptance checklist** — the full S0 verification list (see §9 below).

### 3.1 Status semantics master table (preview)

| Domain | Value | Visual | FG | BG | Notes |
|---|---|---|---|---|---|
| Task | `open` | hollow square stroke | ink-2 | — | |
| Task | `in_progress` | filled square + pulse | paper-0 | ink-0 | pulse 1s |
| Task | `done` | filled gray dot | paper-0 | #b8b0a0 | |
| Task | `blocked` | diagonal stripe pattern | ink-0 | striped | |
| Task | `archived` | text only, faded | ink-3 | — | |
| Run | `running` | accent pulse dot | accent-fg | accent | |
| Run | `queued` | dashed circle | ink-2 | transparent | from `metadata.queued` |
| Run | `canceled` | strikethrough | ink-3 | — | |
| Run | `failed` | × icon | #c25036 | — | |
| Approval | `pending` | clock + countdown | ink-0 | role-approval-bg | |
| Approval | `approved` | ✓ + relative time | — | — | collapsed to 1 line |
| Approval | `denied` | ✗ + relative time | — | — | collapsed |
| Approval | `timeout` | clock crossed | ink-3 | — | buttons disabled, opacity 60% |
| Approval | `<10min countdown` | red bleed text | accent-poppy | — | blinks 1s |

---

## 4. Four core interactions (production-grade)

### 4.1 @mention (Composer + MentionList)

**Trigger**: typing `@` in Composer; popover positioned absolutely below caret; flips above if overflow.

**Filter**: prefix after `@`, case-insensitive, against `agent.handle`. Empty prefix shows all non-archived agents in workspace, sorted by recency.

**Keyboard**:

| Key | Behavior |
|---|---|
| `↑` / `↓` | Highlight up/down, loop |
| `Enter` | Select highlighted, insert mention chip + trailing space |
| `Tab` | Same as Enter |
| `Esc` | Close popover, keep `@` |
| `Backspace` past `@` | Close popover |
| Click item | Select + close, refocus Composer |
| Click outside | Close popover |
| `Ctrl+Enter` | Send message; while popover open, picks current item instead |

**Mention chip**: `<span data-mention-id="...">@writer</span>` with paper-2 bg + 1px hairline + radius 4px. Backspace deletes the **entire chip** as one character.

**Edge cases**:
- No matches: popover shows "未找到 agent，请检查 handle"; Enter is a no-op.
- Archived agents hidden from candidates.
- Multiple mentions: each chip carries its own id; dedup on send.
- `@` self (user): not supported, filtered out.

**Submit shape**: `{ text: "raw text including @<handle> literals", mentions: [agent_uuid, ...] }`. **`mentions[]` is agent IDs, not handles** (API.md §messages).

**Files**: `chat/Composer.jsx`, `chat/MentionList.jsx`, `lib/mention-parse.js`.

### 4.2 tool_use ↔ tool_result pairing

**Pairing rule**: `tool_use.payload.tool_use_id` matches `tool_result.payload.tool_use_id`; result is rendered nested under its use (16px indent + connector line).

**Three states**:

| State | Trigger | Visual |
|---|---|---|
| `running` | use exists, no result | skeleton + "正在运行…" gray |
| `success` | result + `is_error=false` | green-tinted border, ✓ + duration; output >10 lines folded to 3 + "展开" |
| `error` | result + `is_error=true` | red-tinted border, ✗ + first 200 chars + "查看完整错误" |

**Input summary**: use card title shows `tool_name`; one-line collapsed input JSON below (e.g. `Write file_path: D:/draft.md`); full input expandable.

**Edge cases**:
- Orphan result (no matching use): rendered standalone with yellow border, title "未配对的工具结果", shows `tool_use_id` in meta.
- Duplicate `use_id`: keep latest result; old marked `[stale]`.
- Result >100 lines: forced fold + "完整查看" opens drawer.
- base64 decode failure: render `SystemLine` with "消息解码失败" warning.

**Files**: `chat/MessageList.jsx` (pairing reducer), `chat/parts/ToolUse.jsx`, `chat/parts/ToolResult.jsx`, `lib/codec.js`.

### 4.3 Approval countdown & timeout

**Source of truth**: `ApprovalRequest.expires_at` (RFC3339). Countdown is `Date.now()` minus parsed `expires_at`, recomputed each second. **Do not local-accumulate.**

**Visual progression**:

| Remaining | Display | Card state |
|---|---|---|
| `> 10min` | `还剩 58:21` ink color | normal, approve/deny enabled |
| `≤ 10min` and `> 0` | `还剩 09:42` **red bleed**, 1s blink | normal |
| `= 0` (expired) | `已超时` gray | status → `timeout`, buttons disabled, card opacity 60% |
| Decided | `<结果> · <相对时间>` | buttons replaced by status badge; card collapses to 1 line |

**Consistency**: chat inline `permission_request` and `/approvals` hub use the **same `<ApprovalCard mode="inline"|"hub" />`** component.

**Optimistic update**: clicking approve/deny → switch UI to decided state immediately → POST in background → on failure: roll back + toast.

**Edge cases**:
- Countdown 0 but server still pending: clicking approve returns 4xx → toast "审批已超时", refresh card.
- `note` field: deny/approved_with_edits open a small textarea (≤256 chars, optional); empty note → don't send `note` field.
- Server time skew: NOT corrected in S0 (deferred to M6); follows FRONTEND.md §9.4.

**Files**: `lib/countdown.js`, `chat/ApprovalCard.jsx`, `chat/parts/PermissionRequest.jsx`, `screens/ApprovalsHub.jsx`.

### 4.4 queued + cancel-run

**queued badge**:
- Trigger: send response includes `message.metadata` base64-decoded to `{ queued: true }`.
- Visual: dashed circle badge on user-message bubble corner + "排队中" gray text; tooltip "等待 @<handle> 完成当前 run 后自动触发".
- Disappears: WS `run.completed` for the corresponding agent → badge → pulse dot + "运行中".
- **Truth criterion**: ONLY `message.metadata.queued`. Never use `runs.length` (FRONTEND.md §9.6).

**cancel-run button**:
- Location: task detail header, right side.
- Shown only when: the most recent user message in this task card has at least one entry in `runs[]` whose corresponding `run.completed` WS event has not yet been received. (S0 mock equivalent: `data.jsx` tracks `activeRunByTask[taskId]` set; cancel button shown when set is non-empty.)
- Click flow:
  1. Confirm dialog: "这只取消当前 run，排队中的 @<agent> 还会跑。继续吗？"
  2. Confirm → `POST /tasks/{id}/cancel-run` (mocked) → current run card → `canceled` badge.
  3. Queued messages for same agent retain dashed circle, naturally promote in next round.
- **Multi-agent concurrency**: cancel targets the active run owned by the most recent user message. No agent picker in S0 (deferred to M4).

**Edge cases**:
- Repeat click: button disables for 5s after click; backend assumed idempotent.
- Cancel after natural completion: 4xx/409 → toast "运行已结束".
- Multiple queued for same agent: each badge independent; do not aggregate "3 queued" (avoids ambiguity).

**Files**: `chat/parts/UserMessage.jsx` (badge), `screens/TaskDetail.jsx` (cancel button), `data.jsx` (mock `simulateRun(agentId)` + queued path).

---

## 5. Layout & typography fixes (the six recurring issues)

These are written into `DESIGN.md` §5 as immutable component specs so the loop stops:

| # | Issue | Fix |
|---|---|---|
| 1 | hero "新建项目" button wraps on narrow viewport | `WorkspaceHome` header uses `grid` two-column, button col `min-width: 160px`; <1100px button degrades to icon + "新建" |
| 2 | stat 2×2 grid not aligned with right approval rail | Whole page: `grid-template-columns: 1fr 360px`, `grid-template-rows: auto 1fr`. Top-left = hero, top-right = stat 2×2, bottom-left = project cards, bottom-right = approval rail. Project & approval headings on same grid-row baseline. |
| 3 | stat cards render as horizontal rectangles | `aspect-ratio: 1 / 0.78` (not 1/1 because internal label-top + number-bottom needs vertical room); hero height follows stat total height |
| 4 | sidebar "runtime 在线" truncated | flex children get `min-width: 0`; text `text-overflow: ellipsis`; `title=` attr for full text on hover |
| 5 | project card title breaks character-by-character | `word-break: keep-all` + `overflow-wrap: break-word`; max 2 lines + ellipsis |
| 6 | sidebar icons "color → ugly → revert" loop | Hard rule in `DESIGN.md` §1: nav icons monochrome only; color reserved for status badges and accent CTAs |

---

## 6. Six missing pages

Fidelity per user decision: **clickable, forms fillable, no backend submission**.

### 6.1 Login / Register (`screens/Login.jsx` + `Register.jsx`)

Centered card 420px wide, paper bg, logo top, footer "Brainrot · 协作 AI 工作台".
- Login: email + password + submit + link to register.
- Register: name + email + password + submit.
- Local validation: email format + password ≥ 8.
- Submit: loading 1s → route to home (mock). Manually setting email to "wrong@" before submit shows error banner "邮箱或密码错误" for demo.

### 6.2 AgentsList (`screens/AgentsList.jsx`)

Table layout: handle / name / model / runtime / status. Each row trailing `[···]` menu: edit / archive / copy handle. Status badge: online (pulse) / offline (dashed) / archived. Empty state: "还没有 agent，点右上角新建你的第一个 @handle". Archive toggle: "显示已归档" filter.

### 6.3 AgentNew (`screens/AgentNew.jsx`)

Form matching `POST /workspaces/{wsId}/agents` (API.md):

| Field | Control |
|---|---|
| `runtime_id` | select (from mock runtime list) |
| `handle` | text + inline rule "workspace-unique, alphanumeric+underscore" |
| `name` | text |
| `avatar_url` | text + right-side preview block (fallback: handle initial) |
| `description` | textarea |
| `instructions` | textarea + char counter ≤4000 |
| `model` | select [claude-opus-4-7 / claude-sonnet-4-6 / claude-haiku-4-5] |
| `custom_env` | key-value table (add/remove row) |
| `custom_args` | tag input (Enter to add) |
| `mcp_config` | textarea mono + basic JSON parse validation |

Submit: toast "Mock：将创建 agent <handle>（原型不提交）" → back to list, new row highlighted 2s. Validation failure: inline red text under field, form continues to accept input.

### 6.4 RuntimesList + install-token (`screens/RuntimesList.jsx`)

Table: name / host / os arch / capacity / status (online/offline/revoked) / last heartbeat (relative). Empty state: "还没有 daemon，先签发一个 install token".

**Install-token modal**:
1. Click `[签发 install token]` CTA → modal opens.
2. Display one-time plaintext token `bri_xxx...` in mono large + copy button + warning "此 token 只展示一次，关闭后无法找回".
3. Countdown using `lib/countdown.js` driven by `expires_at` (1h).
4. Bottom: full command snippet `daemon --register --token=bri_...` with whole-line copy.
5. On close → list adds "pending" row (dashed border) until daemon comes online.

### 6.5 WorkspaceSettings (`screens/WorkspaceSettings.jsx`)

Secondary tabs: Members / Agents (links to AgentsList) / Runtimes (links to RuntimesList) / Danger zone.
- **Members**: table — avatar + name + email + role dropdown + `[···]` remove. Mock data: extend `data.jsx` with `members[]` (3-4 entries, mixed owner/member). Empty: "邀请第一个成员".
- **Danger zone**: archive workspace / delete workspace, each its own destructive button + secondary confirm dialog (requires typing workspace slug to enable confirm button).

### 6.6 ProjectAssets + ProjectArtifacts

Add tab bar to ProjectBoard header: `任务 / 素材 / 产物`.

- **Assets**: drag/drop + select uploader; **local 100MB pre-check** (display error banner over limit); grid: thumbnail (image: real preview / other: ext icon) + filename + size + uploader + time; `[···]` per file: copy blob_key / delete. Empty: "拖拽文件到此处，或点击上传".
- **Artifacts**: read-only grid (no upload), filters by task / source / `excluded=false`, sort newest first. Empty: "agent 还没产出任何文件". Click → preview drawer (image: direct render / text: first 100 lines / binary: metadata only).

### 6.7 /approvals (`screens/ApprovalsHub.jsx`)

```
● 待审批 · N 件 + [工作区过滤: 全部 / 当前 ws]
[筛选: tool_name + agent_handle]
─── rows (sorted by expires_at ascending) ───
tool_name + countdown(<10min red) + source(ws/proj/task) + cmd mono + [拒绝] [批准]
···
empty: "全部处理完了 ✓"
```

Reuses `<ApprovalCard mode="hub" />`. Workspace filter is a control in S0 even though prototype has only one ws.

---

## 7. Error handling & empty states (cross-cutting)

**Single `<ErrorBanner kind variant />`** component, three kinds (`inline` / `toast` 4s autoclose / `card`), three variants (info/warn/error). S0 wires it to mock errors; S1 wires it to `ApiError { status, message }`.

**Single `<EmptyState icon title description action />`** for all 8 empty cases: no projects, no tasks, no messages, no approvals, no agents, no runtimes, no assets, no artifacts.

**Offline/WS-disconnected banner**: top-of-page bar "实时连接已断开，正在重连…". S0 driver: Tweaks panel + topbar small-light click toggle (already exists). S1 driver: WSProvider.

**Mock error list** (intentionally triggerable in prototype):

| Trigger | Display |
|---|---|
| `@` non-existent handle | mention list "未找到 agent" |
| Upload >100MB | inline banner "文件过大，最大 100MB" |
| Click cancel-run twice within 5s | toast "请勿重复点击" |
| Approve after countdown 0 | toast "审批已超时" |
| Delete workspace with wrong slug | inline banner "工作区 slug 不匹配" |
| Toggle topbar to "offline" | top banner "实时连接已断开" |

---

## 8. Testing strategy

S0 does NOT introduce Vitest (CDN React can't run a module test runner without bundling). Two thin layers instead:

### 8.1 Browser-runnable tests for `lib/*.js`

File: `tests/lib.html`. A `<div id="results">` plus inline `<script>` that runs assertions and prints `[pass] codec.decodeJSON valid input` / `[fail] mention-parse duplicate ids` per line.

Coverage:
- **codec.js**: valid b64→JSON; malformed b64 throws CodecError; nested JSON parsed.
- **mention-parse.js**: single `@`, multiple `@`, missing handle, broken `@` mid-text, duplicates deduped.
- **countdown.js**: >10min → not urgent; <10min → urgent; expired returns `{ expired: true }`; negative remainder coerced to 0.

### 8.2 Manual QA checklist

Lives in `DESIGN.md` §10 as the acceptance checklist (full list below). Human eyes once per release-candidate.

---

## 9. Acceptance checklist (S0 → S1 gate)

S0 is done only when every box is checked. **Any unchecked item blocks S1.**

**Design system**
- [ ] `DESIGN.md` 10 sections complete
- [ ] `tokens/*.css` 8 files in place; `tokens-cream.css` is now just `@import` lines
- [ ] Status semantics master table in §6
- [ ] Tweaks persistence keys in §7
- [ ] Dark token placeholder table in §8 (values blank)
- [ ] Tailwind v4 mapping table in §9

**Code organization**
- [ ] `chat/` split into 7 parts + Composer + MentionList + ApprovalCard
- [ ] `screens/` 13 files (5 existing + 8 new)
- [ ] `lib/` 5 JS utilities
- [ ] `index v2.html` updated; console shows 0 errors on load
- [ ] Old `chat.jsx` and `screens.jsx` deleted

**Four core interactions**
- [ ] `@mention` all 8 keyboard cases pass
- [ ] mention chip deletes as one unit
- [ ] no-match popover shows message
- [ ] tool_use without result shows skeleton + "运行中"
- [ ] `is_error` tool_result shows red border
- [ ] tool_result >10 lines folds
- [ ] approval countdown driven by `expires_at` (not local-accumulated)
- [ ] approval <10min red bleed
- [ ] approval at 0 disables buttons + dims card
- [ ] queued badge shown when `metadata.queued`
- [ ] cancel-run confirms + warns about queued
- [ ] cancel-run 5s debounce

**Layout fixes (6)**
- [ ] hero "新建项目" no wrap
- [ ] stat 2×2 aligned with right rail baseline
- [ ] stat cards near-square
- [ ] sidebar "runtime 在线" no truncation
- [ ] project card title no per-char break
- [ ] sidebar icons monochrome

**Six missing pages**
- [ ] Login / Register fillable, validation works
- [ ] AgentsList with search + archive filter
- [ ] AgentNew full field set incl. mcp_config validation
- [ ] RuntimesList + install-token modal (one-time token + copy + countdown)
- [ ] WorkspaceSettings members + danger zone (slug-typed confirm)
- [ ] ProjectAssets + ProjectArtifacts tabs
- [ ] /approvals hub uses ApprovalCard

**lib/ tests**
- [ ] `tests/lib.html` opens with all assertions green

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Splitting big files breaks existing prototype interactions | Migrate one screen at a time; keep prototype runnable after each commit; manual smoke after each file split |
| Token rename ripples through many CSS rules | First add new token names alongside old; switch consumers; then remove old. Two-step rename |
| New pages drift from "月光奶冻" visual language | All new pages must reference `DESIGN.md` §5 component specs only — no new color/spacing values invented inline |
| `contentEditable` Composer has cross-browser quirks (Backspace chip handling) | Test in Chrome + Firefox + Edge; document known issues; defer Tiptap to S1 |
| `lib/countdown.js` setInterval drift on inactive tabs | Use `requestAnimationFrame` + Date.now() recompute, not interval accumulation; documented in code |
| Scope creep ("just one more page") | "Not in S0" section §1 is authoritative; new asks defer to S1+ |

---

## 11. After S0

When S0 acceptance is fully green:

1. Commit `DESIGN.md` and the polished prototype.
2. Start S1 brainstorming (M1 + M2 in `docs/FRONTEND.md`): Next.js 15 + Tailwind v4 + shadcn skeleton, login flow, three-pane shell, workspace/project/task list (read-only), TanStack Query + Zustand infrastructure.
3. S1 spec will live at `docs/superpowers/specs/YYYY-MM-DD-s1-nextjs-skeleton-design.md`.

S0's `DESIGN.md` and `lib/*.js` become the foundation S1 ports verbatim into the Next codebase.

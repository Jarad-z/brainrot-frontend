# Brainrot Frontend Design System

> Single source of truth for visual language and component behavior in the `ui_design/` prototype. Token names map 1:1 to the eventual Tailwind v4 `@theme` block in S1.

## 1. Principles

1. **Restraint over decoration.** Default to paper + ink. Color enters only as a deliberate accent or as part of the status master table (§6). No gradients in core surfaces.
2. **Form over color for status.** Status is signalled by *shape* (hollow square / filled / pulse / dashed / striped) first, color second. This is the rule that ended the prior "color the icons → ugly → revert" loop. Nav icons stay monochrome — they do NOT carry colored chips.
3. **Paper feel.** Surfaces are warm white (Moonlit Cream), borders are hairline (1px), shadows are solid-offset block-style not blur.
4. **Variable type as voice.** Bricolage Grotesque's `wdth` axis is used intentionally: confident headlines tighten to 88; CTA buttons widen to 96; body stays at 100.

## 2. Palette

Three families: paper (warm-white surfaces), ink (foreground hierarchy), accent (one of four candidates).

| Token | Value | Role |
|---|---|---|
| `--paper-0` | `#fdfaf2` | card backgrounds |
| `--paper-1` | `#f4ede1` | page background (Moonlit Cream base) |
| `--paper-2` | `#ece3d2` | hover, subtle divisions, mention chip |
| `--ink-0` | `#1b1820` | primary text, block shadows |
| `--ink-1` | `#3b3540` | secondary text |
| `--ink-2` | `#6f6878` | meta, timestamps |
| `--ink-3` | `#a8a2b0` | disabled, placeholder |
| `--hairline` | `#d8cfbe` | 1px borders, dividers |
| `--accent-poppy` | `#cf4040` | default accent |
| `--accent-moss` | `#5d7a3a` | secondary accent option |
| `--accent-honey` | `#c79029` | secondary accent option |
| `--accent-plum` | `#6f3b6b` | secondary accent option |
| `--accent-fg` | `#fdfaf2` | foreground on accent backgrounds |

Tweaks panel writes the chosen accent to `--accent` at runtime.

## 3. Typography

| Token | Value | Used for |
|---|---|---|
| `--font-display` | Bricolage Grotesque | headings, hero, CTA |
| `--font-body` | Bricolage Grotesque | body, chat |
| `--font-mono` | JetBrains Mono | code, tokens, blob keys |
| `--wdth-tight: 88` | | confident headlines, big stat numbers |
| `--wdth-normal: 100` | | body |
| `--wdth-wide: 96` | | CTA buttons (calmer, fuller) |
| `--text-xs: 12px` | | meta, timestamps |
| `--text-sm: 14px` | | UI controls, buttons |
| `--text-base: 16px` | | chat messages, paragraphs |
| `--text-lg: 18px` | | card titles |
| `--text-xl: 22px` | | page H2 |
| `--text-2xl: 32px` | | page section header |
| `--text-hero: 64px` | | WorkspaceHome hero only |

Hard rule: chat msg 16px, UI control 14px, meta 12px. Anything outside this scale needs an entry here first.

## 4. Spacing / Radii / Shadow

Spacing scale is 4px-based (`--sp-1` through `--sp-12`). Use spacing tokens, never hard-coded px. Density multiplier (`--sp-base-mult`) attaches via `[data-density]` on `<html>`.

Radii: `--r-sm 6px` (buttons, badges), `--r-md 12px` (cards), `--r-lg 16px` (bubbles), `--r-xl 20px` (hero cards).

Shadow is solid-offset block-style — `Npx Npx 0 var(--ink-0)`. Three tiers: `--shadow-1` (3px), `--shadow-2` (4px), `--shadow-3` (6px). Tweaks panel writes `--depth` which `--shadow-current` consumes. `--shadow-soft` is the ONLY blur shadow — reserved for dropdown/toast/modal floats.

## 5. Component visual specs (and the six layout rules)

### Buttons
- Primary: filled `--ink-0` bg, `--paper-0` fg, `--r-sm`, `--shadow-current`. Used for the single most important action per surface.
- Ghost: transparent bg, `--ink-0` fg, `1.5px` `--hairline` border. Used for everything else.
- Destructive: filled `--state-denied` bg, `--paper-0` fg, with a confirm dialog gate (see Danger Zone in §5.6).
- Icon-only: 32×32 ghost; tooltip mandatory on hover.

### Inputs / textarea
- 1.5px `--hairline` border, `--r-sm`, `--paper-0` bg.
- Focus: 2px `--accent` ring.
- Invalid: 1.5px `--state-failed` border + 1 line of `--state-failed` helper text below.
- mono font for code/path inputs.

### Cards
- Surface `--paper-0`, 1.5px `--hairline` border, `--r-md`, `--shadow-1` (chunky variant: `--shadow-current`).
- Internal padding: `--sp-5` (20px) cozy, scales with density.

### Status badges
- See §6 master table for visual and color rules. Always shape-driven, color secondary.

### Avatars
- Square with 28% corner radius (matches `--r-sm` to `--r-md` scale).
- Agent: `--ink-0` border 1.5px; user: no border.
- Status indicator (online/offline): 8px square in bottom-right, hairline border.

### Mention chip (Composer)
- Inline `<span>` with `--paper-2` bg, `--hairline` 1px border, `--r-sm`, padding `2px 6px`.
- Deletes as one unit (Backspace removes the chip whole, not character-by-character).

### Approval card
- Two modes: `inline` (in chat) and `hub` (in /approvals).
- Header bar: `--role-approval-bg` (ink-0) with `--role-approval-fg` text, diagonal stripe pattern overlay on the right 40%.
- Body: `--paper-0`, command in mono font.
- Buttons: `[拒绝]` ghost, `[批准]` primary. Note textarea opens on demand.
- Status states: pending (default), approved (collapsed 1-line), denied (collapsed), timeout (gray + 60% opacity + disabled buttons).

### Empty state
- Centered card 320px wide, paper-1 bg, 64px glyph at top, then title (16px bold) + sub (13px ink-2). Optional CTA below.

### Error banner
- `inline`: full-width bar above content, padding `--sp-3` `--sp-5`, left-side icon + message + close X. variant info → ink, warn → honey-tinted, error → poppy-tinted.
- `toast`: bottom-right, 4s auto-close, click to dismiss early. Max 3 stacked.
- `card`: full content area replacement; use for terminal page errors only.

### Six locked layout rules (post-mortem of prior iterations)

These six rules are NOT subject to per-iteration retuning:

1. **Hero "新建项目" must not wrap.** `WorkspaceHome` header is `display: grid; grid-template-columns: 1fr auto;` with the button column `min-width: 160px`. Below 1100px viewport, button degrades to icon + "新建" but stays inline.
2. **WorkspaceHome page grid.** `grid-template-columns: 1fr 360px; grid-template-rows: auto 1fr;`. Top-left = hero, top-right = stat 2×2, bottom-left = project cards, bottom-right = approval rail. "项目" heading and "待审批" heading must sit on the same grid-row start line.
3. **Stat cards are near-square, not horizontal rectangles.** Each stat tile: `aspect-ratio: 1 / 0.78` (internal layout puts label on top, big number below, so slightly taller than wide).
4. **Sidebar text never truncates silently.** Every flex child gets `min-width: 0`. Text uses `text-overflow: ellipsis` + `title=` attribute for full-text on hover.
5. **Project card titles do not break per-character.** `word-break: keep-all; overflow-wrap: break-word; -webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;`.
6. **Sidebar icons are monochrome.** No colored chips behind nav icons. Color is reserved for status badges, accent CTAs, and approval header bars.

## 6. Status semantics master table

This is the single source for every status-bearing UI element. New components reference this table; new colors do NOT enter the codebase without an entry here.

| Domain | Value | Shape / Pattern | Foreground | Background |
|---|---|---|---|---|
| Task | `open` | hollow square stroke (1.5px) | — | — |
| Task | `in_progress` | filled square + 1s pulse | `--status-in_progress-fg` | `--status-in_progress-bg` |
| Task | `done` | filled gray dot | `--paper-0` | `--status-done-bg` |
| Task | `blocked` | diagonal stripe pattern fill | `--ink-0` | striped |
| Task | `archived` | text only, faded | `--status-archived-fg` | — |
| Run | `running` | accent dot with 1s pulse | `--accent-fg` | `--state-running` |
| Run | `queued` | dashed 1.5px circle | `--state-queued` | transparent |
| Run | `canceled` | strikethrough text | `--state-canceled` | — |
| Run | `failed` | ✗ icon | `--state-failed` | — |
| Approval | `pending` | clock + countdown text | `--ink-0` | `--role-approval-bg` |
| Approval | `<10min` | clock + RED countdown, 1s blink | `--countdown-urgent` | — |
| Approval | `approved` | ✓ + relative time, collapsed | `--state-approved` | — |
| Approval | `denied` | ✗ + relative time, collapsed | `--state-denied` | — |
| Approval | `timeout` | clock crossed, opacity 60% | `--state-timeout` | — |

Allowed transitions: `open → in_progress → done`; `open|in_progress → blocked → in_progress|done`; any → `archived`. Approvals: `pending → approved|denied|approved_with_edits|timeout` (terminal).

## 7. Tweaks panel & persistence

Tweaks panel writes four values to `localStorage`:

| Key | Type | Default | Notes |
|---|---|---|---|
| `brainrot.tweaks.accent` | hex string | `#cf4040` (poppy) | one of poppy/moss/honey/plum |
| `brainrot.tweaks.density` | enum | `cozy` | `compact` \| `cozy` \| `airy` |
| `brainrot.tweaks.blockDepth` | int | `4` | `0..8` px, drives `--shadow-current` |
| `brainrot.tweaks.theme` | enum | `light` | `light` \| `dark`; dark values blank in S0 |

Reads happen once on boot in `app-cream.jsx`; writes happen in `tweaks-panel.jsx`.

## 8. Dark theme placeholder

Each light token has a paired dark slot; values are intentionally blank in S0 and filled in M6.

| Token | Light | Dark |
|---|---|---|
| `--paper-0` | `#fdfaf2` | _(M6)_ |
| `--paper-1` | `#f4ede1` | _(M6)_ |
| `--paper-2` | `#ece3d2` | _(M6)_ |
| `--ink-0` | `#1b1820` | _(M6)_ |
| `--ink-1` | `#3b3540` | _(M6)_ |
| `--ink-2` | `#6f6878` | _(M6)_ |
| `--ink-3` | `#a8a2b0` | _(M6)_ |
| `--hairline` | `#d8cfbe` | _(M6)_ |
| `--accent-poppy` | `#cf4040` | _(M6)_ |
| `--accent-moss` | `#5d7a3a` | _(M6)_ |
| `--accent-honey` | `#c79029` | _(M6)_ |
| `--accent-plum` | `#6f3b6b` | _(M6)_ |
| `--accent-fg` | `#fdfaf2` | _(M6)_ |

## 9. Tailwind v4 mapping (for S1 migration)

In S1's `app/globals.css`, every token here lands in an `@theme` block. The CSS variable name stays identical — Tailwind v4 reads them directly.

| Our token | Tailwind v4 `@theme` entry | Tailwind utility |
|---|---|---|
| `--paper-0` | `--color-paper-0: var(--paper-0)` | `bg-paper-0` |
| `--ink-0` | `--color-ink-0: var(--ink-0)` | `text-ink-0` |
| `--hairline` | `--color-hairline: var(--hairline)` | `border-hairline` |
| `--accent` | `--color-accent: var(--accent)` | `bg-accent` |
| `--text-base` | `--text-base: var(--text-base)` | `text-base` |
| `--sp-4` | `--spacing-4: var(--sp-4)` | `p-4`, `gap-4` |
| `--r-md` | `--radius-md: var(--r-md)` | `rounded-md` |
| `--shadow-1` | `--shadow-1: var(--shadow-1)` | `shadow-1` |

(Full table at S1 spec time. The structure proves the migration is mechanical.)

## 10. Acceptance checklist (S0 → S1 gate)

S0 is done only when every box is checked. Any unchecked item blocks S1.

**Design system**
- [ ] DESIGN.md 10 sections complete
- [ ] tokens/*.css 8 files in place; tokens-cream.css is now just @import lines
- [ ] Status semantics master table in §6
- [ ] Tweaks persistence keys in §7
- [ ] Dark token placeholder table in §8 (values blank)
- [ ] Tailwind v4 mapping table in §9

**Code organization**
- [ ] chat/ split into MessageList, MessageItem, Composer, MentionList, ApprovalCard + 8 parts
- [ ] screens/ 13 files (5 existing + 8 new)
- [ ] lib/ 5 JS utilities
- [ ] index v2.html updated; console 0 errors on load
- [ ] Old chat.jsx and screens.jsx deleted

**Four core interactions**
- [ ] @mention all 8 keyboard cases pass
- [ ] mention chip deletes as one unit
- [ ] no-match popover shows message
- [ ] tool_use without result shows skeleton + "运行中"
- [ ] is_error tool_result shows red border
- [ ] tool_result >10 lines folds
- [ ] approval countdown driven by expires_at (not local-accumulated)
- [ ] approval <10min red bleed
- [ ] approval at 0 disables buttons + dims card
- [ ] queued badge shown when metadata.queued
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
- [ ] tests/lib.html opens with all assertions green

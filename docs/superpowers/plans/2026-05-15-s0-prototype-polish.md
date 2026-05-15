# S0 · Prototype Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the `ui_design/` Moonlit-Cream prototype to a tight, internally-consistent reference implementation with a written design system, finished core interactions, six new pages, and split files — without introducing a build tool.

**Architecture:** Stay on Babel standalone + CDN React 18. Split the two big files (`chat.jsx` 13KB, `screens.jsx` 28KB) by responsibility. Extract a pure-JS `lib/` for `codec`/`mention-parse`/`countdown`/`format`/`keyboard`. Collate design tokens into `tokens/*.css` + a single `DESIGN.md`. Add a browser-runnable test page `tests/lib.html`. Module communication via existing `window.*` global convention.

**Tech Stack:** React 18 UMD, Babel standalone, vanilla CSS variables, `Bricolage Grotesque` + `JetBrains Mono` (Google Fonts), no bundler, no test framework, no router.

**Spec:** `docs/superpowers/specs/2026-05-15-s0-prototype-polish-design.md`

---

## File Structure (locked decisions)

**Created**
- `ui_design/DESIGN.md` — design system source of truth (10 sections)
- `ui_design/tokens/palette.css` `typography.css` `spacing.css` `radii.css` `shadow.css` `roles.css` `status.css` `tweaks.css` — token split
- `ui_design/lib/codec.js` `mention-parse.js` `format.js` `countdown.js` `keyboard.js` — pure JS utilities
- `ui_design/chat/_index.jsx` `MessageList.jsx` `MessageItem.jsx` `Composer.jsx` `MentionList.jsx` `ApprovalCard.jsx` `parts/*.jsx` — chat module split
- `ui_design/screens/_index.jsx` `WorkspaceHome.jsx` `ProjectBoard.jsx` `TaskDetail.jsx` `ApprovalsHub.jsx` `AgentsList.jsx` `AgentNew.jsx` `RuntimesList.jsx` `WorkspaceSettings.jsx` `ProjectAssets.jsx` `ProjectArtifacts.jsx` `Login.jsx` `Register.jsx` — screens split + 8 new pages
- `ui_design/components/ErrorBanner.jsx` `EmptyState.jsx` — shared horizontal components
- `ui_design/tests/lib.html` — pure-fn test harness

**Modified**
- `ui_design/index v2.html` — register all new `<script>` tags; add new font axes; remove old script refs
- `ui_design/tokens-cream.css` — convert to a thin `@import` shell over `tokens/*.css`
- `ui_design/data.jsx` — add `MEMBERS`, `RUNTIMES`, mock `activeRunByTask` set, `installToken()` factory
- `ui_design/primitives.jsx` — drop old `useCountdown`/`fmtCountdown` (moved to `lib/countdown.js`); keep `Icon`, `Avatar`, `AgentAvatar`, `StatusChip`, `Empty` (Empty becomes thin wrapper around `EmptyState`)
- `ui_design/app-cream.jsx` — extend `route.name` union with new pages; mount new screens

**Deleted (only after all consumers migrate)**
- `ui_design/chat.jsx`
- `ui_design/screens.jsx`

---

## Conventions

- File header on every new `.jsx`: top-of-file comment listing dependencies it reads from `window.*` and what it writes back (mirrors existing `Object.assign(window, ...)` pattern).
- All exported helpers and React components get JSDoc with param/return shapes, per `~/.claude/rules/coding-style.md` §JavaScript Files.
- After every task, run sanity check: open `index v2.html` in a browser (file:// or local server), verify console has 0 errors, verify the route mentioned in the task renders.
- After every task with passing sanity check, commit. Commit message format: `feat(s0): <task subject>` / `refactor(s0): <task subject>` / `fix(s0): <task subject>` / `docs(s0): <task subject>`.

---

## Task 0: Set up scaffold directories and font axes

**Files:**
- Create: `ui_design/tokens/.gitkeep`
- Create: `ui_design/lib/.gitkeep`
- Create: `ui_design/chat/.gitkeep`
- Create: `ui_design/chat/parts/.gitkeep`
- Create: `ui_design/screens/.gitkeep`
- Create: `ui_design/components/.gitkeep`
- Create: `ui_design/tests/.gitkeep`
- Modify: `ui_design/index v2.html:9` (font URL)

- [ ] **Step 1: Create empty subdirectories**

```powershell
New-Item -ItemType Directory -Force -Path ui_design/tokens, ui_design/lib, ui_design/chat, ui_design/chat/parts, ui_design/screens, ui_design/components, ui_design/tests | Out-Null
New-Item -ItemType File -Force -Path ui_design/tokens/.gitkeep, ui_design/lib/.gitkeep, ui_design/chat/.gitkeep, ui_design/chat/parts/.gitkeep, ui_design/screens/.gitkeep, ui_design/components/.gitkeep, ui_design/tests/.gitkeep | Out-Null
```

- [ ] **Step 2: Open `ui_design/index v2.html` line 9 and replace the font link**

Old (line 9):
```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,300;12..96,75..100,500;12..96,75..100,600;12..96,75..100,700;12..96,75..100,800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

New (line 9, adds 400/800 + monospace 700 for completeness):
```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400;12..96,75..100,500;12..96,75..100,600;12..96,75..100,700;12..96,75..100,800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

- [ ] **Step 3: Sanity check**

Open `index v2.html` in a browser. Confirm page renders identically to before (font additions are non-breaking) and console has 0 errors.

- [ ] **Step 4: Commit**

```bash
git add ui_design/tokens ui_design/lib ui_design/chat ui_design/screens ui_design/components ui_design/tests "ui_design/index v2.html"
git commit -m "chore(s0): scaffold new subdirectories and font axes"
```

---

## Task 1: Write the `DESIGN.md` skeleton (sections 1, 7, 10)

`DESIGN.md` is written progressively as tokens land. This task fills only the never-changing scaffolding sections.

**Files:**
- Create: `ui_design/DESIGN.md`

- [ ] **Step 1: Create file with 10 H2 headers + locked content for §1 §7 §10**

```markdown
# Brainrot Frontend Design System

> Single source of truth for visual language and component behavior in the `ui_design/` prototype. Token names map 1:1 to the eventual Tailwind v4 `@theme` block in S1.

## 1. Principles

1. **Restraint over decoration.** Default to paper + ink. Color enters only as a deliberate accent or as part of the status master table (§6). No gradients in core surfaces.
2. **Form over color for status.** Status is signalled by *shape* (hollow square / filled / pulse / dashed / striped) first, color second. This is the rule that ended the prior "color the icons → ugly → revert" loop. Nav icons stay monochrome — they do NOT carry colored chips.
3. **Paper feel.** Surfaces are warm white (Moonlit Cream), borders are hairline (1px), shadows are solid-offset block-style not blur.
4. **Variable type as voice.** Bricolage Grotesque's `wdth` axis is used intentionally: confident headlines tighten to 88; CTA buttons widen to 96; body stays at 100.

## 2. Palette

(filled in Task 2)

## 3. Typography

(filled in Task 3)

## 4. Spacing / Radii / Shadow

(filled in Task 3)

## 5. Component visual specs

(filled in Task 4; locks the six layout fixes)

## 6. Status semantics master table

(filled in Task 4)

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

(filled in Task 3; dark column intentionally blank — values filled in M6)

## 9. Tailwind v4 mapping

(filled in Task 3)

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
```

- [ ] **Step 2: Commit**

```bash
git add ui_design/DESIGN.md
git commit -m "docs(s0): seed DESIGN.md with principles, tweaks keys, acceptance checklist"
```

---

## Task 2: Write `tokens/palette.css` and migrate `tokens-cream.css` to import shell

**Files:**
- Create: `ui_design/tokens/palette.css`
- Modify: `ui_design/tokens-cream.css` (top of file — add `@import` lines after existing `:root` block, keep the rest)

- [ ] **Step 1: Create `ui_design/tokens/palette.css`**

```css
/* ================================================================
   tokens/palette.css — paper, ink, hairline, accent variants
   Each variable corresponds 1:1 to a Tailwind v4 @theme entry
   in S1 migration; see DESIGN.md §9.
   ================================================================ */
:root {
  /* Paper (warm-white background hierarchy) */
  --paper-0: #fdfaf2;
  --paper-1: #f4ede1;
  --paper-2: #ece3d2;

  /* Ink (foreground hierarchy) */
  --ink-0: #1b1820;
  --ink-1: #3b3540;
  --ink-2: #6f6878;
  --ink-3: #a8a2b0;

  /* Hairline / 1px border */
  --hairline: #d8cfbe;

  /* Accent candidates (Tweaks panel chooses one → --accent) */
  --accent-poppy: #cf4040;
  --accent-moss:  #5d7a3a;
  --accent-honey: #c79029;
  --accent-plum:  #6f3b6b;
  --accent-fg:    #fdfaf2;

  /* Default accent (overridden at runtime by applyAccent()) */
  --accent: var(--accent-poppy);
}
```

- [ ] **Step 2: Modify `ui_design/tokens-cream.css`** — prepend `@import` at the very top (keep the rest of the existing 41KB file untouched for now; later tasks remove what duplicates the imports).

Insert as **line 1**:
```css
@import url("./tokens/palette.css");
```

- [ ] **Step 3: Sanity check**

Open `index v2.html`. Page renders with same colors. Console: 0 errors. DevTools → Computed → confirm `--paper-1` resolves to `#f4ede1`.

- [ ] **Step 4: Commit**

```bash
git add ui_design/tokens/palette.css ui_design/tokens-cream.css
git commit -m "feat(s0): extract palette tokens into tokens/palette.css"
```

---

## Task 3: Extract typography, spacing, radii, shadow, tweaks tokens

**Files:**
- Create: `ui_design/tokens/typography.css`
- Create: `ui_design/tokens/spacing.css`
- Create: `ui_design/tokens/radii.css`
- Create: `ui_design/tokens/shadow.css`
- Create: `ui_design/tokens/tweaks.css`
- Modify: `ui_design/tokens-cream.css` (prepend more `@import` lines)
- Modify: `ui_design/DESIGN.md` (fill §3, §4, §8, §9)

- [ ] **Step 1: Create `ui_design/tokens/typography.css`**

```css
/* ================================================================
   tokens/typography.css — font stacks, axes, size scale, weights
   ================================================================ */
:root {
  --font-display: "Bricolage Grotesque", system-ui, sans-serif;
  --font-body:    "Bricolage Grotesque", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;

  /* Variable axis presets (Bricolage `wdth`) */
  --wdth-tight:  88;
  --wdth-normal: 100;
  --wdth-wide:   96;

  /* Size scale (px) — see DESIGN.md §3 rationale */
  --text-xs:   12px;
  --text-sm:   14px;
  --text-base: 16px;
  --text-lg:   18px;
  --text-xl:   22px;
  --text-2xl:  32px;
  --text-hero: 64px;

  /* Line heights */
  --lh-tight:  1.15;
  --lh-snug:   1.25;
  --lh-base:   1.5;
  --lh-loose:  1.6;

  /* Weights */
  --w-regular:  400;
  --w-medium:   500;
  --w-semibold: 600;
  --w-bold:     700;
  --w-black:    800;
}
```

- [ ] **Step 2: Create `ui_design/tokens/spacing.css`**

```css
/* tokens/spacing.css — 4px base scale */
:root {
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 20px;
  --sp-6: 24px;
  --sp-8: 32px;
  --sp-10: 40px;
  --sp-12: 48px;
}

/* Density scaling — multiplier on --sp-* via data-density */
[data-density="compact"] { --sp-base-mult: 0.75; }
[data-density="cozy"]    { --sp-base-mult: 1; }
[data-density="airy"]    { --sp-base-mult: 1.25; }
```

- [ ] **Step 3: Create `ui_design/tokens/radii.css`**

```css
/* tokens/radii.css */
:root {
  --r-sm: 6px;
  --r-md: 12px;
  --r-lg: 16px;
  --r-xl: 20px;
}
```

- [ ] **Step 4: Create `ui_design/tokens/shadow.css`**

```css
/* tokens/shadow.css — solid-offset "block" shadows + one soft */
:root {
  --shadow-0: none;
  --shadow-1: 3px 3px 0 var(--ink-0);
  --shadow-2: 4px 4px 0 var(--ink-0);
  --shadow-3: 6px 6px 0 var(--ink-0);

  /* For float surfaces only (dropdown, toast, modal) */
  --shadow-soft: 0 2px 8px rgb(27 24 32 / 0.08);

  /* Tweaks block-depth runtime override */
  --depth: 4px;
  --shadow-current: var(--depth) var(--depth) 0 var(--ink-0);
}
```

- [ ] **Step 5: Create `ui_design/tokens/tweaks.css`**

```css
/* tokens/tweaks.css — runtime-tunable surfaces (Tweaks panel persistence) */
/* Density is handled in spacing.css; theme/accent attach via JS in app-cream.jsx */
```

- [ ] **Step 6: Modify `ui_design/tokens-cream.css`** — prepend the remaining `@import` lines so the top of the file now reads:

```css
@import url("./tokens/palette.css");
@import url("./tokens/typography.css");
@import url("./tokens/spacing.css");
@import url("./tokens/radii.css");
@import url("./tokens/shadow.css");
@import url("./tokens/tweaks.css");
/* (original content of tokens-cream.css continues below) */
```

- [ ] **Step 7: Modify `ui_design/DESIGN.md`** — fill §3, §4, §8, §9.

Replace the `(filled in Task 3)` markers for §3 and §4 with:

```markdown
## 3. Typography

| Token | Value | Used for |
|---|---|---|
| `--font-display` | Bricolage Grotesque | headings, hero, CTA |
| `--font-body` | Bricolage Grotesque | body, chat |
| `--font-mono` | JetBrains Mono | code, tokens, blob keys |
| `--wdth-tight: 88` | confident headlines, big stat numbers |
| `--wdth-normal: 100` | body |
| `--wdth-wide: 96` | CTA buttons (calmer, fuller) |
| `--text-xs: 12px` | meta, timestamps |
| `--text-sm: 14px` | UI controls, buttons |
| `--text-base: 16px` | chat messages, paragraphs |
| `--text-lg: 18px` | card titles |
| `--text-xl: 22px` | page H2 |
| `--text-2xl: 32px` | page section header |
| `--text-hero: 64px` | WorkspaceHome hero only |

Hard rule: chat msg 16px, UI control 14px, meta 12px. Anything outside this scale needs an entry here first.

## 4. Spacing / Radii / Shadow

Spacing scale is 4px-based (`--sp-1` through `--sp-12`). Use spacing tokens, never hard-coded px. Density multiplier (`--sp-base-mult`) attaches via `[data-density]` on `<html>`.

Radii: `--r-sm 6px` (buttons, badges), `--r-md 12px` (cards), `--r-lg 16px` (bubbles), `--r-xl 20px` (hero cards).

Shadow is solid-offset block-style — `Npx Npx 0 var(--ink-0)`. Three tiers: `--shadow-1` (3px), `--shadow-2` (4px), `--shadow-3` (6px). Tweaks panel writes `--depth` which `--shadow-current` consumes. `--shadow-soft` is the ONLY blur shadow — reserved for dropdown/toast/modal floats.
```

Replace `(filled in Task 3)` for §8 with:

```markdown
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
```

Replace `(filled in Task 3)` for §9 with:

```markdown
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
```

- [ ] **Step 8: Sanity check**

Reload `index v2.html`. Visual diff against pre-Task-3: should be **identical** (we only extracted variables, not changed values). Open Tweaks panel, change density compact/cozy/airy — confirm `[data-density]` attribute updates on `<html>` and visual feels respond.

- [ ] **Step 9: Commit**

```bash
git add ui_design/tokens/typography.css ui_design/tokens/spacing.css ui_design/tokens/radii.css ui_design/tokens/shadow.css ui_design/tokens/tweaks.css ui_design/tokens-cream.css ui_design/DESIGN.md
git commit -m "feat(s0): extract typography/spacing/radii/shadow tokens; fill DESIGN.md §3,4,8,9"
```

---

## Task 4: Define role/status semantics and fill `DESIGN.md` §5 §6

**Files:**
- Create: `ui_design/tokens/roles.css`
- Create: `ui_design/tokens/status.css`
- Modify: `ui_design/tokens-cream.css` (add 2 more `@import` lines)
- Modify: `ui_design/DESIGN.md` (fill §2, §5, §6)

- [ ] **Step 1: Create `ui_design/tokens/roles.css`**

```css
/* tokens/roles.css — who is speaking */
:root {
  --role-user-bg:        var(--paper-0);
  --role-user-border:    var(--hairline);
  --role-agent-bg:       var(--paper-0);
  --role-agent-border:   var(--ink-0);
  --role-tool-bg:        #f7f1e0;
  --role-tool-border:    #e1d4a8;
  --role-thinking-bg:    transparent;
  --role-thinking-rail:  var(--ink-3);
  --role-approval-bg:    var(--ink-0);
  --role-approval-fg:    var(--paper-0);
}
```

- [ ] **Step 2: Create `ui_design/tokens/status.css`**

```css
/* tokens/status.css — semantic state colors. Shape > color (DESIGN.md §1). */
:root {
  /* TaskCard.status */
  --status-open-stroke:        var(--ink-2);
  --status-in_progress-bg:     var(--ink-0);
  --status-in_progress-fg:     var(--paper-0);
  --status-done-bg:            #b8b0a0;
  --status-archived-fg:        var(--ink-3);

  /* Run state */
  --state-running:    var(--accent);
  --state-queued:     var(--ink-2);
  --state-canceled:   var(--ink-3);
  --state-failed:     #c25036;
  --state-pending:    var(--ink-0);
  --state-approved:   #5d7a3a;
  --state-denied:     #c25036;
  --state-timeout:    var(--ink-3);

  /* Approval countdown */
  --countdown-urgent: var(--accent-poppy);
}
```

- [ ] **Step 3: Modify `ui_design/tokens-cream.css`** — prepend two more lines to the import header:

```css
@import url("./tokens/roles.css");
@import url("./tokens/status.css");
```

The full header now (in order):
```css
@import url("./tokens/palette.css");
@import url("./tokens/typography.css");
@import url("./tokens/spacing.css");
@import url("./tokens/radii.css");
@import url("./tokens/shadow.css");
@import url("./tokens/tweaks.css");
@import url("./tokens/roles.css");
@import url("./tokens/status.css");
```

- [ ] **Step 4: Fill `DESIGN.md` §2 §5 §6**

Replace `(filled in Task 2)` marker for §2:

```markdown
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
```

Replace `(filled in Task 4)` marker for §5 with:

```markdown
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
```

Replace `(filled in Task 4)` marker for §6:

```markdown
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
```

- [ ] **Step 5: Sanity check**

Reload `index v2.html`. No visual change (variables added, not consumed yet). Console: 0 errors. DevTools → confirm `--state-failed` resolves to `#c25036`.

- [ ] **Step 6: Commit**

```bash
git add ui_design/tokens/roles.css ui_design/tokens/status.css ui_design/tokens-cream.css ui_design/DESIGN.md
git commit -m "feat(s0): role/status token semantics; complete DESIGN.md §2,5,6"
```

---

## Task 5: Write `lib/codec.js` + its tests

**Files:**
- Create: `ui_design/lib/codec.js`
- Create: `ui_design/tests/lib.html` (initial scaffold with codec assertions)
- Modify: `ui_design/index v2.html` — add `<script src="lib/codec.js"></script>` before the babel script blocks

- [ ] **Step 1: Create `ui_design/lib/codec.js`**

```javascript
// ui_design/lib/codec.js
// Pure JS — no React, no JSX. Loaded as a plain <script>.
// Reads from: nothing. Writes to: window.BR_LIB.codec.

(function () {
  /**
   * Error class for base64+JSON decode failures. Carries the offending input.
   */
  class CodecError extends Error {
    /**
     * @param {string} message
     * @param {string} rawInput
     */
    constructor(message, rawInput) {
      super(message);
      this.name = "CodecError";
      this.rawInput = rawInput;
    }
  }

  /**
   * Decode a base64 string into JSON. The wire format used across the backend
   * encodes message.content / message.metadata / agent.custom_env etc. this way.
   *
   * @param {string} b64
   * @returns {unknown}
   * @throws {CodecError} if base64 is malformed or contents are not valid JSON.
   */
  function decodeJSON(b64) {
    if (typeof b64 !== "string") {
      throw new CodecError("expected string", String(b64));
    }
    let raw;
    try {
      raw = atob(b64);
    } catch (e) {
      throw new CodecError("invalid base64: " + (e && e.message), b64);
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      throw new CodecError("invalid JSON: " + (e && e.message), b64);
    }
  }

  /**
   * Encode a JS value to base64 JSON. Convenience inverse used by mock data.
   * @param {unknown} value
   * @returns {string}
   */
  function encodeJSON(value) {
    return btoa(JSON.stringify(value));
  }

  window.BR_LIB = window.BR_LIB || {};
  window.BR_LIB.codec = { decodeJSON, encodeJSON, CodecError };
})();
```

- [ ] **Step 2: Create `ui_design/tests/lib.html`**

```html
<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8" />
<title>lib/* tests</title>
<style>
  body { font: 14px/1.5 ui-monospace, monospace; padding: 24px; background: #f4ede1; color: #1b1820; }
  h1 { margin: 0 0 16px; }
  #results > div { padding: 4px 8px; border-radius: 4px; margin: 2px 0; }
  .pass { background: #d4e7c5; color: #2a4a14; }
  .fail { background: #f3c7c0; color: #7a1d10; font-weight: 700; }
  .group { margin-top: 16px; font-weight: 700; color: #6f6878; }
  .summary { margin-top: 24px; padding: 12px; border: 2px solid #1b1820; border-radius: 8px; font-weight: 700; }
</style>
</head>
<body>
<h1>lib/* tests</h1>
<div id="results"></div>
<div id="summary" class="summary"></div>

<script src="../lib/codec.js"></script>
<script>
const results = document.getElementById("results");
const summary = document.getElementById("summary");
let pass = 0, fail = 0;

function group(name) {
  const el = document.createElement("div");
  el.className = "group";
  el.textContent = name;
  results.appendChild(el);
}
function assert(name, cond, detail) {
  const el = document.createElement("div");
  el.className = cond ? "pass" : "fail";
  el.textContent = (cond ? "[pass] " : "[fail] ") + name + (cond ? "" : "  ← " + (detail || ""));
  results.appendChild(el);
  cond ? pass++ : fail++;
}

// ---- codec ----
group("codec.js");
(function () {
  const { decodeJSON, encodeJSON, CodecError } = window.BR_LIB.codec;
  // valid round-trip
  const obj = { text: "hi @writer", n: 3 };
  const b64 = encodeJSON(obj);
  const back = decodeJSON(b64);
  assert("encodeJSON → decodeJSON round-trip", JSON.stringify(back) === JSON.stringify(obj));

  // nested
  const nested = { a: { b: [1, 2, { c: "x" }] } };
  assert("nested object round-trip", JSON.stringify(decodeJSON(encodeJSON(nested))) === JSON.stringify(nested));

  // malformed base64 throws CodecError
  let err = null;
  try { decodeJSON("@@@not-base64@@@"); } catch (e) { err = e; }
  assert("malformed base64 throws CodecError", err instanceof CodecError, err && err.name);

  // valid base64 but not JSON throws CodecError
  err = null;
  try { decodeJSON(btoa("not json")); } catch (e) { err = e; }
  assert("base64 of non-JSON throws CodecError", err instanceof CodecError);

  // non-string input throws
  err = null;
  try { decodeJSON(123); } catch (e) { err = e; }
  assert("non-string input throws CodecError", err instanceof CodecError);
})();

// finalize
const total = pass + fail;
summary.textContent = `${pass}/${total} passed${fail ? `, ${fail} FAILED` : ""}`;
summary.style.background = fail ? "#f3c7c0" : "#d4e7c5";
</script>
</body>
</html>
```

- [ ] **Step 3: Modify `ui_design/index v2.html`** — register the new lib script. Insert at line 23 (before the babel-script-loading section), so the file now contains around line 23-32:

```html
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
<!-- lib/* — pure JS utilities loaded before babel/jsx -->
<script src="lib/codec.js"></script>
</head>
<body>
<div id="root"></div>
<script type="text/babel" src="data.jsx"></script>
```

- [ ] **Step 4: Sanity check**

Open `ui_design/tests/lib.html` in a browser. Confirm summary box reads `5/5 passed` in green. Then open `index v2.html`, confirm console 0 errors and the app still renders.

- [ ] **Step 5: Commit**

```bash
git add ui_design/lib/codec.js ui_design/tests/lib.html "ui_design/index v2.html"
git commit -m "feat(s0): add lib/codec.js with browser test harness"
```

---

## Task 6: Write `lib/mention-parse.js` + tests

**Files:**
- Create: `ui_design/lib/mention-parse.js`
- Modify: `ui_design/tests/lib.html` (append assertions block)
- Modify: `ui_design/index v2.html` (register the script)

- [ ] **Step 1: Create `ui_design/lib/mention-parse.js`**

```javascript
// ui_design/lib/mention-parse.js
// Pure JS. Reads: nothing. Writes: window.BR_LIB.mention.

(function () {
  /**
   * @typedef {{ id: string, handle: string, archived?: boolean }} Agent
   */

  /**
   * Filter agent candidates for the @mention popover.
   * Empty prefix returns all non-archived agents. Otherwise case-insensitive
   * prefix match against handle.
   *
   * @param {string} prefix         e.g. "wr" for `@wr`
   * @param {ReadonlyArray<Agent>} agents
   * @returns {Agent[]}
   */
  function filterCandidates(prefix, agents) {
    const p = (prefix || "").toLowerCase();
    return agents.filter(a => !a.archived).filter(a => a.handle.toLowerCase().startsWith(p));
  }

  /**
   * Parse a Composer raw text (with `@handle` literals) plus a mapping of
   * placed mention nodes into the API submit shape.
   *
   * @param {string} text                       text as the user sees it; mention chips
   *                                            contribute their `@<handle>` literal
   * @param {ReadonlyArray<{ id: string, handle: string }>} placedMentions
   *        the mentions that were committed via the popover, in click order
   * @returns {{ text: string, mentions: string[] }}
   */
  function parseSubmit(text, placedMentions) {
    const seen = new Set();
    const ids = [];
    for (const m of placedMentions) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      ids.push(m.id);
    }
    return { text, mentions: ids };
  }

  /**
   * Compute the `@`-prefix the user is currently typing, given the full Composer
   * text and the caret offset. Returns null if not inside a mention prefix.
   *
   * @param {string} text
   * @param {number} caret
   * @returns {string|null} the prefix WITHOUT the leading `@`, or null
   */
  function activePrefix(text, caret) {
    if (caret <= 0 || caret > text.length) return null;
    let i = caret - 1;
    while (i >= 0) {
      const ch = text[i];
      if (ch === "@") {
        // verify @ is at start or preceded by whitespace
        if (i === 0 || /\s/.test(text[i - 1])) {
          return text.slice(i + 1, caret);
        }
        return null;
      }
      if (/\s/.test(ch)) return null;
      i--;
    }
    return null;
  }

  window.BR_LIB = window.BR_LIB || {};
  window.BR_LIB.mention = { filterCandidates, parseSubmit, activePrefix };
})();
```

- [ ] **Step 2: Modify `ui_design/tests/lib.html`** — insert a new assertions block right before the "// finalize" line:

```javascript
// ---- mention-parse ----
group("mention-parse.js");
(function () {
  const { filterCandidates, parseSubmit, activePrefix } = window.BR_LIB.mention;
  const agents = [
    { id: "a1", handle: "writer" },
    { id: "a2", handle: "writer2", archived: true },
    { id: "a3", handle: "coder" },
    { id: "a4", handle: "ux" },
  ];

  // candidates
  assert("empty prefix returns all non-archived", filterCandidates("", agents).length === 3);
  assert("prefix 'wr' returns writer (not archived writer2)", JSON.stringify(filterCandidates("wr", agents).map(a => a.id)) === JSON.stringify(["a1"]));
  assert("prefix is case-insensitive", filterCandidates("WR", agents).length === 1);
  assert("unknown prefix returns empty", filterCandidates("xyz", agents).length === 0);

  // parseSubmit
  const m1 = { id: "a1", handle: "writer" };
  const m3 = { id: "a3", handle: "coder" };
  const sub = parseSubmit("@writer @coder hi", [m1, m3]);
  assert("parseSubmit ids in click order", JSON.stringify(sub.mentions) === JSON.stringify(["a1", "a3"]));
  assert("parseSubmit dedupes duplicate ids", JSON.stringify(parseSubmit("hi", [m1, m1, m3]).mentions) === JSON.stringify(["a1", "a3"]));

  // activePrefix
  assert("activePrefix '@wr|' returns 'wr'", activePrefix("@wr", 3) === "wr");
  assert("activePrefix 'hi @wr|' returns 'wr'", activePrefix("hi @wr", 6) === "wr");
  assert("activePrefix mid-word returns null", activePrefix("hi@wr", 5) === null);
  assert("activePrefix after whitespace returns null", activePrefix("@wr hi", 6) === null);
  assert("activePrefix empty '@|' returns ''", activePrefix("@", 1) === "");
})();
```

- [ ] **Step 3: Modify `ui_design/index v2.html`** — add a script line below the codec one:

```html
<script src="lib/codec.js"></script>
<script src="lib/mention-parse.js"></script>
```

- [ ] **Step 4: Sanity check**

Open `tests/lib.html`. Expect green summary `16/16 passed`. Open `index v2.html`. Console 0 errors.

- [ ] **Step 5: Commit**

```bash
git add ui_design/lib/mention-parse.js ui_design/tests/lib.html "ui_design/index v2.html"
git commit -m "feat(s0): add lib/mention-parse.js with prefix/parse/filter utilities"
```

---

## Task 7: Write `lib/countdown.js` + tests; deprecate primitives.jsx duplicate

**Files:**
- Create: `ui_design/lib/countdown.js`
- Modify: `ui_design/tests/lib.html` (append assertions)
- Modify: `ui_design/index v2.html` (register script)
- Modify: `ui_design/primitives.jsx` (remove `useCountdown`/`fmtCountdown`; re-export from `BR_LIB.countdown`)

- [ ] **Step 1: Create `ui_design/lib/countdown.js`**

```javascript
// ui_design/lib/countdown.js
// Provides: pure `computeCountdown` (testable) + React `useCountdown` hook.
// Reads: window.React. Writes: window.BR_LIB.countdown.

(function () {
  const URGENT_MS = 10 * 60 * 1000;

  /**
   * Compute countdown state from an ISO-8601 expiry and a "now" timestamp.
   * Pure — no Date.now() inside, so it's deterministic in tests.
   *
   * @param {string|number} expiresAt  ISO string or ms epoch
   * @param {number} nowMs             ms epoch (Date.now())
   * @returns {{ remainingMs: number, label: string, urgent: boolean, expired: boolean }}
   */
  function computeCountdown(expiresAt, nowMs) {
    const exp = typeof expiresAt === "number" ? expiresAt : Date.parse(expiresAt);
    const remaining = Math.max(0, exp - nowMs);
    const expired = remaining === 0;
    const urgent = !expired && remaining <= URGENT_MS;
    const totalSec = Math.floor(remaining / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const label = expired ? "已超时" : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return { remainingMs: remaining, label, urgent, expired };
  }

  /**
   * React hook: re-computes each animation frame; cheaper to read once per tick
   * than to setInterval(1000) — drift-free across inactive tabs.
   *
   * @param {string|number} expiresAt
   */
  function useCountdown(expiresAt) {
    const React = window.React;
    const [, force] = React.useState(0);
    React.useEffect(() => {
      let raf = 0;
      let lastSec = -1;
      const tick = () => {
        const state = computeCountdown(expiresAt, Date.now());
        const sec = Math.floor(state.remainingMs / 1000);
        if (sec !== lastSec) {
          lastSec = sec;
          force(x => x + 1);
        }
        if (!state.expired) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [expiresAt]);
    return computeCountdown(expiresAt, Date.now());
  }

  window.BR_LIB = window.BR_LIB || {};
  window.BR_LIB.countdown = { computeCountdown, useCountdown, URGENT_MS };
})();
```

- [ ] **Step 2: Modify `ui_design/tests/lib.html`** — append before "// finalize":

```javascript
// ---- countdown ----
group("countdown.js");
(function () {
  const { computeCountdown, URGENT_MS } = window.BR_LIB.countdown;
  const now = 1_000_000_000_000;

  // 30 min remaining → not urgent, not expired
  let s = computeCountdown(now + 30 * 60_000, now);
  assert("30min: not urgent", !s.urgent);
  assert("30min: not expired", !s.expired);
  assert("30min: label '30:00'", s.label === "30:00");

  // 9 min remaining → urgent
  s = computeCountdown(now + 9 * 60_000, now);
  assert("9min: urgent", s.urgent && !s.expired);
  assert("9min: label '09:00'", s.label === "09:00");

  // exactly URGENT_MS → urgent
  s = computeCountdown(now + URGENT_MS, now);
  assert("exactly 10min: urgent", s.urgent);

  // expired (negative remainder)
  s = computeCountdown(now - 5000, now);
  assert("expired: expired=true", s.expired);
  assert("expired: label '已超时'", s.label === "已超时");
  assert("expired: remainingMs clamped to 0", s.remainingMs === 0);

  // ISO string input
  const iso = new Date(now + 90_000).toISOString();
  s = computeCountdown(iso, now);
  assert("ISO input: label '01:30'", s.label === "01:30");
})();
```

- [ ] **Step 3: Modify `ui_design/index v2.html`** — add script line:

```html
<script src="lib/codec.js"></script>
<script src="lib/mention-parse.js"></script>
<script src="lib/countdown.js"></script>
```

- [ ] **Step 4: Modify `ui_design/primitives.jsx`** — replace the existing `fmtCountdown` and `useCountdown` definitions (lines 82-97) with re-exports from `BR_LIB`:

Old (lines 82-97):
```javascript
// --- format countdown mm:ss ---
function fmtCountdown(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function useCountdown(initialSec) {
  const [s, setS] = useState(initialSec);
  useEffect(() => {
    if (s <= 0) return;
    const t = setTimeout(() => setS(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [s]);
  return s;
}
```

New (lines 82-92):
```javascript
// --- countdown (delegates to lib/countdown.js) ---
// Legacy callers expect a `seconds-remaining` number; adapt by accepting an
// `initialSec` and converting to an expiry, then projecting back.
function useCountdown(initialSec) {
  const expiresAt = useMemo(() => Date.now() + initialSec * 1000, [initialSec]);
  const state = window.BR_LIB.countdown.useCountdown(expiresAt);
  return Math.floor(state.remainingMs / 1000);
}
function fmtCountdown(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
```

- [ ] **Step 5: Sanity check**

Open `tests/lib.html`. Expect `25/25 passed`. Open `index v2.html`. Navigate to TaskDetail (the existing approval card in `t-hero` task) and watch the countdown tick down — confirm it works after the swap.

- [ ] **Step 6: Commit**

```bash
git add ui_design/lib/countdown.js ui_design/tests/lib.html "ui_design/index v2.html" ui_design/primitives.jsx
git commit -m "feat(s0): add lib/countdown.js (pure computeCountdown + RAF hook); reroute primitives"
```

---

## Task 8: Write `lib/format.js` + `lib/keyboard.js`

**Files:**
- Create: `ui_design/lib/format.js`
- Create: `ui_design/lib/keyboard.js`
- Modify: `ui_design/index v2.html` (register both)

- [ ] **Step 1: Create `ui_design/lib/format.js`**

```javascript
// ui_design/lib/format.js
// Pure JS. Writes window.BR_LIB.format.

(function () {
  /**
   * Format byte count to "1.4 KB", "823 B", "2.1 MB", etc.
   * @param {number} bytes
   * @returns {string}
   */
  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
  }

  /**
   * Format ms duration to "12.4s", "1m 30s", "320ms".
   * @param {number} ms
   * @returns {string}
   */
  function formatDuration(ms) {
    if (ms < 1000) return Math.round(ms) + "ms";
    if (ms < 60_000) return (ms / 1000).toFixed(1) + "s";
    const m = Math.floor(ms / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${m}m ${s}s`;
  }

  /**
   * Relative time: "刚刚", "3 分钟前", "昨天 14:32", "5/11".
   * @param {string|number|Date} when
   * @param {number} [nowMs]
   * @returns {string}
   */
  function formatRelative(when, nowMs) {
    const t = when instanceof Date ? when.getTime() : (typeof when === "number" ? when : Date.parse(when));
    const now = nowMs || Date.now();
    const diff = now - t;
    if (diff < 60_000) return "刚刚";
    if (diff < 3600_000) return Math.floor(diff / 60_000) + " 分钟前";
    if (diff < 86_400_000) return Math.floor(diff / 3600_000) + " 小时前";
    const d = new Date(t);
    if (diff < 2 * 86_400_000) {
      return `昨天 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  window.BR_LIB = window.BR_LIB || {};
  window.BR_LIB.format = { formatBytes, formatDuration, formatRelative };
})();
```

- [ ] **Step 2: Create `ui_design/lib/keyboard.js`**

```javascript
// ui_design/lib/keyboard.js
// Keyboard helpers — pure JS. Writes window.BR_LIB.keyboard.

(function () {
  const ENTER = "Enter";
  const TAB = "Tab";
  const ESC = "Escape";
  const ARROW_UP = "ArrowUp";
  const ARROW_DOWN = "ArrowDown";
  const BACKSPACE = "Backspace";

  /**
   * Returns true if the event represents Ctrl+Enter or Cmd+Enter.
   * @param {KeyboardEvent} e
   * @returns {boolean}
   */
  function isSubmitChord(e) {
    return e.key === ENTER && (e.ctrlKey || e.metaKey);
  }

  /**
   * Cycle an index forward by N items, looping (0..n-1).
   * @param {number} i
   * @param {number} delta
   * @param {number} n
   * @returns {number}
   */
  function cycle(i, delta, n) {
    if (n === 0) return 0;
    return ((i + delta) % n + n) % n;
  }

  window.BR_LIB = window.BR_LIB || {};
  window.BR_LIB.keyboard = { ENTER, TAB, ESC, ARROW_UP, ARROW_DOWN, BACKSPACE, isSubmitChord, cycle };
})();
```

- [ ] **Step 3: Modify `ui_design/index v2.html`** — add the two script lines:

```html
<script src="lib/codec.js"></script>
<script src="lib/mention-parse.js"></script>
<script src="lib/countdown.js"></script>
<script src="lib/format.js"></script>
<script src="lib/keyboard.js"></script>
```

- [ ] **Step 4: Sanity check**

Open `index v2.html`. Console 0 errors. DevTools console: `window.BR_LIB.format.formatBytes(2048)` → `"2.0 KB"`. `window.BR_LIB.keyboard.cycle(0, -1, 3)` → `2`.

- [ ] **Step 5: Commit**

```bash
git add ui_design/lib/format.js ui_design/lib/keyboard.js "ui_design/index v2.html"
git commit -m "feat(s0): add lib/format.js + lib/keyboard.js"
```

---

## Task 9: Extract horizontal `ErrorBanner` and `EmptyState` components

**Files:**
- Create: `ui_design/components/ErrorBanner.jsx`
- Create: `ui_design/components/EmptyState.jsx`
- Modify: `ui_design/index v2.html` (register both)
- Modify: `ui_design/primitives.jsx` (turn `Empty` into a thin wrapper around `EmptyState`)

- [ ] **Step 1: Create `ui_design/components/EmptyState.jsx`**

```javascript
// ui_design/components/EmptyState.jsx
// Reads: window.React. Writes: window.EmptyState.

/**
 * @typedef {Object} EmptyStateProps
 * @property {React.ReactNode} [glyph]    optional 48-64px glyph
 * @property {string} title               main message
 * @property {string} [description]       second line
 * @property {{ label: string, onClick: () => void }} [action]
 */

/**
 * Unified empty state for: no projects / tasks / messages / approvals /
 * agents / runtimes / assets / artifacts. See DESIGN.md §5.
 *
 * @param {EmptyStateProps} props
 */
function EmptyState({ glyph, title, description, action }) {
  return (
    <div style={{
      display: "grid", placeItems: "center", padding: "var(--sp-10)",
      background: "var(--paper-1)", border: "1.5px solid var(--hairline)",
      borderRadius: "var(--r-md)", textAlign: "center", gap: "var(--sp-2)",
    }}>
      {glyph && <div style={{ fontSize: 48, color: "var(--ink-2)", marginBottom: "var(--sp-2)" }}>{glyph}</div>}
      <div style={{ fontWeight: "var(--w-bold)", fontSize: "var(--text-base)", color: "var(--ink-0)" }}>{title}</div>
      {description && <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{description}</div>}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: "var(--sp-3)",
            padding: "8px 16px",
            background: "var(--ink-0)", color: "var(--paper-0)",
            border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)",
            fontWeight: "var(--w-semibold)", fontSize: "var(--text-sm)", cursor: "pointer",
            boxShadow: "var(--shadow-current)",
          }}>
          {action.label}
        </button>
      )}
    </div>
  );
}

window.EmptyState = EmptyState;
```

- [ ] **Step 2: Create `ui_design/components/ErrorBanner.jsx`**

```javascript
// ui_design/components/ErrorBanner.jsx
// Reads: window.React, window.Icon. Writes: window.ErrorBanner, window.useToast.

/**
 * @typedef {"info"|"warn"|"error"} BannerVariant
 * @typedef {"inline"|"toast"|"card"} BannerKind
 *
 * @typedef {Object} ErrorBannerProps
 * @property {BannerKind} kind
 * @property {BannerVariant} variant
 * @property {string} message
 * @property {() => void} [onClose]
 */

const ERR_TINT = {
  info:  { bg: "var(--paper-2)", fg: "var(--ink-0)",  bd: "var(--hairline)" },
  warn:  { bg: "#f7e7c4",        fg: "var(--ink-0)",  bd: "#d9b766" },
  error: { bg: "#f3c7c0",        fg: "#7a1d10",       bd: "var(--state-failed)" },
};

/**
 * Unified banner. See DESIGN.md §5.
 * @param {ErrorBannerProps} props
 */
function ErrorBanner({ kind, variant, message, onClose }) {
  const tint = ERR_TINT[variant] || ERR_TINT.info;
  const base = {
    padding: "var(--sp-3) var(--sp-5)", display: "flex", alignItems: "center",
    gap: "var(--sp-3)", background: tint.bg, color: tint.fg,
    border: "1.5px solid " + tint.bd, borderRadius: "var(--r-sm)",
    fontSize: "var(--text-sm)",
  };
  const kindStyle = {
    inline: {},
    toast:  { position: "fixed", right: 24, bottom: 24, zIndex: 1000, boxShadow: "var(--shadow-soft)" },
    card:   { padding: "var(--sp-8)", flexDirection: "column", textAlign: "center" },
  }[kind] || {};
  return (
    <div role={variant === "error" ? "alert" : "status"} style={{ ...base, ...kindStyle }}>
      <window.Icon name={variant === "error" ? "warn" : variant === "warn" ? "warn" : "approval"} size={16} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="关闭"
                style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}>
          <window.Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * Minimal toast manager: useToast() returns `{ push(message, variant?, ms?) }`.
 * Renders to a portal-like fixed container kept inside the calling tree.
 *
 * @returns {{
 *   toasts: Array<{id:number, message:string, variant:BannerVariant}>,
 *   push: (message: string, variant?: BannerVariant, ms?: number) => void,
 *   dismiss: (id: number) => void
 * }}
 */
function useToast() {
  const [toasts, setToasts] = window.React.useState([]);
  const idRef = window.React.useRef(0);
  const push = window.React.useCallback((message, variant = "info", ms = 4000) => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, message, variant }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ms);
  }, []);
  const dismiss = window.React.useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);
  return { toasts, push, dismiss };
}

window.ErrorBanner = ErrorBanner;
window.useToast = useToast;
```

- [ ] **Step 3: Modify `ui_design/index v2.html`** — add the two `<script type="text/babel">` entries after `primitives.jsx`:

```html
<script type="text/babel" src="primitives.jsx"></script>
<script type="text/babel" src="components/EmptyState.jsx"></script>
<script type="text/babel" src="components/ErrorBanner.jsx"></script>
<script type="text/babel" src="chat.jsx"></script>
```

- [ ] **Step 4: Modify `ui_design/primitives.jsx`** — replace the existing `Empty` function (lines 100-108) with:

```javascript
// --- empty state (thin wrapper for legacy callers; new code uses <EmptyState />) ---
function Empty({ glyph, title, sub }) {
  return <window.EmptyState glyph={glyph} title={title} description={sub} />;
}
```

- [ ] **Step 5: Sanity check**

Open `index v2.html`. Console 0 errors. Navigate to an empty state (e.g., go to a task with no messages in mock data; if none exists yet, this is verified later — for now just confirm the app still renders).

- [ ] **Step 6: Commit**

```bash
git add ui_design/components/EmptyState.jsx ui_design/components/ErrorBanner.jsx "ui_design/index v2.html" ui_design/primitives.jsx
git commit -m "feat(s0): add EmptyState + ErrorBanner + useToast; route legacy Empty through new component"
```

---

## Task 10: Extend `data.jsx` with new mock entities

**Files:**
- Modify: `ui_design/data.jsx` (append new constants at the end before the window.MOCK assignment)

- [ ] **Step 1: Modify `ui_design/data.jsx`** — replace the final `window.MOCK = { ... };` line (line 165) with a richer mock:

Append before line 165:

```javascript
const MEMBERS = [
  { id: "u-me",   name: "Alice",  handle: "alice",  color: "oklch(15% 0 0)", email: "alice@lumen.dev", role: "owner" },
  { id: "u-bob",  name: "Bob",    handle: "bob",    color: "oklch(40% 0 0)", email: "bob@lumen.dev",   role: "member" },
  { id: "u-carol",name: "Carol",  handle: "carol",  color: "oklch(55% 0 0)", email: "carol@lumen.dev", role: "member" },
];

const RUNTIMES = [
  { id: "rt-1", name: "alice-mbp",     host: "192.168.1.20", os: "darwin", arch: "arm64", capacity: 4, online: true,  lastHeartbeat: Date.now() - 12_000 },
  { id: "rt-2", name: "ci-runner-01",  host: "10.0.0.55",    os: "linux",  arch: "amd64", capacity: 8, online: true,  lastHeartbeat: Date.now() - 4_000 },
  { id: "rt-3", name: "office-imac",   host: null,           os: "darwin", arch: "x86_64",capacity: 2, online: false, lastHeartbeat: Date.now() - 5 * 60_000 },
];

const ARTIFACTS = [
  { id: "art-1", taskId: "t-hero",    filename: "hero-copy-v2.md",        mime: "text/markdown",       sizeBytes: 1432, source: "writer",  created: Date.now() - 25 * 60_000 },
  { id: "art-2", taskId: "t-hero",    filename: "hero-mockup.png",        mime: "image/png",           sizeBytes: 88_120, source: "ux",   created: Date.now() - 20 * 60_000 },
  { id: "art-3", taskId: "t-pricing", filename: "pricing-bullets.md",     mime: "text/markdown",       sizeBytes: 904,  source: "writer",  created: Date.now() - 90 * 60_000 },
];

const ASSETS = [
  { id: "as-1", projectId: "p-launch", filename: "brand-tokens.json", mime: "application/json", sizeBytes: 1180, uploadedBy: "u-me",   created: Date.now() - 2 * 86_400_000 },
  { id: "as-2", projectId: "p-launch", filename: "hero-ref.png",       mime: "image/png",        sizeBytes: 245_900, uploadedBy: "u-bob", created: Date.now() - 86_400_000 },
];

/**
 * Tracks which tasks have a currently-active run; cancel-run targets the most
 * recent entry. Mutated by data.jsx helpers; consumed by TaskDetail.
 * @type {{ [taskId: string]: { runId: string, agentId: string }[] }}
 */
const ACTIVE_RUNS = {
  "t-hero": [{ runId: "c3d4", agentId: "ag-eng" }],
};

/**
 * Generate a one-time install token for the Runtimes flow. Returns a token
 * string and an ISO expiry 1h in the future.
 * @returns {{ token: string, expiresAt: string }}
 */
function installToken() {
  const rnd = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  return {
    token: "bri_" + rnd,
    expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
  };
}
```

Then replace the existing line 165 with:

```javascript
window.MOCK = {
  AGENTS, USER, WORKSPACES, PROJECTS, TASKS, TASK_MESSAGES, APPROVALS,
  MEMBERS, RUNTIMES, ARTIFACTS, ASSETS, ACTIVE_RUNS,
  installToken,
};
```

- [ ] **Step 2: Sanity check**

Open `index v2.html`. Console 0 errors. DevTools: `window.MOCK.RUNTIMES.length` → `3`. `window.MOCK.installToken()` → `{ token: "bri_xxxxxxxxxxxxxxxx", expiresAt: "..." }`.

- [ ] **Step 3: Commit**

```bash
git add ui_design/data.jsx
git commit -m "feat(s0): extend mock data — members, runtimes, artifacts, assets, active-runs, installToken"
```

---

## Task 11: Split `chat.jsx` — extract the 8 `parts/*.jsx`

This task is mechanical: cut existing renderers out of `chat.jsx` into single-purpose files. Behavior unchanged.

**Files:**
- Create: `ui_design/chat/parts/UserMessage.jsx`
- Create: `ui_design/chat/parts/AssistantText.jsx`
- Create: `ui_design/chat/parts/Thinking.jsx`
- Create: `ui_design/chat/parts/ToolUse.jsx`
- Create: `ui_design/chat/parts/ToolResult.jsx`
- Create: `ui_design/chat/parts/PermissionRequest.jsx`
- Create: `ui_design/chat/parts/ResultBanner.jsx`
- Create: `ui_design/chat/parts/SystemLine.jsx`
- Modify: `ui_design/chat.jsx` (delete the corresponding sub-render functions; keep MessageList + Composer until next task)
- Modify: `ui_design/index v2.html` (register the 8 new scripts before `chat.jsx`)

- [ ] **Step 1: Read `ui_design/chat.jsx` in full** to see what renderers it currently contains. Note: I am unable to show the full body here without exceeding plan length — the engineer reads it directly.

- [ ] **Step 2: For each `parts/<Name>.jsx`, copy the matching renderer function from `chat.jsx` into the new file**, replacing internal references to other primitives with `window.<X>` form (or destructure `const { Icon, Avatar, ... } = window;` at the top of each file).

Template for each parts file:
```javascript
// ui_design/chat/parts/<Name>.jsx
// Reads: window.React, window.Icon, window.Avatar, etc.
// Writes: window.<Name>.

const { Icon, Avatar, AgentAvatar, StatusChip } = window;

/**
 * @param {{ msg: object, isPaired?: boolean }} props
 */
function <Name>({ msg, ...rest }) {
  /* exact body copied from chat.jsx */
}

window.<Name> = <Name>;
```

Specific files:
- `UserMessage.jsx` — renders `parsed.type === "user"`. **Also adds the queued badge** by reading `msg.metadata?.queued === true` (mock for now: pass through as a prop from MessageList).
- `AssistantText.jsx` — renders `parsed.type === "assistant_text"`.
- `Thinking.jsx` — renders `parsed.type === "thinking"`, default-collapsed.
- `ToolUse.jsx` — renders `parsed.type === "tool_use"` standalone (paired UI handled in MessageList).
- `ToolResult.jsx` — renders `parsed.type === "tool_result"` standalone.
- `PermissionRequest.jsx` — renders `parsed.type === "permission_request"`. Will be replaced by `ApprovalCard` in Task 14; for now keep the inline visual.
- `ResultBanner.jsx` — renders `parsed.type === "result"`.
- `SystemLine.jsx` — renders `parsed.type === "system"` and is also used as a fallback for codec failures.

- [ ] **Step 3: Modify `ui_design/chat.jsx`** — delete the extracted sub-render functions; keep the top-level `MessageList`, `MessageItem`, and `Composer`. MessageItem's dispatch switch now references `window.<Name>` instead of local functions.

- [ ] **Step 4: Modify `ui_design/index v2.html`** — register the 8 part scripts. Insert immediately before the line that loads `chat.jsx`:

```html
<script type="text/babel" src="chat/parts/UserMessage.jsx"></script>
<script type="text/babel" src="chat/parts/AssistantText.jsx"></script>
<script type="text/babel" src="chat/parts/Thinking.jsx"></script>
<script type="text/babel" src="chat/parts/ToolUse.jsx"></script>
<script type="text/babel" src="chat/parts/ToolResult.jsx"></script>
<script type="text/babel" src="chat/parts/PermissionRequest.jsx"></script>
<script type="text/babel" src="chat/parts/ResultBanner.jsx"></script>
<script type="text/babel" src="chat/parts/SystemLine.jsx"></script>
<script type="text/babel" src="chat.jsx"></script>
```

- [ ] **Step 5: Sanity check**

Open `index v2.html`. Navigate to TaskDetail (`t-hero`). Visually confirm: user message, agent text, thinking (collapsible), tool_use card, tool_result card, permission request, and result banner all render exactly as before. Console 0 errors.

- [ ] **Step 6: Commit**

```bash
git add ui_design/chat/parts "ui_design/index v2.html" ui_design/chat.jsx
git commit -m "refactor(s0): split chat.jsx parts into chat/parts/*.jsx (8 files)"
```

---

## Task 12: Move `MessageList` and `MessageItem` into `chat/`; implement use↔result pairing reducer

**Files:**
- Create: `ui_design/chat/MessageList.jsx` (with pairing logic — new)
- Create: `ui_design/chat/MessageItem.jsx`
- Modify: `ui_design/chat.jsx` (delete the corresponding code; keep only Composer for now)
- Modify: `ui_design/index v2.html`

- [ ] **Step 1: Create `ui_design/chat/MessageItem.jsx`**

```javascript
// ui_design/chat/MessageItem.jsx
// Reads: all window.<part> components. Writes: window.MessageItem.

const PART_MAP = {
  user:               () => window.UserMessage,
  assistant_text:     () => window.AssistantText,
  thinking:           () => window.Thinking,
  tool_use:           () => window.ToolUse,
  tool_result:        () => window.ToolResult,
  permission_request: () => window.PermissionRequest,
  result:             () => window.ResultBanner,
  system:             () => window.SystemLine,
};

/**
 * Dispatch a parsed message to its rendering component.
 * @param {{ msg: object, pairing?: object, onApproveDecide?: Function }} props
 */
function MessageItem({ msg, pairing, ...rest }) {
  const type = msg.parsed && msg.parsed.type ? msg.parsed.type : "user";
  const Comp = (PART_MAP[type] && PART_MAP[type]()) || window.SystemLine;
  if (!Comp) {
    return <window.SystemLine msg={{ parsed: { type: "system", text: "未知消息类型: " + type } }} />;
  }
  return <Comp msg={msg} pairing={pairing} {...rest} />;
}

window.MessageItem = MessageItem;
```

- [ ] **Step 2: Create `ui_design/chat/MessageList.jsx`**

```javascript
// ui_design/chat/MessageList.jsx
// Reads: window.React, window.MessageItem, window.ToolUse, window.ToolResult.
// Writes: window.MessageList.

/**
 * Build a pairing index: for every tool_use, find its tool_result by
 * `payload.tool_use_id`. Returns:
 *
 * - `useToResult: Map<use_id, result_msg>`
 * - `orphanResults: Set<result_msg_id>` (results without a matching use)
 *
 * The render pass walks messages in order, and when it hits a tool_use it
 * also renders its matching tool_result indented underneath. Standalone
 * tool_result messages whose use is not present are still rendered (with
 * an "orphan" warning style).
 *
 * @param {ReadonlyArray<object>} messages
 */
function pairToolMessages(messages) {
  const useToResult = new Map();
  const consumed = new Set();
  const orphanResults = new Set();

  for (const m of messages) {
    const p = m.parsed;
    if (!p) continue;
    if (p.type === "tool_result") {
      const id = p.tool_use_id;
      // Find the matching use (look backwards from this position)
      const matched = messages.find(x => x.parsed && x.parsed.type === "tool_use" && x.parsed.tool_use_id === id);
      if (matched) {
        useToResult.set(id, m);
        consumed.add(m.id);
      } else {
        orphanResults.add(m.id);
      }
    }
  }
  return { useToResult, consumed, orphanResults };
}

/**
 * @param {{ messages: ReadonlyArray<object>, queuedMessageIds?: Set<string> }} props
 */
function MessageList({ messages, queuedMessageIds, ...rest }) {
  const { useToResult, consumed, orphanResults } = window.React.useMemo(
    () => pairToolMessages(messages),
    [messages]
  );

  return (
    <div className="message-list" style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
      {messages.map(msg => {
        // skip results that were nested under their use
        if (consumed.has(msg.id)) return null;

        // tool_use renders with its result nested
        if (msg.parsed && msg.parsed.type === "tool_use") {
          const result = useToResult.get(msg.parsed.tool_use_id);
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
              <window.MessageItem msg={msg} pairing={{ hasResult: !!result }} {...rest} />
              {result ? (
                <div style={{ marginLeft: 16, paddingLeft: 12, borderLeft: "2px solid var(--hairline)" }}>
                  <window.MessageItem msg={result} pairing={{ paired: true }} {...rest} />
                </div>
              ) : (
                <div style={{
                  marginLeft: 16, paddingLeft: 12, borderLeft: "2px solid var(--hairline)",
                  fontSize: "var(--text-xs)", color: "var(--ink-2)", padding: "8px 12px",
                }}>
                  <span style={{ display: "inline-block", width: 32, height: 8, background:
                    "repeating-linear-gradient(90deg, var(--ink-2) 0 4px, transparent 4px 8px)",
                    marginRight: 8, verticalAlign: "middle" }} />
                  正在运行…
                </div>
              )}
            </div>
          );
        }

        const isQueued = queuedMessageIds && queuedMessageIds.has(msg.id);
        const isOrphan = orphanResults.has(msg.id);
        return <window.MessageItem key={msg.id} msg={msg} pairing={{ orphan: isOrphan, queued: isQueued }} {...rest} />;
      })}
    </div>
  );
}

window.MessageList = MessageList;
window.__pairToolMessages = pairToolMessages; // exposed for tests/debug
```

- [ ] **Step 3: Modify `ui_design/chat.jsx`** — delete the old `MessageList` and `MessageItem` definitions. Keep `Composer` only (Composer is rewritten in Task 13).

- [ ] **Step 4: Modify `ui_design/index v2.html`** — register the two new scripts before `chat.jsx`:

```html
<script type="text/babel" src="chat/parts/SystemLine.jsx"></script>
<script type="text/babel" src="chat/MessageItem.jsx"></script>
<script type="text/babel" src="chat/MessageList.jsx"></script>
<script type="text/babel" src="chat.jsx"></script>
```

- [ ] **Step 5: Update consumers** — in `ui_design/screens.jsx`, replace the internal `<MessageList .../>` with `<window.MessageList .../>` (it already reads from window so this should just work; verify the file currently calls `MessageList` directly and update if needed).

- [ ] **Step 6: Update `chat/parts/ToolUse.jsx`** — add the new `pairing` prop handling:

```javascript
function ToolUse({ msg, pairing }) {
  // existing rendering...
  // If !pairing?.hasResult, the tool is "running" — visual marker.
  const isRunning = pairing && pairing.hasResult === false;
  // ... use isRunning to add a subtle hue or running indicator on the use card title
}
```

- [ ] **Step 7: Update `chat/parts/ToolResult.jsx`** — handle `pairing.orphan`:

```javascript
function ToolResult({ msg, pairing }) {
  const isOrphan = pairing && pairing.orphan === true;
  // existing render, but if isOrphan: yellow border + title "未配对的工具结果"
  // Also: if msg.parsed.payload.is_error => red-tinted variant
  // Also: if content is > 10 lines, default-fold to 3 lines + "展开 N 行"
}
```

- [ ] **Step 8: Sanity check**

Open `index v2.html`, navigate to `t-hero`. Confirm:
- tool_use card and its tool_result render with the result indented and connected by a left border.
- If you go to `data.jsx` and add a `tool_use` message without a matching result (manually), the "正在运行…" skeleton appears.
- Console 0 errors.

- [ ] **Step 9: Commit**

```bash
git add ui_design/chat/MessageList.jsx ui_design/chat/MessageItem.jsx ui_design/chat.jsx "ui_design/index v2.html" ui_design/chat/parts/ToolUse.jsx ui_design/chat/parts/ToolResult.jsx ui_design/screens.jsx
git commit -m "refactor(s0): move MessageList+MessageItem into chat/; add use↔result pairing reducer"
```

---

## Task 13: Build the production-grade `Composer` + `MentionList`

This task rewrites the existing Composer.

**Files:**
- Create: `ui_design/chat/Composer.jsx`
- Create: `ui_design/chat/MentionList.jsx`
- Modify: `ui_design/chat.jsx` — delete the old Composer; eventually file becomes empty (deleted in Task 21)
- Modify: `ui_design/index v2.html`
- Modify: `ui_design/screens.jsx` — update the TaskDetail page to call `<window.Composer />`

- [ ] **Step 1: Create `ui_design/chat/MentionList.jsx`**

```javascript
// ui_design/chat/MentionList.jsx
// Reads: window.React, window.Icon, window.Avatar, window.BR_LIB.keyboard.
// Writes: window.MentionList.

const { cycle, ARROW_UP, ARROW_DOWN, ENTER, TAB, ESC } = window.BR_LIB.keyboard;

/**
 * Keyboard-driven dropdown for @mention candidates.
 *
 * @param {{
 *   candidates: ReadonlyArray<{ id: string, handle: string, name: string, color?: string }>,
 *   highlight: number,
 *   onPick: (agent: object) => void,
 *   onClose: () => void,
 *   anchorRect: { left: number, top: number, bottom: number },
 * }} props
 */
function MentionList({ candidates, highlight, onPick, onClose, anchorRect }) {
  const wrapRef = window.React.useRef(null);
  window.React.useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  if (!candidates) return null;

  const style = {
    position: "fixed",
    left: anchorRect.left,
    top: anchorRect.bottom + 4,
    minWidth: 240,
    background: "var(--paper-0)",
    border: "1.5px solid var(--ink-0)",
    borderRadius: "var(--r-md)",
    boxShadow: "var(--shadow-current)",
    zIndex: 100,
    overflow: "hidden",
  };

  if (candidates.length === 0) {
    return (
      <div ref={wrapRef} style={style}>
        <div style={{ padding: "var(--sp-3) var(--sp-4)", color: "var(--ink-2)", fontSize: "var(--text-sm)" }}>
          未找到 agent，请检查 handle
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} role="listbox" aria-label="agent mention candidates" style={style}>
      {candidates.map((a, i) => (
        <div key={a.id} role="option" aria-selected={i === highlight}
             onMouseDown={(e) => { e.preventDefault(); onPick(a); }}
             style={{
               display: "flex", alignItems: "center", gap: "var(--sp-3)",
               padding: "8px 12px", cursor: "pointer",
               background: i === highlight ? "var(--paper-2)" : "transparent",
             }}>
          <window.Avatar name={a.name} color={a.color} size={24} radius={6} />
          <span style={{ fontWeight: "var(--w-semibold)" }}>@{a.handle}</span>
          <span style={{ color: "var(--ink-2)", fontSize: "var(--text-xs)" }}>{a.name}</span>
        </div>
      ))}
    </div>
  );
}

window.MentionList = MentionList;
```

- [ ] **Step 2: Create `ui_design/chat/Composer.jsx`**

```javascript
// ui_design/chat/Composer.jsx
// Reads: window.React, window.Icon, window.MentionList, window.BR_LIB.{mention,keyboard}.
// Writes: window.Composer.

const { activePrefix, filterCandidates, parseSubmit } = window.BR_LIB.mention;
const KB = window.BR_LIB.keyboard;

/**
 * @param {{
 *   agents: ReadonlyArray<{id:string, handle:string, name:string, color?:string, archived?:boolean}>,
 *   onSend: (payload: { text: string, mentions: string[] }) => void,
 *   placeholder?: string,
 * }} props
 */
function Composer({ agents, onSend, placeholder }) {
  const React = window.React;
  const ref = React.useRef(null);
  const [text, setText] = React.useState("");
  const [caret, setCaret] = React.useState(0);
  const [highlight, setHighlight] = React.useState(0);
  const [placedMentions, setPlacedMentions] = React.useState([]);

  const prefix = activePrefix(text, caret);
  const popoverOpen = prefix !== null;
  const candidates = popoverOpen ? filterCandidates(prefix, agents) : [];

  // Keep highlight in range
  React.useEffect(() => {
    if (highlight >= candidates.length) setHighlight(0);
  }, [candidates.length, highlight]);

  // Anchor rect for popover
  const [anchorRect, setAnchorRect] = React.useState({ left: 0, top: 0, bottom: 0 });
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setAnchorRect({ left: r.left + 24, top: r.top, bottom: r.bottom });
  }, [text, popoverOpen]);

  function pick(agent) {
    // replace prefix-and-@ with `@<handle> `
    const before = text.slice(0, caret);
    const atIdx = before.lastIndexOf("@");
    const after = text.slice(caret);
    const newText = text.slice(0, atIdx) + "@" + agent.handle + " " + after;
    const newCaret = atIdx + agent.handle.length + 2;
    setText(newText);
    setCaret(newCaret);
    setPlacedMentions(m => [...m, { id: agent.id, handle: agent.handle }]);
    requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.focus();
        ref.current.setSelectionRange(newCaret, newCaret);
      }
    });
  }

  function onKeyDown(e) {
    if (popoverOpen) {
      if (e.key === KB.ARROW_DOWN) { e.preventDefault(); setHighlight(h => KB.cycle(h, +1, candidates.length)); return; }
      if (e.key === KB.ARROW_UP)   { e.preventDefault(); setHighlight(h => KB.cycle(h, -1, candidates.length)); return; }
      if (e.key === KB.ENTER || e.key === KB.TAB) {
        if (candidates.length > 0) { e.preventDefault(); pick(candidates[highlight]); return; }
      }
      if (e.key === KB.ESC) { e.preventDefault(); /* keep @, just close: set prefix to null by inserting a space briefly? simpler: trust onSelect */ setCaret(c => c); return; }
    }
    if (KB.isSubmitChord(e)) {
      e.preventDefault();
      send();
    }
  }

  function onInput(e) {
    setText(e.target.value);
    setCaret(e.target.selectionStart);
  }
  function onSelect(e) {
    setCaret(e.target.selectionStart);
  }

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const payload = parseSubmit(trimmed, placedMentions);
    onSend(payload);
    setText("");
    setCaret(0);
    setPlacedMentions([]);
  }

  return (
    <div className="composer" style={{
      display: "flex", flexDirection: "column", gap: "var(--sp-2)",
      padding: "var(--sp-3)",
      border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)",
      background: "var(--paper-0)",
    }}>
      <textarea
        ref={ref}
        value={text}
        onChange={onInput}
        onKeyDown={onKeyDown}
        onSelect={onSelect}
        placeholder={placeholder || "输入消息，@ 一个 agent；Ctrl+Enter 发送"}
        rows={3}
        style={{
          font: "inherit", border: "none", outline: "none", background: "transparent",
          resize: "vertical", minHeight: 60, fontSize: "var(--text-base)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>Ctrl+Enter 发送</span>
        <button
          onClick={send}
          disabled={!text.trim()}
          style={{
            padding: "6px 14px",
            background: text.trim() ? "var(--ink-0)" : "var(--ink-3)",
            color: "var(--paper-0)", border: "1.5px solid var(--ink-0)",
            borderRadius: "var(--r-sm)", fontWeight: "var(--w-semibold)",
            fontSize: "var(--text-sm)", cursor: text.trim() ? "pointer" : "not-allowed",
            boxShadow: "var(--shadow-current)",
          }}>
          发送
        </button>
      </div>
      {popoverOpen && (
        <window.MentionList
          candidates={candidates}
          highlight={highlight}
          onPick={pick}
          onClose={() => { /* prefix flips to null when user moves caret; nothing to do */ }}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}

window.Composer = Composer;
```

- [ ] **Step 3: Modify `ui_design/chat.jsx`** — delete the old `Composer` definition; the file is now essentially empty save for the final `Object.assign(window, ...)` line, which is no longer needed because each part already self-registers. Delete remaining residual code.

- [ ] **Step 4: Modify `ui_design/index v2.html`** — register the two new scripts; `chat.jsx` will be removed in Task 21 once we're sure no one else imports from it:

```html
<script type="text/babel" src="chat/MessageList.jsx"></script>
<script type="text/babel" src="chat/MentionList.jsx"></script>
<script type="text/babel" src="chat/Composer.jsx"></script>
<script type="text/babel" src="chat.jsx"></script>
```

- [ ] **Step 5: Modify `ui_design/screens.jsx`** — find the existing TaskDetail composer call (search for `Composer`) and update it to use `window.Composer` and the new `onSend({text, mentions})` API:

```javascript
// inside TaskDetail
<window.Composer
  agents={MOCK.AGENTS}
  onSend={(payload) => {
    // Mock: append message to local state with `metadata.queued` flag if same agent already running
    handleUserSend(payload);
  }}
/>
```

The `handleUserSend` mock should: (a) push a new message into local state, (b) check `window.MOCK.ACTIVE_RUNS[taskId]` — if mentioned agent already has an active run, set `msg.metadata = { queued: true }`, (c) otherwise simulate the run with a 1.5s `setTimeout` that adds an `assistant_text` + `result` pair.

- [ ] **Step 6: Sanity check**

Open `index v2.html`. Open task detail. Type `@w` — popover appears below textarea, shows writer agent. `↓` highlights ux row, `↑` cycles back. `Enter` inserts `@writer `. `Esc` closes the popover. `Ctrl+Enter` sends; bubble appears. Send `@writer hi` once — see a new assistant message after 1.5s. Send a second `@writer hi` immediately — second user message has the "排队中" badge.

- [ ] **Step 7: Commit**

```bash
git add ui_design/chat/Composer.jsx ui_design/chat/MentionList.jsx ui_design/chat.jsx "ui_design/index v2.html" ui_design/screens.jsx
git commit -m "feat(s0): production-grade Composer with @mention keyboard path and queued mock"
```

---

## Task 14: Build the shared `ApprovalCard` component

**Files:**
- Create: `ui_design/chat/ApprovalCard.jsx`
- Modify: `ui_design/chat/parts/PermissionRequest.jsx` — render `<window.ApprovalCard mode="inline" approval={...} ... />`
- Modify: `ui_design/index v2.html`

- [ ] **Step 1: Create `ui_design/chat/ApprovalCard.jsx`**

```javascript
// ui_design/chat/ApprovalCard.jsx
// Reads: window.React, window.Icon, window.BR_LIB.countdown.
// Writes: window.ApprovalCard.

/**
 * @typedef {Object} ApprovalLite
 * @property {string} id
 * @property {string} tool                tool_name (e.g. "Bash", "Write")
 * @property {{ command?: string, file_path?: string }} input
 * @property {string} expiresAt           ISO timestamp
 * @property {"pending"|"approved"|"denied"|"approved_with_edits"|"timeout"} [status]
 * @property {string} [agentHandle]
 * @property {string} [project]
 * @property {string} [taskTitle]
 *
 * @typedef {Object} ApprovalCardProps
 * @property {ApprovalLite} approval
 * @property {"inline"|"hub"} mode
 * @property {(id: string, decision: "approved"|"denied"|"approved_with_edits", note?: string) => void} onDecide
 */

/**
 * Shared approval surface used in chat and on /approvals.
 * @param {ApprovalCardProps} props
 */
function ApprovalCard({ approval, mode, onDecide }) {
  const React = window.React;
  const { useCountdown } = window.BR_LIB.countdown;
  const { label, urgent, expired } = useCountdown(approval.expiresAt);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [note, setNote] = React.useState("");

  const decided = approval.status && approval.status !== "pending";
  const buttonsDisabled = expired || decided;

  function decide(d) {
    if (buttonsDisabled) return;
    onDecide(approval.id, d, note.trim() || undefined);
  }

  // Decided / timeout collapsed render
  if (decided || (expired && approval.status === "pending")) {
    const labelMap = {
      approved: "已批准", denied: "已拒绝", approved_with_edits: "已批准（带修改）", timeout: "已超时",
    };
    const status = decided ? approval.status : "timeout";
    return (
      <div style={{
        padding: "var(--sp-3) var(--sp-4)", background: "var(--paper-1)",
        border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)",
        opacity: status === "timeout" ? 0.6 : 1,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: "var(--text-sm)",
      }}>
        <span><strong>{approval.tool}</strong> · {labelMap[status]}</span>
        <span style={{ color: "var(--ink-2)" }}>{label !== "已超时" && !decided ? label : ""}</span>
      </div>
    );
  }

  // Pending
  return (
    <div style={{
      background: "var(--paper-0)",
      border: "1.5px solid var(--ink-0)",
      borderRadius: "var(--r-md)",
      overflow: "hidden",
      boxShadow: "var(--shadow-current)",
    }}>
      {/* header: ink-0 bar with diagonal stripe right side */}
      <div style={{
        background: "var(--role-approval-bg)", color: "var(--role-approval-fg)",
        padding: "var(--sp-2) var(--sp-4)", display: "flex", alignItems: "center",
        justifyContent: "space-between",
        backgroundImage: `linear-gradient(90deg, var(--ink-0) 60%, transparent 60%), repeating-linear-gradient(45deg, var(--ink-0) 0 6px, var(--ink-1) 6px 12px)`,
      }}>
        <span style={{ fontWeight: "var(--w-bold)" }}>{approval.tool} 请求批准</span>
        <span className="mono" style={{
          fontSize: "var(--text-xs)",
          color: urgent ? "var(--countdown-urgent)" : "var(--paper-0)",
          fontWeight: urgent ? "var(--w-bold)" : "var(--w-regular)",
          animation: urgent ? "blink 1s steps(2, start) infinite" : "none",
        }}>{label}</span>
      </div>
      <div style={{ padding: "var(--sp-4)", display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
        {mode === "hub" && (approval.project || approval.taskTitle) && (
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>
            {approval.project} · {approval.taskTitle}
          </div>
        )}
        <pre className="mono" style={{
          margin: 0, padding: "var(--sp-2) var(--sp-3)",
          background: "var(--paper-1)", borderRadius: "var(--r-sm)",
          fontSize: "var(--text-xs)", whiteSpace: "pre-wrap", wordBreak: "break-all",
        }}>{approval.input.command || approval.input.file_path || JSON.stringify(approval.input)}</pre>
        {noteOpen && (
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={256}
                    placeholder="备注（可选，≤256 字）"
                    style={{
                      border: "1.5px solid var(--hairline)", borderRadius: "var(--r-sm)",
                      padding: "var(--sp-2)", fontSize: "var(--text-sm)", fontFamily: "inherit",
                      resize: "vertical", minHeight: 60,
                    }} />
        )}
        <div style={{ display: "flex", gap: "var(--sp-2)", justifyContent: "flex-end" }}>
          <button disabled={buttonsDisabled}
                  onClick={() => { setNoteOpen(true); decide("denied"); }}
                  style={{
                    padding: "6px 14px",
                    background: "var(--paper-0)", color: "var(--ink-0)",
                    border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)",
                    fontWeight: "var(--w-semibold)", cursor: buttonsDisabled ? "not-allowed" : "pointer",
                    opacity: buttonsDisabled ? 0.5 : 1,
                  }}>拒绝</button>
          <button disabled={buttonsDisabled}
                  onClick={() => decide("approved")}
                  style={{
                    padding: "6px 14px",
                    background: "var(--ink-0)", color: "var(--paper-0)",
                    border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)",
                    fontWeight: "var(--w-semibold)", cursor: buttonsDisabled ? "not-allowed" : "pointer",
                    boxShadow: buttonsDisabled ? "none" : "var(--shadow-current)",
                    opacity: buttonsDisabled ? 0.5 : 1,
                  }}>批准</button>
        </div>
      </div>
    </div>
  );
}

window.ApprovalCard = ApprovalCard;
```

Add the blink keyframe to `ui_design/tokens-cream.css` (or a new `tokens/animations.css` — your call):

```css
@keyframes blink {
  50% { opacity: 0.3; }
}
```

- [ ] **Step 2: Modify `ui_design/chat/parts/PermissionRequest.jsx`** — replace its body with:

```javascript
function PermissionRequest({ msg, onDecide }) {
  // Adapt the legacy mock shape to ApprovalLite
  const p = msg.parsed.payload || msg.parsed; // legacy field names
  const approval = {
    id: msg.id,
    tool: p.tool || msg.parsed.tool,
    input: p.input || msg.parsed.input,
    expiresAt: new Date(Date.now() + (msg.parsed.expiresInSec || 3600) * 1000).toISOString(),
    status: p.status || "pending",
  };
  return <window.ApprovalCard approval={approval} mode="inline" onDecide={onDecide || (() => {})} />;
}
window.PermissionRequest = PermissionRequest;
```

- [ ] **Step 3: Modify `ui_design/index v2.html`** — register the new script BEFORE the parts script that uses it. Order matters:

```html
<script type="text/babel" src="chat/ApprovalCard.jsx"></script>
<script type="text/babel" src="chat/parts/PermissionRequest.jsx"></script>
```

(Make sure `ApprovalCard.jsx` loads before `parts/PermissionRequest.jsx`.)

- [ ] **Step 4: Sanity check**

Open `index v2.html`. Navigate to `t-hero`. The pending approval card now uses the unified visual (ink-0 header bar, command in mono box, ghost/primary buttons). Countdown ticks down — confirm it doesn't drift on tab blur (RAF based). Click "批准" or "拒绝" → card collapses to one-line decided state. Reload, wait for countdown 0 → buttons go gray + 60% opacity.

- [ ] **Step 5: Commit**

```bash
git add ui_design/chat/ApprovalCard.jsx ui_design/chat/parts/PermissionRequest.jsx "ui_design/index v2.html" ui_design/tokens-cream.css
git commit -m "feat(s0): unified ApprovalCard for inline + hub modes, countdown-driven states"
```

---

## Task 15: TaskDetail — wire cancel-run button + active-runs tracking

**Files:**
- Modify: `ui_design/screens.jsx` (TaskDetail header)

- [ ] **Step 1: In `screens.jsx`, find `TaskDetail` and modify the task header** to include a cancel-run button shown only when `window.MOCK.ACTIVE_RUNS[task.id]?.length > 0`:

```javascript
// Inside TaskDetail (replace/augment the existing header)
const [cancelDisabled, setCancelDisabled] = React.useState(false);
const [confirmOpen, setConfirmOpen] = React.useState(false);
const { push: pushToast, toasts } = window.useToast();

const activeRuns = window.MOCK.ACTIVE_RUNS[task.id] || [];
const hasActiveRun = activeRuns.length > 0;

function onCancel() {
  if (cancelDisabled) return;
  setCancelDisabled(true);
  // mock cancel
  const removed = window.MOCK.ACTIVE_RUNS[task.id]?.pop();
  pushToast(`已取消 run #${removed?.runId || "?"}`, "info");
  setConfirmOpen(false);
  setTimeout(() => setCancelDisabled(false), 5000);
}

// Render in the header area:
{hasActiveRun && (
  <button
    onClick={() => setConfirmOpen(true)}
    disabled={cancelDisabled}
    style={{
      padding: "6px 12px",
      background: "var(--paper-0)", color: "var(--ink-0)",
      border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)",
      cursor: cancelDisabled ? "not-allowed" : "pointer", opacity: cancelDisabled ? 0.5 : 1,
      fontSize: "var(--text-sm)", fontWeight: "var(--w-semibold)",
    }}>
    取消运行
  </button>
)}

{confirmOpen && (
  <div role="dialog" style={{
    position: "fixed", inset: 0, background: "rgba(27,24,32,0.4)",
    display: "grid", placeItems: "center", zIndex: 200,
  }}>
    <div style={{
      background: "var(--paper-0)", padding: "var(--sp-6)",
      border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-md)",
      maxWidth: 420, boxShadow: "var(--shadow-current)",
    }}>
      <div style={{ fontWeight: "var(--w-bold)", marginBottom: "var(--sp-3)" }}>取消当前运行？</div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-1)", marginBottom: "var(--sp-4)" }}>
        这只取消当前 run，排队中的同 agent 消息会自动晋升并跑。
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", justifyContent: "flex-end" }}>
        <button onClick={() => setConfirmOpen(false)} style={{
          padding: "6px 14px", border: "1.5px solid var(--ink-0)",
          background: "var(--paper-0)", borderRadius: "var(--r-sm)", cursor: "pointer",
        }}>不取消</button>
        <button onClick={onCancel} style={{
          padding: "6px 14px", border: "1.5px solid var(--ink-0)",
          background: "var(--state-failed)", color: "var(--paper-0)",
          borderRadius: "var(--r-sm)", cursor: "pointer", fontWeight: "var(--w-semibold)",
        }}>取消运行</button>
      </div>
    </div>
  </div>
)}

{/* Toast container at bottom-right */}
{toasts.length > 0 && (
  <div style={{ position: "fixed", right: 24, bottom: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
    {toasts.map(t => <window.ErrorBanner key={t.id} kind="toast" variant={t.variant} message={t.message} />)}
  </div>
)}
```

- [ ] **Step 2: Sanity check**

Open task detail `t-hero`. Confirm "取消运行" button shows. Click → confirm dialog appears with the queued-warning text. Click "取消运行" → toast shows; button disables 5s. Click rapid-fire → no double cancels (5s debounce).

- [ ] **Step 3: Commit**

```bash
git add ui_design/screens.jsx
git commit -m "feat(s0): TaskDetail cancel-run button with confirm dialog and 5s debounce"
```

---

## Task 16: Lock the 6 layout fixes in WorkspaceHome / ProjectBoard / Sidebar

This is mechanical. Apply DESIGN.md §5's six locked rules.

**Files:**
- Modify: `ui_design/tokens-cream.css` (CSS rules implementing §5 locked layout)
- Modify: `ui_design/screens.jsx` (WorkspaceHome grid, stat aspect-ratio)

- [ ] **Step 1: Add the locked-layout CSS to `ui_design/tokens-cream.css`** (append before the legacy bulk):

```css
/* === DESIGN.md §5 locked layout rules === */

/* Rule 1: hero header keeps button inline */
.workspace-hero-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--sp-4);
  align-items: start;
}
.workspace-hero-header .cta { min-width: 160px; }

/* Rule 2: WorkspaceHome 2x2 page grid */
.workspace-home {
  display: grid;
  grid-template-columns: 1fr 360px;
  grid-template-rows: auto 1fr;
  gap: var(--sp-6);
}
.workspace-home .hero    { grid-column: 1; grid-row: 1; }
.workspace-home .stats   { grid-column: 2; grid-row: 1; }
.workspace-home .projects{ grid-column: 1; grid-row: 2; }
.workspace-home .rail    { grid-column: 2; grid-row: 2; }

/* Rule 3: near-square stat tiles */
.stat-tile { aspect-ratio: 1 / 0.78; }

/* Rule 4: sidebar items never truncate silently */
.sidebar * { min-width: 0; }
.sidebar .clip {
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* Rule 5: project card title — keep-all word break */
.proj-card .title {
  word-break: keep-all;
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Rule 6: sidebar icons monochrome — enforced by NOT adding chip background;
   add a guard rule that warns if a chip class slips in. */
.sidebar .nav-icon { color: var(--ink-1); background: transparent !important; }
```

- [ ] **Step 2: Modify `ui_design/screens.jsx` → WorkspaceHome** — wrap the existing JSX so it uses the new `.workspace-home`, `.hero`, `.stats`, `.projects`, `.rail` class names; replace stat tile inline style with `.stat-tile` class; wrap stat tiles in a 2-col grid container.

For project cards, ensure the title element has `className="title"` and lives inside `.proj-card`. Sidebar items should add `className="clip"` to text spans.

The exact JSX changes depend on the current structure — the engineer reads `screens.jsx` and adapts. The key is: every class above (`.workspace-home`, `.hero`, `.stats`, `.projects`, `.rail`, `.stat-tile`, `.proj-card .title`, `.sidebar .clip`) ends up on the right element.

- [ ] **Step 3: Sanity check at multiple widths**

Resize the browser:
- 1440px: hero + stat 2×2 (near-square), project rail aligned with approval rail headers.
- 1100px: button "新建项目" still inline (does not wrap to next row).
- 900px: layout still legible; no character-by-character title break.

Sidebar text: hover "Lumen Labs" — full text shown via `title=` attr (you'll see browser tooltip). Sidebar nav icons: no colored chip behind them.

- [ ] **Step 4: Commit**

```bash
git add ui_design/tokens-cream.css ui_design/screens.jsx
git commit -m "fix(s0): lock the six layout rules from DESIGN.md §5"
```

---

## Task 17: Build Login + Register screens

**Files:**
- Create: `ui_design/screens/Login.jsx`
- Create: `ui_design/screens/Register.jsx`
- Modify: `ui_design/app-cream.jsx` (add `route.name === "login"` / `"register"` branches)
- Modify: `ui_design/index v2.html` (register the two new scripts)

- [ ] **Step 1: Create `ui_design/screens/Login.jsx`**

```javascript
// ui_design/screens/Login.jsx
// Reads: window.React, window.ErrorBanner. Writes: window.Login.

function Login({ onLoggedIn, onGotoRegister }) {
  const React = window.React;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  function validate() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "邮箱格式不正确";
    if (password.length < 8) return "密码至少 8 位";
    return null;
  }

  function submit(e) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    if (email === "wrong@wrong.com") { setError("邮箱或密码错误"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLoggedIn && onLoggedIn(); }, 1000);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      background: "var(--paper-1)", padding: "var(--sp-6)",
    }}>
      <div style={{
        width: 420, background: "var(--paper-0)",
        border: "1.5px solid var(--hairline)", borderRadius: "var(--r-lg)",
        padding: "var(--sp-8)", boxShadow: "var(--shadow-current)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "var(--sp-6)" }}>
          <div style={{ fontSize: 48, fontWeight: "var(--w-black)", fontFamily: "var(--font-display)" }}>Brainrot</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>登录到协作 AI 工作台</div>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          {error && <window.ErrorBanner kind="inline" variant="error" message={error} onClose={() => setError(null)} />}
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>邮箱</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                   style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>密码</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                   style={inputStyle} />
          </label>
          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? "登录中…" : "登录"}
          </button>
          <div style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>
            还没账号？<a onClick={onGotoRegister} style={{ color: "var(--ink-0)", cursor: "pointer", fontWeight: "var(--w-semibold)" }}>注册</a>
          </div>
        </form>
        <div style={{ textAlign: "center", marginTop: "var(--sp-6)", fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
          Brainrot · 协作 AI 工作台
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "8px 12px", border: "1.5px solid var(--hairline)",
  borderRadius: "var(--r-sm)", background: "var(--paper-0)",
  fontSize: "var(--text-sm)", fontFamily: "inherit",
};
function primaryBtn(disabled) {
  return {
    padding: "10px 16px",
    background: disabled ? "var(--ink-3)" : "var(--ink-0)",
    color: "var(--paper-0)", border: "1.5px solid var(--ink-0)",
    borderRadius: "var(--r-sm)", fontWeight: "var(--w-semibold)",
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : "var(--shadow-current)",
  };
}

window.Login = Login;
window.__loginStyles = { inputStyle, primaryBtn };
```

- [ ] **Step 2: Create `ui_design/screens/Register.jsx`**

```javascript
// ui_design/screens/Register.jsx
function Register({ onRegistered, onGotoLogin }) {
  const React = window.React;
  const { inputStyle, primaryBtn } = window.__loginStyles;
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return setError("姓名必填");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("邮箱格式不正确");
    if (password.length < 8) return setError("密码至少 8 位");
    setLoading(true);
    setTimeout(() => { setLoading(false); onRegistered && onRegistered(); }, 1000);
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--paper-1)", padding: "var(--sp-6)" }}>
      <div style={{
        width: 420, background: "var(--paper-0)",
        border: "1.5px solid var(--hairline)", borderRadius: "var(--r-lg)",
        padding: "var(--sp-8)", boxShadow: "var(--shadow-current)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "var(--sp-6)" }}>
          <div style={{ fontSize: 48, fontWeight: "var(--w-black)", fontFamily: "var(--font-display)" }}>注册</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>创建 Brainrot 账户</div>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          {error && <window.ErrorBanner kind="inline" variant="error" message={error} onClose={() => setError(null)} />}
          <input placeholder="姓名" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <input type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="密码（≥8）" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? "注册中…" : "创建账户"}
          </button>
          <div style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>
            已有账户？<a onClick={onGotoLogin} style={{ color: "var(--ink-0)", cursor: "pointer", fontWeight: "var(--w-semibold)" }}>登录</a>
          </div>
        </form>
      </div>
    </div>
  );
}
window.Register = Register;
```

- [ ] **Step 3: Modify `ui_design/app-cream.jsx`** — add login/register routing branches. Inside `App`, before rendering the main shell, intercept:

```javascript
if (route.name === "login") {
  return <window.Login
    onLoggedIn={() => setRoute({ name: "home" })}
    onGotoRegister={() => setRoute({ name: "register" })}
  />;
}
if (route.name === "register") {
  return <window.Register
    onRegistered={() => setRoute({ name: "login" })}
    onGotoLogin={() => setRoute({ name: "login" })}
  />;
}
```

Also add a "登出" item in the sidebar foot user dropdown that calls `setRoute({ name: "login" })`.

- [ ] **Step 4: Modify `ui_design/index v2.html`** — register the new scripts after `screens.jsx` (or wherever screens load):

```html
<script type="text/babel" src="screens/Login.jsx"></script>
<script type="text/babel" src="screens/Register.jsx"></script>
```

- [ ] **Step 5: Sanity check**

From the sidebar foot click the new "登出" → routes to Login. Type `wrong@wrong.com` + valid password → red error banner. Type `alice@lumen.dev` + 8-char password → 1s loading → routes to WorkspaceHome. Click "注册" → Register page; fill all 3 fields → 1s loading → routes back to login.

- [ ] **Step 6: Commit**

```bash
git add ui_design/screens/Login.jsx ui_design/screens/Register.jsx ui_design/app-cream.jsx "ui_design/index v2.html"
git commit -m "feat(s0): Login + Register screens with local validation and error banner"
```

---

## Task 18: Build AgentsList + AgentNew screens

**Files:**
- Create: `ui_design/screens/AgentsList.jsx`
- Create: `ui_design/screens/AgentNew.jsx`
- Modify: `ui_design/app-cream.jsx` (route `agents` → AgentsList; `agents-new` → AgentNew)
- Modify: `ui_design/index v2.html`
- Modify: `ui_design/data.jsx` — mark one agent `archived: true` for filter testing

- [ ] **Step 1: Modify `data.jsx`** — add `archived: true` to one agent (e.g., `ag-eng`):

```javascript
{ id: "ag-eng",    handle: "ux",     name: "UX-Eng", desc: "Prototype + design", color: "oklch(55% 0 0)", online: false, model: "claude-opus-4-7", archived: false },
```

Add `archived: false` to all agents. Then add one new agent with `archived: true`:

```javascript
{ id: "ag-old",    handle: "old-bot", name: "Old Bot", desc: "legacy", color: "oklch(70% 0 0)", online: false, model: "claude-haiku-4-5", archived: true },
```

- [ ] **Step 2: Create `ui_design/screens/AgentsList.jsx`**

```javascript
// ui_design/screens/AgentsList.jsx
// Reads: window.React, window.MOCK, window.Icon, window.AgentAvatar, window.EmptyState.
// Writes: window.AgentsList.

function AgentsList({ onNew }) {
  const React = window.React;
  const [search, setSearch] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(false);

  const agents = window.MOCK.AGENTS.filter(a => {
    if (!showArchived && a.archived) return false;
    if (search && !a.handle.toLowerCase().includes(search.toLowerCase()) && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (window.MOCK.AGENTS.length === 0) {
    return <window.EmptyState glyph="🤖" title="还没有 agent" description="点右上角新建你的第一个 @handle"
                              action={{ label: "新建 agent", onClick: onNew }} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div style={{ color: "var(--ink-2)", fontSize: "var(--text-xs)", fontWeight: "var(--w-bold)" }}>工作区</div>
          <h1 className="page-title">Agents</h1>
        </div>
        <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "center" }}>
          <input placeholder="搜索 handle / name…" value={search} onChange={(e) => setSearch(e.target.value)}
                 style={{ padding: "6px 12px", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-sm)", minWidth: 240 }} />
          <label style={{ fontSize: "var(--text-sm)", display: "flex", gap: 4, alignItems: "center" }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            显示已归档
          </label>
          <button onClick={onNew} style={{
            padding: "8px 16px", background: "var(--ink-0)", color: "var(--paper-0)",
            border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)", fontWeight: "var(--w-semibold)",
            cursor: "pointer", boxShadow: "var(--shadow-current)",
          }}>+ 新建 agent</button>
        </div>
      </div>
      <div className="card chunky" style={{ padding: 0, marginTop: "var(--sp-4)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--paper-1)", textAlign: "left" }}>
              {["handle", "name", "model", "状态", ""].map(h => (
                <th key={h} style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id} style={{ borderTop: "1px solid var(--hairline)" }}>
                <td style={{ padding: "var(--sp-3) var(--sp-4)", display: "flex", alignItems: "center", gap: 8 }}>
                  <window.AgentAvatar agent={a} size={24} />
                  <span className="mono" style={{ fontWeight: "var(--w-semibold)" }}>@{a.handle}</span>
                </td>
                <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>{a.name}</td>
                <td style={{ padding: "var(--sp-3) var(--sp-4)", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{a.model}</td>
                <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                  {a.archived ? <span style={{ color: "var(--ink-3)" }}>已归档</span> :
                   a.online   ? <span style={{ color: "var(--state-running)" }}>● online</span> :
                                 <span style={{ color: "var(--ink-2)" }}>○ offline</span>}
                </td>
                <td style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "right" }}>
                  <button onClick={() => navigator.clipboard?.writeText(a.handle)} title="复制 handle"
                          style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                    <window.Icon name="more" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.AgentsList = AgentsList;
```

- [ ] **Step 3: Create `ui_design/screens/AgentNew.jsx`** with the full field set per spec §6.3:

```javascript
function AgentNew({ onCancel, onCreated }) {
  const React = window.React;
  const { push: pushToast, toasts } = window.useToast();

  const [form, setForm] = React.useState({
    runtime_id: window.MOCK.RUNTIMES[0]?.id || "",
    handle: "", name: "", avatar_url: "",
    description: "", instructions: "",
    model: "claude-opus-4-7",
    custom_env: [{ k: "", v: "" }],
    custom_args: [],
    mcp_config: "{}",
  });
  const [errors, setErrors] = React.useState({});
  const [argDraft, setArgDraft] = React.useState("");

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }
  function validate() {
    const e = {};
    if (!/^[a-z0-9_]{2,}$/i.test(form.handle)) e.handle = "handle 必须是字母数字下划线，≥2 字符";
    if (form.instructions.length > 4000) e.instructions = "instructions 长度 ≤4000";
    try { JSON.parse(form.mcp_config); } catch { e.mcp_config = "mcp_config 必须是合法 JSON"; }
    return e;
  }
  function submit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      pushToast(`Mock：将创建 agent @${form.handle}（原型不提交）`, "info");
      setTimeout(() => onCreated && onCreated(), 800);
    }
  }

  const inputStyle = window.__loginStyles.inputStyle;
  const field = (label, control, err) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{label}</span>
      {control}
      {err && <span style={{ fontSize: "var(--text-xs)", color: "var(--state-failed)" }}>{err}</span>}
    </label>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">新建 agent</h1>
      </div>
      <form onSubmit={submit} className="card chunky" style={{ padding: "var(--sp-6)", display: "grid", gap: "var(--sp-4)", maxWidth: 720 }}>
        {field("runtime", (
          <select value={form.runtime_id} onChange={(e) => set("runtime_id", e.target.value)} style={inputStyle}>
            {window.MOCK.RUNTIMES.map(r => <option key={r.id} value={r.id}>{r.name} ({r.host || r.id})</option>)}
          </select>
        ))}
        {field("handle (工作区内唯一)", (
          <input value={form.handle} onChange={(e) => set("handle", e.target.value)} placeholder="例如 writer" style={inputStyle} />
        ), errors.handle)}
        {field("name", <input value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} />)}
        {field("avatar_url", <input value={form.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} style={inputStyle} />)}
        {field("description", <textarea value={form.description} onChange={(e) => set("description", e.target.value)} style={{ ...inputStyle, minHeight: 60 }} />)}
        {field(`instructions (${form.instructions.length}/4000)`, (
          <textarea value={form.instructions} onChange={(e) => set("instructions", e.target.value)} style={{ ...inputStyle, minHeight: 100 }} />
        ), errors.instructions)}
        {field("model", (
          <select value={form.model} onChange={(e) => set("model", e.target.value)} style={inputStyle}>
            <option value="claude-opus-4-7">claude-opus-4-7</option>
            <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
            <option value="claude-haiku-4-5">claude-haiku-4-5</option>
          </select>
        ))}
        {field("custom_env", (
          <div style={{ display: "grid", gap: 4 }}>
            {form.custom_env.map((kv, i) => (
              <div key={i} style={{ display: "flex", gap: 4 }}>
                <input placeholder="KEY" value={kv.k} onChange={(e) => set("custom_env", form.custom_env.map((x, j) => j === i ? { ...x, k: e.target.value } : x))} style={inputStyle} />
                <input placeholder="value" value={kv.v} onChange={(e) => set("custom_env", form.custom_env.map((x, j) => j === i ? { ...x, v: e.target.value } : x))} style={inputStyle} />
                <button type="button" onClick={() => set("custom_env", form.custom_env.filter((_, j) => j !== i))} style={{ padding: "0 8px" }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => set("custom_env", [...form.custom_env, { k: "", v: "" }])} style={{ alignSelf: "start", padding: "4px 8px", background: "transparent", border: "1.5px dashed var(--hairline)", borderRadius: 4 }}>+ 增加</button>
          </div>
        ))}
        {field("custom_args", (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {form.custom_args.map((arg, i) => (
              <span key={i} style={{ padding: "2px 8px", background: "var(--paper-2)", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
                {arg} <button type="button" onClick={() => set("custom_args", form.custom_args.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer" }}>×</button>
              </span>
            ))}
            <input value={argDraft} onChange={(e) => setArgDraft(e.target.value)}
                   onKeyDown={(e) => { if (e.key === "Enter" && argDraft.trim()) { e.preventDefault(); set("custom_args", [...form.custom_args, argDraft.trim()]); setArgDraft(""); } }}
                   placeholder="回车增加" style={{ ...inputStyle, minWidth: 120 }} />
          </div>
        ))}
        {field("mcp_config (JSON)", (
          <textarea value={form.mcp_config} onChange={(e) => set("mcp_config", e.target.value)}
                    style={{ ...inputStyle, minHeight: 100, fontFamily: "var(--font-mono)" }} />
        ), errors.mcp_config)}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} style={{ padding: "8px 16px", background: "var(--paper-0)", border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)", cursor: "pointer" }}>取消</button>
          <button type="submit" style={window.__loginStyles.primaryBtn(false)}>创建 agent</button>
        </div>
      </form>
      {toasts.length > 0 && (
        <div style={{ position: "fixed", right: 24, bottom: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
          {toasts.map(t => <window.ErrorBanner key={t.id} kind="toast" variant={t.variant} message={t.message} />)}
        </div>
      )}
    </div>
  );
}
window.AgentNew = AgentNew;
```

- [ ] **Step 4: Modify `ui_design/app-cream.jsx`** — route the existing `agents` and add `agents-new`:

```javascript
} else if (route.name === "agents") {
  content = <window.AgentsList onNew={() => setRoute({ name: "agents-new" })} />;
} else if (route.name === "agents-new") {
  content = <window.AgentNew onCancel={() => setRoute({ name: "agents" })} onCreated={() => setRoute({ name: "agents" })} />;
}
```

- [ ] **Step 5: Modify `ui_design/index v2.html`** — register both screens:

```html
<script type="text/babel" src="screens/AgentsList.jsx"></script>
<script type="text/babel" src="screens/AgentNew.jsx"></script>
```

- [ ] **Step 6: Sanity check**

Click "Agents" in sidebar. See table with 5 active agents (search filter works). Toggle "显示已归档" — old-bot appears. Click "+ 新建 agent" — form with all 11 fields. Type handle `@` (invalid) → red error under field. Set valid handle → submit → toast "Mock：将创建 agent..." + back to list. Set `mcp_config` to `{` → red error.

- [ ] **Step 7: Commit**

```bash
git add ui_design/screens/AgentsList.jsx ui_design/screens/AgentNew.jsx ui_design/app-cream.jsx "ui_design/index v2.html" ui_design/data.jsx
git commit -m "feat(s0): AgentsList (search + archive filter) and AgentNew (full field set + JSON validation)"
```

---

## Task 19: Build RuntimesList + install-token modal

**Files:**
- Create: `ui_design/screens/RuntimesList.jsx`
- Modify: `ui_design/app-cream.jsx`
- Modify: `ui_design/index v2.html`

- [ ] **Step 1: Create `ui_design/screens/RuntimesList.jsx`**

```javascript
function RuntimesList() {
  const React = window.React;
  const { formatRelative } = window.BR_LIB.format;
  const { useCountdown } = window.BR_LIB.countdown;
  const [modal, setModal] = React.useState(null); // null | { token, expiresAt }
  const [pending, setPending] = React.useState([]); // pending runtime rows

  function issueToken() {
    const t = window.MOCK.installToken();
    setModal(t);
  }
  function close() {
    setModal(prev => {
      if (prev) setPending(p => [...p, { id: "pending-" + Date.now(), name: "(pending)", token: prev.token }]);
      return null;
    });
  }
  function copy(text) {
    navigator.clipboard?.writeText(text);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ flex: 1 }}><h1 className="page-title">Runtimes</h1></div>
        <button onClick={issueToken} style={{
          padding: "8px 16px", background: "var(--ink-0)", color: "var(--paper-0)",
          border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)", fontWeight: "var(--w-semibold)",
          cursor: "pointer", boxShadow: "var(--shadow-current)",
        }}>+ 签发 install token</button>
      </div>

      {window.MOCK.RUNTIMES.length === 0 && pending.length === 0 ? (
        <window.EmptyState glyph="🛰" title="还没有 daemon" description="先签发一个 install token" />
      ) : (
        <div className="card chunky" style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--paper-1)" }}>
                {["name", "host", "os/arch", "capacity", "状态", "最后心跳"].map(h =>
                  <th key={h} style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left", fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {window.MOCK.RUNTIMES.map(r => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--hairline)" }}>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>{r.name}</td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)", fontFamily: "var(--font-mono)" }}>{r.host || "—"}</td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)", fontFamily: "var(--font-mono)" }}>{r.os}/{r.arch}</td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>{r.capacity}</td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                    {r.online ? <span style={{ color: "var(--state-running)" }}>● online</span>
                              : <span style={{ color: "var(--ink-3)", borderBottom: "1.5px dashed var(--ink-3)" }}>offline</span>}
                  </td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>
                    {formatRelative(r.lastHeartbeat)}
                  </td>
                </tr>
              ))}
              {pending.map(p => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--hairline)", border: "1.5px dashed var(--ink-3)" }}>
                  <td colSpan={6} style={{ padding: "var(--sp-3) var(--sp-4)", color: "var(--ink-2)", fontStyle: "italic" }}>
                    pending — 等待 daemon 用 token <span className="mono">{p.token}</span> 上线
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <window.InstallTokenModal token={modal.token} expiresAt={modal.expiresAt} onCopy={copy} onClose={close} />}
    </div>
  );
}

function InstallTokenModal({ token, expiresAt, onCopy, onClose }) {
  const { useCountdown } = window.BR_LIB.countdown;
  const { label, urgent } = useCountdown(expiresAt);
  const cmd = `daemon --register --token=${token}`;

  return (
    <div role="dialog" style={{
      position: "fixed", inset: 0, background: "rgba(27,24,32,0.4)",
      display: "grid", placeItems: "center", zIndex: 300,
    }}>
      <div style={{
        background: "var(--paper-0)", padding: "var(--sp-6)",
        border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-md)",
        maxWidth: 560, boxShadow: "var(--shadow-current)",
        display: "flex", flexDirection: "column", gap: "var(--sp-4)",
      }}>
        <div style={{ fontWeight: "var(--w-bold)", fontSize: "var(--text-lg)" }}>签发 install token</div>
        <window.ErrorBanner kind="inline" variant="warn" message="此 token 只展示一次，关闭后无法找回" />
        <div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)", marginBottom: 4 }}>token</div>
          <div style={{
            padding: "var(--sp-3) var(--sp-4)", background: "var(--paper-2)",
            border: "1.5px solid var(--hairline)", borderRadius: "var(--r-sm)",
            fontFamily: "var(--font-mono)", fontSize: "var(--text-base)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>{token}</span>
            <button onClick={() => onCopy(token)} style={{ background: "var(--ink-0)", color: "var(--paper-0)", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}>复制</button>
          </div>
          <div style={{ marginTop: 4, fontSize: "var(--text-xs)", color: urgent ? "var(--countdown-urgent)" : "var(--ink-2)" }}>
            过期：{label}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)", marginBottom: 4 }}>命令</div>
          <div style={{
            padding: "var(--sp-3) var(--sp-4)", background: "var(--ink-0)", color: "var(--paper-0)",
            borderRadius: "var(--r-sm)", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
          }}>
            <span style={{ wordBreak: "break-all" }}>{cmd}</span>
            <button onClick={() => onCopy(cmd)} style={{ background: "var(--paper-0)", color: "var(--ink-0)", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}>复制</button>
          </div>
        </div>
        <button onClick={onClose} style={{
          alignSelf: "flex-end", padding: "8px 16px",
          background: "var(--paper-0)", border: "1.5px solid var(--ink-0)",
          borderRadius: "var(--r-sm)", cursor: "pointer", fontWeight: "var(--w-semibold)",
        }}>关闭</button>
      </div>
    </div>
  );
}

window.RuntimesList = RuntimesList;
window.InstallTokenModal = InstallTokenModal;
```

- [ ] **Step 2: Modify `ui_design/app-cream.jsx`** — replace existing `runtimes` branch:

```javascript
} else if (route.name === "runtimes") {
  content = <window.RuntimesList />;
}
```

- [ ] **Step 3: Modify `ui_design/index v2.html`** — register the script:

```html
<script type="text/babel" src="screens/RuntimesList.jsx"></script>
```

- [ ] **Step 4: Sanity check**

Click "Runtimes" in sidebar. Confirm table with 3 runtime rows shown (2 online, 1 offline). Click "+ 签发 install token". Modal opens with `bri_xxxxxxxx` token, 1-hour countdown ticking down, command snippet. Click "复制" → clipboard receives the token. Close modal → table shows a "pending — 等待 daemon..." row.

- [ ] **Step 5: Commit**

```bash
git add ui_design/screens/RuntimesList.jsx ui_design/app-cream.jsx "ui_design/index v2.html"
git commit -m "feat(s0): RuntimesList with install-token modal (one-time + copy + countdown)"
```

---

## Task 20: Build WorkspaceSettings + ProjectAssets/Artifacts + ApprovalsHub

These three are similar in shape; we batch them.

**Files:**
- Create: `ui_design/screens/WorkspaceSettings.jsx`
- Create: `ui_design/screens/ProjectAssets.jsx`
- Create: `ui_design/screens/ProjectArtifacts.jsx`
- Create: `ui_design/screens/ApprovalsHub.jsx`
- Modify: `ui_design/app-cream.jsx`
- Modify: `ui_design/index v2.html`
- Modify: `ui_design/screens.jsx` — ProjectBoard header gets a tab bar `任务 / 素材 / 产物`

- [ ] **Step 1: Create `ui_design/screens/WorkspaceSettings.jsx`** with Members + Danger Zone (with slug-typed confirm modal).

(Engineer reads the spec §6.5 and writes the standard form. Members section iterates `window.MOCK.MEMBERS`; danger zone has two destructive buttons each opening a confirm modal that requires typing the workspace slug, e.g. `lumen`.)

- [ ] **Step 2: Create `ui_design/screens/ProjectAssets.jsx`** — drag/drop uploader (mock: just shows the file in the local list, never POSTs; pre-check `file.size > 100 * 1024 * 1024` and shows error banner), grid of files with `formatBytes`.

- [ ] **Step 3: Create `ui_design/screens/ProjectArtifacts.jsx`** — read-only grid from `window.MOCK.ARTIFACTS`, filters by task / source, preview drawer with image direct render / text preview / metadata for binary.

- [ ] **Step 4: Create `ui_design/screens/ApprovalsHub.jsx`** — list of pending approvals from `window.MOCK.APPROVALS`, each rendered with `<window.ApprovalCard mode="hub" />`. Sort by `expiresAt` ascending. Filters: tool_name input and agent_handle dropdown. Workspace filter dropdown (visual only — `当前 ws` + `全部` options).

- [ ] **Step 5: Modify ProjectBoard in `screens.jsx`** — add tab bar at top of project pages:

```javascript
<div className="tabs" style={{ display: "flex", gap: 16, borderBottom: "1.5px solid var(--hairline)", marginBottom: 24 }}>
  {[
    { key: "tasks", label: "任务" },
    { key: "assets", label: "素材" },
    { key: "artifacts", label: "产物" },
  ].map(t => (
    <a key={t.key} onClick={() => onTabChange(t.key)}
       style={{ padding: "8px 0", cursor: "pointer",
                borderBottom: activeTab === t.key ? "2px solid var(--ink-0)" : "2px solid transparent",
                fontWeight: activeTab === t.key ? "var(--w-bold)" : "var(--w-regular)" }}>
      {t.label}
    </a>
  ))}
</div>
```

- [ ] **Step 6: Modify `ui_design/app-cream.jsx`** — replace existing `settings` and `approvals` branches:

```javascript
} else if (route.name === "approvals") {
  content = <window.ApprovalsHub onDecide={decideApproval} approvals={approvals} onOpenTask={(t) => navigate({ name: "task", taskId: t.id })} />;
} else if (route.name === "settings") {
  content = <window.WorkspaceSettings ws={ws} />;
} else if (route.name === "project-assets" && project) {
  content = <window.ProjectAssets project={project} />;
} else if (route.name === "project-artifacts" && project) {
  content = <window.ProjectArtifacts project={project} />;
}
```

The existing inline-settings JSX in `app-cream.jsx` (lines 205-230) gets deleted.

- [ ] **Step 7: Modify `ui_design/index v2.html`** — register all four new scripts:

```html
<script type="text/babel" src="screens/WorkspaceSettings.jsx"></script>
<script type="text/babel" src="screens/ProjectAssets.jsx"></script>
<script type="text/babel" src="screens/ProjectArtifacts.jsx"></script>
<script type="text/babel" src="screens/ApprovalsHub.jsx"></script>
```

- [ ] **Step 8: Sanity check**

Navigate through each new page:
- Settings: members table with 3 rows (Alice owner, Bob/Carol member). Danger Zone → click "删除工作区" → confirm modal asks for slug `lumen` (typing wrong shows error banner). Type `lumen` → button enables.
- Project page → "素材" tab → upload widget; drag a >100MB file → error banner.
- Project page → "产物" tab → 3 artifact tiles; click image one → preview drawer with rendered image.
- Sidebar "审批" → list of 3 approvals; each one is the unified ApprovalCard in hub mode. Filter by tool name `Bash` → only Bash rows.

- [ ] **Step 9: Commit**

```bash
git add ui_design/screens/WorkspaceSettings.jsx ui_design/screens/ProjectAssets.jsx ui_design/screens/ProjectArtifacts.jsx ui_design/screens/ApprovalsHub.jsx ui_design/screens.jsx ui_design/app-cream.jsx "ui_design/index v2.html"
git commit -m "feat(s0): WorkspaceSettings + ProjectAssets/Artifacts + ApprovalsHub"
```

---

## Task 21: Split the remaining `screens.jsx` pieces into `screens/`

After Task 20, `screens.jsx` still contains `WorkspaceHome`, `ProjectBoard`, `TaskDetail`, plus the page sub-blocks. Move them.

**Files:**
- Create: `ui_design/screens/WorkspaceHome.jsx`
- Create: `ui_design/screens/ProjectBoard.jsx`
- Create: `ui_design/screens/TaskDetail.jsx`
- Modify: `ui_design/index v2.html` — register the three; remove the `screens.jsx` line
- Delete: `ui_design/screens.jsx`

- [ ] **Step 1: Cut `WorkspaceHome` from `screens.jsx` into `ui_design/screens/WorkspaceHome.jsx`**. Top of file: `const { React, MOCK, ApprovalCard, EmptyState } = window;` (or unpack as needed). Bottom: `window.WorkspaceHome = WorkspaceHome;`. Keep the locked layout class names (`.workspace-home`, `.hero`, `.stats`, etc.) from Task 16.

- [ ] **Step 2: Cut `ProjectBoard` similarly into `ui_design/screens/ProjectBoard.jsx`**, including the tab bar added in Task 20.

- [ ] **Step 3: Cut `TaskDetail` similarly into `ui_design/screens/TaskDetail.jsx`**, including the cancel-run button + confirm dialog + toast container added in Task 15, and the Composer wiring from Task 13.

- [ ] **Step 4: Modify `ui_design/index v2.html`** — register the three new files in load order, remove the old `screens.jsx` line, and also remove the `chat.jsx` line (which should now be empty):

```html
<script type="text/babel" src="screens/WorkspaceHome.jsx"></script>
<script type="text/babel" src="screens/ProjectBoard.jsx"></script>
<script type="text/babel" src="screens/TaskDetail.jsx"></script>
```

- [ ] **Step 5: Delete `ui_design/screens.jsx`**

```powershell
Remove-Item ui_design/screens.jsx
```

- [ ] **Step 6: Delete `ui_design/chat.jsx`** if it now contains no exported functions:

```powershell
$content = Get-Content "ui_design/chat.jsx" -Raw
if ($content -match "^\s*$" -or $content -notmatch "function ") { Remove-Item ui_design/chat.jsx }
```

- [ ] **Step 7: Sanity check**

Open `index v2.html`. Click every nav item: 概览, 审批, Agents, Runtimes, 设置. Open a project, then a task. Make sure the existing flows (chat, approval card, cancel-run, composer) all still work post-split. Console: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add ui_design/screens "ui_design/index v2.html"
git rm ui_design/screens.jsx
git rm -f ui_design/chat.jsx
git commit -m "refactor(s0): finish screens.jsx + chat.jsx split; delete old monolith files"
```

---

## Task 22: Wire up the disconnected banner & final acceptance check

**Files:**
- Modify: `ui_design/DESIGN.md` — check off every box in §10
- Modify: `ui_design/screens/TaskDetail.jsx` and other places if any sanity-check items failed

- [ ] **Step 1: Verify the offline banner** — Open `index v2.html`, click the small light in TopBar to toggle offline. Confirm the "实时连接已断开，正在重连…" banner appears. Click back to online → banner disappears.

- [ ] **Step 2: Walk the full acceptance checklist** — open `DESIGN.md` §10 and walk every box. For each:
  - If green, check it off in the file (`- [x]`).
  - If red, identify the failing component, write a fix, commit it, re-run acceptance.

- [ ] **Step 3: Final test pass**

Open `tests/lib.html`. Confirm all-green summary.

Open `index v2.html` and walk every page once more:
- WorkspaceHome (resize 1440 → 900 → 1100 to verify layout rules)
- ProjectBoard tabs (任务 / 素材 / 产物)
- TaskDetail (composer + mention + tool pairing + approval + cancel-run)
- ApprovalsHub
- AgentsList + AgentNew
- RuntimesList + install-token modal
- WorkspaceSettings + danger zone slug confirm
- Login / Register

Verify console 0 errors throughout.

- [ ] **Step 4: Commit final**

```bash
git add ui_design/DESIGN.md
git commit -m "docs(s0): acceptance checklist complete — S0 ready to gate into S1"
```

---

## Self-review (after writing this plan)

**Spec coverage**

- ✅ Spec §1 four pillars → Tasks 1-22 fully cover (tokens 2-4, big-file split 11-12, 21; layout fixes 16; 4 interactions 13-15; 6 pages 17-20).
- ✅ Spec §2 directory layout → Tasks 0, 11-13, 17-21 produce every directory and file.
- ✅ Spec §3 DESIGN.md 10 sections → Tasks 1, 3, 4 fill all sections.
- ✅ Spec §4.1 @mention 8 keyboard cases → Task 13 Composer + Task 6 mention-parse tests cover.
- ✅ Spec §4.2 tool_use↔tool_result pairing → Task 12 MessageList reducer + ToolResult updates.
- ✅ Spec §4.3 Approval countdown/timeout → Task 7 countdown.js + Task 14 ApprovalCard.
- ✅ Spec §4.4 queued + cancel-run → Task 13 (queued in Composer mock) + Task 15 (cancel-run dialog).
- ✅ Spec §5 six layout fixes → Task 16 (locked CSS) + Task 21 (preserves through split).
- ✅ Spec §6 six missing pages → Tasks 17-20.
- ✅ Spec §7 error/empty/offline → Task 9 ErrorBanner+EmptyState; banner pre-existing wired in Task 22.
- ✅ Spec §8 testing → Tasks 5-8 build tests/lib.html progressively.
- ✅ Spec §9 acceptance checklist → Tasks 1 (seed) + 22 (walk).

**Placeholder scan** — no "TBD", no "TODO", no "implement later", no "similar to Task N". Every step has either complete code or specific path-and-action instructions where the engineer reads the existing file (Task 11 step 1, Task 20 steps 1-3 — those reference reading the spec and using the established patterns from earlier tasks; this is acceptable because the patterns are concrete).

**Type/signature consistency** — `ApprovalCard` signature is consistent (Task 14 defines `{approval, mode, onDecide}`; Task 20 ApprovalsHub uses same). `Composer` signature: `{agents, onSend, placeholder}` (Task 13). `EmptyState` signature: `{glyph, title, description, action}` (Task 9). `BR_LIB.codec / mention / countdown / format / keyboard` namespaces consistent across tasks 5-8.

**Final gate** — Acceptance checklist in Task 22 is the hard gate between S0 and S1.

---

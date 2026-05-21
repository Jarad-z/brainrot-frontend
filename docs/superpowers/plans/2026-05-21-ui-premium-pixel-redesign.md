# UI Premium Pixel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the Brainrot frontend from functional to precious — pixel-weight card shadows, crisp ink borders, spring micro-interactions, 8-bit loading accents, and tighter typographic hierarchy.

**Architecture:** All changes are pure visual layer: CSS custom properties, Tailwind utility classes, and component className strings. No data model, API, or state management changes. Changes cascade from design tokens → global utilities → brand components → page-level components.

**Tech Stack:** Tailwind v4 · CSS custom properties · `cubic-bezier` / `steps()` animations · Next.js App Router · React 19 · shadcn/ui + Radix

---

## File Map

| File | What changes |
|------|-------------|
| `styles/tokens/shadow.css` | Add `--shadow-pixel-sm/md` hover variants + `--transition-spring` |
| `styles/tokens/radii.css` | Tighten `--r-md` → 10px, `--r-lg` → 14px |
| `app/globals.css` | New keyframes (`pixel-spin`, `pixel-blink`, `spring-badge`), updated `card-lift`/`card-lift-hover`, new `btn-spring`, `pixel-label`, `msg-enter` scale addition |
| `components/brand/card.tsx` | `border-2 border-ink-0`, `rounded-lg`, `p-6`, pixel shadow, spring hover |
| `components/brand/button.tsx` | Spring press animation via `btn-spring` utility, `border-2` |
| `components/brand/proj-item.tsx` | Rail width snap via `steps(1)` instead of smooth transition |
| `components/nav/Sidebar.tsx` | Width `w-[220px]`, `border-b-2`/`border-t-2` dividers, `h-9` NavItem height |
| `components/nav/ThreeColumnShell.tsx` | Header `border-b-2`, tighter header height to `h-12` |
| `components/chat/parts/UserMessage.tsx` | User bubble: `border-2 border-ink-0` + pixel shadow |
| `components/chat/parts/ToolPair.tsx` | `border-l-4 border-ink-0`, `bg-paper-2`, running indicator pixel-blink |
| `components/chat/Composer.tsx` | `min-h-[56px]`, `border-2`, pixel focus shadow |
| `components/chat/MessageList.tsx` | `gap-4` between messages (via padding), `max-w-3xl` clamp |
| `components/chat/parts/MessageListSkeleton.tsx` | Steps-based pixel blink instead of smooth shimmer |

---

## Task 1: Design Token Updates — Shadows & Radii

**Files:**
- Modify: `styles/tokens/shadow.css`
- Modify: `styles/tokens/radii.css`

- [ ] **Step 1: Update shadow.css**

Replace the entire file content:

```css
/* tokens/shadow.css — solid-offset "block" shadows + soft float */
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

  /* Hover lift — used on interactive cards (kanban, approval, agent,
     runtime, asset). Cards translateY(-2px) and swap shadow-1 → lift. */
  --shadow-lift: 5px 5px 0 var(--ink-0);

  /* Pixel hover collapse — cards shrink shadow on hover */
  --shadow-pixel-sm: 2px 2px 0 var(--ink-0);
  --shadow-pixel-md: 3px 3px 0 var(--ink-0);

  /* Spring easing for hover lift transitions */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out-fast: cubic-bezier(0.16, 1, 0.3, 1);
}
```

- [ ] **Step 2: Update radii.css**

Replace the entire file content:

```css
/* tokens/radii.css */
:root {
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
  --r-xl: 20px;
}
```

- [ ] **Step 3: Verify the dev server compiles without errors**

Run: `pnpm dev` in `frontend/`, open `http://localhost:3000`, check no console CSS errors.

- [ ] **Step 4: Commit**

```bash
git add styles/tokens/shadow.css styles/tokens/radii.css
git commit -m "feat: add pixel shadow variants and spring easing tokens"
```

---

## Task 2: Global CSS — New Animations & Updated Utilities

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Update the `card-lift` and `card-lift-hover` utilities**

Find the two `@utility card-lift` and `@utility card-lift-hover` blocks and replace them:

```css
/* Interactive card lift — pair with `border-2 border-ink-0` cards. */
@utility card-lift {
  transition:
    transform 120ms ease-out,
    box-shadow 120ms ease-out;
}
@utility card-lift-hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-pixel-md);
}
```

- [ ] **Step 2: Update the `ink-stamp` and `ink-stamp-active` utilities**

Find the two `@utility ink-stamp` / `@utility ink-stamp-active` blocks and replace:

```css
/* Spring press for buttons — quick compress + overshoot release. */
@utility btn-spring {
  transition: transform 90ms ease-out, box-shadow 90ms ease-out;
}
@utility btn-spring-active {
  transform: scale(0.94);
  box-shadow: none;
}

/* Legacy stamp utilities kept for other callers */
@utility ink-stamp {
  transition: transform 90ms ease, box-shadow 90ms ease;
}
@utility ink-stamp-active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 var(--ink-0);
}
```

- [ ] **Step 3: Update the `msg-enter` animation to include scale**

Find the `@keyframes msg-in` block and the `@utility msg-enter` block, replace both:

```css
@keyframes msg-in {
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@utility msg-enter {
  animation: msg-in 180ms var(--ease-out-fast) forwards;
}
```

- [ ] **Step 4: Add pixel loading keyframes and utilities — append before the final `.ProseMirror` block**

```css
/* 4-frame pixel spinner — steps() gives discrete 8-bit feel. */
@keyframes pixel-spin {
  0%   { content: "⣾"; }
  25%  { content: "⣽"; }
  50%  { content: "⣻"; }
  75%  { content: "⣷"; }
}

/* Pixel blink for skeleton states — discrete flash instead of smooth shimmer. */
@keyframes pixel-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0.35; }
}
@utility skeleton-pixel {
  animation: pixel-blink 0.8s steps(1, end) infinite;
}

/* Badge spring-in */
@keyframes badge-spring {
  from { opacity: 0; transform: scale(0); }
  60%  { transform: scale(1.1); }
  to   { opacity: 1; transform: scale(1); }
}
@utility badge-enter {
  animation: badge-spring 200ms var(--ease-spring) forwards;
}

/* Pixel section label — game-UI zone header style. */
@utility pixel-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-3);
}
```

- [ ] **Step 5: Verify no Tailwind compilation errors**

Run: `pnpm build` (or check the running `pnpm dev` output for CSS warnings).

- [ ] **Step 6: Commit**

```bash
git add app/globals.css
git commit -m "feat: add spring animations, pixel keyframes, updated card-lift utilities"
```

---

## Task 3: Card Component — Border, Shadow, Radius, Hover

**Files:**
- Modify: `components/brand/card.tsx`

- [ ] **Step 1: Update card.tsx**

Replace the entire file:

```tsx
"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  chunky?: boolean;
  /** Adds hover-lift transition. Pair with chunky for the strongest
   *  visual feedback. Pure CSS, no JS handlers. */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ chunky, interactive, className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-paper-0 border-2 rounded-lg p-6",
        chunky
          ? "border-ink-0 shadow-[var(--shadow-current)]"
          : "border-ink-0 shadow-[3px_3px_0_var(--ink-0)]",
        interactive && [
          "card-lift hover:border-ink-0",
          chunky
            ? "hover:shadow-[var(--shadow-pixel-md)] hover:-translate-y-[3px]"
            : "hover:shadow-[var(--shadow-pixel-sm)] hover:-translate-y-[2px]",
        ],
        className,
      )}
      {...rest}
    />
  ),
);
Card.displayName = "Card";
```

- [ ] **Step 2: Run type check**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/brand/card.tsx
git commit -m "feat: card — pixel border, tighter radius, spring hover shadow"
```

---

## Task 4: Button Component — Spring Press Animation

**Files:**
- Modify: `components/brand/button.tsx`

- [ ] **Step 1: Update button.tsx**

Replace the entire file:

```tsx
"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center gap-2 rounded-md text-sm font-bold whitespace-nowrap " +
  "border-2 btn-spring " +
  "active:scale-[0.94] active:shadow-none " +
  "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-0 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-1 " +
  "[&_svg]:size-4 [&_svg]:shrink-0";

const variants = {
  primary:
    "bg-ink-0 text-paper-0 border-ink-0 shadow-[var(--shadow-current)] hover:brightness-95",
  ghost: "bg-transparent text-ink-0 border-hairline hover:bg-paper-2",
  danger:
    "bg-paper-0 text-ink-0 border-ink-0 shadow-[var(--shadow-current)] hover:bg-paper-2",
} as const;

const sizes = {
  default: "px-3.5 py-2.5",
  sm: "px-2.5 py-1.5 text-xs",
  big: "px-5 py-3 text-base rounded-full border-2",
  icon: "p-0 w-9 h-9 justify-center",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  ),
);
Button.displayName = "Button";
```

- [ ] **Step 2: Run type check**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/brand/button.tsx
git commit -m "feat: button — spring press scale, border-2 upgrade"
```

---

## Task 5: ProjItem — Pixel Rail Snap

**Files:**
- Modify: `components/brand/proj-item.tsx`

- [ ] **Step 1: Change the rail width transition from smooth to `steps(1)`**

Find the `<span>` with `transition-[width]` inside `ProjItem` (line ~59) and replace just the span's className:

Old:
```tsx
className={cn(
  "absolute left-1 top-1 bottom-1 rounded-sm transition-[width]",
  railClass[swatch],
  active ? "w-[5px]" : "w-[3px] group-hover:w-[4px]",
)}
```

New:
```tsx
className={cn(
  "absolute left-1 top-1 bottom-1 rounded-sm",
  "transition-[width] duration-0 [transition-timing-function:steps(1,end)]",
  railClass[swatch],
  active ? "w-[5px]" : "w-[3px] group-hover:w-[5px]",
)}
```

(Rail snaps instantly on hover — pixel feel. Active and hover now both go to 5px.)

- [ ] **Step 2: Run type check**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/brand/proj-item.tsx
git commit -m "feat: proj-item — pixel-snap rail width on hover"
```

---

## Task 6: Sidebar — Width, Dividers, NavItem Height

**Files:**
- Modify: `components/nav/Sidebar.tsx`

- [ ] **Step 1: Narrow sidebar and upgrade borders**

In `Sidebar.tsx`, make these targeted changes:

1. Change aside width: `w-64` → `w-[220px]`
2. Change aside right border: `border-r-[1.5px] border-hairline` → `border-r-2 border-ink-0/15`
3. Change head bottom border: `border-b-[1.5px] border-hairline` → `border-b-2 border-ink-0/10`
4. Add pixel-label class to the two `<p>` section headers (replace their className):

Old:
```tsx
<p className="px-4 pt-3 pb-1.5 text-[10.5px] font-extrabold tracking-[0.08em] text-ink-3 uppercase">
  导航
</p>
```
New:
```tsx
<p className="px-4 pt-3 pb-1.5 pixel-label">
  导航
</p>
```

And for the projects section header:
```tsx
<p className="px-4 pt-4 pb-1.5 pixel-label">
  {messages.shell.projects}
</p>
```

- [ ] **Step 2: Run type check**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/nav/Sidebar.tsx
git commit -m "feat: sidebar — narrower width, ink borders, pixel-label section headers"
```

---

## Task 7: ThreeColumnShell — Header Border Upgrade

**Files:**
- Modify: `components/nav/ThreeColumnShell.tsx`

- [ ] **Step 1: Upgrade header border**

Find the `<header>` tag. Change:

Old:
```tsx
<header className="h-14 border-b-[1.5px] border-hairline bg-paper-0 px-5 flex items-center gap-3.5 shrink-0">
```

New:
```tsx
<header className="h-12 border-b-2 border-ink-0/10 bg-paper-0 px-5 flex items-center gap-3.5 shrink-0">
```

- [ ] **Step 2: Run type check**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/nav/ThreeColumnShell.tsx
git commit -m "feat: shell header — border-2, tighter height"
```

---

## Task 8: UserMessage — Pixel Border & Shadow

**Files:**
- Modify: `components/chat/parts/UserMessage.tsx`

- [ ] **Step 1: Upgrade user bubble**

Find the bubble `<div>` (line 34) and replace its className:

Old:
```tsx
<div className="inline-block px-4 py-2.5 bg-role-user border-[1.5px] border-hairline rounded-2xl max-w-[75%] break-words shadow-[2px_2px_0_var(--ink-0)]">
```

New:
```tsx
<div className="inline-block px-4 py-2.5 bg-role-user border-2 border-ink-0 rounded-lg max-w-[75%] break-words shadow-[2px_2px_0_var(--ink-0)]">
```

- [ ] **Step 2: Run type check**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/chat/parts/UserMessage.tsx
git commit -m "feat: user message bubble — border-2 ink border, rounded-lg"
```

---

## Task 9: ToolPair — Left Border Rail & Running Pixel Indicator

**Files:**
- Modify: `components/chat/parts/ToolPair.tsx`

- [ ] **Step 1: Update ToolPair card outer shell**

Find the outer `<div className="tool-card ...">` (line 40) and replace its className:

Old:
```tsx
<div className="tool-card border-[1.5px] border-ink-0 bg-paper-0 rounded-xl overflow-hidden shadow-[2px_2px_0_var(--ink-0)]">
```

New:
```tsx
<div className="tool-card border-2 border-ink-0 bg-paper-2 rounded-lg overflow-hidden shadow-[2px_2px_0_var(--ink-0)]">
```

- [ ] **Step 2: Update the running indicator to use pixel-blink**

Find the running indicator block (the `{!resultMsg && ...}` section, lines 87-91) and replace:

Old:
```tsx
<div className="flex items-center gap-2 px-4 py-1.5 text-xs text-ink-2 border-t-[1.5px] border-hairline">
  <span className="w-1.5 h-1.5 rounded-full bg-state-running animate-pulse shrink-0" />
  运行中…
</div>
```

New:
```tsx
<div className="flex items-center gap-2 px-4 py-1.5 text-xs text-ink-2 border-t-2 border-hairline font-mono">
  <span className="w-2 h-2 rounded-none bg-state-running skeleton-pixel shrink-0" />
  运行中…
</div>
```

- [ ] **Step 3: Upgrade the expanded body border**

Find `border-t-[1.5px] border-hairline` in the expanded body div and change to `border-t-2 border-hairline`.

- [ ] **Step 4: Run type check**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add components/chat/parts/ToolPair.tsx
git commit -m "feat: tool pair — bg-paper-2, rounded-lg, pixel running indicator"
```

---

## Task 10: Composer — Height, Border, Focus Shadow

**Files:**
- Modify: `components/chat/Composer.tsx`

- [ ] **Step 1: Update composer wrapper**

Find the outer `<div className="composer-wrap ...">` (line 141) and replace its className:

Old:
```tsx
<div className="composer-wrap composer-focus-ring border-[1.5px] border-ink-0 rounded-xl bg-paper-0 p-4 shadow-[var(--shadow-2)] flex flex-col gap-3">
```

New:
```tsx
<div className="composer-wrap composer-focus-ring border-2 border-ink-0 rounded-lg bg-paper-0 p-4 shadow-[var(--shadow-2)] flex flex-col gap-3">
```

- [ ] **Step 2: Update the editor content min-height**

Find the `editorProps.attributes.class` string (line 106):

Old:
```tsx
class: "composer-input outline-none min-h-[60px] py-2 px-1 text-base",
```

New:
```tsx
class: "composer-input outline-none min-h-[56px] py-2 px-1 text-base",
```

- [ ] **Step 3: Run type check**

```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add components/chat/Composer.tsx
git commit -m "feat: composer — border-2, rounded-lg"
```

---

## Task 11: MessageList — Wider Chat Bubbles

**Files:**
- Modify: `components/chat/MessageList.tsx`

- [ ] **Step 1: Add max-width clamp to the virtualizer container**

Find the `<div className="relative h-full">` wrapper (line 114) — it wraps the scroll container. Find the inner scroll div:

Old:
```tsx
className="h-full overflow-y-auto px-8 py-6"
```

New:
```tsx
className="h-full overflow-y-auto px-8 py-6"
```

(No change to the scroll container — the width is controlled by the shell layout.)

Instead, find the virtualized item wrapper div and add a max-width to center wide content. Find the `<div style={{ height: virtualizer.getTotalSize(), ...}}>` inner wrapper and add `className="mx-auto max-w-3xl"` to it:

Old:
```tsx
<div
  style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}
>
```

New:
```tsx
<div
  style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}
  className="mx-auto max-w-3xl"
>
```

- [ ] **Step 2: Run type check**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/chat/MessageList.tsx
git commit -m "feat: message list — max-w-3xl chat content clamp"
```

---

## Task 12: MessageListSkeleton — Pixel Blink

**Files:**
- Modify: `components/chat/parts/MessageListSkeleton.tsx`

- [ ] **Step 1: Read the current skeleton**

Read `components/chat/parts/MessageListSkeleton.tsx` to see current implementation before editing.

- [ ] **Step 2: Replace shimmer animation with pixel-blink**

Find any `animate-pulse` or shimmer classes on skeleton bars and replace with `skeleton-pixel`. If the component uses Tailwind's `animate-pulse`, add `skeleton-pixel` and remove `animate-pulse`. Example pattern:

Old pattern (may vary):
```tsx
<div className="h-4 bg-paper-2 rounded animate-pulse" />
```

New pattern:
```tsx
<div className="h-4 bg-paper-2 rounded-sm skeleton-pixel" />
```

Apply to all skeleton placeholder elements in the file.

- [ ] **Step 3: Run type check**

```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add components/chat/parts/MessageListSkeleton.tsx
git commit -m "feat: skeleton — pixel-blink steps animation instead of smooth pulse"
```

---

## Task 13: Final Verification

- [ ] **Step 1: Run full pre-commit gate**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Expected: all pass.

- [ ] **Step 2: Start dev server and visually verify**

```bash
pnpm dev
```

Open `http://localhost:3000` and check:
- Cards have 2px ink borders + offset pixel shadows
- Button press has spring scale feedback (`active:scale-[0.94]`)
- Sidebar is narrower (220px), section labels are mono uppercase
- Chat bubbles are crisper (ink border on user messages)
- Tool pair block has paper-2 background + pixel blink on running state
- Composer has border-2 ink border

- [ ] **Step 3: Final commit if any tweaks were needed**

```bash
git add -p
git commit -m "fix: ui tweaks from visual verification pass"
```

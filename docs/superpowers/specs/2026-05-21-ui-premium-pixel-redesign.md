# UI Premium Pixel Redesign

**Date:** 2026-05-21  
**Status:** Approved  
**Scope:** Frontend-only visual overhaul — no API, no data model changes

## Goal

Elevate the Brainrot UI from "functional" to "precious and deliberate." The aesthetic target: **premium SaaS meets light pixel-art accent** — real-weight card shadows, crisp ink borders, spring-bouncy micro-interactions, and a few 8-bit decorative touches. Existing color palette (paper/ink/swatches) stays intact.

---

## Section 1 — Card & Panel System

### Shadow System

| Card type | Default shadow | Hover shadow | Hover transform |
|-----------|---------------|--------------|-----------------|
| Normal | `3px 3px 0 var(--ink-0)` | `2px 2px 0 var(--ink-0)` | `translateY(-2px)` |
| Chunky | `5px 5px 0 var(--ink-0)` | `3px 3px 0 var(--ink-0)` | `translateY(-3px)` |

Transition: `box-shadow 120ms ease-out, transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1)`  
(末段 overshoot → 轻微回弹)

### Borders

- All cards: `border-2` (up from `border-[1.5px]`), color `ink-0` (up from `hairline`)
- Internal dividers: `border-ink-0/15`

### Border Radius

- Main cards: `rounded-lg` (down from `rounded-xl` — slightly squarer, more pixel-like)
- Small elements (badge, tag): `rounded-sm` or `rounded-none`

### Spacing

- Card padding: `p-6` (up from `p-5`)
- Card gap: `gap-4` (up from `gap-3`)

---

## Section 2 — Typography Hierarchy

### Scale Changes

| Element | Before | After |
|---------|--------|-------|
| Page title | `text-2xl font-bold` | `text-3xl font-bold font-wide` |
| Card title | `text-sm font-medium` | `text-base font-semibold` |
| Body/description | `text-sm ink-1` | `text-sm ink-2` |
| Meta (timestamp, ID) | `text-xs` | `text-xs ink-3` |
| Stat numbers | varied | `text-3xl font-bold font-mono tabular-nums` |

### Pixel-accent Labels

Section headers / area labels: `uppercase tracking-widest text-xs font-mono` — game-UI zone label feel.

Badge text: `font-mono text-xs`, square corners.

### Line Height

- Titles: `leading-tight`
- Body: `leading-relaxed`
- Chat messages: `leading-normal` (unchanged)

---

## Section 3 — Animation System

### Large Element Entry — Smooth Easing

```css
/* Page / card list entry */
opacity: 0 → 1
translateY: 8px → 0
duration: 280ms
easing: cubic-bezier(0.16, 1, 0.3, 1)

/* Side panel slide-in */
translateX: 12px → 0 + opacity
duration: 240ms
```

Message entry (`msg-in`): add `scale(0.98 → 1)` on top of existing animation.

### Small Interactions — Spring Bounce

```css
/* Button press */
press:   scale(0.94), immediate
release: scale(1.04) → scale(1.0)
total:   200ms, cubic-bezier(0.34, 1.56, 0.64, 1)

/* Badge appear */
scale(0 → 1), 150ms spring

/* Approval countdown pulse */
scale(1.05 → 1) per second
```

### Pixel Loading States

- Spinner: 4-frame CSS pixel animation using `steps(4, end)` — no images needed
- Skeleton shimmer: replace smooth gradient with `steps(4)` flash — 8-bit blink
- `pending-stripes` animation: change to `steps(8)` movement — pixel-scroll feel

### Hover Micro-motion

| Element | Hover effect |
|---------|-------------|
| Sidebar NavItem | `translateX(3px)`, 100ms ease-out |
| ProjItem color rail | `width: 3px → 5px` via `steps(1)` (instant snap, pixel feel) |
| Icons | `rotate(8deg)`, 150ms spring |

---

## Section 4 — Layout Proportions

### Three-Column Widths

- Left sidebar: `240px → 220px` (slightly narrower, more focused)
- Main content: gains freed space; chat bubble `max-w-2xl → max-w-3xl`
- Right rail: unchanged width, inner card gaps increased

### Sidebar Internal

- Top logo area: add `pb-4 border-b-2 border-ink-0`
- NavItem: explicit `h-9` height (larger click target)
- Bottom user area: add `pt-4 border-t-2 border-ink-0`
- Section gap between nav groups: increase

### Chat Area

| Element | Change |
|---------|--------|
| Message gap | `gap-3 → gap-4` |
| User bubble | add `border-2 border-ink-0` + `2px 2px 0 var(--ink-0)` shadow |
| Tool-use block | `border-l-4 border-ink-0` + `bg-paper-2` |
| Composer | `min-h-[56px]`, `border-2`, pixel shadow on focus |

### Card Grids

- WorkspaceHome gap: `gap-4 → gap-6`
- Stat tile padding: `p-6`, larger number/label separation
- ApprovalHubCard header: taller, more presence

---

## Implementation Scope

### Files to touch

| File | Changes |
|------|---------|
| `styles/tokens/shadow.css` | Add pixel shadow variables |
| `styles/tokens/radii.css` | Adjust `--r-md/lg` values |
| `app/globals.css` | New keyframes, updated utilities, spring transitions |
| `components/brand/card.tsx` | New shadow + border + transition classes |
| `components/brand/button.tsx` | Spring press animation |
| `components/brand/proj-item.tsx` | `steps(1)` rail width transition |
| `components/nav/ThreeColumnShell/` | Sidebar width, border dividers |
| `components/chat/MessageItem.tsx` | Updated `msg-in` animation |
| `components/chat/parts/UserMessage.tsx` | Pixel border + shadow |
| `components/chat/parts/ToolPair.tsx` | Left border + bg |
| `components/chat/Composer.tsx` | Height + border + focus shadow |
| `components/approvals/ApprovalHubCard.tsx` | Taller header, countdown pulse |
| Various page files | Typography scale updates |

### Out of scope

- Color palette changes (paper/ink/swatches stay)
- Data model, API, WebSocket layer
- Accessibility regression (contrast ratios must be maintained)
- Mobile/responsive (existing breakpoints unchanged)

---

## Success Criteria

1. Cards feel weighty and deliberate — pixel shadow gives real depth without gradients
2. Typography has clear 3-level hierarchy visible at a glance
3. Button clicks feel satisfying — spring bounce, not rubber
4. Loading states read as intentional design, not placeholder
5. Overall impression: "someone cared about every pixel"

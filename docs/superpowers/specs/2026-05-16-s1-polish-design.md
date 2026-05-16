# S1 Polish — Visual Alignment to Prototype

> **Date:** 2026-05-16
> **Parent:** S1 (Next.js skeleton + login + 3-column shell + read-only browse) is functionally complete (37 commits, dda8b32 → 14e2031). This sub-project closes the visual gap to `screenshots/01-13` so the cream-paper + ink-black + block-shadow + Bricolage-wide design language is fully expressed in code.
> **Not in scope:** S2 chat (Composer, message rendering, tool_use pairing), S3 approvals / cancel-run, S4 agents / runtimes / settings, dark theme (S6).

---

## 1. Problem

S1 shipped with stock shadcn surface styles. The 13 prototype screenshots in `screenshots/` define a specific "moonlit cream + plum ink + poppy red + block shadow + Bricolage Grotesque" voice that is not present in current implementation:

- shadcn primitives (`Button`, `Card`, `Input`, …) use `bg-primary`, `border-input`, `ring-ring`, etc. but `globals.css @theme` only defines `--color-paper-0 / ink-0 / accent / state-*`. There is no mapping for `--color-primary / border / input / ring`, so shadcn falls back to Tailwind's neutral defaults → flat gray button, thin gray Input border, no offset shadow.
- The hero ("工作区") uses `text-hero font-extrabold style={{ fontStretch: "88%" }}` — `font-stretch` is unreliable on Bricolage Grotesque's `wdth` axis across browsers; needs `font-variation-settings: "wdth" N` to actually drive the variable axis.
- `WorkspaceHomePage` renders hero + project grid only. The stat 2×2 (右上) and approval rail (右下) — visual core of screenshots 01/02 — do not exist.
- `Sidebar` is a flat `aside` + 5 plain `<Link>` rows; lacks brand block, workspace switcher, nav sections, project list with swatches, account foot.
- `ProjectCard` is a plain text card; lacks the striped topstrip cover that gives screenshots 01/02 their visual rhythm.
- `LoginForm` item 3 in `tests/manual-checklist.md` is partial: 401 error does not return focus to the email field.

Acceptance is purely visual: side-by-side with `screenshots/01`, `02`, `13`, the live `localhost:3000` pages must be visually indistinguishable. "Looks close" is not enough.

## 2. Approach decision

Three were considered:

- **A. Fork shadcn cva defaults** — modify `components/ui/button.tsx` etc. to flip `bg-primary` → `bg-ink-0`, add `border-[1.5px] border-ink-0 shadow-[var(--shadow-current)]`. Cheap (existing import sites unchanged), but new shadcn installs revert to defaults.
- **B. Map shadcn semantic tokens via @theme** — define `--color-primary: var(--ink-0)` so default shadcn variants resolve to our palette. Only fixes color, not shape (radius / border weight / shadow style / font axis baked into shadcn classNames).
- **C. Replace shadcn with brand primitives ported from `ui_design/primitives.jsx` + `ui_design/tokens-cream.css`.** New components live in `components/brand/`. Path-based namespacing distinguishes them from any remaining shadcn (`@/components/brand/button` vs `@/components/ui/button`). The three Radix-backed widgets (Dialog, DropdownMenu, Tooltip) are also re-wrapped from `@radix-ui/*` primitives directly, bypassing shadcn entirely.

**Decision: C (full brand rebuild, path-based namespace, all three Radix widgets re-wrapped).**

Rationale:

- The visual gap is shape, not just color. Block-shadow geometry, 1.5px hairline borders, 12px card radius, Bricolage `wdth` axis — these are written into shadcn's default classNames and `@theme` mapping can't reach them. Fork (A) would patch every variant separately; replacement (C) lets the same brand components be reused identically in S2/S3/S4 by copying `ui_design/screens/*.jsx` class structures.
- ~18 brand components + ~18 call-site rewrites is large but bounded. Once done, S3/S4 pages reuse these primitives near-1:1 from `ui_design/screens/`.
- Trade-off accepted: longer S1-polish duration (8–12 days vs 3–5 days for A) in exchange for zero "shadcn default smell" residue.

## 3. Architecture — three layers, built bottom-up

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Call sites                                    │
│  - 6 pages + Sidebar + AccountMenu + 3 forms +          │
│    3 cards + 4 common — import paths flip to brand/     │
│  - LoginForm + RegisterForm focus-return fix            │
│  - 1 Vitest unit test for LoginForm 401 → focus         │
├─────────────────────────────────────────────────────────┤
│  Layer 2: brand components                              │
│  - components/brand/  — 23 files                        │
│  - 18 prototype ports + 3 Radix re-wraps + 2 combos     │
│  - "use client", named exports, TypeScript interfaces,  │
│    100% token-utility className, no inline hex/px       │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Tokens & utilities                            │
│  - globals.css: 6 @utility entries for font axes        │
│  - next/font/google Bricolage Grotesque (wdth, wght)    │
│  - Custom @utility entries for hot-stripe, topstrip-*,  │
│    animate-status-pulse                                 │
└─────────────────────────────────────────────────────────┘
```

Build order is strict bottom-up. Layer 1 must compile cleanly before Layer 2 imports start; Layer 2 must export its 23 components before Layer 3 flips imports.

## 4. Layer 1 — Tokens & utilities

### 4.1 Bricolage Grotesque loading

Currently uses fallback `system-ui` via CSS variable. Replace with `next/font/google`:

```tsx
// app/layout.tsx
import { Bricolage_Grotesque } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["wdth"],          // wght included by default
  display: "swap",
  variable: "--font-display",
});
```

Apply `bricolage.variable` to `<html>` className. Remove `Bricolage Grotesque` literal from `styles/tokens/typography.css` (`--font-display` is now next/font-injected).

**Axes:** `wdth` (75–100 range, we use 78/84/88/96/100) + default `wght` (200–800). Drop `opsz` — Bricolage Grotesque does not expose it; `"opsz" 96` in any `font-variation-settings` declaration will be silently ignored, but is removed for clarity.

### 4.2 Six font utilities

Append to `app/globals.css` after the `@theme` block:

```css
@utility font-tight {
  font-variation-settings: "wdth" 88;
  letter-spacing: -0.015em;
}
@utility font-wide {
  font-variation-settings: "wdth" 96;
  letter-spacing: -0.005em;
}
@utility font-normal-wdth {
  font-variation-settings: "wdth" 100;
  letter-spacing: 0;
}
@utility hero-title {
  font-variation-settings: "wdth" 84;
  letter-spacing: -0.035em;
  line-height: 0.92;
  text-wrap: balance;
}
@utility stat-num {
  font-variation-settings: "wdth" 78;
  letter-spacing: -0.04em;
  line-height: 1;
}
@utility page-title {
  font-variation-settings: "wdth" 88;
  letter-spacing: -0.02em;
}
```

`font-normal-wdth` is named with the suffix to avoid colliding with Tailwind's built-in `font-normal` (= weight 400).

### 4.3 Custom @utility entries for complex backgrounds

```css
@utility stat-card-hot-stripe {
  /* ::after diagonal stripe overlay */
  position: relative;
}
@utility stat-card-hot-stripe-after {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; height: 14px;
  background: repeating-linear-gradient(
    -45deg,
    rgb(255 255 255 / 0.22) 0 4px,
    transparent 4px 9px
  );
  pointer-events: none;
}

/* 6 project topstrip swatches — mono line patterns */
@utility topstrip-green  { background-image: repeating-linear-gradient( 45deg, var(--ink-0) 0 1.5px, transparent 1.5px 10px); }
@utility topstrip-blue   { background-image: repeating-linear-gradient(  0deg, var(--ink-0) 0 1.5px, transparent 1.5px  9px); }
@utility topstrip-pink   { background-image: radial-gradient(var(--ink-0) 1.2px, transparent 1.6px); background-size: 12px 12px; }
@utility topstrip-amber  { background-image: repeating-linear-gradient( 90deg, var(--ink-0) 0 1.5px, transparent 1.5px 14px); }
@utility topstrip-violet { background-image: repeating-linear-gradient(-45deg, var(--ink-0) 0 1.5px, transparent 1.5px 12px); }
@utility topstrip-teal   { background-image: linear-gradient(var(--ink-0) 1.5px, transparent 1.5px), linear-gradient(90deg, var(--ink-0) 1.5px, transparent 1.5px); background-size: 18px 18px; }

/* status_chip in_progress pulse */
@utility animate-status-pulse {
  animation: status-pulse 1.4s ease-in-out infinite;
}
@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}
```

### 4.4 Shadow utility validation

`@theme` already maps `--shadow-1`, `--shadow-current` etc. After Layer 1 lands, write a 5-line smoke test page that renders `<div class="shadow-1 bg-paper-0 w-32 h-32 border" />` and visually confirms it renders as `3px 3px 0 var(--ink-0)`. If Tailwind v4 doesn't accept token-based shadow utility correctly, fall back to arbitrary-value syntax `shadow-[3px_3px_0_var(--ink-0)]` per usage. Brand components prepared in §5 use `shadow-1` / `shadow-current` first; document the fallback in the implementation plan.

## 5. Layer 2 — Brand components (23 files in `components/brand/`)

### 5.1 File inventory

| File | Component(s) | Source (prototype) |
|---|---|---|
| `button.tsx` | `<Button variant="primary\|ghost\|danger" size="default\|sm\|big\|icon">` | `.btn` family |
| `card.tsx` | `<Card>`, `<Card chunky>` | `.card`, `.card.chunky` |
| `input.tsx` | `<Input>`, `<Textarea>` | DESIGN.md §5 inputs spec |
| `avatar.tsx` | `<Avatar>`, `<AgentAvatar>`, online dot variant | `primitives.jsx Avatar/AgentAvatar` + `.avatar-block .av-wrap .av-online` |
| `status-chip.tsx` | `<StatusChip status=…>` 6 statuses | `primitives.jsx StatusChip` + `.chip[data-status]` rules |
| `tag.tsx` | `<Tag>`, `<Pill>`, `<Pills>` | `.tag`, `.pills .pill` |
| `icon-button.tsx` | `<IconButton icon size badge>` | `.icon-btn` + red dot |
| `brand-mark.tsx` | `<BrandMark>` | `.brand-block` + `.brand-text .brand-sub` |
| `ws-switcher.tsx` | `<WsSwitcher>` | `.ws-switcher` + `.ws-avatar .ws-name .ws-meta` |
| `nav-item.tsx` | `<NavItem icon active count disabled tooltip>` | `.nav-item` + count badge |
| `proj-item.tsx` | `<ProjItem swatch active count>` | `.proj-item` + `.proj-swatch` |
| `section-head.tsx` | `<SectionHead title count>` | `.section-head .section-title .count-pill` |
| `stat-card.tsx` | `<StatCard hot label value foot>` | `.stat-card`, `.stat-card.hot` |
| `rail-section.tsx` | `<RailSection>`, `<RailHead>`, `<RailEmpty>` | `.rail-section .rail-head .rail-empty` |
| `proj-topstrip.tsx` | `<ProjTopstrip swatch>` | `.proj-card .topstrip` × 6 swatch |
| `hero.tsx` | `<HeroTitle>`, `<HeroEyebrow>`, `<HeroPop>`, `<HeroSub>`, `<HeroArrow>` | `.hero*` family |
| `page-header.tsx` | `<PageHeader>`, `<PageTitle>`, `<PageSub>` | `.page-header .page-title .page-sub` |
| `crumb.tsx` | `<Crumb>`, `<CrumbSeg>`, `<CrumbSep>` | `.crumb .seg .sep` |
| `banner.tsx` | `<Banner>` | `.banner` |
| `dialog.tsx` | brand wrapper around `@radix-ui/react-dialog` primitives | — |
| `dropdown.tsx` | brand wrapper around `@radix-ui/react-dropdown-menu` primitives | — |
| `tooltip.tsx` | brand wrapper around `@radix-ui/react-tooltip` primitives | — |

`<EmptyState>` stays in `components/common/empty-state.tsx` (it's business-text + brand-visual), internally rendering `<Card>` + visual primitives.

### 5.2 Conventions

- File: `kebab-case.tsx`. Component: PascalCase exports.
- All files begin with `"use client";` — even pure-visual components, to avoid RSC nesting friction across the whole `components/brand/` namespace.
- Named exports only. `export function X(...)` and `export const X = forwardRef(...)`. No default exports.
- Props: explicit TypeScript `interface XProps`. Callbacks typed. `cn` from `@/lib/utils` for className merging.
- **Zero inline colors / sizes / shadows.** Every visual value resolves through token utility classes (`bg-paper-0`, `border-hairline`, `shadow-1`, `text-ink-2`, `font-tight`, etc.) or arbitrary values referencing tokens (`shadow-[var(--shadow-current)]` if Tailwind v4 needs that fallback per §4.4). Hard-coded pixel sizes are allowed only for SVG icon dimensions (`width: 18`) and component-internal width/height where a token doesn't exist (`w-9 h-9` for IconButton 36×36 is fine; `w-[27px]` is questionable).
- Subset of components follow the DESIGN.md §5 "six layout rules" — `<HeroTitle>` enforces no-wrap on the adjacent CTA via grid; `<NavItem>` enforces `min-width: 0` + ellipsis on the text span; `<ProjItem>` enforces same; `<ProjectCard name>` enforces `word-break: keep-all` 2-line clamp.

### 5.3 Worked examples

**`button.tsx`** (final reference; primary/ghost/danger × default/sm/big/icon):

```tsx
"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center gap-2 rounded-md text-sm font-bold whitespace-nowrap " +
  "border-[1.5px] transition-transform " +
  "active:translate-y-[var(--depth)] active:shadow-none " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary: "bg-ink-0 text-paper-0 border-ink-0 shadow-[var(--shadow-current)] hover:brightness-95",
  ghost:   "bg-transparent text-ink-0 border-hairline hover:bg-paper-2",
  danger:  "bg-paper-0 text-ink-0 border-ink-0 shadow-[var(--shadow-current)] hover:bg-paper-2",
} as const;

const sizes = {
  default: "px-3.5 py-2.5",
  sm:      "px-2.5 py-1.5 text-xs",
  big:     "px-5 py-3 text-base rounded-full border-[1.75px]",
  icon:    "p-0 w-9 h-9 justify-center",
} as const;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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

**`status-chip.tsx`** — DESIGN.md §6 shape-first status master table; reference implementation in §3 of the design discussion.

### 5.4 Component-level decisions

- **`<NavItem>`** count badge is optional. When omitted, row right edge is empty (no zero state).
- **`<NavItem disabled>`** applies `opacity-50 cursor-not-allowed` and wraps the row in a Radix tooltip from `@/components/brand/tooltip`. tooltip prop is required when disabled.
- **`<ProjItem>`** same disabled/tooltip pattern.
- **`<Avatar>`** computes initials from `name` (first letter of first ≤2 words, uppercased). `online` is optional; omit to hide the dot.
- **`<StatCard hot>`** when `hot`, render an extra `<div>` child with `stat-card-hot-stripe-after` for the diagonal overlay (§4.3).
- **`<ProjTopstrip swatch>`** picks one of 6 utility classes (topstrip-green/blue/pink/amber/violet/teal); `swatch` is required.
- **`<Dialog>`**, **`<Dropdown>`**, **`<Tooltip>`** — each file exports a brand-flavored wrapper around the Radix primitives. They expose `Root`, `Trigger`, `Content`, etc. similar to shadcn but with brand classNames applied. ~40–80 lines each.

## 6. Layer 3 — Call sites (18 changes)

### 6.1 WorkspaceHomePage (`app/(app)/w/[wsId]/page.tsx`)

Most-changed page. New layout, new components, new content.

```tsx
"use client";
import { use } from "react";
import {
  HeroEyebrow, HeroTitle, HeroPop, HeroArrow, HeroSub,
} from "@/components/brand/hero";
import { Button } from "@/components/brand/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/brand/tooltip";
import { SectionHead } from "@/components/brand/section-head";
import { Pill, Pills } from "@/components/brand/tag";
import { StatCard } from "@/components/brand/stat-card";
import { RailSection, RailHead, RailEmpty } from "@/components/brand/rail-section";
import { EmptyState } from "@/components/common/EmptyState";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { useProjects } from "@/hooks/useProjects";
import { useSession } from "@/hooks/useSession";
import { messages } from "@/lib/messages";

interface PageProps { params: Promise<{ wsId: string }>; }

export default function WorkspaceHomePage({ params }: PageProps) {
  const { wsId } = use(params);
  const { data: projects, isPending } = useProjects(wsId);
  const { user } = useSession();
  const firstName = user?.name?.split(/\s+/)[0] ?? "";

  return (
    <div className="p-7 home-page">
      <div className="home-grid">

        <section className="hero">
          <HeroEyebrow>
            <span className="dot" /> · 概览
          </HeroEyebrow>
          <HeroTitle>
            {firstName ? `${firstName}, ` : ""}今天 <HeroPop>开干</HeroPop>
            <HeroArrow />
          </HeroTitle>
          <HeroSub>该开始干了。先把今天最重要的一件事拎出来。</HeroSub>
          <div className="hero-cta">
            <Tooltip>
              <TooltipTrigger asChild>
                <span><Button size="big" disabled>+ 新建项目</Button></span>
              </TooltipTrigger>
              <TooltipContent>{messages.shell.writesDisabled}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span><Button variant="ghost" size="big" disabled>召唤 agent</Button></span>
              </TooltipTrigger>
              <TooltipContent>S2 上线后启用</TooltipContent>
            </Tooltip>
          </div>
        </section>

        <section className="stat-grid">
          <StatCard hot label="待审批" value="—" foot="—" />
          <StatCard      label="在线"   value="—" foot="—" />
          <StatCard      label="今日新建" value="—" foot="—" />
          <StatCard      label="已完成" value="—" foot="—" />
        </section>

        <section className="home-projects">
          <SectionHead title="项目" count={projects?.length ?? 0}>
            <Pills>
              <Pill active>我的</Pill>
              <Pill>全部</Pill>
            </Pills>
          </SectionHead>
          {isPending && <ProjectGridSkeleton />}
          {!isPending && projects && projects.length === 0 && (
            <EmptyState
              title={messages.empty.noProjects.title}
              description={messages.empty.noProjects.description}
            />
          )}
          {!isPending && projects && projects.length > 0 && (
            <ProjectGrid wsId={wsId} projects={projects} chunky />
          )}
        </section>

        <section className="home-rail">
          <RailSection>
            <RailHead dot>待审批 · 0 件</RailHead>
            <RailEmpty>暂无待审批，agent 安静着</RailEmpty>
          </RailSection>
        </section>

      </div>
    </div>
  );
}
```

Layout grid (`home-grid`, `hero`, `stat-grid`, `home-projects`, `home-rail`) is keyed off tokens-cream.css equivalents already embedded in `styles/layout-rules.css`; no per-component grid CSS needed.

### 6.2 Sidebar (`components/nav/Sidebar.tsx`)

Replaced with brand-driven structure. See §5 of design discussion for full sketch. Key points:

- `<BrandMark>` + `<WsSwitcher>` at top
- 5 `<NavItem>` rows: 概览 (active when at /w/[wsId]), 审批 (disabled, tooltip "S3 上线后启用", no count badge), Agents (disabled), Runtimes (disabled), 设置 (disabled)
- "项目" section with one `<ProjItem swatch={swatchFromId(p.id)} active>` per project, plus disabled "+ 新建项目" item
- `<AccountMenu />` in foot (existing component, internal imports flipped to brand)
- Swatch helper: `lib/swatch.ts` — `swatchFromId(id: string): "green"|"blue"|"pink"|"amber"|"violet"|"teal"` via stable hash of id.

### 6.3 Topbar (rendered via `ThreeColumnShell` / `app/(app)/layout.tsx`)

New: brand `<Crumb>` + spacer + disabled brand `<Input>` search box (tooltip "S2 上线后启用") + disabled `<IconButton icon="bell">` (no badge count, tooltip "S3 上线后启用") + `<Avatar>` (no online dot).

### 6.4 LoginForm / RegisterForm

```tsx
const emailRef = useRef<HTMLInputElement>(null);
// <Input ref={emailRef} id="email" .../>

// in error handler:
if (err.status === 401) {              // LoginForm: 401
  setFormError(messages.auth.loginFailed);
  setPassword("");
  emailRef.current?.focus();
  emailRef.current?.select();
}
// RegisterForm uses 409 (conflict) with same pattern.
```

All `<Button>` `<Input>` `<Label>` imports flip to `@/components/brand/*`. Cards wrap form in `<Card chunky>` per prototype Login.jsx.

### 6.5 ProjectCard (`components/projects/ProjectCard.tsx`)

Replaced with chunky variant:

```tsx
import { Card } from "@/components/brand/card";
import { ProjTopstrip } from "@/components/brand/proj-topstrip";
import { swatchFromId } from "@/lib/swatch";

export function ProjectCard({ wsId, project }: ProjectCardProps) {
  const swatch = swatchFromId(project.id);
  return (
    <Link href={`/w/${wsId}/p/${project.id}`}>
      <Card chunky className="proj-card overflow-hidden p-0">
        <ProjTopstrip swatch={swatch} className="h-[130px] tall" />
        <div className="p-4">
          <h3 className="proj-name text-lg font-tight font-extrabold text-ink-0">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-xs text-ink-2 mt-1 line-clamp-2">{project.description}</p>
          )}
          <div className="flex items-center gap-2 mt-3 text-xs text-ink-2">
            <span>创建于 {relativeTime(project.created_at)}</span>
            {project.archived && <span className="text-status-archived-fg">已归档</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

The `proj-name` className inherits DESIGN.md §5 Rule 5 (keep-all + 2-line clamp) via `styles/layout-rules.css` selectors.

### 6.6 ProjectBoardPage (`app/(app)/w/[wsId]/p/[projectId]/page.tsx`)

Header swapped to `<PageHeader title={project.name} sub={taskCountLabel} />`. TaskCard internal Card → brand Card, StatusBadge → brand StatusChip.

### 6.7 OnboardingPage, common/* (EmptyState, ErrorBanner, OfflineBanner, PageSkeleton)

Paths preserved at `components/common/`. Internal imports flip to brand. Visual treatment per DESIGN.md §5 (Empty state: 320px card; ErrorBanner: paper-0 bg + accent border; OfflineBanner: ink banner; PageSkeleton: paper-1 placeholders).

## 7. Focus-return fix details

Item 3 of `tests/manual-checklist.md` (Login 401 → focus does not return to email) closes here.

- **LoginForm:** add `emailRef` + on 401 → `setPassword(""); emailRef.current?.focus(); emailRef.current?.select();`
- **RegisterForm:** add `emailRef` + on 409 (user exists) → same handler.
- **Unit test:** `tests/unit/LoginForm.focus-return.test.tsx` using `@testing-library/react` + Vitest, mocks `auth.login` to throw `ApiError(401, …)`, asserts `document.activeElement === emailInput` after submit. Add `@testing-library/react` + `jsdom` to devDependencies if not present in `vitest.config.ts`.
- **No RegisterForm unit test** — verified manually in visual acceptance report.

## 8. Visual acceptance — the gate

A new file `docs/superpowers/reports/s1-polish-visual-acceptance.md` collects side-by-side proof. Structure:

```markdown
# S1 Polish Visual Acceptance Report
> Generated YYYY-MM-DD after S1 polish branch merge.
> Method: human-eye side-by-side comparison vs prototype screenshots.

## 1. Login page
- Target: ui_design/screens/Login.jsx rendered or screenshot
- After:  docs/superpowers/screenshots/s1-polish/login-after.png
- Status: ✅ accepted | ❌ rework needed
- Notes:  …

## 2. Register page
…

## 3. WorkspaceHome — empty state
…

## 4. WorkspaceHome — with projects (hero + stat + rail)
- Target: screenshots/01-workspace-home-with-tasks.png
         + screenshots/02-workspace-home-projects-grid.png
- After:  docs/superpowers/screenshots/s1-polish/wshome-after.png
…

## 5. ProjectBoard
…

## 6. Onboarding
…

## 7. Sidebar (collapsed + expanded)
…

## 8. Topbar
…

## 9. EmptyState / ErrorBanner / OfflineBanner
…
```

Each section gets a `target` image (prototype screenshot or rendered ui_design/screens output) and an `after` image (browse-skill capture of `localhost:3000`). Acceptance is `✅` only after the human reviewer (zhangtema@gmail.com) confirms visual indistinguishability. Pixel-diff automation is explicitly deferred to a future S5 / visual-regression sub-project.

Screenshots stored in `docs/superpowers/screenshots/s1-polish/` (new directory).

## 9. Risks and unknowns

1. **`shadow-1` token utility may not render correctly under Tailwind v4.** The `@theme` block defines `--shadow-1: var(--shadow-1)` which is self-referential (refers to the CSS variable from `styles/tokens/shadow.css`). Tailwind v4 should resolve this. If smoke test (§4.4) shows broken shadow, brand components flip to arbitrary-value syntax `shadow-[3px_3px_0_var(--ink-0)]` and `shadow-[var(--shadow-current)]` per-usage. No design change, just utility verbosity.

2. **Bricolage Grotesque first-paint flash with next/font.** `display: 'swap'` causes a fallback `system-ui` flash on first paint before web font loads. Browsers see system-ui at wdth 100 (no axis support), so the hero may flash unstyled-narrow → confident-wide. Mitigation: `display: 'swap'` accepted as standard cost; if flash is severe in practice, evaluate `display: 'optional'` (Lighthouse-friendly but loses font on slow connections).

3. **Dark mode tokens are blank (DESIGN.md §8).** Brand components reference `--paper-0` etc.; under `[data-theme="dark"]` they resolve to empty values. S1 polish does not implement dark mode (S6 scope). If a tester accidentally toggles dark mode via Tweaks panel, expect broken visuals. Mitigation: spec-document, optionally hide dark theme toggle in Tweaks panel for S1 (out of scope, but worth noting).

4. **`Project` type lacks `taskCount` field.** Sidebar `<ProjItem count>` and stat-grid "今日新建" / "已完成" have no backend data. Spec accepts placeholder rendering (no count badge in sidebar; `value="—"` in stat cards). New entry should be added to `docs/BACKEND_GAPS.md` for S3+ planning, but not blocking polish.

5. **`opsz` axis confusion.** Some prototype CSS includes `font-variation-settings: "wdth" 84, "opsz" 96`. Bricolage Grotesque does not expose `opsz`. Browsers silently ignore unknown axis names — no visual difference — but spec drops `opsz` from all brand utility entries for cleanliness.

## 10. Out of scope (explicit)

These items are intentionally deferred:

- **S2 chat primitives** (`<ToolCard>`, `<PermCard>`, `<MentionPop>`, `<Composer>`, `<MessageBubble>`, `<ThinkingCard>`) — port during S2 brainstorm.
- **S3 approval primitives** (`<ApprovalRow>` hub variant, `<ApprovalHead>` striped) — port during S3.
- **Real data wiring for stat cards and approval rail** — wait for `/api/v1/workspaces/{wsId}` aggregations (BACKEND_GAPS #5) and approval listing endpoints (S3).
- **Dark theme** (S6).
- **Visual regression automation** (pixel diff CI) — future S5 / dedicated sub-project.
- **Sidebar collapse mode** at `<900px` viewport — CSS rules are in `styles/layout-rules.css`; tested but not explicitly QA'd this round.

## 11. Acceptance criteria

S1 polish is accepted when every box below is checked:

**Layer 1 (tokens & utilities)**
- [ ] `next/font/google` Bricolage Grotesque loaded with axes=wdth+wght, exposed as `--font-display`
- [ ] 6 font `@utility` entries (font-tight, font-wide, font-normal-wdth, hero-title, stat-num, page-title) defined in `globals.css`
- [ ] Custom `@utility` entries for hot-stripe overlay, 6 topstrip swatches, status-pulse animation
- [ ] Shadow utility smoke test passes (or fallback documented)

**Layer 2 (brand components)**
- [ ] 23 files exist in `components/brand/`, each "use client", named exports, TypeScript interfaces
- [ ] Zero inline hex colors / px sizes (except SVG icons and required component-internal dims)
- [ ] Each component is the only consumer of its own prototype CSS rules (no duplication)
- [ ] Three Radix wrappers (dialog, dropdown, tooltip) compile and render

**Layer 3 (call sites)**
- [ ] WorkspaceHomePage renders hero + stat 2×2 + project grid + rail per §6.1
- [ ] Sidebar renders 5 nav items + project list per §6.2
- [ ] Topbar renders crumb + disabled search + bell + avatar per §6.3
- [ ] LoginForm 401 → password cleared, focus returned to email (selected). Vitest unit test green.
- [ ] RegisterForm 409 → focus returned to email (manual verification only)
- [ ] ProjectCard renders chunky with topstrip swatch per §6.5
- [ ] ProjectBoardPage uses brand PageHeader + Card + StatusChip
- [ ] 4 `components/common/*` files internally use brand components

**Visual acceptance**
- [ ] `docs/superpowers/reports/s1-polish-visual-acceptance.md` filled with 9 sections
- [ ] All 9 sections marked ✅ by human reviewer (no remaining ❌)

**Hygiene**
- [ ] No regressions: existing 69 Vitest tests still pass, `lib/` coverage stays ≥94%
- [ ] Manual checklist items 1-2, 4-20 (19 items) re-verified PASS
- [ ] Item 3 (focus return) flips from PARTIAL to PASS
- [ ] `pnpm dev` cold start <2s, page TTFB <500ms (current baseline: ttfb 245ms / domReady 276ms / load 856ms — must not regress >20%)

## 12. Effort estimate

Single-person workload, sequential execution per build order in §3:

- **Layer 1** (tokens, utilities, font loading): ~0.5 day
- **Layer 2** (23 brand components, port + test render): ~4–6 days
- **Layer 3** (18 call site rewrites + focus fix + unit test): ~2 days
- **Visual acceptance loop** (9 sections, expect 1–2 rework rounds per section): ~1–3 days

**Total: 8–12 days.** Carries one ~37-commit-sized PR or a series of PRs gated by visual acceptance per page.

---

**Next:** This spec is reviewed and approved by zhangtema@gmail.com. Implementation plan written by `superpowers:writing-plans` skill into `docs/superpowers/plans/2026-05-16-s1-polish.md`. Execution by subagent-driven development per `~/.claude/rules/development-workflow.md`.

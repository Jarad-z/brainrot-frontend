# S1 · Next.js Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the Next.js 15 engineering foundation (auth + three-column shell + read-only workspace/project/task browsing) per `docs/superpowers/specs/2026-05-16-s1-nextjs-skeleton-design.md`.

**Architecture:** Next.js 15 App Router at repo root, two route groups `(public)` and `(app)`. Cookie session validated by `useSession()` on the client; `(app)/layout.tsx` gates with `'use client'`. State split: TanStack Query for server data (typed `queryKeys` factory), Zustand for selection + WS status. Tailwind v4 with `:root` token variables + `@theme` alias layer (1:1 port of S0 tokens). WS infrastructure is connect-only — `subscribe` abstraction deferred to S2. Every write operation renders disabled with tooltip "S? 上线后启用".

**Tech Stack:** pnpm · Next.js 15 · React 19 · TypeScript strict (`noUncheckedIndexedAccess`) · Tailwind CSS v4 · shadcn/ui (10 components) · TanStack Query v5 · Zustand · Vitest + @testing-library/react · ESLint flat config · Prettier · date-fns

---

## Spec & Reference Files

- **Spec:** `docs/superpowers/specs/2026-05-16-s1-nextjs-skeleton-design.md`
- **Engineering baseline:** `docs/FRONTEND.md`
- **API contract:** `docs/API.md`
- **Design system (S0):** `ui_design/DESIGN.md`
- **Tokens (S0):** `ui_design/tokens/*.css` (copy verbatim to `styles/tokens/`)
- **Lib helpers (S0):** `ui_design/lib/*.js` (port to TypeScript)

---

## File Structure

Files created in this plan, grouped by task cluster:

```
D:\brainrot_frontend\
├── package.json                       Task 1
├── pnpm-lock.yaml                     Task 1
├── tsconfig.json                      Task 1
├── next.config.ts                     Task 1
├── tailwind.config.ts                 Task 2
├── postcss.config.mjs                 Task 2
├── eslint.config.mjs                  Task 3
├── .prettierrc                        Task 3
├── vitest.config.ts                   Task 4
├── .env.example                       Task 1
├── .gitignore                         Task 1
│
├── app/
│   ├── layout.tsx                     Task 5  (fonts + Providers + html lang="zh")
│   ├── globals.css                    Task 2  (Tailwind + @theme + token imports)
│   ├── icon.tsx                       Task 5
│   ├── (public)/
│   │   ├── layout.tsx                 Task 16
│   │   ├── login/page.tsx             Task 17
│   │   └── register/page.tsx          Task 18
│   └── (app)/
│       ├── layout.tsx                 Task 20  ('use client' shell)
│       ├── page.tsx                   Task 21  (entry redirect)
│       ├── onboarding/page.tsx        Task 22
│       └── w/[wsId]/
│           ├── layout.tsx             Task 23
│           ├── page.tsx               Task 24
│           └── p/[projectId]/
│               ├── layout.tsx         Task 25
│               └── page.tsx           Task 26
│
├── styles/
│   ├── tokens/                        Task 2  (8 files copied verbatim)
│   │   ├── palette.css
│   │   ├── typography.css
│   │   ├── spacing.css
│   │   ├── radii.css
│   │   ├── shadow.css
│   │   ├── roles.css
│   │   ├── status.css
│   │   └── tweaks.css
│   └── layout-rules.css               Task 2  (six locked layout rules)
│
├── lib/
│   ├── codec.ts                       Task 6  (port + tests)
│   ├── mention-parse.ts               Task 7
│   ├── countdown.ts                   Task 8
│   ├── format.ts                      Task 9
│   ├── keyboard.ts                    Task 10
│   ├── parse-message.ts               Task 11
│   ├── validation.ts                  Task 12
│   ├── messages.ts                    Task 12
│   ├── store.ts                       Task 14
│   ├── api/
│   │   ├── client.ts                  Task 13
│   │   ├── keys.ts                    Task 13
│   │   ├── types.ts                   Task 13
│   │   ├── auth.ts                    Task 13
│   │   ├── projects.ts                Task 13
│   │   ├── tasks.ts                   Task 13
│   │   └── messages.ts                Task 13  (type-only stub)
│   └── ws/
│       ├── client.ts                  Task 15
│       └── provider.tsx               Task 15
│
├── hooks/
│   ├── useSession.ts                  Task 19
│   ├── useProjects.ts                 Task 23
│   ├── useProject.ts                  Task 25
│   └── useTasks.ts                    Task 26
│
├── providers/
│   └── QueryProvider.tsx              Task 19
│
├── components/
│   ├── ui/                            Task 5  (shadcn generated, 10 components)
│   ├── common/
│   │   ├── EmptyState.tsx             Task 16
│   │   ├── ErrorBanner.tsx            Task 16
│   │   ├── OfflineBanner.tsx          Task 15
│   │   └── PageSkeleton.tsx           Task 20
│   ├── auth/
│   │   ├── LoginForm.tsx              Task 17
│   │   └── RegisterForm.tsx           Task 18
│   ├── nav/
│   │   ├── Sidebar.tsx                Task 20
│   │   ├── WorkspaceSwitcher.tsx      Task 20
│   │   ├── Breadcrumb.tsx             Task 20
│   │   ├── AccountMenu.tsx            Task 20
│   │   └── ThreeColumnShell.tsx       Task 20
│   ├── projects/
│   │   ├── ProjectGrid.tsx            Task 24
│   │   └── ProjectCard.tsx            Task 24
│   └── tasks/
│       ├── TaskGrid.tsx               Task 26
│       ├── TaskCard.tsx               Task 26
│       └── TaskStatusBadge.tsx        Task 26
│
├── tests/
│   ├── lib/                           Tasks 6-12
│   ├── api/                           Task 13
│   └── store/                         Task 14
│
└── docs/
    ├── BACKEND_GAPS.md                Task 27
    └── README.md                      Task 27 (or root README)
```

`ui_design/` stays untouched. `next.config.ts` excludes it from the build.

---

## Task 1: Scaffold Next.js 15 + TypeScript + base config

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize pnpm + package.json**

Run from `D:\brainrot_frontend\`:

```bash
pnpm init
```

Then replace `package.json` content with:

```json
{
  "name": "brainrot-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,css}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,css}\""
  }
}
```

- [ ] **Step 2: Install runtime dependencies**

```bash
pnpm add next@^15 react@^19 react-dom@^19 @tanstack/react-query@^5 @tanstack/react-query-devtools@^5 zustand@^5 date-fns@^4
```

- [ ] **Step 3: Install dev dependencies**

```bash
pnpm add -D typescript@^5 @types/node @types/react @types/react-dom
pnpm add -D tailwindcss@^4 @tailwindcss/postcss postcss
pnpm add -D vitest@^2 @vitest/coverage-v8 @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^25
pnpm add -D eslint@^9 @eslint/js typescript-eslint eslint-config-next eslint-plugin-react eslint-plugin-react-hooks
pnpm add -D prettier@^3
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "ui_design", "_design_pkg", ".next"]
}
```

- [ ] **Step 5: Create next.config.ts**

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;
    if (apiBase) return [];
    return [
      { source: "/api/:path*", destination: "http://localhost:8080/api/:path*" },
    ];
  },
  webpack(config) {
    config.module.rules.push({ test: /ui_design[\\/]/, loader: "ignore-loader" });
    return config;
  },
};

export default config;
```

Then install `ignore-loader`:

```bash
pnpm add -D ignore-loader
```

- [ ] **Step 6: Create .env.example**

```
# Same-origin (Next rewrites): leave empty
NEXT_PUBLIC_API_BASE=

# Direct backend (development with CORS):
# NEXT_PUBLIC_API_BASE=http://localhost:8080
# NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

- [ ] **Step 7: Create .gitignore**

```
node_modules
.next
out
build
dist
.env
.env.local
*.tsbuildinfo
.DS_Store
coverage
.vscode
```

- [ ] **Step 8: Verify**

```bash
pnpm typecheck
```

Expected: `tsc --noEmit` runs without errors (there's no code yet, exits 0).

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json next.config.ts .env.example .gitignore
git commit -m "feat(s1): scaffold Next.js 15 + TS strict + base config"
```

---

## Task 2: Tailwind v4 + globals.css + token migration

**Files:**
- Create: `app/globals.css`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `styles/tokens/*.css` (8 files, copied from `ui_design/tokens/`)
- Create: `styles/layout-rules.css` (extracted from `ui_design/tokens-cream.css`)

- [ ] **Step 1: Create postcss.config.mjs**

```js
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};
export default config;
```

- [ ] **Step 2: Create tailwind.config.ts**

Tailwind v4 reads `@theme` from CSS — config is content paths only:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
};

export default config;
```

- [ ] **Step 3: Copy 8 token files from S0 to styles/tokens/**

Run from `D:\brainrot_frontend\`:

```bash
mkdir styles
mkdir styles\tokens
copy "ui_design\tokens\palette.css" "styles\tokens\palette.css"
copy "ui_design\tokens\typography.css" "styles\tokens\typography.css"
copy "ui_design\tokens\spacing.css" "styles\tokens\spacing.css"
copy "ui_design\tokens\radii.css" "styles\tokens\radii.css"
copy "ui_design\tokens\shadow.css" "styles\tokens\shadow.css"
copy "ui_design\tokens\roles.css" "styles\tokens\roles.css"
copy "ui_design\tokens\status.css" "styles\tokens\status.css"
copy "ui_design\tokens\tweaks.css" "styles\tokens\tweaks.css"
```

- [ ] **Step 4: Extract layout-rules from tokens-cream.css**

Open `ui_design/tokens-cream.css`, find the "Six locked layout rules" block (search for `WorkspaceHome header` or "hero" rules). Copy that block verbatim into `styles/layout-rules.css`. If `tokens-cream.css` doesn't have an explicit named block, copy the rules that implement DESIGN.md §5 "Six locked layout rules" (hero grid, page grid, stat aspect-ratio, sidebar min-width, project card word-break, sidebar icon monochrome). The file should be standalone CSS that can be `@import`-ed.

- [ ] **Step 5: Create app/globals.css**

```css
@import "tailwindcss";

@import "../styles/tokens/palette.css";
@import "../styles/tokens/typography.css";
@import "../styles/tokens/spacing.css";
@import "../styles/tokens/radii.css";
@import "../styles/tokens/shadow.css";
@import "../styles/tokens/roles.css";
@import "../styles/tokens/status.css";
@import "../styles/tokens/tweaks.css";
@import "../styles/layout-rules.css";

@theme {
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
  --color-role-approval-bg: var(--role-approval-bg);
  --color-role-approval-fg: var(--role-approval-fg);
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

  --text-xs:   var(--text-xs);
  --text-sm:   var(--text-sm);
  --text-base: var(--text-base);
  --text-lg:   var(--text-lg);
  --text-xl:   var(--text-xl);
  --text-2xl:  var(--text-2xl);
  --text-hero: var(--text-hero);

  --spacing-1:  var(--sp-1);
  --spacing-2:  var(--sp-2);
  --spacing-3:  var(--sp-3);
  --spacing-4:  var(--sp-4);
  --spacing-5:  var(--sp-5);
  --spacing-6:  var(--sp-6);
  --spacing-8:  var(--sp-8);
  --spacing-10: var(--sp-10);
  --spacing-12: var(--sp-12);

  --radius-sm:  var(--r-sm);
  --radius-md:  var(--r-md);
  --radius-lg:  var(--r-lg);
  --radius-xl:  var(--r-xl);
  --shadow-1:       var(--shadow-1);
  --shadow-2:       var(--shadow-2);
  --shadow-3:       var(--shadow-3);
  --shadow-current: var(--shadow-current);
  --shadow-soft:    var(--shadow-soft);

  --font-display: var(--font-display);
  --font-body:    var(--font-display);
  --font-mono:    var(--font-mono);
}

html, body { background: var(--paper-1); color: var(--ink-0); }
body { font-family: var(--font-body); font-size: var(--text-base); line-height: 1.5; }
```

- [ ] **Step 6: Commit**

```bash
git add app/globals.css tailwind.config.ts postcss.config.mjs styles/
git commit -m "feat(s1): Tailwind v4 + token migration (paper/ink/accent/status)"
```

---

## Task 3: ESLint + Prettier

**Files:**
- Create: `eslint.config.mjs`
- Create: `.prettierrc`

- [ ] **Step 1: Create eslint.config.mjs**

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "eslint-config-next";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "camelcase": ["error", { properties: "never", ignoreDestructuring: true }]
    },
  },
  {
    ignores: ["node_modules/", ".next/", "ui_design/", "_design_pkg/", "coverage/", "*.config.*"],
  },
];
```

- [ ] **Step 2: Create .prettierrc**

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

- [ ] **Step 3: Run lint to verify config**

```bash
pnpm lint
```

Expected: exit 0 (no source files yet to flag).

- [ ] **Step 4: Commit**

```bash
git add eslint.config.mjs .prettierrc
git commit -m "feat(s1): ESLint flat config + Prettier"
```

---

## Task 4: Vitest config + jsdom setup

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.{ts,tsx}"],
      exclude: ["lib/**/*.d.ts", "lib/api/messages.ts"],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 2: Create tests/setup.ts**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Write a smoke test**

Create `tests/lib/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("vitest is wired", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run test**

```bash
pnpm test
```

Expected: 1 test passing, "smoke > vitest is wired".

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts tests/setup.ts tests/lib/smoke.test.ts
git commit -m "feat(s1): Vitest + jsdom + 80% coverage threshold on lib/"
```

---

## Task 5: Root layout + fonts + shadcn/ui install

**Files:**
- Create: `app/layout.tsx`
- Create: `app/icon.tsx`
- Create: `app/page.tsx` (temporary placeholder)
- Create: `components.json` (shadcn config)
- Modify: `components/ui/` (shadcn generated files)

- [ ] **Step 1: Create app/layout.tsx with next/font**

```tsx
import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Brainrot",
  description: "协作 AI 工作台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Create app/icon.tsx (favicon via OG image generation)**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ fontSize: 24, background: "#1b1820", color: "#fdfaf2", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontWeight: 800 }}>B</div>,
    { ...size },
  );
}
```

- [ ] **Step 3: Create temporary app/page.tsx**

```tsx
export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-display">Brainrot — S1 bootstrap OK</h1>
      <p className="text-ink-2 text-sm mt-2">Tailwind v4 + tokens loaded.</p>
    </main>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

Expected: build succeeds, "Compiled successfully" and a list of routes including `/`.

- [ ] **Step 5: Install shadcn/ui**

```bash
pnpm dlx shadcn@latest init
```

When prompted, accept defaults: TypeScript yes, default style, base color neutral, `app/globals.css` already exists (overwrite no — we manage it), `components.json` yes, `@/components` alias, `@/lib/utils` alias.

If prompts differ, ensure `components.json` ends up with:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": { "components": "@/components", "utils": "@/lib/utils" }
}
```

- [ ] **Step 6: Generate the 10 minimal shadcn components**

```bash
pnpm dlx shadcn@latest add button input label card avatar separator skeleton dropdown-menu tooltip dialog
```

This creates `components/ui/*.tsx` (10 files) and `lib/utils.ts` (the `cn()` helper).

- [ ] **Step 7: Verify build still passes**

```bash
pnpm build
```

Expected: success.

- [ ] **Step 8: Commit**

```bash
git add app/layout.tsx app/icon.tsx app/page.tsx components/ui/ components.json lib/utils.ts
git commit -m "feat(s1): root layout + fonts + shadcn/ui (10 components)"
```

---

## Task 6: Port lib/codec.ts + tests

**Files:**
- Create: `lib/codec.ts`
- Create: `tests/lib/codec.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/codec.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { decodeJSON, encodeJSON, CodecError } from "@/lib/codec";

describe("decodeJSON", () => {
  it("decodes valid base64 JSON", () => {
    const b64 = btoa('{"text":"hello","n":42}');
    expect(decodeJSON(b64)).toEqual({ text: "hello", n: 42 });
  });

  it("throws CodecError on malformed base64", () => {
    expect(() => decodeJSON("not!base64!@#")).toThrow(CodecError);
  });

  it("throws CodecError on non-JSON content", () => {
    const b64 = btoa("plain text not json");
    expect(() => decodeJSON(b64)).toThrow(/invalid JSON/);
  });

  it("throws CodecError on empty string", () => {
    expect(() => decodeJSON("")).not.toThrow();  // atob("") === "", JSON.parse("") throws
    // Actually empty b64 -> empty raw -> JSON.parse fails:
    expect(() => decodeJSON("")).toThrow(CodecError);
  });

  it("throws CodecError when passed non-string", () => {
    // @ts-expect-error testing runtime guard
    expect(() => decodeJSON(123)).toThrow(/expected string/);
  });

  it("round-trips encode/decode", () => {
    const value = { a: 1, b: [2, 3], c: { nested: true } };
    expect(decodeJSON(encodeJSON(value))).toEqual(value);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test tests/lib/codec.test.ts
```

Expected: all fail with "Cannot find module '@/lib/codec'".

- [ ] **Step 3: Implement lib/codec.ts**

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
  try {
    raw = atob(b64);
  } catch (e) {
    throw new CodecError(`invalid base64: ${(e as Error).message}`, b64);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new CodecError(`invalid JSON: ${(e as Error).message}`, b64);
  }
}

export function encodeJSON(value: unknown): string {
  return btoa(JSON.stringify(value));
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test tests/lib/codec.test.ts
```

Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/codec.ts tests/lib/codec.test.ts
git commit -m "feat(s1): port lib/codec.ts to TS + Vitest"
```

---

## Task 7: Port lib/mention-parse.ts + tests

**Files:**
- Create: `lib/mention-parse.ts`
- Create: `tests/lib/mention-parse.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { filterCandidates, parseSubmit, activePrefix } from "@/lib/mention-parse";

const agents = [
  { id: "1", handle: "writer" },
  { id: "2", handle: "Reviewer" },
  { id: "3", handle: "deployer", archived: true },
  { id: "4", handle: "writer-2" },
];

describe("filterCandidates", () => {
  it("returns all non-archived on empty prefix", () => {
    expect(filterCandidates("", agents)).toHaveLength(3);
  });

  it("filters by prefix case-insensitively", () => {
    expect(filterCandidates("WR", agents).map((a) => a.id)).toEqual(["1", "4"]);
  });

  it("excludes archived even when prefix matches", () => {
    expect(filterCandidates("dep", agents)).toEqual([]);
  });
});

describe("parseSubmit", () => {
  it("dedupes mention ids", () => {
    const result = parseSubmit(
      "hi @writer @writer",
      [{ id: "1", handle: "writer" }, { id: "1", handle: "writer" }],
    );
    expect(result).toEqual({ text: "hi @writer @writer", mentions: ["1"] });
  });
});

describe("activePrefix", () => {
  it("returns prefix when caret is in a mention", () => {
    expect(activePrefix("hi @wri", 7)).toBe("wri");
  });

  it("returns null when not in a mention", () => {
    expect(activePrefix("hi there", 5)).toBeNull();
  });

  it("returns null when @ is mid-word", () => {
    expect(activePrefix("foo@bar", 7)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests, expect fail**

```bash
pnpm test tests/lib/mention-parse.test.ts
```

Expected: fail with "Cannot find module".

- [ ] **Step 3: Implement lib/mention-parse.ts**

```ts
export interface AgentLike {
  id: string;
  handle: string;
  archived?: boolean;
}

export function filterCandidates(
  prefix: string,
  agents: ReadonlyArray<AgentLike>,
): AgentLike[] {
  const p = (prefix || "").toLowerCase();
  return agents
    .filter((a) => !a.archived)
    .filter((a) => a.handle.toLowerCase().startsWith(p));
}

export function parseSubmit(
  text: string,
  placedMentions: ReadonlyArray<{ id: string; handle: string }>,
): { text: string; mentions: string[] } {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const m of placedMentions) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    ids.push(m.id);
  }
  return { text, mentions: ids };
}

export function activePrefix(text: string, caret: number): string | null {
  if (caret <= 0 || caret > text.length) return null;
  let i = caret - 1;
  while (i >= 0) {
    const ch = text[i];
    if (ch === "@") {
      const prev = i === 0 ? "" : text[i - 1];
      if (i === 0 || (prev !== undefined && /\s/.test(prev))) {
        return text.slice(i + 1, caret);
      }
      return null;
    }
    if (ch !== undefined && /\s/.test(ch)) return null;
    i--;
  }
  return null;
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm test tests/lib/mention-parse.test.ts
```

Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/mention-parse.ts tests/lib/mention-parse.test.ts
git commit -m "feat(s1): port lib/mention-parse.ts to TS"
```

---

## Task 8: Port lib/countdown.ts + tests

**Files:**
- Create: `lib/countdown.ts`
- Create: `tests/lib/countdown.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { computeCountdown, URGENT_MS } from "@/lib/countdown";

const now = Date.parse("2026-05-16T12:00:00Z");

describe("computeCountdown", () => {
  it("returns urgent=false when remaining > 10min", () => {
    const expires = new Date(now + 15 * 60 * 1000).toISOString();
    const r = computeCountdown(expires, now);
    expect(r.urgent).toBe(false);
    expect(r.expired).toBe(false);
    expect(r.remainingMs).toBe(15 * 60 * 1000);
  });

  it("returns urgent=true when remaining ≤ 10min", () => {
    const expires = new Date(now + 5 * 60 * 1000).toISOString();
    expect(computeCountdown(expires, now).urgent).toBe(true);
  });

  it("returns expired=true when remaining = 0", () => {
    const expires = new Date(now).toISOString();
    const r = computeCountdown(expires, now);
    expect(r.expired).toBe(true);
    expect(r.label).toBe("已超时");
  });

  it("clamps negative remainder to 0", () => {
    const expires = new Date(now - 60_000).toISOString();
    expect(computeCountdown(expires, now).remainingMs).toBe(0);
  });

  it("formats label as MM:SS zero-padded", () => {
    const expires = new Date(now + 65_000).toISOString();  // 1:05
    expect(computeCountdown(expires, now).label).toBe("01:05");
  });

  it("URGENT_MS is 10 minutes", () => {
    expect(URGENT_MS).toBe(10 * 60 * 1000);
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
pnpm test tests/lib/countdown.test.ts
```

- [ ] **Step 3: Implement lib/countdown.ts**

```ts
import { useEffect, useState } from "react";

export const URGENT_MS = 10 * 60 * 1000;

export interface CountdownState {
  remainingMs: number;
  label: string;
  urgent: boolean;
  expired: boolean;
}

export function computeCountdown(expiresAt: string | number, nowMs: number): CountdownState {
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

export function useCountdown(expiresAt: string | number): CountdownState {
  const [, force] = useState(0);
  useEffect(() => {
    let raf = 0;
    let lastSec = -1;
    const tick = () => {
      const state = computeCountdown(expiresAt, Date.now());
      const sec = Math.floor(state.remainingMs / 1000);
      if (sec !== lastSec) {
        lastSec = sec;
        force((x) => x + 1);
      }
      if (!state.expired) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [expiresAt]);
  return computeCountdown(expiresAt, Date.now());
}
```

- [ ] **Step 4: Run, expect pass**

```bash
pnpm test tests/lib/countdown.test.ts
```

Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/countdown.ts tests/lib/countdown.test.ts
git commit -m "feat(s1): port lib/countdown.ts to TS (computeCountdown + useCountdown)"
```

---

## Task 9: Port lib/format.ts + tests

**Files:**
- Create: `lib/format.ts`
- Create: `tests/lib/format.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { relativeTime, formatBytes } from "@/lib/format";

const now = Date.parse("2026-05-16T12:00:00Z");

describe("relativeTime", () => {
  it("formats past minutes", () => {
    const iso = new Date(now - 5 * 60_000).toISOString();
    expect(relativeTime(iso, now)).toBe("5 分钟前");
  });

  it("formats past hours", () => {
    const iso = new Date(now - 3 * 3600_000).toISOString();
    expect(relativeTime(iso, now)).toBe("3 小时前");
  });

  it("formats past days", () => {
    const iso = new Date(now - 2 * 86400_000).toISOString();
    expect(relativeTime(iso, now)).toBe("2 天前");
  });

  it("returns 刚刚 for <60s", () => {
    const iso = new Date(now - 5_000).toISOString();
    expect(relativeTime(iso, now)).toBe("刚刚");
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats KB", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1500)).toBe("1.5 KB");
  });

  it("formats MB", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement lib/format.ts**

```ts
export function relativeTime(iso: string, nowMs: number = Date.now()): string {
  const then = Date.parse(iso);
  const diffSec = Math.floor((nowMs - then) / 1000);
  if (diffSec < 60) return "刚刚";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
  return `${Math.floor(diffSec / 86400)} 天前`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
```

- [ ] **Step 4: Run, expect pass**

```bash
pnpm test tests/lib/format.test.ts
```

Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/format.ts tests/lib/format.test.ts
git commit -m "feat(s1): port lib/format.ts to TS (relativeTime + formatBytes)"
```

---

## Task 10: Port lib/keyboard.ts (no tests — DOM-heavy, S2 component tests will cover)

**Files:**
- Create: `lib/keyboard.ts`

- [ ] **Step 1: Implement lib/keyboard.ts**

```ts
export interface KeyModifiers {
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export function isKey(
  ev: KeyboardEvent | React.KeyboardEvent,
  key: string,
  modifiers: KeyModifiers = {},
): boolean {
  if (ev.key !== key) return false;
  if (modifiers.meta !== undefined && ev.metaKey !== modifiers.meta) return false;
  if (modifiers.ctrl !== undefined && ev.ctrlKey !== modifiers.ctrl) return false;
  if (modifiers.shift !== undefined && ev.shiftKey !== modifiers.shift) return false;
  if (modifiers.alt !== undefined && ev.altKey !== modifiers.alt) return false;
  return true;
}

export function focusNext(
  container: HTMLElement,
  current: HTMLElement | null,
  direction: 1 | -1,
): HTMLElement | null {
  const focusables = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled"));
  if (focusables.length === 0) return null;
  const idx = current ? focusables.indexOf(current) : -1;
  const nextIdx = (idx + direction + focusables.length) % focusables.length;
  const next = focusables[nextIdx];
  next?.focus();
  return next ?? null;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add lib/keyboard.ts
git commit -m "feat(s1): port lib/keyboard.ts to TS"
```

---

## Task 11: Create lib/parse-message.ts + tests (unused by S1 — S2 first consumer)

**Files:**
- Create: `lib/parse-message.ts`
- Create: `tests/lib/parse-message.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { parseMessageContent, type ParsedMessage } from "@/lib/parse-message";
import { encodeJSON } from "@/lib/codec";

function parsed(input: object): ParsedMessage {
  return parseMessageContent(encodeJSON(input));
}

describe("parseMessageContent variants", () => {
  it("user (default type)", () => {
    const r = parsed({ text: "hello @writer", mentions: ["uuid-1"] });
    expect(r.type).toBe("user");
    if (r.type === "user") expect(r.mentions).toEqual(["uuid-1"]);
  });

  it("system", () => {
    const r = parsed({ type: "system", payload: '{"type":"init"}' });
    expect(r.type).toBe("system");
  });

  it("assistant_text", () => {
    const r = parsed({ type: "assistant_text", payload: { text: "hi" } });
    expect(r.type).toBe("assistant_text");
    if (r.type === "assistant_text") expect(r.payload.text).toBe("hi");
  });

  it("tool_use", () => {
    const r = parsed({ type: "tool_use", payload: { tool_name: "Write", tool_use_id: "u1", input: { path: "/x" } } });
    expect(r.type).toBe("tool_use");
  });

  it("tool_result", () => {
    const r = parsed({ type: "tool_result", payload: { tool_use_id: "u1", is_error: false, content: "ok" } });
    expect(r.type).toBe("tool_result");
  });

  it("permission_request", () => {
    const r = parsed({ type: "permission_request", payload: { tool_use_id: "u1", tool_name: "Bash" } });
    expect(r.type).toBe("permission_request");
  });

  it("thinking", () => {
    const r = parsed({ type: "thinking", payload: { text: "hmm" } });
    expect(r.type).toBe("thinking");
  });

  it("result", () => {
    const r = parsed({ type: "result", payload: { duration_ms: 1200, result: "done" } });
    expect(r.type).toBe("result");
  });

  it("rate_limit_event", () => {
    const r = parsed({ type: "rate_limit_event", payload: { retry_in_seconds: 30 } });
    expect(r.type).toBe("rate_limit_event");
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement lib/parse-message.ts**

```ts
import { decodeJSON } from "./codec";

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

interface RawWithType {
  type?: string;
  text?: string;
  mentions?: string[];
  payload?: unknown;
}

export function parseMessageContent(b64: string): ParsedMessage {
  const raw = decodeJSON<RawWithType>(b64);
  if (!raw.type) {
    return {
      type: "user",
      text: typeof raw.text === "string" ? raw.text : "",
      mentions: Array.isArray(raw.mentions) ? raw.mentions : [],
    };
  }
  return { type: raw.type, payload: raw.payload } as ParsedMessage;
}
```

- [ ] **Step 4: Run, expect pass**

```bash
pnpm test tests/lib/parse-message.test.ts
```

Expected: 9 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/parse-message.ts tests/lib/parse-message.test.ts
git commit -m "feat(s1): lib/parse-message.ts ParsedMessage union (S2 consumer)"
```

---

## Task 12: Create lib/validation.ts + lib/messages.ts + tests

**Files:**
- Create: `lib/validation.ts`
- Create: `lib/messages.ts`
- Create: `tests/lib/validation.test.ts`

- [ ] **Step 1: Write failing tests for validation**

```ts
import { describe, it, expect } from "vitest";
import { isValidEmail, isValidPassword, isValidUuid } from "@/lib/validation";

describe("isValidEmail", () => {
  it("accepts well-formed emails", () => {
    expect(isValidEmail("alice@example.com")).toBe(true);
  });
  it("rejects malformed", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("accepts ≥8 chars", () => {
    expect(isValidPassword("password123")).toBe(true);
  });
  it("rejects <8 chars", () => {
    expect(isValidPassword("short")).toBe(false);
  });
});

describe("isValidUuid", () => {
  it("accepts v4-shaped UUID", () => {
    expect(isValidUuid("11111111-2222-3333-4444-555555555555")).toBe(true);
  });
  it("rejects malformed", () => {
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid("11111111-2222-3333-4444-55555555555")).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement lib/validation.ts**

```ts
export const isValidEmail = (s: string): boolean =>
  typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export const isValidPassword = (s: string): boolean =>
  typeof s === "string" && s.length >= 8;

export const isValidUuid = (s: string): boolean =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
```

- [ ] **Step 4: Implement lib/messages.ts**

```ts
export const messages = {
  auth: {
    invalidEmail: "请输入有效的邮箱地址",
    shortPassword: "密码至少 8 位",
    loginFailed: "邮箱或密码错误",
    registerConflict: "邮箱已被占用或参数非法",
    serverError: "服务器错误，请稍后重试",
    registerCta: "注册",
    loginCta: "登录",
  },
  workspace: {
    onboardingTitle: "进入工作区",
    onboardingHelp: "工作区列表接口尚未开放，请粘贴工作区 ID（管理员处获取）。",
    onboardingRemember: "记住此选择",
    onboardingCta: "进入",
    onboardingInvalidUuid: "格式不正确",
    notMember: "你不是该工作区成员",
    notFound: "工作区不存在",
    backToOnboarding: "返回引导",
  },
  shell: {
    pendingApprovals: "待审批",
    pendingDisabled: "S3 上线后启用",
    listsDisabled: "S4 上线后启用",
    writesDisabled: "S4 上线后启用",
    taskDisabled: "S2 上线后启用",
    wsListDisabled: "工作区列表接口尚未开放（S? 上线后启用）",
    logout: "登出",
    projects: "项目",
    agents: "Agents",
    runtimes: "Runtimes",
    settings: "设置",
  },
  errors: {
    genericRetry: "出错了，请重试",
  },
  empty: {
    noProjects: { title: "还没有项目", description: "请联系管理员创建" },
    noTasks: { title: "还没有任务", description: "" },
  },
  offline: "实时连接已断开，正在重连…",
} as const;
```

- [ ] **Step 5: Run tests, expect pass**

```bash
pnpm test tests/lib/validation.test.ts
```

Expected: 6 passing.

- [ ] **Step 6: Commit**

```bash
git add lib/validation.ts lib/messages.ts tests/lib/validation.test.ts
git commit -m "feat(s1): lib/validation + lib/messages (i18n anchor)"
```

---

## Task 13: API layer — client, keys, types, fetchers + tests

**Files:**
- Create: `lib/api/types.ts`
- Create: `lib/api/client.ts`
- Create: `lib/api/keys.ts`
- Create: `lib/api/auth.ts`
- Create: `lib/api/projects.ts`
- Create: `lib/api/tasks.ts`
- Create: `lib/api/messages.ts` (type stub)
- Create: `tests/api/client.test.ts`
- Create: `tests/api/keys.test.ts`

- [ ] **Step 1: Create lib/api/types.ts**

```ts
// User uses PascalCase to match the /me endpoint response (see BACKEND_GAPS.md #3).
export interface User {
  ID: string;
  Email: string;
  Name: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "open" | "in_progress" | "done" | "blocked" | "archived";

export interface TaskCard {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  status: TaskStatus;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  done_at: string | null;
}
```

- [ ] **Step 2: Write failing tests for client**

Create `tests/api/client.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch, ApiError } from "@/lib/api/client";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const result = await apiFetch<{ ok: boolean }>("/api/v1/me");
    expect(result).toEqual({ ok: true });
  });

  it("returns undefined on 204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const result = await apiFetch<void>("/api/v1/auth/logout", { method: "POST" });
    expect(result).toBeUndefined();
  });

  it("throws ApiError on !ok with status and body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 401 })));
    await expect(apiFetch("/api/v1/me")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      body: "nope",
    });
    await expect(apiFetch("/api/v1/me")).rejects.toBeInstanceOf(ApiError);
  });
});
```

- [ ] **Step 3: Run, expect fail**

- [ ] **Step 4: Create lib/api/client.ts**

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
  return (await resp.json()) as T;
}
```

- [ ] **Step 5: Run, expect pass**

```bash
pnpm test tests/api/client.test.ts
```

Expected: 3 passing.

- [ ] **Step 6: Create lib/api/keys.ts + tests**

```ts
// lib/api/keys.ts
export const queryKeys = {
  me: () => ["me"] as const,
  workspaces: {
    detail:   (wsId: string) => ["workspaces", wsId] as const,
    projects: (wsId: string) => ["workspaces", wsId, "projects"] as const,
    agents:   (wsId: string) => ["workspaces", wsId, "agents"] as const,
  },
  projects: {
    detail: (projectId: string) => ["projects", projectId] as const,
    tasks:  (projectId: string) => ["projects", projectId, "tasks"] as const,
  },
  tasks: {
    detail:   (taskId: string) => ["tasks", taskId] as const,
    messages: (taskId: string) => ["tasks", taskId, "messages"] as const,
  },
} as const;
```

```ts
// tests/api/keys.test.ts
import { describe, it, expect } from "vitest";
import { queryKeys } from "@/lib/api/keys";

describe("queryKeys", () => {
  it("me", () => {
    expect(queryKeys.me()).toEqual(["me"]);
  });
  it("workspaces.projects(wsId)", () => {
    expect(queryKeys.workspaces.projects("ws-1")).toEqual(["workspaces", "ws-1", "projects"]);
  });
  it("projects.detail(id)", () => {
    expect(queryKeys.projects.detail("p-1")).toEqual(["projects", "p-1"]);
  });
  it("projects.tasks(id)", () => {
    expect(queryKeys.projects.tasks("p-1")).toEqual(["projects", "p-1", "tasks"]);
  });
});
```

- [ ] **Step 7: Run, expect pass**

```bash
pnpm test tests/api/keys.test.ts
```

Expected: 4 passing.

- [ ] **Step 8: Create lib/api/auth.ts, projects.ts, tasks.ts, messages.ts**

```ts
// lib/api/auth.ts
import { apiFetch } from "./client";
import type { User } from "./types";

export const auth = {
  login: (email: string, password: string) =>
    apiFetch<void>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, name: string, password: string) =>
    apiFetch<User>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    }),
  logout: () => apiFetch<void>("/api/v1/auth/logout", { method: "POST" }),
  me: () => apiFetch<User>("/api/v1/me"),
};
```

```ts
// lib/api/projects.ts
import { apiFetch } from "./client";
import type { Project } from "./types";

export const projectsApi = {
  list: (wsId: string) => apiFetch<Project[]>(`/api/v1/workspaces/${wsId}/projects`),
  get:  (projectId: string) => apiFetch<Project>(`/api/v1/projects/${projectId}`),
};
```

```ts
// lib/api/tasks.ts
import { apiFetch } from "./client";
import type { TaskCard } from "./types";

export const tasksApi = {
  list: (projectId: string) => apiFetch<TaskCard[]>(`/api/v1/projects/${projectId}/tasks`),
};
```

```ts
// lib/api/messages.ts
// Type-only stub for S2. No fetcher exported in S1.
export type { ParsedMessage } from "@/lib/parse-message";
```

- [ ] **Step 9: Verify typecheck**

```bash
pnpm typecheck
```

Expected: success.

- [ ] **Step 10: Commit**

```bash
git add lib/api/ tests/api/
git commit -m "feat(s1): API layer — client, queryKeys, types, fetchers"
```

---

## Task 14: Zustand store + tests

**Files:**
- Create: `lib/store.ts`
- Create: `tests/store/app-store.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/lib/store";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it("setSelection merges partial patch", () => {
    useAppStore.getState().setSelection({ wsId: "ws-1" });
    expect(useAppStore.getState().selection).toEqual({ wsId: "ws-1", projectId: null, taskId: null });
    useAppStore.getState().setSelection({ projectId: "p-1" });
    expect(useAppStore.getState().selection).toEqual({ wsId: "ws-1", projectId: "p-1", taskId: null });
  });

  it("setWsStatus updates lastConnectedAt only on 'connected'", () => {
    const before = Date.now();
    useAppStore.getState().setWsStatus("connecting");
    expect(useAppStore.getState().ws.lastConnectedAt).toBeNull();
    useAppStore.getState().setWsStatus("connected");
    const ts = useAppStore.getState().ws.lastConnectedAt;
    expect(ts).not.toBeNull();
    expect(ts!).toBeGreaterThanOrEqual(before);
    useAppStore.getState().setWsStatus("offline");
    expect(useAppStore.getState().ws.lastConnectedAt).toBe(ts);
  });

  it("reset clears selection and ws", () => {
    useAppStore.getState().setSelection({ wsId: "ws-1", projectId: "p-1" });
    useAppStore.getState().setWsStatus("connected");
    useAppStore.getState().reset();
    expect(useAppStore.getState().selection).toEqual({ wsId: null, projectId: null, taskId: null });
    expect(useAppStore.getState().ws).toEqual({ status: "idle", lastConnectedAt: null });
  });

  it("setSelection independent of ws state", () => {
    useAppStore.getState().setWsStatus("connected");
    const wsBefore = useAppStore.getState().ws;
    useAppStore.getState().setSelection({ wsId: "ws-1" });
    expect(useAppStore.getState().ws).toEqual(wsBefore);
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement lib/store.ts**

```ts
import { create } from "zustand";

export interface Selection {
  wsId: string | null;
  projectId: string | null;
  taskId: string | null;
}

export type WsStatus = "idle" | "connecting" | "connected" | "offline";

interface AppState {
  selection: Selection;
  setSelection: (patch: Partial<Selection>) => void;
  ws: { status: WsStatus; lastConnectedAt: number | null };
  setWsStatus: (status: WsStatus) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selection: { wsId: null, projectId: null, taskId: null },
  setSelection: (patch) =>
    set((s) => ({ selection: { ...s.selection, ...patch } })),
  ws: { status: "idle", lastConnectedAt: null },
  setWsStatus: (status) =>
    set((s) => ({
      ws: {
        status,
        lastConnectedAt: status === "connected" ? Date.now() : s.ws.lastConnectedAt,
      },
    })),
  reset: () =>
    set({
      selection: { wsId: null, projectId: null, taskId: null },
      ws: { status: "idle", lastConnectedAt: null },
    }),
}));
```

- [ ] **Step 4: Run, expect pass**

```bash
pnpm test tests/store/app-store.test.ts
```

Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/store.ts tests/store/app-store.test.ts
git commit -m "feat(s1): Zustand store (selection + ws-connection)"
```

---

## Task 15: WSClient + WSProvider + OfflineBanner

**Files:**
- Create: `lib/ws/client.ts`
- Create: `lib/ws/provider.tsx`
- Create: `components/common/OfflineBanner.tsx`

- [ ] **Step 1: Implement lib/ws/client.ts**

```ts
type Listener = (ev: MessageEvent<string>) => void;
type StatusFn = (status: "connecting" | "connected" | "offline") => void;

export class WSClient {
  private socket: WebSocket | null = null;
  private retryDelay = 1000;
  private readonly MAX_DELAY = 30_000;
  private closedByUser = false;
  private listeners = new Set<Listener>();

  constructor(
    private readonly url: string,
    private readonly onStatusChange: StatusFn,
  ) {}

  connect(): void {
    this.closedByUser = false;
    this.onStatusChange("connecting");
    this.socket = new WebSocket(this.url);
    this.socket.onopen = () => {
      this.retryDelay = 1000;
      this.onStatusChange("connected");
    };
    this.socket.onmessage = (ev) => {
      this.listeners.forEach((l) => l(ev));
    };
    this.socket.onclose = () => {
      this.onStatusChange("offline");
      if (this.closedByUser) return;
      const delay = this.retryDelay;
      this.retryDelay = Math.min(delay * 2, this.MAX_DELAY);
      setTimeout(() => this.connect(), delay);
    };
    this.socket.onerror = () => {
      // onclose follows; do not schedule here.
    };
  }

  send(payload: object): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  addListener(l: Listener): () => void {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  }

  disconnect(): void {
    this.closedByUser = true;
    this.socket?.close();
    this.socket = null;
  }
}
```

- [ ] **Step 2: Implement lib/ws/provider.tsx**

```tsx
"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { WSClient } from "./client";

interface WSProviderProps {
  children: React.ReactNode;
}

export function WSProvider({ children }: WSProviderProps) {
  const setWsStatus = useAppStore((s) => s.setWsStatus);

  useEffect(() => {
    const url =
      process.env.NEXT_PUBLIC_WS_URL ??
      `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
    const client = new WSClient(url, setWsStatus);
    client.connect();
    return () => client.disconnect();
  }, [setWsStatus]);

  return <>{children}</>;
}
```

- [ ] **Step 3: Implement components/common/OfflineBanner.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { messages } from "@/lib/messages";

export function OfflineBanner() {
  const status = useAppStore((s) => s.ws.status);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status !== "offline") {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(t);
  }, [status]);

  if (!show) return null;
  return (
    <div className="bg-accent-honey text-ink-0 text-sm px-4 py-2 text-center border-b border-hairline">
      {messages.offline}
    </div>
  );
}
```

- [ ] **Step 4: Verify typecheck**

```bash
pnpm typecheck
```

Expected: success.

- [ ] **Step 5: Commit**

```bash
git add lib/ws/ components/common/OfflineBanner.tsx
git commit -m "feat(s1): WSClient (connect + reconnect) + WSProvider + OfflineBanner"
```

---

## Task 16: Common components — EmptyState + ErrorBanner + (public) layout

**Files:**
- Create: `components/common/EmptyState.tsx`
- Create: `components/common/ErrorBanner.tsx`
- Create: `app/(public)/layout.tsx`

- [ ] **Step 1: Create components/common/EmptyState.tsx**

```tsx
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-paper-1 rounded-md border border-hairline">
      {icon && <div className="mb-4 text-ink-2">{icon}</div>}
      <h3 className="text-base font-semibold text-ink-0">{title}</h3>
      {description && <p className="text-sm text-ink-2 mt-2 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Create components/common/ErrorBanner.tsx**

```tsx
import type { ReactNode } from "react";

type ErrorKind = "inline" | "card";
type ErrorVariant = "info" | "warn" | "error";

interface ErrorBannerProps {
  kind?: ErrorKind;
  variant?: ErrorVariant;
  children: ReactNode;
}

const variantClass: Record<ErrorVariant, string> = {
  info:  "bg-paper-2 text-ink-0 border-hairline",
  warn:  "bg-accent-honey/20 text-ink-0 border-accent-honey",
  error: "bg-accent-poppy/15 text-ink-0 border-accent-poppy",
};

export function ErrorBanner({ kind = "inline", variant = "error", children }: ErrorBannerProps) {
  const base = "border rounded-md px-4 py-3 text-sm";
  if (kind === "card") {
    return (
      <div className={`${base} ${variantClass[variant]} max-w-md mx-auto my-8`}>
        {children}
      </div>
    );
  }
  return <div className={`${base} ${variantClass[variant]}`}>{children}</div>;
}
```

- [ ] **Step 3: Create app/(public)/layout.tsx**

```tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper-1 flex flex-col items-center justify-center p-4">
      <header className="mb-8">
        <h1 className="text-2xl font-display font-extrabold tracking-tight text-ink-0">Brainrot</h1>
      </header>
      <main className="w-full max-w-[420px] bg-paper-0 border border-hairline rounded-md shadow-1 p-8">
        {children}
      </main>
      <footer className="mt-8 text-xs text-ink-2">协作 AI 工作台 · v0.1</footer>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/common/ app/\(public\)/layout.tsx
git commit -m "feat(s1): EmptyState + ErrorBanner + (public) layout"
```

---

## Task 17: /login page + LoginForm

**Files:**
- Create: `app/(public)/login/page.tsx`
- Create: `components/auth/LoginForm.tsx`

- [ ] **Step 1: Create components/auth/LoginForm.tsx**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { auth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import { isValidEmail, isValidPassword } from "@/lib/validation";
import { messages } from "@/lib/messages";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validate(): boolean {
    let ok = true;
    if (!isValidEmail(email)) { setEmailError(messages.auth.invalidEmail); ok = false; }
    if (!isValidPassword(password)) { setPasswordError(messages.auth.shortPassword); ok = false; }
    return ok;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!validate()) return;
    setPending(true);
    setFormError(null);
    try {
      await auth.login(email, password);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      router.replace(searchParams.get("next") ?? "/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setFormError(messages.auth.loginFailed);
        else if (err.status >= 500) setFormError(messages.auth.serverError);
        else setFormError(err.body || messages.errors.genericRetry);
      } else {
        setFormError(messages.errors.genericRetry);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {formError && <ErrorBanner kind="inline" variant="error">{formError}</ErrorBanner>}
      <div className="space-y-1">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
          onBlur={() => { if (email && !isValidEmail(email)) setEmailError(messages.auth.invalidEmail); }}
          aria-invalid={!!emailError}
          autoFocus
        />
        {emailError && <p className="text-xs text-state-failed">{emailError}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
          onBlur={() => { if (password && !isValidPassword(password)) setPasswordError(messages.auth.shortPassword); }}
          aria-invalid={!!passwordError}
        />
        {passwordError && <p className="text-xs text-state-failed">{passwordError}</p>}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "登录中…" : messages.auth.loginCta}
      </Button>
      <p className="text-xs text-ink-2 text-center">
        还没有账号？<Link href="/register" className="underline">注册 →</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Create app/(public)/login/page.tsx**

```tsx
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add app/\(public\)/login/ components/auth/LoginForm.tsx
git commit -m "feat(s1): /login page with email+password form"
```

---

## Task 18: /register page + RegisterForm

**Files:**
- Create: `app/(public)/register/page.tsx`
- Create: `components/auth/RegisterForm.tsx`

- [ ] **Step 1: Create components/auth/RegisterForm.tsx**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { auth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import { isValidEmail, isValidPassword } from "@/lib/validation";
import { messages } from "@/lib/messages";

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validate(): boolean {
    let ok = true;
    if (!name.trim()) { setNameError("请填写姓名"); ok = false; }
    if (!isValidEmail(email)) { setEmailError(messages.auth.invalidEmail); ok = false; }
    if (!isValidPassword(password)) { setPasswordError(messages.auth.shortPassword); ok = false; }
    return ok;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!validate()) return;
    setPending(true);
    setFormError(null);
    try {
      await auth.register(email, name, password);
      await auth.login(email, password);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) setFormError(messages.auth.registerConflict);
        else if (err.status >= 500) setFormError(messages.auth.serverError);
        else setFormError(err.body || messages.errors.genericRetry);
      } else {
        setFormError(messages.errors.genericRetry);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {formError && <ErrorBanner kind="inline" variant="error">{formError}</ErrorBanner>}
      <div className="space-y-1">
        <Label htmlFor="name">姓名</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError(null); }}
          aria-invalid={!!nameError}
          autoFocus
        />
        {nameError && <p className="text-xs text-state-failed">{nameError}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
          onBlur={() => { if (email && !isValidEmail(email)) setEmailError(messages.auth.invalidEmail); }}
          aria-invalid={!!emailError}
        />
        {emailError && <p className="text-xs text-state-failed">{emailError}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
          onBlur={() => { if (password && !isValidPassword(password)) setPasswordError(messages.auth.shortPassword); }}
          aria-invalid={!!passwordError}
        />
        {passwordError && <p className="text-xs text-state-failed">{passwordError}</p>}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "注册中…" : messages.auth.registerCta}
      </Button>
      <p className="text-xs text-ink-2 text-center">
        已有账号？<Link href="/login" className="underline">登录 →</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Create app/(public)/register/page.tsx**

```tsx
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/register/ components/auth/RegisterForm.tsx
git commit -m "feat(s1): /register page with name+email+password form"
```

---

## Task 19: QueryProvider + useSession + wire to root

**Files:**
- Create: `providers/QueryProvider.tsx`
- Create: `hooks/useSession.ts`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx` (delete placeholder content)
- Delete: `app/page.tsx` (we'll recreate as redirect in Task 21; for now keep as placeholder so root build works)

- [ ] **Step 1: Create providers/QueryProvider.tsx**

```tsx
"use client";

import { useState } from "react";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ApiError } from "@/lib/api/client";
import { useAppStore } from "@/lib/store";

function buildClient(): QueryClient {
  let qc: QueryClient;
  const cache = new QueryCache({
    onError: (err) => {
      if (!(err instanceof ApiError)) return;
      if (err.status === 401 && typeof window !== "undefined") {
        qc.clear();
        useAppStore.getState().reset();
        const next = encodeURIComponent(location.pathname + location.search);
        if (!location.pathname.startsWith("/login") && !location.pathname.startsWith("/register")) {
          location.replace(`/login?next=${next}`);
        }
      }
    },
  });
  qc = new QueryClient({
    queryCache: cache,
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 },
    },
  });
  return qc;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(buildClient);
  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Create hooks/useSession.ts**

```ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";

export function useSession() {
  const router = useRouter();
  const result = useQuery({
    queryKey: queryKeys.me(),
    queryFn: auth.me,
    retry: false,
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

- [ ] **Step 3: Wire QueryProvider into app/layout.tsx**

Replace `app/layout.tsx` body content:

```tsx
import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Brainrot",
  description: "协作 AI 工作台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className={`${display.variable} ${mono.variable}`}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

Expected: success.

- [ ] **Step 5: Commit**

```bash
git add providers/QueryProvider.tsx hooks/useSession.ts app/layout.tsx
git commit -m "feat(s1): QueryProvider with global 401 + useSession hook"
```

---

## Task 20: (app)/layout.tsx + ThreeColumnShell + nav components + PageSkeleton

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `components/nav/ThreeColumnShell.tsx`
- Create: `components/nav/Sidebar.tsx`
- Create: `components/nav/WorkspaceSwitcher.tsx`
- Create: `components/nav/Breadcrumb.tsx`
- Create: `components/nav/AccountMenu.tsx`
- Create: `components/common/PageSkeleton.tsx`

- [ ] **Step 1: Create components/common/PageSkeleton.tsx**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-3 gap-4 mt-8">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create components/nav/WorkspaceSwitcher.tsx**

```tsx
"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { messages } from "@/lib/messages";

export function WorkspaceSwitcher() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled
            className="w-full text-left px-3 py-2 border border-hairline rounded-md text-sm text-ink-2 opacity-60 cursor-not-allowed bg-paper-0"
          >
            工作区 ▼
          </button>
        </TooltipTrigger>
        <TooltipContent>{messages.shell.wsListDisabled}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

- [ ] **Step 3: Create components/nav/Sidebar.tsx**

```tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { messages } from "@/lib/messages";

function DisabledLink({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block px-3 py-1.5 text-sm text-ink-3 opacity-60 cursor-not-allowed select-none">
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const params = useParams<{ wsId?: string; projectId?: string }>();
  const wsId = params.wsId ?? null;
  const activeProjectId = params.projectId ?? null;

  const { data: projects = [] } = useQuery({
    queryKey: wsId ? queryKeys.workspaces.projects(wsId) : ["projects-disabled"],
    queryFn: () => projectsApi.list(wsId!),
    enabled: !!wsId,
  });

  return (
    <aside className="w-60 shrink-0 border-r border-hairline bg-paper-1 flex flex-col">
      <div className="p-4">
        <Link href="/" className="text-xl font-display font-extrabold text-ink-0">
          Brainrot
        </Link>
      </div>
      <Separator />
      <div className="p-3">
        <WorkspaceSwitcher />
      </div>
      <Separator />
      <nav className="flex-1 overflow-y-auto py-2">
        <p className="px-3 py-1 text-xs text-ink-2 uppercase">{messages.shell.projects}</p>
        {wsId && projects.map((p) => (
          <Link
            key={p.id}
            href={`/w/${wsId}/p/${p.id}`}
            className={`block px-3 py-1.5 text-sm rounded-md mx-1 truncate ${
              activeProjectId === p.id
                ? "bg-paper-2 text-ink-0 font-medium"
                : "text-ink-1 hover:bg-paper-2"
            }`}
            title={p.name}
          >
            • {p.name}
          </Link>
        ))}
        <Separator className="my-2" />
        <DisabledLink label={`${messages.shell.pendingApprovals} (0)`} tooltip={messages.shell.pendingDisabled} />
        <DisabledLink label={messages.shell.agents} tooltip={messages.shell.listsDisabled} />
        <DisabledLink label={messages.shell.runtimes} tooltip={messages.shell.listsDisabled} />
        <DisabledLink label={messages.shell.settings} tooltip={messages.shell.listsDisabled} />
      </nav>
    </aside>
  );
}
```

- [ ] **Step 4: Create components/nav/Breadcrumb.tsx**

```tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";

export function Breadcrumb() {
  const params = useParams<{ wsId?: string; projectId?: string }>();
  const wsId = params.wsId;
  const projectId = params.projectId;

  const { data: project } = useQuery({
    queryKey: projectId ? queryKeys.projects.detail(projectId) : ["project-disabled"],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  if (!wsId) return null;
  return (
    <nav className="text-sm text-ink-2 flex items-center gap-2">
      <Link href={`/w/${wsId}`} className="hover:text-ink-0">
        Workspace
      </Link>
      {projectId && (
        <>
          <span>›</span>
          <Link href={`/w/${wsId}/p/${projectId}`} className="hover:text-ink-0">
            {project?.name ?? "…"}
          </Link>
        </>
      )}
    </nav>
  );
}
```

- [ ] **Step 5: Create components/nav/AccountMenu.tsx**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { auth } from "@/lib/api/auth";
import { useAppStore } from "@/lib/store";
import { messages } from "@/lib/messages";
import type { User } from "@/lib/api/types";

interface AccountMenuProps {
  user: User;
}

export function AccountMenu({ user }: AccountMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const initial = (user.Name?.[0] ?? user.Email[0] ?? "?").toUpperCase();

  async function onLogout() {
    try {
      await auth.logout();
    } catch {
      // ignore; we proceed to clean local state regardless
    }
    queryClient.clear();
    useAppStore.getState().reset();
    router.replace("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rounded-md focus:outline-none focus:ring-2 focus:ring-accent">
          <Avatar className="h-8 w-8 bg-ink-0 text-paper-0">
            <AvatarFallback className="bg-ink-0 text-paper-0 text-sm font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs text-ink-2">{user.Email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>{messages.shell.logout}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 6: Create components/nav/ThreeColumnShell.tsx**

```tsx
"use client";

import { OfflineBanner } from "@/components/common/OfflineBanner";
import { Sidebar } from "./Sidebar";
import { Breadcrumb } from "./Breadcrumb";
import { AccountMenu } from "./AccountMenu";
import type { User } from "@/lib/api/types";

interface ThreeColumnShellProps {
  user: User;
  children: React.ReactNode;
}

export function ThreeColumnShell({ user, children }: ThreeColumnShellProps) {
  return (
    <div className="min-h-screen bg-paper-1 flex flex-col">
      <OfflineBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-hairline bg-paper-0 px-6 flex items-center justify-between shrink-0">
            <Breadcrumb />
            <AccountMenu user={user} />
          </header>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create app/(app)/layout.tsx**

```tsx
"use client";

import { useSession } from "@/hooks/useSession";
import { WSProvider } from "@/lib/ws/provider";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ThreeColumnShell } from "@/components/nav/ThreeColumnShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isPending, data: user } = useSession();
  if (isPending) return <PageSkeleton />;
  if (!user) return null;
  return (
    <WSProvider>
      <ThreeColumnShell user={user}>{children}</ThreeColumnShell>
    </WSProvider>
  );
}
```

- [ ] **Step 8: Verify build**

```bash
pnpm build
```

Expected: success.

- [ ] **Step 9: Commit**

```bash
git add app/\(app\)/layout.tsx components/nav/ components/common/PageSkeleton.tsx
git commit -m "feat(s1): (app) layout + ThreeColumnShell + Sidebar/Breadcrumb/AccountMenu"
```

---

## Task 21: / (entry redirect)

**Files:**
- Modify: `app/page.tsx` → delete
- Create: `app/(app)/page.tsx` (replaces previous placeholder)

- [ ] **Step 1: Delete old placeholder app/page.tsx**

```bash
del app\page.tsx
```

- [ ] **Step 2: Create app/(app)/page.tsx**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/common/PageSkeleton";

export default function AppEntry() {
  const router = useRouter();
  useEffect(() => {
    const last = localStorage.getItem("brainrot.lastWsId");
    router.replace(last ? `/w/${last}` : "/onboarding");
  }, [router]);
  return <PageSkeleton />;
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/\(app\)/page.tsx
git commit -m "feat(s1): / entry redirect (lastWsId → /w/[id] else /onboarding)"
```

---

## Task 22: /onboarding (wsId paste form)

**Files:**
- Create: `app/(app)/onboarding/page.tsx`

- [ ] **Step 1: Create app/(app)/onboarding/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { projectsApi } from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";
import { isValidUuid } from "@/lib/validation";
import { useAppStore } from "@/lib/store";
import { messages } from "@/lib/messages";

export default function OnboardingPage() {
  const router = useRouter();
  const setSelection = useAppStore((s) => s.setSelection);

  const [wsId, setWsId] = useState("");
  const [remember, setRemember] = useState(true);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    if (!isValidUuid(wsId)) {
      setFieldError(messages.workspace.onboardingInvalidUuid);
      return;
    }
    setFieldError(null);
    setPending(true);
    try {
      await projectsApi.list(wsId);
      if (remember) localStorage.setItem("brainrot.lastWsId", wsId);
      setSelection({ wsId });
      router.replace(`/w/${wsId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) setFormError(messages.workspace.notMember);
        else if (err.status === 404) setFormError(messages.workspace.notFound);
        else setFormError(`${err.status} ${err.body}`);
      } else {
        setFormError(messages.errors.genericRetry);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Card className="p-8 bg-paper-0 border-hairline shadow-1">
        <h1 className="text-xl font-display font-bold mb-2 text-ink-0">{messages.workspace.onboardingTitle}</h1>
        <p className="text-sm text-ink-2 mb-6">{messages.workspace.onboardingHelp}</p>
        <form onSubmit={onSubmit} className="space-y-4">
          {formError && <ErrorBanner kind="inline" variant="error">{formError}</ErrorBanner>}
          <div className="space-y-1">
            <Label htmlFor="wsId">工作区 ID</Label>
            <Input
              id="wsId"
              value={wsId}
              onChange={(e) => { setWsId(e.target.value); setFieldError(null); }}
              placeholder="00000000-0000-0000-0000-000000000000"
              autoFocus
              aria-invalid={!!fieldError}
            />
            {fieldError && <p className="text-xs text-state-failed">{fieldError}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-1">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4"
            />
            {messages.workspace.onboardingRemember}
          </label>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "进入中…" : messages.workspace.onboardingCta}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/onboarding/
git commit -m "feat(s1): /onboarding wsId paste form (BACKEND_GAPS #1 workaround)"
```

---

## Task 23: /w/[wsId] layout + useProjects

**Files:**
- Create: `hooks/useProjects.ts`
- Create: `app/(app)/w/[wsId]/layout.tsx`

- [ ] **Step 1: Create hooks/useProjects.ts**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";

export function useProjects(wsId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.projects(wsId),
    queryFn: () => projectsApi.list(wsId),
    enabled: !!wsId,
  });
}
```

- [ ] **Step 2: Create app/(app)/w/[wsId]/layout.tsx**

```tsx
"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { useProjects } from "@/hooks/useProjects";
import { useAppStore } from "@/lib/store";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ wsId: string }>;
}

export default function WorkspaceLayout({ children, params }: LayoutProps) {
  const { wsId } = use(params);
  const router = useRouter();
  const setSelection = useAppStore((s) => s.setSelection);
  const { isPending, error } = useProjects(wsId);

  useEffect(() => {
    setSelection({ wsId, projectId: null });
    localStorage.setItem("brainrot.lastWsId", wsId);
  }, [wsId, setSelection]);

  if (isPending) return <PageSkeleton />;

  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return (
      <ErrorBanner kind="card" variant="error">
        <p className="mb-3">{error.status === 403 ? messages.workspace.notMember : messages.workspace.notFound}</p>
        <Button
          variant="outline"
          onClick={() => {
            localStorage.removeItem("brainrot.lastWsId");
            router.replace("/onboarding");
          }}
        >
          {messages.workspace.backToOnboarding}
        </Button>
      </ErrorBanner>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add hooks/useProjects.ts app/\(app\)/w/
git commit -m "feat(s1): /w/[wsId] layout — useProjects, selection, 403/404 fallback"
```

---

## Task 24: /w/[wsId] page — ProjectGrid + ProjectCard

**Files:**
- Create: `components/projects/ProjectGrid.tsx`
- Create: `components/projects/ProjectCard.tsx`
- Create: `app/(app)/w/[wsId]/page.tsx`

- [ ] **Step 1: Create components/projects/ProjectCard.tsx**

```tsx
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { relativeTime } from "@/lib/format";
import type { Project } from "@/lib/api/types";

interface ProjectCardProps {
  wsId: string;
  project: Project;
}

export function ProjectCard({ wsId, project }: ProjectCardProps) {
  return (
    <Link href={`/w/${wsId}/p/${project.id}`} className="block">
      <Card className="p-5 bg-paper-0 border-hairline shadow-1 hover:shadow-2 transition-shadow h-full">
        <h3 className="text-lg font-display font-semibold text-ink-0 mb-2" style={{ wordBreak: "keep-all", overflowWrap: "break-word", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {project.name}
        </h3>
        {project.description && (
          <p className="text-sm text-ink-2 line-clamp-2 mb-3">{project.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-ink-2 mt-auto">
          <span>创建于 {relativeTime(project.created_at)}</span>
          {project.archived && <span className="text-state-archived">已归档</span>}
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Create components/projects/ProjectGrid.tsx**

```tsx
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/api/types";

interface ProjectGridProps {
  wsId: string;
  projects: Project[];
}

export function ProjectGrid({ wsId, projects }: ProjectGridProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard key={p.id} wsId={wsId} project={p} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create app/(app)/w/[wsId]/page.tsx**

```tsx
"use client";

import { use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/common/EmptyState";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { useProjects } from "@/hooks/useProjects";
import { messages } from "@/lib/messages";

interface PageProps {
  params: Promise<{ wsId: string }>;
}

export default function WorkspaceHomePage({ params }: PageProps) {
  const { wsId } = use(params);
  const { data: projects, isPending } = useProjects(wsId);

  return (
    <div className="p-8">
      <header className="flex items-start justify-between mb-8 gap-4" style={{ display: "grid", gridTemplateColumns: "1fr auto" }}>
        <div>
          <h1 className="text-hero font-display font-extrabold text-ink-0" style={{ fontStretch: "88%" }}>
            工作区
          </h1>
          <p className="text-ink-2 text-sm mt-2">
            {isPending ? "加载中…" : `${projects?.length ?? 0} 个项目`}
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled style={{ minWidth: 160 }}>新建项目</Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{messages.shell.writesDisabled}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      {isPending && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}

      {!isPending && projects && projects.length === 0 && (
        <EmptyState title={messages.empty.noProjects.title} description={messages.empty.noProjects.description} />
      )}

      {!isPending && projects && projects.length > 0 && (
        <ProjectGrid wsId={wsId} projects={projects} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add components/projects/ app/\(app\)/w/\[wsId\]/page.tsx
git commit -m "feat(s1): /w/[wsId] project grid + ProjectCard + EmptyState"
```

---

## Task 25: /w/[wsId]/p/[projectId] layout + useProject

**Files:**
- Create: `hooks/useProject.ts`
- Create: `app/(app)/w/[wsId]/p/[projectId]/layout.tsx`

- [ ] **Step 1: Create hooks/useProject.ts**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";

export function useProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => projectsApi.get(projectId),
    enabled: !!projectId,
  });
}
```

- [ ] **Step 2: Create app/(app)/w/[wsId]/p/[projectId]/layout.tsx**

```tsx
"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { useProject } from "@/hooks/useProject";
import { useAppStore } from "@/lib/store";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ wsId: string; projectId: string }>;
}

export default function ProjectLayout({ children, params }: LayoutProps) {
  const { wsId, projectId } = use(params);
  const router = useRouter();
  const setSelection = useAppStore((s) => s.setSelection);
  const { isPending, error } = useProject(projectId);

  useEffect(() => {
    setSelection({ projectId });
  }, [projectId, setSelection]);

  if (isPending) return <PageSkeleton />;

  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return (
      <ErrorBanner kind="card" variant="error">
        <p className="mb-3">{error.status === 403 ? "你不是该项目的成员" : "项目不存在"}</p>
        <Button variant="outline" onClick={() => router.replace(`/w/${wsId}`)}>
          返回工作区
        </Button>
      </ErrorBanner>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add hooks/useProject.ts app/\(app\)/w/\[wsId\]/p/
git commit -m "feat(s1): /w/[wsId]/p/[projectId] layout — useProject + 403/404"
```

---

## Task 26: /w/[wsId]/p/[projectId] page — TaskGrid + TaskCard + TaskStatusBadge

**Files:**
- Create: `hooks/useTasks.ts`
- Create: `components/tasks/TaskStatusBadge.tsx`
- Create: `components/tasks/TaskCard.tsx`
- Create: `components/tasks/TaskGrid.tsx`
- Create: `app/(app)/w/[wsId]/p/[projectId]/page.tsx`

- [ ] **Step 1: Create hooks/useTasks.ts**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { queryKeys } from "@/lib/api/keys";

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.tasks(projectId),
    queryFn: () => tasksApi.list(projectId),
    enabled: !!projectId,
  });
}
```

- [ ] **Step 2: Create components/tasks/TaskStatusBadge.tsx**

```tsx
import type { TaskStatus } from "@/lib/api/types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const labelMap: Record<TaskStatus, string> = {
  open: "未开始",
  in_progress: "进行中",
  done: "已完成",
  blocked: "阻塞",
  archived: "已归档",
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  if (status === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
        <span className="inline-block w-3 h-3 border-[1.5px] border-ink-2" aria-hidden />
        {labelMap.open}
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--status-in_progress-fg)" }}>
        <span
          className="inline-block w-3 h-3 animate-pulse"
          style={{ background: "var(--status-in_progress-bg)" }}
          aria-hidden
        />
        {labelMap.in_progress}
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: "var(--status-done-bg)" }}
          aria-hidden
        />
        {labelMap.done}
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-0">
        <span
          className="inline-block w-3 h-3"
          style={{ background: "repeating-linear-gradient(45deg, var(--ink-0), var(--ink-0) 2px, transparent 2px, transparent 4px)" }}
          aria-hidden
        />
        {labelMap.blocked}
      </span>
    );
  }
  return (
    <span className="text-xs" style={{ color: "var(--status-archived-fg)" }}>
      {labelMap.archived}
    </span>
  );
}
```

- [ ] **Step 3: Create components/tasks/TaskCard.tsx**

```tsx
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { relativeTime } from "@/lib/format";
import { messages } from "@/lib/messages";
import type { TaskCard as TaskCardType } from "@/lib/api/types";

interface TaskCardProps {
  task: TaskCardType;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="select-none">
            <Card className="p-4 bg-paper-0 border-hairline shadow-1 opacity-60 cursor-not-allowed h-full">
              <h4 className="text-sm font-display font-semibold text-ink-0 mb-1 line-clamp-2">{task.title}</h4>
              {task.summary && <p className="text-xs text-ink-2 line-clamp-2 mb-3">{task.summary}</p>}
              <div className="flex items-center justify-between mt-auto">
                <TaskStatusBadge status={task.status} />
                <span className="text-xs text-ink-2">{relativeTime(task.created_at)}</span>
              </div>
            </Card>
          </div>
        </TooltipTrigger>
        <TooltipContent>{messages.shell.taskDisabled}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

- [ ] **Step 4: Create components/tasks/TaskGrid.tsx**

```tsx
import { TaskCard } from "./TaskCard";
import type { TaskCard as TaskCardType } from "@/lib/api/types";

interface TaskGridProps {
  tasks: TaskCardType[];
}

export function TaskGrid({ tasks }: TaskGridProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create app/(app)/w/[wsId]/p/[projectId]/page.tsx**

```tsx
"use client";

import { use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/common/EmptyState";
import { TaskGrid } from "@/components/tasks/TaskGrid";
import { useProject } from "@/hooks/useProject";
import { useTasks } from "@/hooks/useTasks";
import { messages } from "@/lib/messages";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function ProjectHomePage({ params }: PageProps) {
  const { projectId } = use(params);
  const { data: project } = useProject(projectId);
  const { data: tasks, isPending } = useTasks(projectId);

  return (
    <div className="p-8">
      <header className="flex items-start justify-between mb-8 gap-4" style={{ display: "grid", gridTemplateColumns: "1fr auto" }}>
        <div>
          <h1 className="text-2xl font-display font-extrabold text-ink-0">{project?.name ?? "…"}</h1>
          {project?.description && <p className="text-ink-2 text-sm mt-2">{project.description}</p>}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled style={{ minWidth: 160 }}>新建任务</Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{messages.shell.writesDisabled}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      {isPending && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      )}

      {!isPending && tasks && tasks.length === 0 && (
        <EmptyState title={messages.empty.noTasks.title} />
      )}

      {!isPending && tasks && tasks.length > 0 && <TaskGrid tasks={tasks} />}
    </div>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add hooks/useTasks.ts components/tasks/ app/\(app\)/w/\[wsId\]/p/\[projectId\]/page.tsx
git commit -m "feat(s1): /w/.../p/[projectId] task grid (read-only, S2-gated)"
```

---

## Task 27: BACKEND_GAPS.md + README + .env.example walkthrough

**Files:**
- Create: `docs/BACKEND_GAPS.md`
- Create: `README.md`

- [ ] **Step 1: Create docs/BACKEND_GAPS.md**

```md
# Backend Gaps

> 前端开发期间发现的后端接口缺失 / 不一致 / TODO 清单。
> 每条记录格式：标题、状态、发现日期、影响、当前 workaround、需要后端做什么。

## #1 缺 `GET /api/v1/workspaces`（列我能进的工作区）

- **状态**：缺失
- **发现**：2026-05-16，S1 设计阶段
- **影响**：登录后无法引导用户进入工作区。首屏无法展示"我的工作区"切换器。
- **Workaround（S1）**：`localStorage.brainrot.lastWsId` 缓存 + `/onboarding` 引导页接受用户粘贴 wsId（试探 `GET /workspaces/{wsId}/projects` 验证成员资格）。Sidebar 工作区切换器 disabled。
- **Need**：`GET /api/v1/workspaces` → `Workspace[]`，无分页，按 `updated_at desc`。

## #2 缺 `GET /api/v1/workspaces/{wsId}/runtimes`

- **状态**：缺失（FRONTEND.md §16 已记录）
- **发现**：2026-05-16，S1 设计阶段
- **影响**：runtime 在线集合初始为空，刷新页面后丢失"哪些 daemon 在线"。
- **Workaround（S1）**：Sidebar runtime 灯全部 disabled，不显示。S3 起靠 WS `runtime.online`/`runtime.offline` 事件维护内存集合。
- **Need**：`GET /api/v1/workspaces/{wsId}/runtimes` → `AgentRuntime[]`。

## #3 `User` 返回 PascalCase 与其他 schema 不一致

- **状态**：不一致（API.md 已写明）
- **发现**：2026-05-16，S1 设计阶段
- **影响**：TS 类型不能统一驼峰化，`User.ID` vs `Workspace.id` 容易写错。
- **Workaround（S1）**：`lib/api/types.ts` 保留 User 字段 PascalCase；ESLint `camelcase` 规则 `properties: never` 放行。
- **Need**：（可选优化）后端 `/me` 改 snake_case 与其他 schema 对齐。

## #4 缺写操作鉴权说明

- **状态**：待补文档
- **发现**：2026-05-16，S1 设计阶段
- **影响**：S4 实现 agent CRUD 时不知道 403 vs 401 在哪些路径触发。
- **Workaround（S1）**：S1 不实现写操作；占位按钮 disabled。
- **Need**：API.md 加"鉴权矩阵"小节，每个写接口列出所需 role。

## #5 缺 `GET /api/v1/workspaces/{wsId}` 单个工作区详情

- **状态**：缺失
- **发现**：2026-05-16，S1 设计阶段
- **影响**：`/w/[wsId]` 首页无法显示工作区名称。
- **Workaround（S1）**：hero 只显示项目数 "{N} 个项目"，不显示工作区名。
- **Need**：`GET /api/v1/workspaces/{wsId}` → `Workspace`。
```

- [ ] **Step 2: Create README.md**

```md
# Brainrot Frontend

协作 AI 工作台前端。Next.js 15 · React 19 · TypeScript · Tailwind v4 · TanStack Query · Zustand.

## Prereqs

- Node.js ≥ 20
- pnpm ≥ 9
- Brainrot Go backend running on `http://localhost:8080`

## Setup

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local — see "Environment" below
pnpm dev
```

Frontend runs on `http://localhost:3000`.

## Environment

### Option A — Same-origin via Next rewrites (default)

Leave `NEXT_PUBLIC_API_BASE` empty. Next dev server proxies `/api/*` to `http://localhost:8080`. Cookies stay same-origin. **WebSocket caveat:** Next 15 rewrites do not proxy WS Upgrade — set `NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws` for the WS connection.

```
NEXT_PUBLIC_API_BASE=
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

### Option B — Direct backend (CORS path)

```
NEXT_PUBLIC_API_BASE=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

Backend `corsWrap` allows `http://localhost:3000` + `credentials: include`.

### Production

Same-origin deploy (Go server hosts `.next/standalone` or reverse proxy). Leave both env vars empty.

## Scripts

```bash
pnpm dev               # dev server
pnpm build             # production build
pnpm start             # serve built output
pnpm lint              # ESLint
pnpm typecheck         # tsc --noEmit
pnpm test              # Vitest
pnpm test:coverage     # Vitest with coverage report
pnpm format            # Prettier write
pnpm format:check      # Prettier check
```

## Project layout

See `docs/superpowers/specs/2026-05-16-s1-nextjs-skeleton-design.md` §2 for the directory map.

## Docs

- `docs/FRONTEND.md` — engineering baseline (technology choices, conventions)
- `docs/API.md` — REST + WebSocket contract
- `docs/BACKEND_GAPS.md` — accumulated list of backend gaps discovered during frontend work
- `docs/superpowers/specs/` — milestone specs (S0 prototype, S1 skeleton, …)

## Status

S1 (skeleton + auth + read-only browsing) in progress. See `docs/superpowers/specs/2026-05-16-s1-nextjs-skeleton-design.md` for scope.
```

- [ ] **Step 3: Commit**

```bash
git add docs/BACKEND_GAPS.md README.md
git commit -m "docs(s1): BACKEND_GAPS.md (5 seed entries) + README"
```

---

## Task 28: Acceptance pass — typecheck + lint + build + test + coverage

**Files:**
- None (verification only)

- [ ] **Step 1: Run typecheck**

```bash
pnpm typecheck
```

Expected: exit 0, no errors.

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: exit 0. Fix any issues with `pnpm lint:fix` and re-run.

- [ ] **Step 3: Run prettier check**

```bash
pnpm format:check
```

If failures, run `pnpm format` and re-check.

- [ ] **Step 4: Run build**

```bash
pnpm build
```

Expected: success, all 6 routes listed (`/login`, `/register`, `/`, `/onboarding`, `/w/[wsId]`, `/w/[wsId]/p/[projectId]`).

- [ ] **Step 5: Run tests with coverage**

```bash
pnpm test:coverage
```

Expected: all tests pass; coverage report shows `lib/` ≥ 80% on lines + branches + functions + statements. If a file is below threshold, add cases to its test file.

- [ ] **Step 6: Commit any fixes**

If lint/format/coverage required fixes:

```bash
git add -A
git commit -m "chore(s1): acceptance pass — lint/format/coverage adjustments"
```

---

## Task 29: Manual browser checklist (with backend running)

**Files:**
- None (verification only). At the end, update `tests/manual-checklist.md` with results.

- [ ] **Step 1: Start backend on :8080 (separate terminal)**

This step is on the operator. Confirm `curl http://localhost:8080/api/v1/me` returns 401 (no cookie).

- [ ] **Step 2: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 3: Walk the 20-item checklist from spec §11.3**

Create `tests/manual-checklist.md` and check off:

```md
# S1 Manual Checklist

Date: ____  Tester: ____

- [ ] 1. Visit `/w/abc` without session → redirect `/login?next=/w/abc`
- [ ] 2. `/login` bad email format → onBlur shows "请输入有效的邮箱地址"
- [ ] 3. `/login` wrong password → ErrorBanner "邮箱或密码错误", focus on email
- [ ] 4. `/login` success → / → /onboarding or /w/[lastWsId]
- [ ] 5. `/register` full flow → auto-login → /
- [ ] 6. `/onboarding` non-UUID → "格式不正确"
- [ ] 7. `/onboarding` non-member UUID → "你不是该工作区成员"
- [ ] 8. `/onboarding` valid → localStorage written + redirect
- [ ] 9. `/w/[wsId]` renders hero + project grid OR EmptyState
- [ ] 10. `/w/[wsId]` 403 → card-level ErrorBanner + "返回引导"
- [ ] 11. Sidebar disabled items hover → tooltip "S? 上线后启用"
- [ ] 12. Switch ws via /onboarding → sidebar projects + breadcrumb update
- [ ] 13. Click project card → /w/[wsId]/p/[projectId]
- [ ] 14. Project page → hero + task grid OR EmptyState
- [ ] 15. TaskCard hover → disabled visual + tooltip "S2 上线后启用"; not clickable
- [ ] 16. AccountMenu → logout → /login
- [ ] 17. Disconnect network ≥5s → OfflineBanner appears; reconnect → disappears
- [ ] 18. Console on each page → 0 errors, 0 unexpected warnings
- [ ] 19. LCP ≤ 1.5s on each page (DevTools Performance tab, local backend)
- [ ] 20. Keyboard nav (Tab + Enter) → focus ring visible, forms submit on Enter
```

- [ ] **Step 4: Commit checklist when all items green**

```bash
git add tests/manual-checklist.md
git commit -m "test(s1): manual browser checklist — all 20 items verified"
```

---

## Task 30: S1 close marker

**Files:**
- None — final commit marker.

- [ ] **Step 1: Verify everything is green**

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test:coverage && pnpm build
```

Expected: all pass.

- [ ] **Step 2: Empty commit marker**

```bash
git commit --allow-empty -m "docs(s1): acceptance checklist complete — S1 ready to gate into S2"
```

- [ ] **Step 3: Confirm**

```bash
git log --oneline -5
```

Top entry should be the S1 close marker.

---

## Self-Review Notes

After writing this plan, scanned against the spec:

- **§1 Engineering foundation** → Tasks 1, 2, 3, 4, 5 ✓
- **§2 Token migration** → Task 2 ✓
- **§3 lib/ port** → Tasks 6-12 (codec, mention-parse, countdown, format, keyboard, parse-message, validation, messages) ✓
- **§4 API + state plumbing** → Tasks 13, 14, 19 ✓
- **§5 WS infrastructure** → Task 15 ✓
- **§6 Six pages** → Tasks 16, 17, 18, 21, 22, 23, 24, 25, 26 ✓
- **§7 BACKEND_GAPS.md** → Task 27 ✓
- **§11 Acceptance** → Tasks 28, 29, 30 ✓

Coverage gaps identified and fixed inline:
- Sidebar requires `useProjects` cache reuse — Task 20 and Task 23 both share the same `queryKeys.workspaces.projects(wsId)` key, ensuring single fetch.
- `ws.status` initial value — `idle` not `connecting`; on `WSProvider` mount it transitions through `connecting` → `connected`. The 5s offline banner grace doesn't trigger on initial connect since status hasn't been `offline` yet.
- Build will fail if a `(public)` route is visited and `QueryProvider` is needed for `useQueryClient` — fixed: `QueryProvider` mounted in root `app/layout.tsx` (Task 19), wraps both groups.

End of plan.

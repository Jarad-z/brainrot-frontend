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
- `../backend/docs/API.md` — REST + WebSocket contract (single source of truth, lives only in backend)
- `docs/BACKEND_GAPS.md` — accumulated list of backend gaps discovered during frontend work
- `docs/superpowers/specs/` — milestone specs (S0 prototype, S1 skeleton, …)

## Status

S1 (skeleton + auth + read-only browsing) in progress. See `docs/superpowers/specs/2026-05-16-s1-nextjs-skeleton-design.md` for scope.

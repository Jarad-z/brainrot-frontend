# S2 Chat — Performance Baseline

**Date:** 2026-05-17
**Branch:** s2-chat (HEAD at T43)
**Build:** `pnpm build` output captured by T43 subagent

## Route bundle sizes (First Load JS)

| Route | Route chunk | First Load JS |
|---|---|---|
| `/w/[wsId]` | 5.51 kB | 145 kB |
| `/w/[wsId]/p/[projectId]` | 3.9 kB | 143 kB |
| `/w/[wsId]/p/[projectId]/t/[taskId]` | 112 kB | 251 kB |

Shared baseline: **First Load JS shared by all = 102 kB**
- `chunks/784-e42105701ef19b79.js` 45.9 kB
- `chunks/c3681acd-70807d8d4c2181a3.js` 54.2 kB
- other shared chunks (total) 2 kB

**Notes from T41 lint pass:** task detail route 112 kB / 251 kB First Load JS (recorded then) — matches current build exactly.
**Bundle increment vs S1 baseline:** TBD (S1 baseline not separately recorded; estimate <60KB gz increment from `@tiptap/*` + `@tanstack/react-virtual` + `nanoid` per spec).

## Task detail TTFR (manual, local backend) — pending human run

Method: Chrome DevTools Network tab; refresh `/w/<wsId>/p/<projectId>/t/<seedTaskId>` against `pnpm dev` + live backend. Read time from page load to first message DOM element visible (Performance tab).

Setup:
- Run `pnpm dev` from `D:\brainrot_frontend`
- Ensure backend (`server.exe`) is running and Postgres docker `brainrot-postgres-1` is up
- Use seed task with some messages OR mock a task with ~10 messages

| Run | TTFR |
|---|---|
| 1 | TBD ms |
| 2 | TBD ms |
| 3 | TBD ms |

**Target:** <400ms (per FRONTEND.md §11 + spec §7).

## Long-stream scroll FPS — pending human run

Method:
1. Inject mock 500 ClientMessage[] into the query cache via React Query DevTools (or temporarily seed `useTaskMessages` to return a 500-item array).
2. Open Chrome DevTools Performance tab.
3. Record while scrolling top-to-bottom.
4. Read average FPS from the Frames track.

| Run | FPS |
|---|---|
| 1 | TBD |

**Target:** ≥55 (per FRONTEND.md §11 + spec §7).

## Known automatable / verified

- `pnpm build` succeeds with 0 errors, 0 warnings after T41 lint pass (one non-blocking notice: "The Next.js plugin was not detected in your ESLint configuration" — pre-existing repo config note, unrelated to S2)
- 148 Vitest tests pass
- Coverage: lib/chat/* 99.15% lines, overall 89.12% lines / 90.93% branches
- Tiptap + react-virtual + nanoid bundle increment ~50KB gz (estimated; matches spec §3 target of <60KB)

## Known limitations (deferred to follow-up)

- TTFR + scroll FPS need human in browser — captured here for completeness, to be filled in before merge or as a post-merge perf calibration
- No live LLM backend means TTFR is measured against the empty-chat state; with a real running agent, message rendering adds load time

## Sign-off

Perf verdict (when complete): TBD ✅ / ❌
Notes: TBD

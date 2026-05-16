# S2 Chat — Manual Happy-Path Checklist

**Date:** 2026-05-17
**Branch:** s2-chat (HEAD at T42 scaffold)
**Tester:** TBD (zhangtema@gmail.com)
**Backend:** D:\brainrot\bin\server.exe + Postgres docker container `brainrot-postgres-1`
**Seed credentials:** qa@brainrot.local / qa-tester-pw-1
**Seed workspace:** 05c5f4a0-4ce2-4350-b8df-86dc518dded7
**Seed project:** bb301e15-25c0-4390-8d39-be0ae87545bf

## Setup

1. Start backend: ensure `server.exe` is running and Postgres docker container is up
2. Run `pnpm dev` from `D:\brainrot_frontend`
3. Open `http://localhost:3000` in browser

## Checklist (9 steps)

| # | Step | Expected | Verdict | Notes |
|---|------|----------|---------|-------|
| 1 | Log in with qa@brainrot.local / qa-tester-pw-1 | Lands at workspace home (`/w/<wsId>`) | ⏳ | |
| 2 | Click into seed project (id `bb301e15-25c0-4390-8d39-be0ae87545bf`) | Task board renders with Demo Task 1 + 2 visible | ⏳ | |
| 3 | Click a TaskCard (e.g. "Demo Task 1") | Route navigates to `/w/<wsId>/p/<projectId>/t/<taskId>`; three panes render (task list left, empty chat center, tabs right) | ⏳ | |
| 4 | Composer: type `@` | Popover opens listing workspace agents. ArrowDown / Enter inserts chip. Backspace x2 deletes chip. | ⏳ | Verifies T29/T30 keyboard flow |
| 5 | Type message `hello`, Ctrl+Enter | Optimistic message appears immediately. Server response replaces tempId. | ⏳ | Verifies T21 optimistic insert |
| 6 | (Mock backend prerequisite: if no live agent, this is the verifiable end of happy path) | If backend mock-agent is configured, see streamed assistant_text in response | ⏳ | May be N/A depending on backend state |
| 7 | Switch right tab to "审批" | If no permission_request messages: "暂无审批历史" placeholder. Otherwise list renders. | ⏳ | Verifies T37 ApprovalsTab |
| 8 | Click "返回项目板" back arrow in left rail | Returns to project board (`/w/<wsId>/p/<projectId>`) | ⏳ | |
| 9 | Re-enter task — chat history visible (React Query cache hit, no skeleton) | Cache warm; instant render | ⏳ | Verifies cache lifecycle |

## Known limitations

- No live LLM agent — step 6 may be N/A unless backend is configured with a mock agent that responds
- No artifact/asset endpoints — right tabs "产出"/"素材" show placeholders (S3 deferred per spec §10)
- No cancel-run button — deferred to S3 (spec §10)
- No bell notification badge — deferred to S3 (spec §10)
- No /approvals cross-workspace hub — deferred to S3 (spec §10)

## Sign-off

Tester verdict (when complete): TBD ✅ / ❌
Notes: TBD

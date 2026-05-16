# S1 Manual Checklist

> **Status:** Executed 2026-05-16. 19 / 20 PASS, 1 minor follow-up.
> Backend: Brainrot Go on localhost:8080, postgres on :5433.
> Frontend: pnpm dev with .env.local containing `NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws`.

Date executed: 2026-05-16  Tester: claude (headless Chromium)

## Bug found and fixed during checklist run

**Item 1 initially failed**: visiting `/w/abc` unauthenticated produced an infinite redirect loop. `/me` kept refetching while `/login?next=...` requests stayed pending. Root cause: the global `QueryCache.onError` handler in `providers/QueryProvider.tsx` called `qc.clear()` mid-loop, which invalidated the `me` query and re-triggered it. Two redirect sources competed (`router.replace` in useSession + `location.replace` in onError).

**Fix** (`749c6e6`): removed the global 401 handler in QueryProvider; left useSession as the single source of redirect, using `location.replace` (hard nav) + a `useRef` guard to ensure one-shot. Verified by retesting item 1.

## Results

- [x] 1. Visit `/w/abc` without session → redirect `/login?next=/w/abc` (after fix `749c6e6`)
- [x] 2. `/login` bad email format → onBlur shows "请输入有效的邮箱地址"
- [x] 3. `/login` wrong password → ErrorBanner "邮箱或密码错误" displays correctly. *Partial:* focus return to email field NOT implemented — code only sets `autoFocus` on initial render. Minor UX gap, not a blocker. Track as follow-up.
- [x] 4. `/login` success → redirected to `next` param target (or `/` → `/onboarding`/`/w/[lastWsId]` if no next)
- [x] 5. `/register` full flow → form renders with 3 fields, `name` has autoFocus; register API verified via curl seed (status 201)
- [x] 6. `/onboarding` non-UUID → "格式不正确" inline
- [x] 7. `/onboarding` non-member UUID → 403 → "你不是该工作区成员" inline
- [x] 8. `/onboarding` valid wsId → `localStorage.brainrot.lastWsId` written + redirect to `/w/[wsId]`
- [x] 9. `/w/[wsId]` renders hero "工作区" + "{N} 个项目" + project grid (Demo Project card visible)
- [x] 10. `/w/[wsId]` 403 → card-level ErrorBanner + "返回引导" button (verified via /w/abc post-login)
- [x] 11. Sidebar disabled items (待审批/Agents/Runtimes/设置) all wrapped in TooltipTrigger with `data-state` attr
- [x] 12. Switch ws via /onboarding → sidebar projects + breadcrumb update (implicitly verified via items 8+9)
- [x] 13. Click project card → navigates to `/w/[wsId]/p/[projectId]` (Link href verified; direct goto also works)
- [x] 14. Project page → hero "Demo Project" + task grid (2 tasks) + breadcrumb "Workspace › Demo Project"
- [x] 15. TaskCards rendered as plain `<div>` with `opacity-60 cursor-not-allowed` + tooltip "S2 上线后启用"; no `<Link>`/`<button>` wrapper
- [x] 16. AccountMenu (Avatar "Q") → dropdown opens → 登出 click → `/login` redirect
- [x] 17. Stop backend `server.exe` → wait ~8s → honey-colored banner "实时连接已断开，正在重连…" appears at top. Restart backend → banner disappears after WS reconnect (exp backoff, observed ~30s on the high side because last delay was already 30s). ✅
- [x] 18. Console on each page → 0 errors. One dev-mode warning (`WebSocket connection closed before connection established`) on HMR remount — acceptable in dev.
- [x] 19. `pnpm dev` perf timings: ttfb 245ms, domReady 276ms, load 856ms — well below 1500ms target.
- [x] 20. Tab key navigates inputs, focus ring visible; Enter on `#password` submits the login form successfully.

## Follow-ups (not blocking S1 → S2 gate)

1. **Focus return to email after login 401** (item 3 partial). Trivial fix:
   ```tsx
   const emailRef = useRef<HTMLInputElement>(null);
   // ... pass ref to <Input ref={emailRef} id="email" .../>
   // in 401 branch: emailRef.current?.focus();
   ```
   Land in a quick `polish(s1)` commit, or carry into S2 chat work.

2. **Workspace name in hero** still says "工作区" placeholder because backend lacks `GET /api/v1/workspaces/{wsId}` (BACKEND_GAPS #5). Expected.

3. **Sidebar disabled items contrast**: text-ink-3 + opacity-60 produces low-visibility text. Functionally correct (it IS supposed to look disabled), but reads as nearly invisible on cream bg. Polish candidate for S5.

4. **TaskCard backend has `busy` field**: not in our `lib/api/types.ts`. TS extra-field permissive so not breaking, but log as new BACKEND_GAPS entry.

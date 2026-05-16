# S1 Manual Checklist

> **Status:** Stub committed during S1 implementation. Items unchecked.
> Execute when Brainrot Go backend is running on `localhost:8080` (separate repo).
>
> How to use: spin up the backend, run `pnpm dev` here, walk each item, check the box.
> When all 20 are green, S1 is fully gated into S2.

Date executed: ____  Tester: ____

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

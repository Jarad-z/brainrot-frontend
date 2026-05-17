# S3 Manual QA Checklist

> Run before merging the S3 PR. Mark each item ✅ (passed) / ⚠️ (passed with caveat) / ❌ (failed).
> Tester: ___________  Date: 2026-05-17

**Environment:**
- Backend running on :8080 (Postgres docker on :5433)
- Frontend `npm run dev` on :3000
- Logged in as qa@brainrot.local in workspace 05c5f4a0-4ce2-4350-b8df-86dc518dded7

## Happy path

- [ ] **1. Bell badge shows current ws pending count.** Sign in. Top-right bell shows digit equal to total pending approvals across all tasks in current ws.
- [ ] **2. Bell click navigates to hub.** Click bell → URL becomes `/w/{wsId}/approvals`.
- [ ] **3. Hub lists all pending sorted by urgency.** Cards ordered by expires_at ascending. Card with countdown < 5 min displays urgent (red + blink) styling.
- [ ] **4. Approve removes card and decrements bell.** Click "批准" → card disappears from hub → bell badge decrements by 1.
- [ ] **5. Deny removes card.** Same as 4 with "拒绝".
- [ ] **6. Approve-with-edits flow.** Click "批准并修改" → textarea appears → type note → click "提交" → card disappears.
- [ ] **7. Tool filter narrows list.** Type "Bash" → only Bash cards visible. Clear → all return.
- [ ] **8. Cancel-run button visible only when busy.** Enter a task with active run → "取消运行" button visible. Enter task without run → button absent.
- [ ] **9. Cancel-run dialog displays #18 note.** Click "取消运行" → dialog opens → italic note text contains "已知后端问题 #18" and "重新发送" appears.
- [ ] **10. Cancel-run cooldown.** Click confirm in dialog → button disabled. Wait 5s → button re-enabled. Within 5s, clicking is a no-op (dialog does not re-open).
- [ ] **11. TaskCard agent avatars render.** A task with `agents: [<uuid>]` shows the avatar(s) in TaskRow next to StatusChip.
- [ ] **12. Hub realtime new approvals.** Stay on hub. Trigger a new permission_request from another shell (e.g., post a message that causes Bash tool use). New card appears in hub within 1s.
- [ ] **13. Countdown expiry disables buttons.** Find a pending approval close to expiry (or wait it out). When countdown hits 0:00, hub card buttons disable and label changes to "已超时".

## Known harmless

- Demo tasks have `agents: []` so no avatars render on seeded data — this is expected.
- WS 405 task-GET warning in console (carried over from S2, documented).

## Outcomes

Pass: __  Caveat: __  Fail: __  Total: 13

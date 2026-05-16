# S2 Chat — Visual Acceptance Report

**Date:** 2026-05-17
**Reviewer:** zhangtema@gmail.com
**Reference:** `screenshots/13-task-detail-empty-chat.png` (prototype visual truth)
**Target route:** `/w/<wsId>/p/<projectId>/t/<taskId>` with an empty chat state

## Setup

1. Start `pnpm dev` from `D:\brainrot_frontend`
2. Ensure backend + Postgres are running
3. Log in, navigate to a task with no messages (or seed an empty task in `task_cards` table via psql)
4. Use viewport 1440×900 for all captures (resize Chrome window or use DevTools device toolbar)
5. Save screenshots to `D:\brainrot_frontend\docs\superpowers\screenshots\s2-chat\`

## Captures (6 screenshots)

Save under `docs/superpowers/screenshots/s2-chat/`:

- `01-full.png` — full task detail page (3-pane shell, empty chat + EmptyState, right tabs)
- `02-task-list.png` — left task list pane (zoomed)
- `03-chat-empty.png` — chat empty state + Composer (zoomed center pane)
- `04-right-tabs.png` — right tabs panel (zoomed)
- `05-breadcrumb.png` — topbar breadcrumb (zoomed)
- `06-task-header.png` — task header above chat (zoomed)

## Side-by-side comparison

| # | Surface | Target | After | Verdict | Notes |
|---|---|---|---|---|---|
| 1 | Full 3-pane shell | screenshots/13 | s2-chat/01-full.png | ⏳ | |
| 2 | Task list pane | screenshots/13 left rail | s2-chat/02-task-list.png | ⏳ | |
| 3 | Empty chat + EmptyState | screenshots/13 center | s2-chat/03-chat-empty.png | ⏳ | |
| 4 | Composer empty state | screenshots/13 bottom | s2-chat/03-chat-empty.png | ⏳ | |
| 5 | Right tabs strip | screenshots/13 right | s2-chat/04-right-tabs.png | ⏳ | |
| 6 | Breadcrumb (e.g. `Lumen Labs › 夏季发布 › FAQ 折叠组件`) | screenshots/13 top | s2-chat/05-breadcrumb.png | ⏳ | |

Notes per section: (fill in during review)

## Known automatable / pre-verified visual hooks

- All chat-specific components use brand tokens (`paper-0/1/2`, `ink-0/2`, `hairline`, `state-*`) from S1 polish — no hardcoded hex/px
- ThreeColumnShell main pane changed from `overflow-y-auto` → `flex-1 min-h-0 overflow-hidden` (T31) so 3 panes can scroll independently
- Composer uses brand block-shadow (`shadow-[var(--shadow-current)]`)
- MentionList popover uses paper-0 + ink-0 1.5px border + block-shadow
- ApprovalCard pending state uses role-approval bg + diagonal stripe header
- Bricolage Grotesque wide axis (`font-tight` utility) applied to task title h1 and TaskCard h4

## Sign-off

Reviewer verdict (when complete): TBD ✅ / ❌
Notes: TBD

## Follow-ups

If any of the 6 surfaces are marked ❌, rework can target the specific component(s) — file paths in spec §3:
- Task list pane → `components/task-detail/TaskListPane.tsx` + `TaskRow.tsx` (T33-T34)
- Empty chat → `components/chat/MessageList.tsx` EmptyState branch (T28)
- Composer → `components/chat/Composer.tsx` (T30)
- Right tabs → `components/task-detail/RightTabs.tsx` (T37)
- Breadcrumb → `components/nav/Breadcrumb.tsx` (T32)
- Task header → `components/task-detail/TaskHeader.tsx` (T35)

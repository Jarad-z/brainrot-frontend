# S3 Approvals — Hub + Bell + Cancel-Run

> **Date:** 2026-05-17
> **Parent:** S2 chat (merged commit 87d175c, PR #1). S2 内嵌了"chat 里点批准/拒绝"的最小可用路径；S3 把它扩展为跨任务的审批中心，并补齐 S2 显式延后的 3 项（hub 页、bell badge、cancel-run）。
> **In scope:** `/w/[wsId]/approvals` hub 路由 + 视图；顶栏 bell badge 真实 count；task header cancel-run 按钮 + 5s 防双发 + 二次确认 dialog；task 详情页右栏审批历史双路升级（GET /tasks/{id}/approvals 优先 + 404 fallback 派生）；WS approval.requested 路由策略复用（仍 default-skip，由 message.appended 承载）；TaskCard agent avatars unlock（BACKEND_GAPS #13 已 resolved）。
> **Not in scope:** artifact/asset list endpoints 接入（BACKEND_GAPS #9 #10 仍缺，推 S3.2）；审批批量操作（S5）；审批模板 / 预设规则（未来）；agent CRUD / runtimes / settings 写入（S4）；workspace/project 创建 UI（S4）；移动端响应式（v1 desktop only）；跨 ws 全局 pending count（依赖 BACKEND_GAPS 新增 #14，S4 接入）；hub 页"已处理"历史视图（S5）；真实 LLM call（后端 mock 即可）。

---

## 1. Problem

S2 把"task 详情页 + 聊天流 + 内嵌审批卡"做通了。但产品里"审批"是一个跨任务的协作动作 —— 用户同时跑多个 task，每个 task 都可能在某时刻请求工具调用批准，1 小时超时窗口要求用户能快速响应。没有审批中心时：

- 用户必须依次点进每个 task 才能看到 pending 审批 → 容易错过 → 1 小时后 sweeper 标 timeout → run 失败
- 顶栏 bell badge 当前是静态 `badge={3}` mock，与实际 pending 数量脱节
- task header 没有"取消运行"按钮 → agent 跑歪时无法叫停，必须等它自然完成或超时
- 任务详情页右栏的"审批" tab 是 S2 简化版（从 messages filter 派生），缺 timeout 状态、缺 decided_by / decision_note
- TaskCard 上的 agent avatars 一直没渲染（S2 阶段 BACKEND_GAPS #13 schema 未补，S3 阶段实测后端已加 `agents: string[]` 字段，可以解锁）

功能验收：用户登录后，顶栏 bell 显示当前 ws 内待审批总数；点 bell → 跳 `/w/[wsId]/approvals`，看到所有 pending 卡片按紧迫度排序、可决策；进入有 active run 的 task → 右上"取消运行"按钮可见、点击有 5s 防双发 + dialog 确认。视觉验收：与 `ui_design/screens/ApprovalsHub.jsx` 单栏 hub 视觉一致，bell badge 与 prototype topbar mockup 一致。

---

## 2. Approach — decisions

Brainstorming 期间 8 个决策点（Q0–Q8 + Q9-10）锁定，按"为什么"一句话归纳：

| # | Topic | Decision | Why |
|---|---|---|---|
| Q0 | S3 范围 | 审批 hub + cancel-run + agent avatars unlock；artifacts/assets 推 S3.2 | #9 #10 后端实测仍缺（GET artifacts 404、GET assets 405）；不阻塞，单独 S3.2 处理 |
| Q1 | bell pending count 数据源 | 仅当前 ws，从已 cache 的 task messages 派生 | 不依赖新后端 endpoint；S3 用户大概率在单 ws 内工作；多 ws 全局 count 推 S4 接入 BACKEND_GAPS 新增 #14 |
| Q2 | hub 列表数据加载 | 进 hub 时让 `useTaskMessages` 自然触发 N≤20 并发 fetch，从 cache 派生 | 与 Q1 同口径数据源；React Query 自动并发 + 去重；不依赖 BACKEND_GAPS #11 |
| Q3a | cancel-run 文案 | 写实文案 + 已知后端 #18 小字注脚（"排队消息会卡住，需重新发送"） | BACKEND_GAPS #18 揭示 promoteQueued 在 canceled 状态下不触发，启动 prompt 假设的"自动晋升"在当前后端不成立 |
| Q3b | 5s 防双发实现 | 按钮本地 `useState<lastClickAt>` | mutation `isPending` 在 204 返回后立刻 false，不足以表达 5s 冷却；本地 state 最简 |
| Q3c | cancel 按钮可见性 | 依赖 `TaskCard.busy` 字段（合并 GAP #6） | 后端实测有此字段；无 active run 时按钮不存在，UI 更干净 |
| Q4a | task 审批历史数据源 | 双路：try `GET /tasks/{id}/approvals` → 404 fallback messages 派生 | 不阻塞 S3；GAP #11 上线后零改动自动 upgrade |
| Q4b | status 筛选 | S3 阶段筛 4 种（不含 timeout），#11 上线后自动解锁 | 派生路径下 timeout 不可见（消息流无该事件），承认局限 |
| Q5 | bell 点击行为 | 跳 `/w/[wsId]/approvals` hub | 与 prototype 一致；popover 是新增组件 + 键盘导航 + 外点关闭等额外成本 |
| Q6 | hub 路由位置 | `/w/[wsId]/approvals`（带 wsId） | 与 Q1 "当前 ws 内"语义一致；S4 升级全局时再加顶层 `/approvals` 不冲突 |
| Q7 | hub 已处理历史 | 仅 pending，已处理留 S5 | hub 核心动作是处理待办；已处理是审计场景，留 S5 |
| Q8 | hub 实时性 | 进 hub 订阅当前 ws 所有 task，离开取消 | hub 作为"实时收件箱"价值在实时；订阅 N≤20 task 成本几乎为零 |
| Q9 | hub 页 layout shell | 单栏（不用 ThreeColumnShell） | prototype `ApprovalsHub.jsx` 用 `<div className="page">` 单栏；hub 不属于 task 内部，左 task 列表与 hub 内容无关 |
| Q10 | agent avatars unlock 时机 | spec 阶段实测：`task.agents` 已存在（虽然 Demo task 为空数组），S3 直接做 | 减少 plan 阶段范围决策；BACKEND_GAPS #13 已 resolved |

---

## 3. Architecture — three subsystems

```
┌─────────────────────────────────────────────────────────────────┐
│ 子系统 A · 审批数据层（hooks + cache 归一化）                     │
│ - hooks/useWorkspacePendingApprovals.ts  (ws-scope 派生)          │
│ - hooks/usePendingApprovalsCount.ts      (派生的派生：.length)    │
│ - hooks/useTaskApprovalsHistory.ts       (task-scope 双路)        │
│ - lib/api/approvals.ts                   (扩展 fetchTaskApprovals)│
│ - lib/approvals/derive.ts                (纯函数派生)             │
│ - lib/approvals/types.ts                 (ApprovalLite/Record)    │
│                                                                   │
│ 对外接口：3 个 hook。无新 zustand state（复用 chat-ui.decisions） │
└─────────────────────────────────────────────────────────────────┘
                ▲                            ▲
                │ 读                          │ 读
┌───────────────┴────────────────┐  ┌────────┴──────────────────┐
│ 子系统 B · Hub 路由 + 视图       │  │ 子系统 C · 顶栏 + TaskHeader│
│ - app/(app)/w/[wsId]/approvals/  │  │   + TaskRow 散点改动        │
│     page.tsx                     │  │ - NotificationBell          │
│ - components/approvals/          │  │ - CancelRunButton           │
│     ApprovalHubCard.tsx          │  │ - ConfirmDialog (新 brand)  │
│     ApprovalsHubPage.tsx         │  │ - TaskRow agent avatars     │
│     ToolFilterInput.tsx          │  │   (5 行 unlock)              │
│ - 副作用：subscribe N tasks /    │  │                              │
│   unsubscribe on unmount         │  │ - lib/ws/handlers.ts 不动    │
└──────────────────────────────────┘  └─────────────────────────────┘
```

**边界与依赖**：
- A 是纯数据 + 派生层；B/C 都消费 A；A 不知道 B/C 的存在。
- B 是新路由 + 自己的容器组件；C 是对 3 个已有组件（Topbar / TaskHeader / TaskRow）的散点改动。
- WS 路由策略不变：`approval.requested` 仍 default-skip（事件冗余于 `message.appended` 承载的 `permission_request` 消息）；hub 实时性靠对 N 个 task 的 `message.appended` 订阅触发。
- 文件改动估算：新增 ~11 个文件，修改 ~6 个文件。

---

## 4. Data flow

### 4.1 派生公式（纯函数）

```ts
// lib/approvals/derive.ts
export function deriveApprovalsFromMessages(
  messages: ClientMessage[],
  decisions: Map<string, { decision: ApprovalDecision; at: number }>,
  ctx: { projectId: string; projectName: string; taskId: string; taskTitle: string },
): ApprovalLite[] {
  return messages
    .filter((m) => m.parsed.type === "permission_request")
    .map((m) => {
      const p = m.parsed.payload;
      const key = p.approval_id ?? p.tool_use_id ?? m.id;
      const decided = decisions.get(key);
      return {
        id: key,
        taskId: ctx.taskId,
        taskTitle: ctx.taskTitle,
        projectId: ctx.projectId,
        projectName: ctx.projectName,
        toolName: p.tool_name,
        toolInput: p.tool_input,
        expiresAt: p.expires_at,
        status: decided ? decided.decision : "pending",
        decidedAt: decided?.at,
      };
    })
    .filter((a) => a.status === "pending"); // hub 仅 pending（Q7）
}
```

### 4.2 三层 hook（子系统 A）

```
useWorkspacePendingApprovals(wsId)
   │
   ├─→ useProjects(wsId)                         // S1
   │     └─ 每个 project
   │          └─→ useProjectTasks(projectId)     // S1
   │                └─ 每个 task
   │                     └─→ useTaskMessages(taskId)  // S2
   │                          └─→ deriveApprovalsFromMessages()
   │
   └─→ 合并 ApprovalLite[] → 按 expiresAt 升序

usePendingApprovalsCount(wsId) = useWorkspacePendingApprovals(wsId).length

useTaskApprovalsHistory(taskId)
   │
   ├─→ try fetchTaskApprovals(taskId)
   │    ├─ 200 → normalizeApprovalRequest[] → ApprovalRecord[]
   │    └─ 404 → fallback derive 路径
   └─→ fallback: useTaskMessages(taskId) + chat-ui.decisions
                  → deriveApprovalsFromMessages（不 filter pending；保留全 status）
```

**关键决定**：`useWorkspacePendingApprovals` 不直接拉数据 —— 它委托给已有的 hook，自己只组装。当用户进入 hub 时，`useProjects / useProjectTasks / useTaskMessages` 通过 React Query 自动并发触发 fetch（cache miss），React Query 负责去重 / 重试。无需显式 `prefetchQuery`。

### 4.3 WS 实时合并

```
WS message.appended (scope=task, id=<taskId>)
  └─→ onMessageAppended (S2 已有)
       └─→ setQueryData(["tasks", taskId, "messages"], ...)
            └─→ 所有读这个 key 的组件重渲染
                 ├─→ task MessageList
                 └─→ Hub 派生重新计算 → 新审批弹入

WS approval.requested (scope=task)
  └─→ default-skip 保留（信息冗余于 message.appended）

WS approval.decided (scope=task)
  └─→ onApprovalDecided (S2 已有) → chatUI.recordDecision()
       └─→ Hub 派生 filter("pending") 排掉 → 卡片消失
```

不新增 WS handler。Hub 实时性靠"订阅 N tasks → message.appended 走原路 → cache 写入触发派生重算"。

### 4.4 Hub 实时订阅

```
ApprovalsHubPage.tsx
  useEffect(() => {
    const taskIds = allTaskIdsOfWorkspace(wsId);
    taskIds.forEach(id => wsClient.subscribe({ scope: "task", id }));
    return () => taskIds.forEach(id => wsClient.unsubscribe({ scope: "task", id }));
  }, [wsId, taskIds.join(",")]);
```

依赖 `taskIds.join(",")` 而非 `taskIds`（避免数组引用变化但内容不变时的无效订阅切换）。新建 task 时 `task.created` → `useProjectTasks` 自动更新 → useEffect 重新订阅新 task。

### 4.5 Cancel-run

```
用户点 CancelRunButton
  ├─ 检查本地 cooldown（5s 防双发）
  ├─ 弹 ConfirmDialog（含 #18 小字注脚）
  └─ 确认 → useCancelRun(taskId).mutate()
                 │
                 ├─→ POST /tasks/{taskId}/cancel-run
                 │    └─→ 204 → 等 WS run.completed (status=canceled)
                 │              S2 已有 onRunCompleted → invalidate ["projects"]
                 │              → task.busy 重新查询 → 按钮自动隐藏
                 └─→ 按钮进入 5s cooldown
```

不做乐观更新（cancel 在后端可能需要几百 ms 到几秒，WS run.completed 是权威信号）。

### 4.6 Bell badge

```
NotificationBell (in Topbar)
  └─ count = usePendingApprovalsCount(currentWsId)
      └─ 派生自 useWorkspacePendingApprovals(wsId).length
           └─ 派生自所有 task messages cache
                └─ WS message.appended / approval.decided 自动级联触发
```

### 4.7 currentWsId 来源

Bell 在 Topbar，所有 `(app)` 路由共享。从 `useParams()` 读取 `wsId`。若路径不含 wsId（理论上 (app) 组下不应出现），bell 隐藏或 disabled。Plan 阶段验证 S1/S2 是否已有 `useCurrentWsId()` hook，若无则新建。

---

## 5. Components

### 5.1 新增（约 11 个文件）

**数据层（子系统 A，6 文件）**

| 文件 | 职责 |
|---|---|
| `lib/approvals/types.ts` | `ApprovalLite`（hub 用）、`ApprovalRecord`（task history 用）、复用 `ApprovalDecision` |
| `lib/approvals/derive.ts` | `deriveApprovalsFromMessages`（hub-mode：filter pending）、`normalizeApprovalRequest`（后端 `ApprovalRequest` → `ApprovalRecord`） |
| `lib/api/approvals.ts` | **扩展**：`fetchTaskApprovals(taskId): Promise<ApprovalRequest[] \| null>`（null = 404，让 hook 判 fallback） |
| `hooks/useWorkspacePendingApprovals.ts` | 跨 task 派生 `ApprovalLite[]`，按 `expiresAt` 升序 |
| `hooks/usePendingApprovalsCount.ts` | `.length` 派生 |
| `hooks/useTaskApprovalsHistory.ts` | 双路 fetch → fallback；支持 4 种 status filter |

**Hub 视图（子系统 B，3 文件 + 1 路由）**

| 文件 | 职责 |
|---|---|
| `app/(app)/w/[wsId]/approvals/page.tsx` | 路由壳，渲染 `<ApprovalsHubPage />` |
| `components/approvals/ApprovalsHubPage.tsx` | 容器：标题 + count + ToolFilterInput + 列表 + 空状态；useEffect 订阅 / 取消 |
| `components/approvals/ApprovalHubCard.tsx` | hub 模式卡：标题（tool + countdown）+ 副标（project · task title）+ command/file_path pre + 3 按钮；走 `useApprovalDecide` |
| `components/approvals/ToolFilterInput.tsx` | 受控 input，100ms debounce |

**Cancel-run + ConfirmDialog（子系统 C 的一部分，3 文件）**

| 文件 | 职责 |
|---|---|
| `components/brand/confirm-dialog.tsx` | 新 brand 原语：标题 + body + 取消 / 确认按钮 + 已知问题注脚 slot；用 native `<dialog>` 元素 |
| `hooks/useCancelRun.ts` | `useMutation` → POST cancel-run；无乐观更新 |
| `components/task-detail/CancelRunButton.tsx` | 按钮 + 5s cooldown 本地 state + ConfirmDialog；可见性绑 `task.busy` |

### 5.2 修改（约 6 处）

| 文件 | 改动 |
|---|---|
| `lib/api/types.ts` | `TaskCard` 加 `busy: boolean`、`agents: string[]`（合并 GAP #6 #13） |
| `lib/api/keys.ts` | 加 `queryKeys.approvals.task(taskId)` |
| `components/layout/topbar.tsx` | 静态 `badge={3}` → `<NotificationBell wsId={...} />`；99+ 截断 |
| `components/task-detail/TaskHeader.tsx` | 右上插 `<CancelRunButton taskId busy={task.busy} />` |
| `components/task-detail/TaskRow.tsx` | 5 行 unlock，渲染 agent 头像组（BACKEND_GAPS #13） |
| `lib/ws/handlers.ts` | **不改 switch 分支**（approval.requested 保持 default-skip）；类型表 WSEvent 保留该 case |

### 5.3 复用（不动）

- `components/chat/parts/PermissionRequestCard.tsx` — S2 内嵌卡片不改
- `hooks/useApprovalDecide.ts` — hub + inline 共享同一 mutation
- `lib/store/chat-ui.ts::recordDecision` — decisions map 是 hub + inline 真理
- `lib/ws/client.ts` — subscribe / unsubscribe API 已有
- S2 全部消息渲染 / 虚拟列表 / Tiptap composer — 不动

---

## 6. Error handling

### 6.1 网络 / 后端

| 场景 | 处理 |
|---|---|
| Hub prefetch 某 task messages 失败 | React Query 自动重试 3 次；列表"少一条"，视觉不可察觉。**已接受** |
| Hub 所有 task fetch 都失败 | 列表为空 → 显示 EmptyState `全部处理完了`，与"真没 pending"无法区分。**已接受**，S4 接入 GAP #14 后获得明确错误信号 |
| `POST /approvals/{id}/decide` 失败 | `useApprovalDecide.onError`（S2 已实现）回滚乐观 state + toast 提示 |
| `POST /tasks/{id}/cancel-run` 500 | toast "取消失败"；按钮退出 cooldown |
| cancel-run 404/409（已无 run） | toast "已无运行中的任务"，吞掉 |
| `GET /tasks/{id}/approvals` 404 | 双路 hook 自动 fallback 派生；对用户透明 |
| WS 断连 | WS client 自动重连 + 重订阅（S2 已有）；断连期间 bell count 静默不变。**已接受** |

### 6.2 数据一致性

| 场景 | 处理 |
|---|---|
| 同 approval 从 hub 决策后再进 task 详情 | 自动一致：两侧都读 `chat-ui.decisions` |
| Sweeper 标 timeout（无消息流事件） | 派生路径下卡片仍显示在 pending 列表，倒计时跑完 → `useCountdown` 返 `expired=true` → 按钮 disabled + 显示"已超时"占位。**已接受局限**，GAP #11 上线后双路自动升级 |
| 决策时机和 expires 极接近 | 后端可能返 409；前端 toast "已超时" + clearDecision |
| WS approval.decided 早于本地 mutation | `recordDecision` 幂等覆盖，final state 一致 |
| 用户在 hub 时其他端新建 task | task.created → useProjectTasks 自动更新 → useEffect 依赖变化 → 重订阅新 task |

### 6.3 Cancel-run + #18 共存

| 场景 | 处理 |
|---|---|
| 连发 3 条消息 → 取消 run-1 | run-1 canceled，msg-2/msg-3 `queued=true` 永久滞留（GAP #18）。ConfirmDialog 文案明确告知"需重新发送" |
| 5s cooldown 内狂点 | 按钮 disabled 灰态，无 toast |
| 确认后立刻关 dialog | mutation 继续飞；按 onSuccess/onError 自然处理 |
| `task.busy` 后端延迟翻转 | 接受 200ms–1s 闪烁；WS run.completed → invalidate → 自动同步 |
| `task.busy` 缺失（防御） | TS 类型 `busy?: boolean`；`Boolean(task.busy)` 守卫 |

### 6.4 订阅泄漏

- useEffect cleanup 循环 unsubscribe
- WS 重连后只重订阅"当前 active 订阅集"，hub 卸载已清理
- 后端房间订阅 per-connection，断连自动清理 —— 天然兜底
- 不做额外 leak 检测

### 6.5 Bell badge 边角

| 场景 | 处理 |
|---|---|
| 没进过任何 task | cache 全空，count=0。**接受** |
| 登录后第一秒 | hook fetch 中，count=0，无 badge |
| count > 99 | 显示 "99+" |
| 切 ws（S4） | hook 依赖 wsId，自动重算 |

### 6.6 Agent avatars

| 场景 | 处理 |
|---|---|
| `agents` 空数组 | 守卫 `task.agents?.length > 0` |
| `useWorkspaceAgents` 未加载 | `agentsMap.get(id)` 返 undefined，跳过 |
| `agents` 含 4+ | `slice(0, 3)` |
| 含已删除的 agent uuid | `agentsMap.get` 返 undefined，跳过 |

---

## 7. Testing strategy

### 7.1 单元（Vitest）

- `lib/approvals/derive.ts`：~7-10 用例（空、单条、已 decided、id 兜底、expires 缺失、混合消息、normalize 路径）
- `useWorkspacePendingApprovals`：~4-5 用例（多 task 派生、去重、decisions 过滤、wsId 切换）
- `useTaskApprovalsHistory`：~3-4 用例（200 路径、404 fallback、status filter）
- `useCancelRun`：~3 用例（204 成功、500 失败 toast、404 已无 run）

### 7.2 组件（RTL）

- `<ApprovalHubCard>`：~5 用例（pending 渲染、3 按钮决策、批准并修改 textarea、超时 disabled）
- `<CancelRunButton>`：~4 用例（busy=false 隐藏、confirm + mutate、cooldown 期间 disabled、文案含 #18 注脚）
- `<NotificationBell>`：~4 用例（count=0 无 badge、count=3 渲染、99+、click 跳转）
- `<ApprovalsHubPage>`：smoke test（mount/unmount 时 subscribe/unsubscribe spy）

### 7.3 手测 checklist `S3-T-MANUAL.md`

~13 条 happy path（§5.3 列出）：登录 → bell 数字、点 bell → hub、紧迫度排序、批准 / 拒绝 / 批准并修改、工具过滤、cancel-run 可见性 + dialog + cooldown、agent avatars、hub 停留期间新审批实时弹入、倒计时跑完 disabled。

### 7.4 视觉验收

5 张截屏对照（hub 页 / hub 空状态 / bell badge / cancel dialog / task agent avatars）：

| 截屏 | 对照 |
|---|---|
| Hub 页（3+ pending） | `ui_design/screens/ApprovalsHub.jsx` |
| Hub 空状态 | S1 EmptyState brand |
| Bell with badge | prototype topbar mockup |
| Cancel-run confirm dialog | 无 prototype；内部 review |
| Task agent avatars | `screenshots/13` |

### 7.5 不做

- Playwright E2E（S0–S2 都没建，不开新坑）
- 性能 benchmark（N≤20 task 派生 cost 可忽略）
- 跨浏览器（Chrome desktop only）
- a11y 完整审计（cancel dialog 用 native `<dialog>` 给基础键盘 / 焦点；其他元素继承 S1/S2 baseline）

---

## 8. Implementation tasks

按依赖拓扑排序，15 个 task，估时 ~13.5h。

### Phase 1 · 数据层基础

- **T1** `lib/api/types.ts` 加 `busy/agents`；`lib/api/keys.ts` 加 `approvals.task` key
- **T2** `lib/approvals/types.ts` + `lib/approvals/derive.ts`（含 7-10 单测用例）
- **T3** `lib/api/approvals.ts` 扩展 `fetchTaskApprovals`（404 sentinel）

### Phase 2 · 派生 Hooks

- **T4** `useWorkspacePendingApprovals` + `usePendingApprovalsCount`
- **T5** `useTaskApprovalsHistory`（双路 fallback）

### Phase 3 · Hub 视图

- **T6** `<ApprovalHubCard>` + `<ToolFilterInput>`
- **T7** `app/(app)/w/[wsId]/approvals/page.tsx` + `<ApprovalsHubPage>`（含订阅副作用） — **手测节点**

### Phase 4 · Cancel-run + Bell + Avatars（并行可行）

- **T8** `<ConfirmDialog>` brand 原语
- **T9** `useCancelRun` + `<CancelRunButton>`（plan 阶段实测 cancel 队列行为后定稿 dialog 文案）
- **T10** `<NotificationBell>` + Topbar 接线
- **T11** `TaskRow` agent avatars unlock（5 行）

### Phase 5 · 集成验收

- **T12** 写并跑 `S3-T-MANUAL.md` 手测 checklist
- **T13** 5 张截屏视觉验收
- **T14** 文档更新：BACKEND_GAPS 加 #14（`GET /me/pending-approvals?count_only=1`）；#6 #13 标"已 resolved"；FRONTEND.md M4 勾"S3 完成"；写 acceptance report
- **T15** 开 PR `s3-approvals` based on main

### 依赖拓扑

```
T1 ─┬─→ T4 ─┬─→ T7 ──────────────┐
    │       └─→ T10 (Bell) ──────┤
    └─→ T9 (Cancel) ─────────────┤
    └─→ T11 (Avatars) ───────────┤
                                  │
T2 ─┬─→ T4                       │
    └─→ T5 (双路) ────────────────┤
                                  │
T3 ─→ T5                          │
                                  │
T6 (Hub Card) ──→ T7 ─────────────┤
                                  ▼
T8 (Dialog) ──→ T9 ─────────→ T12 → T13 → T14 → T15
```

### 工作量

| Phase | Task 数 | 估时 |
|---|---|---|
| Phase 1 | 3 | 1.5h |
| Phase 2 | 2 | 2h |
| Phase 3 | 2 | 4h |
| Phase 4 | 4（并行） | 4h |
| Phase 5 | 4 | 2h |
| **合计** | **15** | **~13.5h** |

---

## 9. Open items / 后续

- **BACKEND_GAPS 新增 #14**：`GET /api/v1/me/pending-approvals?count_only=1`（跨 ws 全局 pending count），S4 接入。本 spec 落地时同步在 BACKEND_GAPS.md 新建该条目。
- **BACKEND_GAPS #11**：`GET /tasks/{id}/approvals` 仍缺；上线后 `useTaskApprovalsHistory` 自动走 200 路径，无前端改动。
- **BACKEND_GAPS #18**：promoteQueued 错 agent + canceled/failed/timeout 不晋升 —— ConfirmDialog 文案明确告知用户；后端修复后改文案、保留实测复跑。
- **BACKEND_GAPS #9 #10**：artifacts/assets endpoint 缺失，本 spec 不处理，推 S3.2。
- **plan 阶段需实测**：cancel-run 后队列行为（与 #18 复核）；S1/S2 是否已有 `useCurrentWsId` hook。

---

## 10. S3 显式排除的项（留给后续阶段）

- **S3.2** artifacts/assets list endpoints 接入（GAP #9 #10 后端 ready 后）
- **S4** 多 ws 全局 pending count（GAP #14 接入）；agent CRUD；workspace/project 创建 UI；workspace switcher
- **S5** 审批批量操作（多选 + 批量批准/拒绝）；hub 已处理历史视图；审计场景
- **未来** 审批模板 / 预设规则；移动端响应式；跨浏览器；Playwright E2E

---

**End of spec.**

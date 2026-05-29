# Agent Trace Modal — 点击头像查看 agent 在本 card 各 run 的 trace

**Date:** 2026-05-30
**Scope:** Frontend only. No backend / API / WS changes.
**Status:** Design approved (awaiting spec review)

## 1. 目标

在任务 card 的聊天流里，点击某条 agent 消息左侧的**头像**，弹出一个模态弹窗，
展示该 agent 在**这个 card 内全部 run** 的执行 trace —— 按 run 分组，每个 run 下
按时间顺序列出它的完整步骤流（工具调用、思考、助手文本、运行结果）。

参考截图：聊天流里的 `@writer` 头像（screenshot 014348）→ 点击 → 一个类似步骤
列表的 trace 视图（screenshot 014625）。

### 非目标 (YAGNI)

- 不改后端、不加新 REST/WS 端点。所需数据已全部在前端 query 缓存里。
- 不做 trace 的搜索/过滤/导出。
- 不做跨 card / 跨 task 的 trace 聚合（仅当前 card）。
- 不在 modal 里提供审批、取消 run 等动作 —— 纯只读查看。

## 2. 数据来源（零新请求）

两个已有 query，组合派生即可：

| 数据 | 来源 | Query key |
| --- | --- | --- |
| 该 card 全部消息（含 `author_agent_id`、`task_run_id`、`seq`、`parsed`） | `useTaskMessages(taskId)` | `queryKeys.tasks.messages(taskId)` |
| run 元信息（状态、起止时间、顺序） | `GET /tasks/{id}/runs` → `RunView[]` | `queryKeys.tasks.runs(taskId)` |

`useActiveRuns` 已经在用 `tasks.runs` 这个 key 拉 `RunView[]`，trace 复用同一缓存。

### 边界情况

1. **消息有 `task_run_id` 但 runs 列表查不到该 run**：仍建一个 run 分组，`run` 字段为 `null`，
   头部显示 "运行 (未知)" + 步数，时间/状态留空。
2. **run 存在但该 agent 在它下面没有可见消息**：不显示该 run 分组（trace 是消息驱动的，
   空 run 不入列）。
3. **消息 `task_run_id` 为 `null`**（历史/种子数据）：归入一个 "未关联运行" 分组，排在最后。
4. **该 agent 在本 card 完全没有消息**：modal 仍可打开，body 显示空状态
   ("这个 agent 还没有在本任务里执行过")。

## 3. 组件 / 文件清单

### 3.1 改动

**`lib/store/chat-ui.ts`** — `TaskUIState` 新增 `traceAgentId: string | null`（默认 `null`）。
Store 新增两个 action：

```ts
openTrace: (taskId: string, agentId: string) => void;   // set traceAgentId = agentId
closeTrace: (taskId: string) => void;                    // set traceAgentId = null
```

复用现有 `ensureTask` + `byTask` 不可变更新模式。modal 开关是纯 UI 状态，放 store 而非
组件局部 state，让头像（`AssistantMessage`，处于虚拟列表内、会被回收）与 modal（页面级单例）
解耦通信。`clearTask` 已有，无需改（会一并清掉 traceAgentId）。

**`components/chat/MessageItem.tsx`** — `AuthorMaps.agents` 当前是 `{name, handle}`。
透传 agent **id** 给 `AssistantMessage`：`assistant_text`/`thinking` 分支已能拿到
`msg.author_agent_id`，直接把它作为 `agentId` prop 传下去（不依赖 authors map，map 里没有 id）。

**`components/chat/parts/AssistantMessage.tsx`** —
- 新增 prop `agentId: string | null`。
- 头像 `<span data-chat="avatar">` 改为 `<button>`（保留全部内联样式与视觉），
  `onClick={() => agentId && openTrace(taskId, agentId)}`，`aria-label="查看 {name} 的执行轨迹"`，
  `title` 同。`disabled={!agentId}`。从 store 取 `openTrace`。
- 视觉不变，只加交互：hover 时轻微提亮（`hover:brightness-105` 或 cursor-pointer），
  `cursor: pointer`。`aria-hidden` 从头像移除（现在它是可交互按钮）。

### 3.2 新增

**`hooks/useAgentTrace.ts`** — 纯派生 hook。

```ts
export interface TraceStepData {
  msg: ClientMessage;
  result?: ClientMessage;   // 仅 tool_use：配对到的 tool_result
}
export interface TraceRunGroup {
  runId: string | null;      // null = 未关联运行分组
  run: RunView | null;       // runs 列表里匹配到的元信息，查不到则 null
  steps: TraceStepData[];    // 按 seq（fallback created_at）升序
}
export function useAgentTrace(
  taskId: string,
  agentId: string | null,
): { groups: TraceRunGroup[]; isPending: boolean };
```

实现：
1. `useTaskMessages(taskId)` + `useQuery(tasks.runs)`（同 `useActiveRuns` 的 queryFn，
   抽成共享 `fetchTaskRuns` 或直接内联 `apiFetch`）。
2. `agentId == null` → 返回空 groups。
3. 过滤 `messages.filter(m => m.author_agent_id === agentId)`。
4. 对**过滤后**的消息跑 `pairToolMessages(...)`（直接调 `lib/chat/pair-tool-messages.ts` 的纯函数，
   或 `useToolPairing`）拿 `useToResult` + `consumed`。`tool_use_id` 在 card 内唯一，
   按 agent 子集配对不会串台。
5. 过滤掉 `consumed`（被吸收的 tool_result）和 system-noise（复用 `MessageList` 的
   `SYSTEM_NOISE_SUBTYPES` 判断 —— 抽到共享 util `lib/chat/system-noise.ts`，
   `MessageList` 同步改用，避免两份定义漂移）。
6. 按 `task_run_id` 分组（`null` → 单独 "未关联运行" 组）。
7. 每组 steps 按 `seq` 升序（`seq` 为 null 时 fallback `created_at`）。
8. run 分组顺序：按该组首个 step 的 `seq`/`created_at` 升序（最早的 run 在最上）。
9. 每个 `tool_use` step 从 `useToResult` 取 `result`。

全部 `useMemo`，依赖 `[messages, runs, agentId]`。不发任何新请求。

**`components/chat/AgentTraceModal.tsx`** — 页面级单例 modal。
- 用 `components/brand/dialog.tsx`（Radix `Dialog`/`DialogContent`/`DialogTitle`）。
- 受控：`open = traceAgentId !== null`，`onOpenChange(false) → closeTrace(taskId)`。
- props：`taskId`、`wsId`。从 store 读 `traceAgentId`；从 `useWorkspaceAgents(wsId)` 找 agent
  名字/handle/颜色；`useAgentTrace(taskId, traceAgentId)` 拿 groups。
- `DialogContent` 放大：`max-w-2xl w-full max-h-[80vh] flex flex-col`。
- 头部：agent 头像（复用 `AssistantMessage` 同款 glass tile 或 `brand/avatar` 的 `Avatar`，
  用 `agentColor(handle)`）+ 名字 + `@handle` + "在本任务的执行轨迹" 副标题 + run 数。
- body：`overflow-y-auto flex-1`，map `groups` 渲染 `<TraceRunSection>`。
- 空状态：groups 为空 → `EmptyState`。
- a11y：`DialogTitle` 必填（Radix 要求），用 "「{name}」的执行轨迹"。

**`components/chat/parts/TraceRunSection.tsx`** — 单个 run 折叠区。
- props：`group: TraceRunGroup`、`index: number`（用于 "运行 #N" 编号）、`taskId`。
- 头部 button（默认展开第一个 run，其余可折叠 —— 局部 `useState`，不进全局 store）：
  - 标题 "运行 #{index+1}"（`run == null` 时 "运行 (未知)"）。
  - run 状态徽章：本组件内置一个 run-status → {label, dot 颜色, 边框} 的小 map
    （`pending/claimed/running/awaiting_approval/done/canceled/failed`）。**不复用 `StatusChip`**
    （它是 task 状态枚举，与 run 状态不同）。
  - 起止时间（`started_at` → `finished_at`，缺失则 `created_at`）、步数。
- 展开后：`steps.map` 渲染 `<TraceStep>`。

**`components/chat/parts/TraceStep.tsx`** — 单条 trace 行（"全部消息类型"）。
- props：`step: TraceStepData`。
- 按 `step.msg.parsed.type` 分派：
  - `tool_use`：工具名（mono）+ 关键参数摘要（有 `file_path`/`command`/`pattern` 等取一个显示）
    + 状态点（`step.result` 成功/失败、无 result = 运行中）。点击可展开看完整 input + result 片段
    （局部 state，复用 `ToolPair` 的视觉但**不复用组件**，因为 `ToolPair` 依赖 chat-ui 的
    `expandedToolBodies` 全局 state，trace 里用局部 state 更干净）。
  - `assistant_text`：纯文本行（截断 + 可展开）。
  - `thinking`：折叠成一行 "思考" + 灰色斜体预览（空 thinking 直接跳过，同 `AssistantMessage`）。
  - `result`：完成横幅（duration + result 摘要）。
  - `permission_request`：一行 "请求批准：{tool_name}"（只读，不放按钮）。
  - 其它/`system`：一行系统说明。
- 行内显示该 step 的时间（`created_at` 的 HH:MM:SS）。

## 4. 数据流图

```
点击头像 (AssistantMessage button)
  └─> openTrace(taskId, agentId)  [chat-ui store: traceAgentId = agentId]
        └─> AgentTraceModal (挂在 ChatPane, 单例) 监听 traceAgentId
              ├─ useWorkspaceAgents(wsId) → agent 名字/handle/颜色
              └─ useAgentTrace(taskId, traceAgentId)
                    ├─ useTaskMessages(taskId)     [已有缓存]
                    ├─ tasks.runs query            [已有缓存]
                    ├─ filter by author_agent_id
                    ├─ pairToolMessages(子集)
                    ├─ 去 consumed + system-noise
                    └─ group by task_run_id, 排序
                          └─> groups → TraceRunSection[] → TraceStep[]
```

## 5. Mount 点

`AgentTraceModal` 挂在 `components/task-detail/ChatPane.tsx`（已渲染一次，持有 `wsId`+`taskId`）。
**不**挂在 `AssistantMessage`（虚拟列表里会有 N 个实例且被 virtualizer 回收）。

## 6. 测试

遵循 `lib/**` 80% 覆盖门槛 —— 把可测逻辑放进 `lib/`/`hooks/` 纯函数：

- **`hooks/useAgentTrace`**（或抽出的纯函数 `lib/chat/build-agent-trace.ts` 便于单测）：
  - 按 agent 过滤正确。
  - 按 run 分组、组内按 seq 排序、组间排序正确。
  - tool_use ↔ tool_result 配对，consumed 的 result 不单独成 step。
  - `task_run_id == null` 归入 "未关联运行" 组且排最后。
  - run 元信息查不到 → `run: null` 但仍成组。
  - system-noise 被过滤。
  - 空输入 / agentId null → 空 groups。
- **`lib/chat/system-noise.ts`**（抽出的共享判断）单测。
- **组件测**（Testing Library）：
  - `AssistantMessage` 头像 click 调用 `openTrace`（mock store）。
  - `AgentTraceModal` 空状态、渲染 groups。
  - `TraceStep` 各 `parsed.type` 分派渲染。

## 7. 实施顺序

1. `lib/chat/system-noise.ts`（抽出 + `MessageList` 改用）+ 测试。
2. `lib/chat/build-agent-trace.ts` 纯函数 + 测试。
3. `hooks/useAgentTrace.ts`（薄封装纯函数 + 两个 query）。
4. `lib/store/chat-ui.ts` 加 `traceAgentId` + actions + 测试。
5. `TraceStep.tsx` → `TraceRunSection.tsx` → `AgentTraceModal.tsx`。
6. `MessageItem.tsx` / `AssistantMessage.tsx` 接线（头像 button + agentId 透传）。
7. `ChatPane.tsx` 挂载 modal。
8. 跑 `pnpm typecheck && pnpm lint && pnpm test`。

## 8. 风险 / 注意

- **虚拟列表回收**：头像在 virtualizer 内，但 click → store action 是即时的，modal 在外层，
  回收不影响。✅
- **wire-format**：`Message.content` 是 base64 JSON，但 `useTaskMessages` 返回的已是
  `ClientMessage`（含 `parsed`），trace 直接用 `parsed`，不碰 codec。✅
- **`tool_use_id` 唯一性**：card 内唯一，按 agent 子集配对安全。✅
- **run 轮询**：`tasks.runs` 在 `useActiveRuns` 里 5s 轮询；trace 复用缓存，run 状态会自动刷新。
  modal 打开期间 run 状态变化会反映出来。✅
```
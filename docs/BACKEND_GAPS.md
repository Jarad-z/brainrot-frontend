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

## #6 `TaskCard` 响应包含未文档化的 `busy: boolean` 字段

- **状态**：schema 不一致（API.md 未列出）
- **发现**：2026-05-16，S1 manual QA 阶段
- **影响**：前端 `lib/api/types.ts` 没声明 `busy`，TS 允许（响应是 superset）但读 `busy` 字段时无类型支持。
- **Workaround（S1）**：不读 `busy`；S2 聊天阶段引入时再加入类型。
- **Need**：API.md 在 TaskCard schema 加 `busy: boolean` 字段说明（是否有 active run）。

## #7 `POST /api/v1/auth/login` 返回 200 + 明文 token 而不是 204 + 仅 cookie

- **状态**：schema 不一致 + 潜在安全问题（API.md 写 204，HttpOnly cookie-only；实际 200 + `{"token":"..."}` 响应体）
- **发现**：2026-05-16，S1 manual QA 阶段
- **影响**：
  - 前端 `apiFetch<void>` 应当对 204 返回 undefined；现在 200 + JSON 走 `resp.json()` 路径，返回的 token 值被丢弃 —— 工作但语义错。
  - **安全顾虑**：明文 token 出现在响应体里，违背 HttpOnly cookie-only 的设计意图。任何能读 `/login` 响应的中间层（浏览器扩展、devtools、proxy log）都能拿到这个 token。如果后端也把它作为 cookie 设置了（应当如此），那 token 是双发，体内那份是冗余的；如果没设 cookie 而是希望前端自己存，那 HttpOnly 的承诺没兑现。
- **Workaround（S1）**：当前能跑通（cookie 看起来是设上了，因为后续 `/me` 用 cookie 验证通过）。前端忽略响应体 token。
- **Need**：后端确认 token 是否同时通过 `Set-Cookie` 落地。如果是 → 删除响应体的 token（与 API.md 对齐）；如果不是 → 改设 HttpOnly cookie 并删响应体 token。无论哪个分支，API.md 都要更新成实际行为。

## #8 缺 `GET /api/v1/tasks/{taskId}/messages?before=<created_at>&limit=N` 分页

- **状态**：缺失（API.md 标 TODO）
- **发现**：2026-05-16，S2 设计阶段
- **影响**：长任务（>1000 条消息）首次进入会全量拉一次。S2 实测 200 条量级跑得动。
- **Workaround（S2）**：全量拉，react-virtual 惰性渲染。
- **Need**：cursor-based 分页，response 加 `next_cursor` 字段。

## #9 缺 `GET /api/v1/tasks/{taskId}/artifacts`

- **状态**：缺失
- **发现**：2026-05-16，S2 设计阶段
- **影响**：任务详情页右栏"产出"tab 无数据可拉。
- **Workaround（S2）**：右栏 artifacts tab 显示 placeholder（EmptyState "S3 上线后启用"）。
- **Need**：`GET /api/v1/tasks/{taskId}/artifacts` → `Artifact[]`。

## #10 缺 `GET /api/v1/projects/{projectId}/assets`

- **状态**：缺失
- **发现**：2026-05-16，S2 设计阶段
- **影响**：任务详情页右栏"素材"tab 无数据可拉。
- **Workaround（S2）**：右栏 assets tab 显示 placeholder（EmptyState "S3 上线后启用"）。
- **Need**：`GET /api/v1/projects/{projectId}/assets` → `Asset[]`。

## #11 缺 `GET /api/v1/tasks/{taskId}/approvals`

- **状态**：缺失（S2 实际**未阻塞**，审批历史从 messages filter 派生）
- **发现**：2026-05-16，S2 设计阶段
- **影响**：S3 做跨 task/跨工作区审批 hub 时需要此 endpoint。S2 仅作记录。
- **Workaround（S2）**：`useApprovalsHistory(taskId)` 从 `useTaskMessages(taskId)` 过滤 `permission_request` 类消息。
- **Need**：`GET /api/v1/tasks/{taskId}/approvals` → `ApprovalRequest[]`。

## #12 `permission_request` 消息 payload schema 未明确

- **状态**：schema 不完整（API.md 仅列 `tool_use_id` + `tool_name`）
- **发现**：2026-05-16，S2 设计阶段
- **影响**：前端渲染 ApprovalCard 需要 `approval_id`、`tool_input`、`expires_at` 才能完整工作（按钮决策路由、倒计时、命令摘要）。
- **Workaround（S2）**：`lib/parse-message.ts` 把这三个字段标 optional；前端按 `approval_id ?? tool_use_id` 兜底 key。`tool_input` 缺失时显示 "(无参数)"，`expires_at` 缺失时不显示倒计时。
- **Need**：后端确认消息 payload 是否含这三个字段；API.md 更新 `permission_request` 行的 "关键字段" 列。

## #13 `TaskCard` schema 缺 `agents` 字段（任务关联的 agent 列表）

- **状态**：缺失 / 待 mock
- **发现**：2026-05-17，S2 visual acceptance 阶段
- **影响**：任务详情页左栏 TaskRow + 项目板 TaskCard 都无法显示"这个 task 关联了哪些 agent"。Prototype `screenshots/13` 的每个 task row 底部都有一组 agent 头像（mock 数据），S2 实际渲染没有 → 视觉差异。
- **Workaround（S2）**：完全不渲染 agent 头像组。spec §10 + visual acceptance 报告 §6.2 都明确说明此差异由 schema 缺失引起，不是前端疏漏。
- **Need**：`TaskCard` schema 加 `agents: string[]`（agent uuid 数组）或 `agent_ids: string[]`。后端 mock 阶段：每个 task 至少关联 1-3 个 agent，让前端能渲染出 2-3 个头像的视觉密度（匹配 prototype）。
- **前端 unlock 路径（≤5 行）**：拿到字段后，`components/task-detail/TaskRow.tsx` 加一段：
  ```tsx
  {task.agents && task.agents.length > 0 && (
    <div className="flex -space-x-1.5">
      {task.agents.slice(0, 3).map((id) => {
        const a = agentsMap.get(id);
        return a ? <Avatar key={id} name={a.name} size={18} /> : null;
      })}
    </div>
  )}
  ```
  其中 `agentsMap` 来自 `useWorkspaceAgents(wsId)` —— hook 已在 T20 实现。

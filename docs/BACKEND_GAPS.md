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

# Brainrot 前端开发文档

> 给"前端设计 + 前端工程"agent 的合并指南。
>
> - **API 细节**：见 [`API.md`](./API.md)，本文不重复 schema。
> - **后端定位 / 数据模型**：见 [`ARCHITECTURE.md`](./ARCHITECTURE.md) 与 spec。
> - **范围**：v1 Web 前端（桌面优先，移动可降级）。
> - **状态**：从零起步，本文档即权威基线。

---

## 0. 一句话产品

> 一个轻量协作式 AI 工作台：**workspace → project → 并行任务卡（task card）**；任务卡内是聊天流；用户 `@<agent_handle>` 召唤自托管的 Claude Code agent 写代码/做事；agent 的工具调用要走**人工审批**；agent 写出的文件自动落到项目"产出池"。

记住三件事——它会决定 UI 形态：

1. **任务卡是工作单元**，不是看板里的卡片占位符，而是**完整的对话 + 状态 + 产物容器**。
2. **多 agent 并行**：一张任务卡里可以 @ 多个 agent，每个 @ 触发一个独立 run；同 agent 在同卡内有 active run 时，新消息会被**排队**（后端打 `metadata.queued=true`，UI 要显示"排队中"）。
3. **审批是一等公民**：agent 跑工具（写文件、运行命令）需要用户点"批准/拒绝"，**1 小时**不决定会超时并失败 run。UI 必须把 pending 审批做成**显眼、阻塞性**提示，否则用户会丢任务。

---

## 1. 技术栈

| 维度 | 选型 | 理由 |
|---|---|---|
| 框架 | **Next.js 15（App Router）+ React 19** | 客户端密集（WS / 长聊天流），App Router 用于布局复用、route group 区分公开/受保护页 |
| 渲染 | **客户端为主**（`"use client"`），少量 SSR | Cookie session + WS 强依赖浏览器；SSR 仅用于公开页（登录/注册）和首屏壳 |
| 语言 | TypeScript 严格模式 | `strict: true`、`noUncheckedIndexedAccess: true` |
| 样式 | **Tailwind CSS v4** + CSS variables（主题） | 与 shadcn/ui 生态契合；变量化便于深/浅色切换 |
| 组件库 | **shadcn/ui**（Radix 基底）+ lucide-react 图标 | 可拷贝、可改、可裁剪，无 runtime 锁定 |
| 服务端状态 | **TanStack Query v5**（@tanstack/react-query） | REST 缓存 + 失效；WS 事件通过 `queryClient.setQueryData` 增量打补丁 |
| 客户端状态 | **Zustand**（一个 store 即可） | 仅放：当前 ws/project/task 选择、WS 连接状态、未读计数 |
| 表单 | React Hook Form + Zod | 类型安全 + 一份 schema 兼前后端校验 |
| 富文本 | 聊天输入：**Tiptap**（仅 mention 扩展）；消息渲染：**react-markdown** + `remark-gfm` + `rehype-highlight` | mention 弹层是核心 UX，react-markdown 处理 agent 输出的 markdown / 代码块 |
| 日期 | `date-fns`（按需 import） | 体积小 |
| 测试 | Vitest + @testing-library/react；E2E 用 Playwright | 与后端 e2e 风格一致 |
| 包管理 | pnpm | monorepo 友好（未来若拆 packages） |

**不要引入**：Redux、MobX、SWR（已选 TanStack Query）、Material UI、Ant Design、emotion、styled-components、moment.js。

---

## 2. 目录结构

```
web/
├── app/
│   ├── (public)/                  # 未登录可见
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (app)/                     # 受保护，layout 里强制校验 session
│   │   ├── layout.tsx             # 三栏壳：侧栏 + 内容区
│   │   ├── page.tsx               # 跳转到最近一个 workspace
│   │   │
│   │   ├── w/[wsId]/
│   │   │   ├── layout.tsx         # 注入 ws 上下文 + 项目列表
│   │   │   ├── page.tsx           # 工作区首页：项目网格
│   │   │   ├── settings/page.tsx  # 工作区设置（成员、agent、runtime）
│   │   │   ├── agents/
│   │   │   │   ├── page.tsx       # agent 列表
│   │   │   │   └── new/page.tsx
│   │   │   └── p/[projectId]/
│   │   │       ├── layout.tsx     # 注入 project 上下文 + 任务列表
│   │   │       ├── page.tsx       # 项目看板（任务卡列表）
│   │   │       ├── assets/page.tsx
│   │   │       ├── artifacts/page.tsx
│   │   │       └── t/[taskId]/page.tsx   # 任务卡详情（聊天流主舞台）
│   │   │
│   │   └── approvals/page.tsx     # 跨项目的全部 pending 审批
│   │
│   └── api/                       # 仅用于 Next 自身需要，禁止业务代理
│
├── components/
│   ├── ui/                        # shadcn/ui 原件（generated）
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── MessageItem.tsx        # 根据 parsed.type 派发到子组件
│   │   ├── parts/
│   │   │   ├── UserMessage.tsx
│   │   │   ├── AssistantText.tsx
│   │   │   ├── ToolUse.tsx
│   │   │   ├── ToolResult.tsx
│   │   │   ├── Thinking.tsx
│   │   │   ├── PermissionRequest.tsx
│   │   │   └── ResultBanner.tsx
│   │   ├── Composer.tsx           # Tiptap + mention 弹层
│   │   └── MentionList.tsx
│   ├── approvals/
│   │   ├── ApprovalCard.tsx
│   │   └── ApprovalDrawer.tsx
│   ├── tasks/
│   │   ├── TaskCard.tsx           # 看板用小卡片
│   │   ├── TaskStatusBadge.tsx
│   │   └── TaskHeader.tsx         # 详情页头
│   ├── nav/
│   │   ├── WorkspaceSwitcher.tsx
│   │   ├── Sidebar.tsx
│   │   └── PresenceIndicator.tsx  # runtime online/offline 灯
│   └── common/
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       └── ConfirmDialog.tsx
│
├── lib/
│   ├── api/                       # fetch 封装
│   │   ├── client.ts              # api(url, init) 基础函数
│   │   ├── auth.ts                # login/register/me/logout
│   │   ├── workspaces.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   ├── messages.ts
│   │   ├── approvals.ts
│   │   ├── agents.ts
│   │   └── assets.ts
│   ├── ws/
│   │   ├── client.ts              # WebSocket 类（重连+订阅去重）
│   │   ├── provider.tsx           # React Context
│   │   └── handlers.ts            # 事件 → queryClient 补丁
│   ├── codec.ts                   # base64 → JSON 解码（content/metadata/tool_input）
│   ├── parse-message.ts           # Message → ParsedMessage 联合类型
│   ├── mention-parse.ts           # 输入框 @handle → mentions[]
│   ├── format.ts                  # 时间/字节/相对时间
│   └── store.ts                   # Zustand store
│
├── hooks/
│   ├── useSession.ts
│   ├── useWorkspaces.ts
│   ├── useTask.ts
│   ├── useMessages.ts             # 内含分页 + WS 增量合并
│   ├── usePendingApprovals.ts
│   └── useRuntimes.ts             # 维护 ws/proj 级 runtime 在线集合
│
├── styles/
│   └── globals.css                # Tailwind + CSS 变量
│
└── public/
    └── ... (静态资源)
```

> Next.js 项目根放在仓库的 `web/` 目录下，与现有 Go 后端（`cmd/`、`internal/`）平行。`pnpm dev` 起前端，后端单独跑（默认 `http://localhost:8080`）。

---

## 3. 信息架构

### 3.1 主导航层级

```
App
└─ Workspace (顶级切换；用户可属于多个 ws)
   ├─ Projects                ← 工作区首页
   │  └─ Project
   │     ├─ Tasks (Board)     ← 项目首页，任务卡瀑布/网格
   │     │  └─ Task           ← 详情，聊天流主舞台
   │     ├─ Assets            ← 项目级素材池
   │     └─ Artifacts         ← agent 自动产物
   ├─ Agents                  ← 工作区级 agent 定义（@handle、提示词、模型、MCP）
   ├─ Runtimes                ← daemon 列表 + install-token 签发
   └─ Settings                ← 成员、role、危险操作
```

**跨工作区入口**（在最外层固定位置）：

- `/approvals` —— 我所有 pending 审批（避免漏审批超时）
- 账户 dropdown（个人信息、登出）

### 3.2 三栏壳（受保护区域 layout）

```
┌─────────┬──────────────────────────────────────────────────────────┐
│         │  顶栏  Workspace 名 · 面包屑 · 全局搜索(可选) · 审批徽章 · 头像  │
│ 侧栏    ├──────────────────────────────────────────────────────────┤
│         │                                                          │
│ Logo    │                                                          │
│ ─────   │                                                          │
│ WS切换  │                内容区（按路由切换）                       │
│         │                                                          │
│ Projects│                                                          │
│  - 项目1│                                                          │
│  - 项目2│                                                          │
│ ─────   │                                                          │
│ Agents  │                                                          │
│ Runtimes│                                                          │
│ Settings│                                                          │
└─────────┴──────────────────────────────────────────────────────────┘
```

- **侧栏宽度** 240px，可折叠到 56px（icon-only）。
- **顶栏 Pending 审批徽章**：右上角，红点 + 数字；点击进 `/approvals`。
- **面包屑**：`Workspace › Project › Task #标题`，每段可点击。

### 3.3 任务卡详情（最复杂的页面，独立设计）

任务详情是用户停留时间最长的页面，按**三区**布局（桌面 ≥1280px）：

```
┌─────────────────────────────────────────────────────────────────────┐
│ 任务头  标题 · 状态切换 · @参与 agent 头像组 · 取消运行 · 更多       │
├──────────────────────────────────────────┬──────────────────────────┤
│                                          │  右侧面板（可隐藏）       │
│           聊天流 MessageList              │  ───────────────────     │
│                                          │  Tab: 产物 | 素材 | 审批  │
│   [user] @writer 请草拟开场白             │                          │
│   [thinking] (折叠的思考块)               │  - 这张卡产生的 artifact  │
│   [assistant] 这是开场白……                │  - 项目级 asset 可拖入    │
│   [tool_use] Write file: draft.md         │  - 此 run 历史审批       │
│     ┌── tool_result: ok                   │                          │
│   [permission_request] 批准/拒绝          │                          │
│   [result] 完成 · 12.4s                   │                          │
│                                          │                          │
├──────────────────────────────────────────┴──────────────────────────┤
│ Composer  [Tiptap 输入框 with @mention 弹层]    [发送] [Ctrl+Enter] │
└─────────────────────────────────────────────────────────────────────┘
```

- **`<1280px`** 时右侧面板变 drawer（点产物 icon 抽出）。
- **`<768px`** 时聊天流和 Composer 全宽，任务头折叠成单行。
- **永远显示**："谁在思考"指示器：当某 agent 有活跃 run，头像旁加脉冲点 + 在输入框上方贴一条 "@writer is thinking…"；run 完成后消失。

---

## 4. 聊天流渲染规范

> 这是产品的核心 UX，不要省。

### 4.1 消息类型 → 视觉映射

`Message.content` 是 base64 编码的 JSON，解码后按 `parsed.type` 派发（见 `API.md` "消息内容"表）。

| `parsed.type` | 容器 | 视觉 | 默认折叠 |
|---|---|---|---|
| 缺省（user） | 右对齐气泡 / 或左对齐带头像（统一左对齐更清晰，推荐左对齐） | 蓝色边或柔和底色 | 否 |
| `assistant_text` | 左对齐，agent 头像 + handle | 主文本块，markdown 渲染，代码块 highlight | 否 |
| `thinking` | 嵌入在 assistant 块内或独立卡 | 灰色斜体 + 折叠器（默认收起，点击展开） | **是** |
| `tool_use` | 卡片样式：`> 工具图标 tool_name` | 显示工具名 + 输入摘要（折叠 JSON） | 输入折叠，标题展开 |
| `tool_result` | 紧贴对应 `tool_use` 下方（用 `tool_use_id` 配对） | 成功绿底 / 失败红底；长输出可折叠 | 输出 >10 行时折叠 |
| `permission_request` | **高亮卡片**（黄色边） | 显示工具名、参数、批准/拒绝按钮、note 输入 | 否，最显眼 |
| `system` | 极简灰色一行 | "Session started"等元信息 | 否 |
| `result` | 分隔线 + 摘要徽章 | "Done · 12.4s · 5 tools used" | 否 |
| `rate_limit_event` | 警告条 | "Rate limit hit, retrying in 30s" | 否 |

**配对 `tool_use` ↔ `tool_result`**：用 `payload.tool_use_id` 关联，渲染时把 result 缩进/嵌套在对应 use 下面，形成树状视觉。如果 result 还没到，显示骨架占位 + "running…"。

### 4.2 流式增量渲染

- **历史走 REST**：`GET /api/v1/tasks/{task_id}/messages`（注意：API.md 老版本未列出此接口，但路由已存在；用它拉历史 + 分页）。
- **增量走 WS**：订阅 `task` scope 后，`message.appended` 事件持续追加。
- agent 消息会带 `seq`，**按 seq 排序**插入；同一条消息 `id` 的多次更新以最新 `content` 为准（dedupe by `id`）。
- 渲染长聊天流用**虚拟化列表**（推荐 `@tanstack/react-virtual`）。
- 自动滚到底：仅当用户**当前已贴底**时；如果用户向上翻看历史，显示"有新消息 ↓"浮标，点了再滚。

### 4.3 @mention 输入

- Composer 是 Tiptap（仅核心扩展 + Mention 扩展），不需要其他富文本能力。
- 输入 `@` 弹出当前 workspace 的 agent 列表（按 handle 过滤），上下键 + Enter 选择。
- 提交时把所有 mention 节点转成 `mentions: agent_id[]`，纯文本拼回 `text`。
- 校验：至少 @ 一个 agent 才能触发；否则消息只入库不产生 run（按需，可让用户写纯笔记）。
- **排队提示**：发送后如果后端返回的 `message.metadata` 含 `queued: true`，在该消息上挂 "排队中" 徽章。

---

## 5. 实时（WebSocket）接入

### 5.1 单连接模型

整个 SPA **只开一条 `/ws`**，由顶层 `WSProvider` 持有，订阅按需增删。

```ts
// lib/ws/client.ts —— 关键不变量
class WSClient {
  // 1. 自动重连（指数退避，1s → 2s → 4s ... 上限 30s）
  // 2. 重连后必须重发所有当前订阅
  // 3. 不主动发 ping（后端 45s 心跳）
  // 4. onMessage 分发到 handlers.ts
}
```

### 5.2 订阅生命周期

订阅消息的**线协议**是 `{type:"subscribe", scope:"<name>", id:"<uuid>"}` 三字段对象，其中 `scope` 只能是字面量 `"workspace"` / `"project"` / `"task"`（**不是**拼好的字符串）。`unsubscribe` 同形。

| 页面 | 需要订阅 |
|---|---|
| Workspace 首页 | `{scope:"workspace", id: wsId}` |
| Project 首页 | 上面 + `{scope:"project", id: projectId}` |
| Task 详情 | 上面 + `{scope:"task", id: taskId}` |

进入页面 useEffect 订阅，**离开时 unsubscribe**。多页面共用 hub，引用计数避免重复订阅。

### 5.3 事件 → TanStack Query 失效/打补丁

| WS event | 处理 |
|---|---|
| `task.created` / `task.updated` | `queryClient.setQueryData(['tasks', projectId], (old) => merge(old, payload.task))` |
| `message.appended` | 把消息 append 到 `['messages', taskId]` 缓存；若已存在 `id` 则替换 |
| `run.completed` | 关 "thinking" 状态；触发 `['tasks', projectId]` 失效（状态可能改） |
| `approval.requested` | append 到 `['approvals', 'pending']`；如果当前不在该 task 页，弹 toast + 红点徽章+1 |
| `approval.decided` | 更新该 approval；如对应消息是 `permission_request`，把按钮换成结果 |
| `asset.added` / `artifact.added` | `setQueryData` 注入；若用户在对应 tab，骨架闪一下即可 |
| `runtime.online` / `runtime.offline` | 更新 `useRuntimes` 集合；agent 卡片上的"runtime 在线"灯切换 |

**乐观更新策略**：发消息走乐观插入（带 `tempId`），WS 回包到达时按 `task_card_id + role + content hash` 协调；不要等 HTTP response 再渲染。

---

## 6. 认证 & 路由保护

- Cookie 是 **HttpOnly** —— 前端读不到 token，**只能靠 `GET /api/v1/me`** 判断是否登录。
- `(app)/layout.tsx` 是 client component，在挂载时 `useSession()` 调用 `/me`，401 则 `router.replace('/login?next=...')`。
- 所有 fetch **必须** `credentials: 'include'`，封装到 `lib/api/client.ts` 默认带上。
- 跨域：开发期 Next 端口（`3000`）和 server（`8080`）不同源。**后端已配 CORS**（见 `cmd/server/router.go` `corsWrap`：`Access-Control-Allow-Origin: http://localhost:3000` + `Allow-Credentials: true`），cookie 走 `SameSite=Lax`。生产同源不需要 CORS。
- 如要换端口或部署到非 `localhost:3000`，需要后端 `corsWrap` 同步更新允许的 Origin。
- 也可以选择走 Next rewrites 代理 `/api/*` 和 `/ws` 到 `:8080` 把两者归一到同源（避免任何 CORS 边界问题）：

  ```ts
  // next.config.ts
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:8080/api/:path*' },
      { source: '/ws',         destination: 'http://localhost:8080/ws' },
    ];
  }
  ```

---

## 7. 错误处理 & 状态展示

- API 错误是 **`text/plain` 状态码**（不是 JSON envelope）。`api()` 封装时把 `!resp.ok` 抛 `ApiError { status, message }`。
- TanStack Query 全局 `onError`：401 → 登出跳登录；403/404 → 内联 EmptyState；5xx → toast + 重试按钮；其他 → 内联红条。
- **空态**统一组件 `<EmptyState icon title description action />`，覆盖：无工作区、无项目、无任务、无消息、无审批、无产物。
- **加载态**：列表用 skeleton（≥3 行），详情页骨架顶到底；不要用 spinner 占整屏。
- **离线态**：WS 断开 >5s 顶部贴一条警告条 "实时连接已断开，正在重连…"；恢复后消失。

---

## 8. 视觉设计基线

### 8.1 颜色（CSS variables）

走"中性 + 强调色 + 角色色"三层。

```css
:root {
  /* 中性 */
  --bg:          oklch(99% 0 0);
  --surface:     oklch(97% 0 0);
  --border:      oklch(92% 0 0);
  --text:        oklch(20% 0 0);
  --text-muted:  oklch(50% 0 0);

  /* 强调（品牌） */
  --accent:      oklch(62% 0.18 265);   /* 紫蓝 */
  --accent-fg:   oklch(99% 0 0);

  /* 角色 */
  --role-user:      oklch(95% 0.02 240);
  --role-agent:     oklch(96% 0.015 150);
  --role-tool:      oklch(96% 0.02 60);
  --role-thinking:  oklch(94% 0 0);
  --role-approval:  oklch(95% 0.12 80);  /* 黄系，最显眼 */

  /* 语义 */
  --success: oklch(60% 0.15 150);
  --warning: oklch(70% 0.16 80);
  --danger:  oklch(58% 0.20 25);
}

[data-theme="dark"] {
  --bg:          oklch(15% 0 0);
  --surface:     oklch(20% 0 0);
  --border:     oklch(28% 0 0);
  --text:        oklch(95% 0 0);
  --text-muted:  oklch(65% 0 0);
  --accent:      oklch(72% 0.18 265);
  /* ... 其余按需调 */
}
```

- 默认跟随系统 (`prefers-color-scheme`)，用户可手动切换并持久化到 localStorage。
- **不要硬编码颜色**，永远走变量。

### 8.2 字号 / 节奏

| token | px | 用途 |
|---|---|---|
| `text-xs` | 12 | 元信息、时间戳 |
| `text-sm` | 14 | 正文、按钮 |
| `text-base` | 16 | 长文本、聊天消息 |
| `text-lg` | 18 | 卡片标题 |
| `text-xl` | 20 | 页面 H2 |
| `text-2xl` | 24 | 页面 H1 |

- 行高 1.5（正文）/ 1.25（标题）。
- 字体：UI 用系统 stack（`-apple-system, Segoe UI, ...`）；代码块用 `ui-monospace, SF Mono, Menlo`。

### 8.3 间距 / 圆角 / 阴影

- Tailwind 默认 spacing 即可，主用 `2/3/4/6/8`。
- 圆角：卡片 `rounded-xl`（12px），按钮 `rounded-md`（6px），气泡 `rounded-2xl`（16px）。
- 阴影：仅在浮层（dropdown、dialog、toast）使用 `shadow-lg`；列表卡片走 `border` 而非 shadow。

### 8.4 图标

`lucide-react` 全局统一，尺寸 16/20/24 三档；不要混用多套图标库。

### 8.5 关键组件视觉对照

```
[user message]
  ┌─ Alice · 14:32 ──────────────────────────┐
  │ @writer 请草拟一段开场白                  │
  └───────────────────────────────────────────┘

[assistant message]
  ┌─ 🤖 writer · 14:32 · run#a1b2 ───────────┐
  │ 这是草拟的开场白……                         │
  │ ```ts                                      │
  │ const hello = "world";                     │
  │ ```                                        │
  └───────────────────────────────────────────┘

[tool_use]
  ┌─ 🔧 Write · 14:32 ────────────────── [▾] ┐
  │ file_path: D:/draft.md                    │
  └───────────────────────────────────────────┘
    └─ [tool_result · ok · 0.4s] ✓

[permission_request]
  ┌─ ⚠ Bash 请求批准 ────────────────────────┐
  │ command: rm -rf node_modules              │
  │ [批准]  [批准并修改]  [拒绝]              │
  │ 备注: ____________________                 │
  │ 还剩 58:21 决策                           │
  └───────────────────────────────────────────┘
```

---

## 9. 关键交互细节（容易做错的）

1. **Base64 内容**：`Message.content`、`Message.metadata`、`Agent.custom_env/custom_args/mcp_config`、`ApprovalRequest.tool_input` 全是 base64 JSON。在 `lib/codec.ts` 统一 `decodeJSON<T>(b64)`，**绝不在组件里 inline `atob`**。
2. **EnqueuedRun 是 PascalCase**：`{RunID, AgentID, RuntimeID}`，而其他对象是 snake_case。类型定义里别搞混。
3. **没有"列工作区""列 runtime"接口**：v1 这两个接口暂缺。前端启动时如果没有 `wsId`，先尝试从 localStorage 拿最近选择，没有就引导用户新建。Runtime 列表靠 `runtime.online/offline` WS 事件维护（注意：刷新页面后初始集合为空，需要后端补 `GET /workspaces/{wsId}/runtimes` 才能有正确初值——前端可以先按"未知 → 收到 online 才显示在线"渲染，并在 README 里标 TODO）。
4. **审批超时**：每条 pending 审批有 `expires_at`，UI 倒计时显示；客户端时钟和服务器有偏差时**以 `expires_at` 为准**（不要本地累加）。
5. **取消 run**：`POST /tasks/{id}/cancel-run` 只取消**当前活跃 run**，排队中的下一个会自然顶上来——UI 要提示用户"这只取消当前 run，排队的 @writer 还会跑"。
6. **同 agent 排队**：判断"是否排队"的**唯一可靠信号**是发送响应里 `message.metadata`（base64 解码后）含 `queued: true`——这表示此用户消息因目标 agent 已有 active run 被延后；它会在当前 run 结束后被自动晋升触发。`runs` 字段总是会带上被 mention 的 agent，**不能用 runs 长度判断**。
7. **资产上传**：`multipart/form-data`，单文件 100MB 上限；超限后端返 413，UI 要在选文件时本地预检。
8. **登出**：`POST /auth/logout` 后**清空所有 TanStack Query 缓存**（`queryClient.clear()`）+ 关闭 WS + Zustand reset。否则下个用户登录后会闪一下前一个用户的数据。

---

## 10. 可访问性 & 国际化

- 所有交互元素键盘可达，焦点环（`focus-visible:ring`）保留。
- 颜色对比度 ≥ WCAG AA（4.5:1 文本，3:1 大字号/UI 元素）。
- 文案中英双语：默认中文（项目用户主要是中文），但代码常量、状态名（`open` / `in_progress` 等）保留英文。i18n 用 `next-intl`（轻量、App Router 友好），如果一期只做中文，至少把字面量集中到 `lib/messages.ts` 便于后续迁移。
- 聊天流朗读：`aria-live="polite"` 容器仅在新消息追加时通知，**不要**用 `assertive`（会打断屏幕阅读器）。

---

## 11. 性能要求

| 场景 | 目标 |
|---|---|
| 首屏 LCP（受保护页） | < 1.5s（本地后端） |
| 进入任务详情到首条消息可见 | < 400ms |
| 长聊天流（1000+ 条）滚动 FPS | ≥ 55 |
| WS 事件到 DOM 更新 | < 50ms |
| Bundle 初始 JS（gzip） | < 300KB |

手段：

- 路由级代码分割（Next 默认按 route 切包）。
- 聊天流用虚拟列表。
- Markdown / highlight 用 `lazy()` 延迟加载（点开 thinking 时再载）。
- `next/image` 处理头像；agent 头像 fallback 用 initials（不要 404 占位图）。

---

## 12. 测试

- **单元**：`lib/*` 全覆盖（codec、parse-message、mention-parse），目标 90%+。
- **组件**：消息渲染分支（每种 `parsed.type` 一个 story + test）。
- **集成**：用 MSW mock REST + WS，跑核心流程：登录 → 选 task → 发消息 → 收 assistant → 审批 → run 完成。
- **E2E**：Playwright 起真后端 + 真 daemon（与 `test/e2e/` 同环境），覆盖端到端 1 条 happy path 即可，其他用 MSW 假数据。

---

## 13. 上线/部署

- 与 Go 后端**同源**部署：`server.exe` 静态托管 `web/.next/standalone`（或 Caddy/Nginx 反代两者到同域），消除 CORS。
- 静态资源走 CDN（可选）；`/api/*` 和 `/ws` 永远直连后端。
- 环境变量：
  - `NEXT_PUBLIC_API_BASE`（生产留空表示同源）
  - `NEXT_PUBLIC_WS_PATH=/ws`

---

## 14. 阶段拆解（建议交付节奏）

**M1 · 骨架可登录（1 周）**
- 路由壳、登录/注册、`/me`、Zustand、TanStack Query 基础设施、Tailwind/shadcn 接入。

**M2 · 工作区 → 项目 → 任务卡浏览（1 周）**
- 工作区切换、项目列表、任务卡列表（只读）、空态、错误态。

**M3 · 聊天流 + 发消息（2 周，核心）**
- Composer + @mention、消息分类渲染（含 thinking/tool/result）、WS 接入与增量、流式滚动。

**M4 · 审批 + run 控制（1 周）** — ✅ S3 已完成（2026-05-17，branch `s3-approvals`）
- 审批卡片、`/approvals` 总览（hub 模式）、取消 run（5s cooldown + 二次确认）、超时倒计时（disabled + "已超时" 占位）。
- 排队提示因 BACKEND_GAPS #18 暂未做 — cancel-run dialog 文案承认了"取消后排队消息会卡住"。
- 跨 ws 全局 count 推 S4（虽然 backend 已实现 `GET /me/pending-approvals?count_only=1` 在 #11/#14 一并，但 ws-switcher UI 还在 S4 范围内）。

**M5 · 素材 / 产物 / agent 管理（1 周）** — ⚙️ S4 已完成（2026-05-18，branch `s4-workspace-mgmt`）

- ✅ workspace switcher dropdown + 创建工作区（modal）— sidebar 切换器解锁，登录后按 `localStorage.lastWsId` 智能落地
- ✅ 跨 ws bell badge + 顶层 `/approvals` hub — bell 按当前路由 scope 智能跳转单 ws 或全局 hub
- ✅ agent CRUD（new / edit / archive，按钮文案"归档"+ 默认隐藏 + "显示已归档" toggle）— 三个 jsonb 字段的 base64 wire 非对称由 `lib/api/agents-encoding.ts` 统一边界处理（见 BACKEND_GAPS #21）
- ✅ `/w/[wsId]/runtimes` 列表 + 一次性 install-token modal（token 不入 React Query 缓存）
- ✅ `/w/[wsId]/settings`：基本信息 + 我的 user ID + 添加成员（按 UUID）+ 危险操作占位
- 文件上传 UX（asset 上传 / artifact 排除标记）→ S5
- 改 ws 元信息 / 列成员 / 移除成员 / 改 role / 归档 ws / 按 email 邀请 → S5 阻塞于 BACKEND_GAPS #19/#20

**M6 · 打磨**
- 深色主题、键盘快捷键、虚拟列表、E2E、可访问性扫描。

---

## 15. 给前端 agent 的工作守则

1. **先读 `API.md`**，再开始 UI；schema 没疑问再动手。
2. **base64 解码统一走 `lib/codec.ts`**，别每处 inline。
3. **每加一个 fetch，先定义 TanStack Query key**：`['workspaces']` / `['projects', wsId]` / `['tasks', projectId]` / `['messages', taskId]` / `['approvals', 'pending']`。统一 key 工厂在 `lib/api/keys.ts`，禁止散落字符串。
4. **WS 事件处理只能改 query 缓存**，不要在事件回调里直接 setState 业务数据。
5. **不要 SSR 受保护页**——它们依赖 Cookie session 和 WS，硬要 SSR 会让水合复杂十倍。
6. **不要造组件库**：能用 shadcn/ui 拷一个的就拷，自己写的要先放到 `components/common/` 评审过。
7. **不要写"未来可能用到"的抽象**。三处用到再抽。
8. **每个新组件配一个故事/测试**，至少跑一遍渲染分支。
9. **提交前**：`pnpm typecheck && pnpm lint && pnpm test`。
10. **不确定就问**，特别是产品语义类（"任务卡 done 后还能 @ agent 吗？" 这类问题答案在后端，不要瞎猜）。

---

## 16. 待办 / 开放问题

- [ ] 后端补 `GET /api/v1/workspaces`（列我能进的工作区）和 `GET /api/v1/workspaces/{wsId}/runtimes`（列 daemon）。当前两者都缺；前者影响首屏导航，后者影响 runtime 在线集合初始化。`GET /api/v1/workspaces/{wsId}/agents` 已存在（API.md 漏写了，**实际可用**），前端 agent 直接调即可。
- [ ] 是否支持消息编辑/删除？v1 看起来只追加，前端先不做。
- [ ] @ 多个 agent 时的视觉：所有 run 都在同一条流里，需要不需要按 agent 分列？v1 建议**不分列**，混合按时间渲染，只在头像/名字上区分；后期再看用户反馈。
- [ ] 移动端是否进 v1？建议 v1 只做桌面响应到 768px 不崩；< 768px 显示"建议桌面使用"。
- [ ] 国际化是否进 v1？建议先全中文 + 字面量集中化，i18n 框架等需求出现再上。

# Brainrot Backend API

供前端 coding agent 使用的 HTTP + WebSocket 接口手册。所有路径以 server 监听地址为基（默认 `http://localhost:8080`）。

## 总览

| 类别 | 前缀 | 鉴权 |
|---|---|---|
| 用户 / 工作区 / 项目 / 任务卡 / 消息 / 审批 / 资产 | `/api/v1` | Cookie session（除注册/登录） |
| 实时事件（浏览器） | `/ws` | Cookie session |
| Daemon 内部接口 | `/api/daemon` | `X-Runtime-Id` + `Authorization: Bearer <runtime_secret>` |

前端**只需关心** `/api/v1` 和 `/ws`。`/api/daemon/*` 是 self-hosted Claude Code daemon 用的，前端不要直接调。

---

## 鉴权

### 注册

```
POST /api/v1/auth/register
Content-Type: application/json

{ "email": "alice@example.com", "name": "Alice", "password": "min8chars" }
```

- `201 Created` → `{ "ID": "<uuid>", "Email": "...", "Name": "..." }`
- `400` 邮箱已被占用或参数非法。

### 登录

```
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "alice@example.com", "password": "min8chars" }
```

- `204 No Content`，响应 `Set-Cookie: brainrot_session=<token>; HttpOnly; Path=/`，30 天有效。
- `401 Unauthorized` 凭据错。

> 前端 fetch 必须带 `credentials: 'include'`，否则 cookie 不会跟随。

### 当前用户

```
GET /api/v1/me           （需要 session）
```

- `200` → `{ "ID": "<uuid>", "Email": "...", "Name": "..." }`
- `401` 未登录。

### 登出

```
POST /api/v1/auth/logout
```

- `204` 清空 cookie。

---

## 工作区

### 列出我能进的工作区

```
GET /api/v1/workspaces
```

- `200` → `Workspace[]`，按 `created_at DESC`，无分页。新用户返回 `[]`。
- `401` 未登录。
- 用途：前端登录后用它决定默认 `wsId`；空数组就跳新建工作区流程。

### 单个工作区详情

```
GET /api/v1/workspaces/{ws_id}
```

- `200` → `Workspace`（不含 role）。
- `403` 调用者不是该工作区成员。

### 列出工作区的 daemon runtime

```
GET /api/v1/workspaces/{ws_id}/runtimes
```

- `200` → `AgentRuntime[]`，按 `created_at DESC`；已 `revoked` 的不返回。
- `403` 不是工作区成员。
- 用途：sidebar 显示"哪些 daemon 在线"；与 WS `runtime.online`/`runtime.offline` 事件互补，REST 给首屏初始集合。

### 创建工作区

```
POST /api/v1/workspaces
{
  "name": "My Team",
  "slug": "my-team"      // 工作区短码，全局唯一
}
```

- `201` → `Workspace`（见下方对象表）。

### 添加成员（已知 user_id）

```
POST /api/v1/workspaces/{ws_id}/members
{ "user_id": "<uuid>", "role": "editor" }   // role: "owner" | "editor" | "viewer"
```

- `204`，`403` 不是 owner，`409` 已经是成员（`ErrAlreadyMember`）。

### 按 email 邀请成员

```
POST /api/v1/workspaces/{ws_id}/invitations
{ "email": "alice@example.com", "role": "editor" }
```

- `204` 直接入会（v1 无 pending/accept 流，邀请即生效）。
- `403` 不是 owner。
- `404` 该 email 在系统里没有对应用户 — 让对方先 `/auth/register`。
- `409` 已经是成员。

### 列出成员

```
GET /api/v1/workspaces/{ws_id}/members
```

- `200` → `WorkspaceMember[]`，按 `joined_at` 升序。
- `403` 不是工作区成员。

每条字段：`workspace_id` / `user_id` / `role` / `joined_at` / `email` / `name` / `avatar_url`（`pgtype.Text` 形态 `{String, Valid}`）。

### 改成员角色

```
PATCH /api/v1/workspaces/{ws_id}/members/{user_id}
{ "role": "viewer" }
```

- `204`，`403` 不是 owner。

### 移除成员

```
DELETE /api/v1/workspaces/{ws_id}/members/{user_id}
```

- `204`，`403` 不是 owner。

### 改工作区名称 / slug

```
PATCH /api/v1/workspaces/{ws_id}
{ "name"?: "New Name", "slug"?: "new-slug" }   // 字段可选，nil = 不改
```

- `200` → `Workspace`，`403` 不是 owner，`400` slug 冲突。
- 软归档（`POST /workspaces/{ws}/archive`）尚未实现，已立项延后。

### 签发 daemon 安装 token

```
POST /api/v1/workspaces/{ws_id}/install-tokens
{}                                          // 请求体允许为空，TTL 默认 1h
```

- `201` → `{ "token": "bri_xxx...", "expires_at": "RFC3339" }`
- token 是单次使用的明文，**只在本响应里出现一次**，把它给 daemon 跑 `--register` 用。

### 列出工作区内 agent

```
GET /api/v1/workspaces/{ws_id}/agents
```

- `200` → `Agent[]`（无分页，全量返回；服务端已过滤掉 `archived=true` 的行，前端不会看到归档项）。
- `403` 不是工作区成员。

### 注册 agent（即"工作区里的一个 @handle"）

```
POST /api/v1/workspaces/{ws_id}/agents
{
  "runtime_id":   "<uuid>",      // 必填，指向已注册的 daemon
  "handle":       "writer",      // 必填，@handle 字符，工作区内唯一
  "name":         "Writer",
  "avatar_url":   "",
  "description":  "Drafts copy",
  "instructions": "You are ...", // 系统提示
  "model":        "claude-opus-4-7",
  "custom_env":   { "MY_KEY": "v" },
  "custom_args":  ["--flag"],
  "mcp_config":   { ... }        // 透传到 claude --mcp-config
}
```

- `201` → `Agent`。请求体的 `custom_env` / `custom_args` / `mcp_config` 是裸 JSON（对象/数组）。

### 单个 agent 详情

```
GET /api/v1/agents/{agent_id}
```

- `200` → `Agent`。响应里 `custom_env` / `custom_args` / `mcp_config` 已解码为对象/数组（与请求体形状对称）。
- `403` 不是工作区成员。
- `404` agent 不存在或已归档。

### 修改 agent

```
PATCH /api/v1/agents/{agent_id}
{
  "name"?:         "New",
  "avatar_url"?:   "",
  "description"?:  "",
  "instructions"?: "...",
  "model"?:        "claude-sonnet-4-6",
  "custom_env"?:   { "ANTHROPIC_API_KEY": "sk-..." },
  "custom_args"?:  ["--flag"],
  "mcp_config"?:   { ... }
}
```

- `200` → `Agent`（与 list/get 同形）。
- `403` 不是 owner / editor。
- `handle` **不可改**（保持工作区内唯一约束的稳定性）。
- 语义：字段**省略或 `null`** = 保留原值；**`{}` / `[]`** = 显式清空。注意区分。

### 归档 agent

```
DELETE /api/v1/agents/{agent_id}
```

- `204` 软删除（`archived=true`），后续 list 接口不再返回该行。
- `403` 不是工作区 owner / editor。

---

## 项目 + 任务卡

### 项目

```
POST /api/v1/workspaces/{ws_id}/projects
{ "name": "Launch Plan", "description": "..." }
→ 201 Project

GET  /api/v1/workspaces/{ws_id}/projects
→ 200 [Project, ...]

GET  /api/v1/projects/{project_id}
→ 200 Project
```

### 任务卡

```
POST /api/v1/projects/{project_id}/tasks
{ "title": "Write press release", "summary": "...", "sort_order": 0 }
→ 201 TaskCard

GET  /api/v1/projects/{project_id}/tasks
→ 200 [TaskCard, ...]

PATCH /api/v1/tasks/{task_id}
{ "status": "open" | "in_progress" | "done" | "blocked" | "archived" }
→ 204

POST /api/v1/tasks/{task_id}/cancel-run
→ 204             // 取消该任务卡当前活跃的 run（若有）
```

**`cancel-run` 语义（重要）**：

- **取消范围**：只取消该任务卡当前唯一的活跃 run（`status IN ('pending','claimed','running','awaiting_approval')`）。受 partial unique index `idx_task_queue_card_active` 保证，每张任务卡同一时刻**至多**一条活跃 run，因此不存在"批量取消"语义。
- **排队消息清除（同一事务）**：取消操作在同一数据库事务内，把该 card 上所有 `message.metadata.queued=true` 的用户消息的 `queued` 键删掉。这样未来某次成功 run 的 `Complete -> promoteQueued` 不会把被取消那一轮背后的旧排队消息"复活"成新 run。
- **排队消息处理**：被取消的 run 状态记为 `canceled`，**不会**触发自动晋升排队消息。换言之：取消之后，用户需**重新 @mention** agent 才会再次入队。⚠️ 这与"自动晋升"直觉不同，前端文案不要承诺"队列会接着跑"。
- **daemon 迟报保护**：daemon 若在收到取消通知前已完成处理并随后上报 `Complete(status='done')`，服务端会识别到 run 已处于终态（`canceled`）并**静默丢弃**该报告，不会把 status 翻回 `done`。
- **审批联动**：若取消时 run 处于 `awaiting_approval`，对应的 `ApprovalRequest` 行状态**不会**被自动改写（仍是 `pending`），但 daemon 已被通知该 run 终止；sweeper 最终会按 TTL 把它打 `timeout`。
- **并发幂等性**：多次调用幂等——后续调用 SQL UPDATE 命中 0 行，service 当前会因 `pgx.ErrNoRows` 返回 400。前端遇到这种 400 视作"已被人取消过"处理即可。
- **WS 通知**：取消完成后通过 daemon 通道触发 `run.completed` (`status="canceled"`)；前端用它来 toast "X 的运行已取消"，**不需要**响应体里带 `run_id`。
- **返回值**：当前为 `204 No Content`；不返回 `run_id`。改成 `200 + {"canceled_run_id":"..."}` 的提案 still pending（参见 BACKEND_GAPS #16）。

---

## 消息（核心 — 触发 agent）

任务卡内一条对话线。`@handle` 会在 body 解析为 `mentions[]`（agent ID 数组），由后端入队为 run。

### 列出消息（历史 / 分页）

```
GET /api/v1/tasks/{task_id}/messages
GET /api/v1/tasks/{task_id}/messages?before=<RFC3339Nano>&limit=N    // cursor 分页
```

- **不带任何参数**：返回 `Message[]`，按 `created_at` **升序**，全量无分页（旧行为，前端兼容）。⚠️ 长 task 下一次能拉出数千行 message，**生产前端建议始终带 `limit`**。
- **带 `limit`（推荐，长流场景）**：返回 `{ "messages": Message[], "next_cursor": "<RFC3339Nano>" | "" }`。
  - `messages` 仍按 `created_at` **升序**（直接 append 到聊天流末端）。
  - `next_cursor` 是本批最早一条的 `created_at`；再次请求时作 `before=` 传入；为空 (`""`) 表示已到头。
  - `limit` 上限 `500`，缺省 `50`。
- `403` 不是任务所属工作区成员（或任务不存在 — service 层用 `ErrForbidden` 兜底，不区分）。
- `400` `before` 不是合法 RFC3339Nano。

### 追加消息

```
POST /api/v1/tasks/{task_id}/messages
{
  "content": {
    "text": "@writer 请草拟一段开场白",
    "mentions": ["<agent_uuid>", "<agent_uuid_2>"]    // 直接传 agent ID，不是 handle
  }
}
```

- `201` →

```jsonc
{
  "message": Message,                              // 见对象表
  "runs": [
    { "RunID": "<uuid>", "AgentID": "<uuid>", "RuntimeID": "<uuid>" },
    ...
  ]
}
```

每个被 mention 的 agent 都会产生一个 run；如果该任务卡已有同 agent 的活跃 run，新消息会被打 `metadata.queued=true`，等当前 run 完成后自动晋升。

### 消息内容（content / metadata 都是结构化对象）

`Message.content` 和 `Message.metadata` 在 JSON 响应里都是**已解码的对象**——服务端在 `writeJSON` 之前用 `MessageView` 把 jsonb 列反序列化。前端可以直接 `message.content.text` / `message.metadata.queued`，**不要**再 `atob` + `JSON.parse`。

`content` 内的字段约定：

| `content.type` | 来源 | 关键字段 |
|---|---|---|
| 缺省（用户消息） | 用户发送 | `text` (string), `mentions` (uuid[]) |
| `"system"` | claude stream | `payload` 是 stringified JSON，包含 `type`, `subtype` 等 |
| `"assistant_text"` | claude stream | `payload` 是 stringified `{"text":"..."}` |
| `"tool_use"` | claude stream | `payload` 含 `tool_name`, `tool_use_id`, `input` |
| `"tool_result"` | claude stream | `payload` 含 `tool_use_id`, `is_error`, `content` |
| `"permission_request"` | server（创建审批时同步写入） | payload: `approval_id`, `tool_name`, `tool_input`, `expires_at`, `agent_id`, `agent_handle`。前端可用此消息在聊天流就地渲染审批卡。同时会发 WS `approval.requested` 事件。 |
| `"thinking"` | claude stream | `payload.text` 是思考内容 |
| `"result"` | claude stream | 标记 run 结束，`payload.duration_ms`, `payload.result` |
| `"rate_limit_event"` | claude stream | 速率限制提示 |

`metadata` 关键字段：

| 字段 | 含义 |
|---|---|
| `queued` (bool) | 用户消息发出时已有同卡活跃 run，被打成"排队"；当前 run 完成后会被 `promoteQueued` 自动晋升。 |
| `promoted_agents` (uuid[]) | 已经为该排队消息派工过的 agent ID 列表，幂等去重防止 promote 二次入队。 |

提取助手文本的 SQL 形式作参考：`(content->>'payload')::jsonb->>'text'`。

---

## 审批

`tool_use` 是受限工具时（agent 配置里默认所有写操作都要审批），daemon 会创建一条 `ApprovalRequest`。前端需要让用户决策然后回传：

```
POST /api/v1/approvals/{approval_id}/decide
{
  "decision": "approved" | "denied" | "approved_with_edits",
  "note":     "可选说明"                            // 显示给 agent
}
→ 200 ApprovalRequest
```

- 决策窗口默认 1 小时；超时会被 sweeper 标 `timeout` 并让 run 失败。
- 审批的 `tool_input` 字段仍是 jsonb-as-`[]byte`（base64）—— 与 message 的 `content`/`metadata` 不同，本批未顺手解码。前端读 REST 响应里的 `ApprovalRequest.tool_input` 时仍需 `JSON.parse(atob(...))`；WS `approval.requested` 事件的 payload 里则是已解码的对象（见对应章节）。

### 列出任务的审批历史

```
GET /api/v1/tasks/{task_id}/approvals
```

- `200` → `TaskApprovalItem[]`，按 `created_at DESC`。`TaskApprovalItem` = `ApprovalRequest` 所有字段 + `agent_id` + `agent_handle`（避免前端 N+1 反查 agent）。
- `403` 不是任务所属工作区成员。

### 工作区审批 hub（跨任务）

```
GET /api/v1/workspaces/{ws_id}/approvals?status=pending|approved|denied|timeout|approved_with_edits
```

- `200` → `ApprovalHubItem[]`：每条是 `ApprovalRequest` 的所有字段 + `project_id` + `project_name` + `task_id` + `task_title` + `agent_id` + `agent_handle`，按 `created_at DESC`。
- 不带 `status` 参数 → 返回工作区内所有审批（不过滤）。
- `403` 不是工作区成员。

### 当前用户跨工作区 pending 审批

```
GET /api/v1/me/pending-approvals                  // 全量
GET /api/v1/me/pending-approvals?count_only=1     // 只算数
```

- 默认 `200` → 裸 `PendingItem[]`（与 ws-scope `/workspaces/{ws}/approvals` 风格对齐）。`PendingItem` 是 `ApprovalHubItem` + `workspace_id`。
- `count_only=1` → `{ "count": N }`，省去 join；用于 navbar bell badge。
- 语义：扫调用者所有 workspace membership 下 `status='pending'` 且 `expires_at > now()` 的审批。
- ⚠️ 历史变更：本接口默认形态原为 `{count, items}` 包裹，2026-05-19 起改为裸数组。前端如还在解 `r.items`，会拿到 `undefined`。

---

## 资产（项目级文件上传）

```
POST /api/v1/projects/{project_id}/assets
Content-Type: multipart/form-data
  file=<binary>
→ 201 Asset
```

- 限制 100 MB；MIME 由 form 决定。
- agent 触发期间生成的产物走另一条线（artifacts），由 daemon 直接上传，前端只读。

### 列出项目资产

```
GET /api/v1/projects/{project_id}/assets
```

- `200` → `Asset[]`，按 `created_at DESC`。
- `403` 不是项目所属工作区成员。

### 列出任务产出 (artifacts)

```
GET /api/v1/tasks/{task_id}/artifacts
```

- `200` → `Artifact[]`，按 `created_at DESC`；`excluded=true` 的不返回。
- `403` 不是任务所属工作区成员。

### 列出任务的 run 历史

```
GET /api/v1/tasks/{task_id}/runs
```

- `200` → `RunView[]`，按 `created_at DESC`。
- `403` 不是任务所属工作区成员。

`RunView` 字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | uuid | run id |
| `workspace_id` / `task_card_id` / `agent_id` / `runtime_id` | uuid | 关联 |
| `trigger_message_id` | uuid \| null | 触发本 run 的用户消息 |
| `session_id` | pgtype.Text | claude session resume token |
| `status` | string | `pending` / `claimed` / `running` / `awaiting_approval` / `done` / `canceled` / `failed` |
| `error` | pgtype.Text | 失败原因（`runtime_offline` 表示 sweeper 因 runtime 离线判失败） |
| `created_at` / `claimed_at` / `started_at` / `finished_at` | time | 生命周期戳 |

⚠️ **不返回 `agent_snapshot` 和 `metadata`**：`agent_snapshot` 内嵌 agent 的 `custom_env`（含 API key），裸返回会让 workspace viewer 拿到密钥；`metadata` 是 server 内部状态（如 promote 进度），不暴露给客户端。

---

## 实时事件 WebSocket

```
GET /ws
Upgrade: websocket
Cookie: brainrot_session=...
```

握手必须带 session cookie（与 HTTP 同一套）。连上后默认**不订阅任何房间**，需要客户端发送订阅消息。

### 客户端 → 服务端

```jsonc
// 订阅
{ "type": "subscribe",   "scope": "workspace" | "project" | "task", "id": "<uuid>" }
// 取消
{ "type": "unsubscribe", "scope": "...",                            "id": "<uuid>" }
```

- 一个连接可以同时订阅多个房间。
- scope 的 `id` 是对应资源的 UUID（如 task scope 就是 task_card_id）。

### 服务端 → 客户端

事件统一形如：

```jsonc
{ "type": "<event>", "scope": "<scope>", "id": "<uuid>", "payload": { ... } }
```

| `type` | scope | 触发时机 | payload 主要字段 |
|---|---|---|---|
| `task.created` | `project` | 任务卡新建 | `task`: TaskCard |
| `task.updated` | `project` | 状态/字段变更 | `task`: TaskCard |
| `message.appended` | `task` | 用户/agent 消息新增 | `message`: Message, `runs`: EnqueuedRun[]（user）或 `message_id`+`seq`+`content`（agent） |
| `run.completed` | `task` | run 终止 | `run_id`, `status` (`done`/`failed`/`canceled`), `error` |
| `approval.requested` | `task` | 新审批请求 | `approval_id`, `run_id`, `tool_name`, `tool_input`, `expires_at`, `agent_id`, `agent_handle` |
| `approval.decided` | `task` | 审批决策 | `approval_id`, `decision`, `note` |
| `asset.added` | `project` | 项目资产上传完成 | `asset`: Asset |
| `artifact.added` | `project` | agent 产物上传完成 | `artifact`: Artifact |
| `runtime.online` | `workspace` | daemon 上线 | `runtime_id` |
| `runtime.offline` | `workspace` | daemon 心跳过期 | `runtime_id` |

> ⚠️ `approval.requested` 事件里的 `tool_input` 是**解码后的 JSON 对象**（直接在 payload 里），而 REST `ApprovalRequest.tool_input` 是 base64 编码的字符串。前端处理 WS 事件时**不要**再 `atob()`。

### Ping / 重连建议

- 服务端每 45s 发一次 ping，连接保持。
- 读超时为 2 分钟（pong 重置），客户端**不需要**主动发 ping。
- 断线后 exponential backoff 重连，重连完成后**重新发送一次所有订阅**。

---

## 对象 schema

> 字段名都是 JSON 形态（snake_case，除非另注）。可空字段在响应里要么省略，要么为 `null` / `""`。

### Workspace
```ts
{
  id: string, name: string, slug: string,
  owner_id: string, created_at: string, updated_at: string
}
```

### Agent
```ts
{
  id: string, workspace_id: string, runtime_id: string,
  handle: string, name: string, avatar_url: string | null,
  description: string, instructions: string,
  backend_type: "claude",
  model: string | null,
  custom_env:  { [k: string]: string },   // 已解码对象
  custom_args: string[],                   // 已解码数组
  mcp_config:  Record<string, any>,        // 已解码对象
  archived: boolean,
  created_at: string, updated_at: string
}
```

### Project
```ts
{
  id: string, workspace_id: string,
  name: string, description: string,
  archived: boolean, created_by: string,
  created_at: string, updated_at: string
}
```

### TaskCard
```ts
{
  id: string, project_id: string,
  title: string, summary: string,
  status: "open" | "in_progress" | "done" | "blocked" | "archived",
  sort_order: number,
  created_by: string,
  created_at: string, updated_at: string,
  done_at: string | null,
  busy: boolean,             // 只在 list 接口返回；true = 该卡有 pending/claimed/running/awaiting_approval 的 run
  agents: string[]           // 只在 list 接口返回；该卡历史上派过工的所有 agent uuid（DISTINCT，来自 agent_task_queue）。空数组 = 尚未触发过任何 agent。前端用这个字段渲染任务卡底部的 agent 头像组。
}
```

### Message
```ts
{
  id: string, task_card_id: string,
  role: "user" | "agent" | "system",
  author_user_id:  string | null,
  author_agent_id: string | null,
  content:  Record<string, any>,  // 已解码对象（见上面"消息内容"小节）
  task_run_id: string | null,     // agent 消息会带 run_id
  seq: number | null,             // agent 消息流内序号；user 消息为 null
  metadata: Record<string, any>,  // 已解码对象；user 排队会含 {"queued":true,"promoted_agents":[...]}
  created_at: string
}
```

### EnqueuedRun
```ts
{ RunID: string, AgentID: string, RuntimeID: string }
```

注意字段是 PascalCase（Go 字段名直出），不是 snake_case。

### ApprovalRequest
```ts
{
  id: string, run_id: string, task_card_id: string,
  tool_name: string,
  tool_input: string,                 // base64 编码的 jsonb
  status: "pending" | "approved" | "denied" | "approved_with_edits" | "timeout",
  decided_by:    string | null,
  decided_at:    string | null,
  decision_note: string | null,
  created_at: string, expires_at: string
}
```

### Asset / Artifact
```ts
// 共同字段
{
  id: string, project_id: string,
  filename: string, mime_type: string,
  size_bytes: number, blob_key: string, sha256: string,
  created_at: string
}
// Asset 额外: uploaded_by
// Artifact 额外: task_card_id, task_run_id, source, excluded
```

### AgentRuntime（daemon 元数据，供前端展示）
```ts
{
  id: string, workspace_id: string, name: string,
  host: string | null, os: string | null, arch: string | null,
  capacity: number,
  revoked: boolean,
  online:  boolean,
  last_heartbeat: string | null,
  created_at: string
}
```

> 列出 runtime 的 REST 是 `GET /api/v1/workspaces/{ws_id}/runtimes`（见上文）。WS `runtime.online`/`runtime.offline` 事件用于维护增量。

---

## 鉴权矩阵

下面这张表是从 service 层 `requireRole(...)` 调用反推出来的，描述每个**写接口**实际要求的 workspace role。角色等级：`owner > editor > viewer`（`viewer` 只读）。

| Endpoint | 需要的 role | 失败码 | 备注 |
|---|---|---|---|
| `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` | — | — | 无需 session |
| `GET /me`, `GET /me/pending-approvals` | 任意已登录 | `401` | |
| `POST /workspaces` | 任意已登录 | `401` | 创建者自动成为 `owner` |
| `GET /workspaces`, `GET /workspaces/{id}` | 调用者必须是该 ws 成员 | `403` | |
| `PATCH /workspaces/{id}` (name/slug) | `owner` | `403` | |
| `POST /workspaces/{id}/members` | `owner` | `403` / `409`(已是成员) | |
| `POST /workspaces/{id}/invitations` | `owner` | `403` / `404`(用户未注册) / `409`(已是成员) | |
| `GET /workspaces/{id}/members` | 任意成员 | `403` | |
| `PATCH /workspaces/{id}/members/{user_id}` | `owner` | `403` | 改 role |
| `DELETE /workspaces/{id}/members/{user_id}` | `owner` | `403` | |
| `POST /workspaces/{id}/install-tokens` | `owner` | `403` | |
| `GET /workspaces/{id}/runtimes` | 任意成员（owner/editor/viewer） | `403` | |
| `GET /workspaces/{id}/agents` | 任意成员 | `403` | |
| `POST /workspaces/{id}/agents` | `owner` / `editor` | `403` | |
| `GET /agents/{id}` | 任意 ws 成员 | `403` / `404` | |
| `PATCH /agents/{id}` | `owner` / `editor` | `403` | partial update |
| `DELETE /agents/{id}` | `owner` / `editor` | `403` | 软删 (archive) |
| `POST /workspaces/{id}/projects` | `owner` / `editor` | `403` | |
| `GET /workspaces/{id}/projects` | 任意成员 | `403` | |
| `GET /workspaces/{id}/approvals` | 任意成员 | `403` | |
| `GET /projects/{id}` | 任意 ws 成员 | `403` | |
| `POST /projects/{id}/tasks` | `owner` / `editor` | `403` | |
| `GET /projects/{id}/tasks` | 任意 ws 成员 | `403` | |
| `POST /projects/{id}/assets` | `owner` / `editor` | `403` | upload |
| `GET /projects/{id}/assets` | 任意 ws 成员 | `403` | |
| `PATCH /tasks/{id}` (status) | `owner` / `editor` | `403` | |
| `POST /tasks/{id}/cancel-run` | `owner` / `editor` | `403` | |
| `GET /tasks/{id}/messages` | 任意 ws 成员 | `403` | |
| `POST /tasks/{id}/messages` | `owner` / `editor` | `403` | 触发 agent |
| `GET /tasks/{id}/artifacts` | 任意 ws 成员 | `403` | |
| `GET /tasks/{id}/approvals` | 任意 ws 成员 | `403` | |
| `GET /tasks/{id}/runs` | 任意 ws 成员 | `403` | run 历史，不含 agent_snapshot |
| `POST /approvals/{id}/decide` | `owner` / `editor` | `403` | |

## 错误模型

所有错误用纯文本响应体（`text/plain`）+ HTTP 状态码，**不是** JSON envelope。常见码：

| 状态 | 含义 |
|---|---|
| `400` | 请求体不合法 / 业务前置失败 |
| `401` | 未登录 / cookie 过期 |
| `403` | 越权（不是工作区成员 / owner） |
| `404` | 资源不存在 |
| `409` | 冲突（如同一 run 已有 pending 审批） |
| `410` | 安装 token 已失效 |
| `413` | 上传超出 100 MB |
| `500` | 服务器错（应该在前端做兜底重试 + 提示） |

前端模式建议：

```ts
const resp = await fetch(url, { credentials: 'include', ... });
if (!resp.ok) {
  const msg = await resp.text();
  throw new Error(`${resp.status} ${msg}`);
}
return resp.json();
```

---

## 典型前端流程（端到端）

1. **登录** → cookie 落地。
2. **`GET /me`** → 拿到 user.id。
3. **列工作区** *(待加 REST，现在通过 db 或新建获取)*；选一个 ws_id。
4. **列项目** `GET /workspaces/{ws_id}/projects`，选一个 project_id。
5. **列任务卡** `GET /projects/{project_id}/tasks`，选一个 task_id。
6. **列工作区 agent** `GET /workspaces/{ws_id}/agents`，用来渲染 @mention 候选列表（按 `handle` 模糊匹配）。
7. **拉历史消息** `GET /tasks/{task_id}/messages`，按 `created_at` 升序渲染初始流。
8. **WS 连接 `/ws`，订阅** `{scope:"task", id: task_id}` 以及 `{scope:"project", id: project_id}`，对增量 `message.appended` 与历史按 `id` 去重合并。
9. **发消息** `POST /tasks/{task_id}/messages`，body 里 mentions 写要 @ 的 agent uuid。
10. **监听 WS** 事件：
    - `message.appended` 增量渲染聊天流；
    - `approval.requested` 弹审批 UI；
    - `run.completed` 把"正在思考"loading 关掉，刷新任务状态。
11. **审批** 时 `POST /approvals/{id}/decide`。
12. **任务完成** 时 `PATCH /tasks/{id}` 设 `status: "done"`。

---

## 速查 cheat sheet

```http
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/me
GET    /api/v1/me/pending-approvals

GET    /api/v1/workspaces
POST   /api/v1/workspaces
GET    /api/v1/workspaces/{ws_id}
PATCH  /api/v1/workspaces/{ws_id}
POST   /api/v1/workspaces/{ws_id}/members
GET    /api/v1/workspaces/{ws_id}/members
PATCH  /api/v1/workspaces/{ws_id}/members/{user_id}
DELETE /api/v1/workspaces/{ws_id}/members/{user_id}
POST   /api/v1/workspaces/{ws_id}/invitations
POST   /api/v1/workspaces/{ws_id}/install-tokens
GET    /api/v1/workspaces/{ws_id}/runtimes
GET    /api/v1/workspaces/{ws_id}/agents
POST   /api/v1/workspaces/{ws_id}/agents
GET    /api/v1/agents/{agent_id}
PATCH  /api/v1/agents/{agent_id}
DELETE /api/v1/agents/{agent_id}
POST   /api/v1/workspaces/{ws_id}/projects
GET    /api/v1/workspaces/{ws_id}/projects
GET    /api/v1/workspaces/{ws_id}/approvals

GET    /api/v1/projects/{project_id}
POST   /api/v1/projects/{project_id}/tasks
GET    /api/v1/projects/{project_id}/tasks
POST   /api/v1/projects/{project_id}/assets
GET    /api/v1/projects/{project_id}/assets

PATCH  /api/v1/tasks/{task_id}
POST   /api/v1/tasks/{task_id}/cancel-run
GET    /api/v1/tasks/{task_id}/messages
POST   /api/v1/tasks/{task_id}/messages
GET    /api/v1/tasks/{task_id}/artifacts
GET    /api/v1/tasks/{task_id}/approvals
GET    /api/v1/tasks/{task_id}/runs

POST   /api/v1/approvals/{approval_id}/decide

GET    /ws                                              // WebSocket
```

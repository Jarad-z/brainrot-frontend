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

### 创建工作区

```
POST /api/v1/workspaces
{
  "name": "My Team",
  "slug": "my-team"      // 工作区短码，全局唯一
}
```

- `201` → `Workspace`（见下方对象表）。

### 添加成员

```
POST /api/v1/workspaces/{ws_id}/members
{ "user_id": "<uuid>", "role": "member" }   // role: "owner" | "member"
```

- `204`，`403` 不是 owner。

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

- `200` → `Agent[]`（无分页，全量返回；不区分 `archived`，前端自行过滤）。
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

- `201` → `Agent`。

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
→ 204             // 取消当前活跃的 run（若有）
```

---

## 消息（核心 — 触发 agent）

任务卡内一条对话线。`@handle` 会在 body 解析为 `mentions[]`（agent ID 数组），由后端入队为 run。

### 列出消息（历史）

```
GET /api/v1/tasks/{task_id}/messages
```

- `200` → `Message[]`，按 `created_at` **升序**。
- **当前没有分页**：响应即任务卡里全部消息。聊天流活跃时这条会越长越大，前端在长流场景下要把它配合虚拟列表渲染；后续会加 `before`/`limit` 分页（TODO）。
- `400` 不是任务所属工作区成员。

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

### 消息内容（重要 — content 是 base64）

`Message.content` 字段在 JSON 响应里是 **base64 编码后的 jsonb**（Go `[]byte` 默认 JSON marshal 行为）。前端解析方式：

```js
const raw = atob(message.content);          // -> '{"text":"@writer hi"}'
const parsed = JSON.parse(raw);
```

`parsed` 内的字段约定：

| `parsed.type` | 来源 | 关键字段 |
|---|---|---|
| 缺省（用户消息） | 用户发送 | `text` (string), `mentions` (uuid[]) |
| `"system"` | claude stream | `payload` 是 stringified JSON，包含 `type`, `subtype` 等 |
| `"assistant_text"` | claude stream | `payload` 是 stringified `{"text":"..."}` |
| `"tool_use"` | claude stream | `payload` 含 `tool_name`, `tool_use_id`, `input` |
| `"tool_result"` | claude stream | `payload` 含 `tool_use_id`, `is_error`, `content` |
| `"permission_request"` | claude stream | 同时会创建 `ApprovalRequest`，前端应优先看 approval 列表 |
| `"thinking"` | claude stream | `payload.text` 是思考内容 |
| `"result"` | claude stream | 标记 run 结束，`payload.duration_ms`, `payload.result` |
| `"rate_limit_event"` | claude stream | 速率限制提示 |

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
- 审批的 `tool_input` 字段同样是 base64 编码的 jsonb，解码后是 `{"command":"ls", ...}` 之类。

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
| `approval.requested` | `task` | 新审批请求 | `approval_id`, `run_id`, `tool_name`, `tool_input` |
| `approval.decided` | `task` | 审批决策 | `approval_id`, `decision`, `note` |
| `asset.added` | `project` | 项目资产上传完成 | `asset`: Asset |
| `artifact.added` | `project` | agent 产物上传完成 | `artifact`: Artifact |
| `runtime.online` | `workspace` | daemon 上线 | `runtime_id` |
| `runtime.offline` | `workspace` | daemon 心跳过期 | `runtime_id` |

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
  custom_env:  string,  // base64 编码的 jsonb，解出来是 {"KEY":"v"}
  custom_args: string,  // base64 编码的 jsonb，解出来是 ["--flag"]
  mcp_config:  string,  // base64 编码的 jsonb
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
  done_at: string | null
}
```

### Message
```ts
{
  id: string, task_card_id: string,
  role: "user" | "agent" | "system",
  author_user_id:  string | null,
  author_agent_id: string | null,
  content:  string,           // base64 编码的 jsonb (见上面"消息内容"小节)
  task_run_id: string | null, // agent 消息会带 run_id
  seq: number | null,         // agent 消息流内序号；user 消息为 null
  metadata: string,           // base64 编码的 jsonb；user 排队会含 {"queued":true}
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

> 当前没有"列出工作区的 runtime"REST 接口。前端可以从 `runtime.online`/`runtime.offline` WS 事件维护一份本地集合，或后端补一个 `GET /api/v1/workspaces/{ws_id}/runtimes`（待加）。

---

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

POST   /api/v1/workspaces
POST   /api/v1/workspaces/{ws_id}/members
POST   /api/v1/workspaces/{ws_id}/install-tokens
GET    /api/v1/workspaces/{ws_id}/agents
POST   /api/v1/workspaces/{ws_id}/agents
POST   /api/v1/workspaces/{ws_id}/projects
GET    /api/v1/workspaces/{ws_id}/projects

GET    /api/v1/projects/{project_id}
POST   /api/v1/projects/{project_id}/tasks
GET    /api/v1/projects/{project_id}/tasks
POST   /api/v1/projects/{project_id}/assets

PATCH  /api/v1/tasks/{task_id}
POST   /api/v1/tasks/{task_id}/cancel-run
GET    /api/v1/tasks/{task_id}/messages
POST   /api/v1/tasks/{task_id}/messages

POST   /api/v1/approvals/{approval_id}/decide

GET    /ws                                              // WebSocket
```

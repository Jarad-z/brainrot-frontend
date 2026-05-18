# S5 — Collaboration & Uploads Design Spec

- **Date**: 2026-05-19
- **Branch (planned)**: `s5-collab-and-uploads`
- **Predecessor**: S4 (PR #6 `b2fe44c`) + hotfix PR #7 `1a7c37c`
- **Status**: design approved, pending plan

## 1. Background

S4 完成了"用户能创建管理"（workspace switcher、agent CRUD、runtimes、settings 占位）。S5 要兑现 FRONTEND.md M6 + S4 spec §"Not in scope" 的协作 + 文件闭环。

Backend gap 状态（截至 2026-05-19，BACKEND_GAPS.md）：

| gap | 状态 | 对 S5 影响 |
|---|---|---|
| #19 邀请 by email | ✅ done | unlock 邀请功能 |
| #20 成员管理 + ws 元信息 | ✅ done（归档延后） | unlock 成员区与改名 |
| #21 agents jsonb 解码 | ✅ done | unlock 删兼容层 |
| #22 GET/PATCH `/agents/{id}` | ✅ done | unlock agent 编辑 |
| #24 message content/metadata 解码 | ✅ done | S5 不直接消费，但前端可放心去除任何 base64 兜底 |
| #25 runtime online 即时 | ✅ done | 与 S5 无直接关联 |
| #26 `GET /tasks/{id}/runs` | ✅ done | 与 S5 无直接关联 |
| **#28（拟立）** artifact `PATCH excluded` | ❌ 缺接口 | **S5 不做 artifact 排除**，整块 UI 不出现 |
| WS 软归档 | ⏸ 后端主动延后 | S5 保持 disabled 占位 |
| **#29（拟立）** 非 owner 自离工作区 | ❌ 缺接口 | S5 不出现"离开工作区"按钮 |

## 2. Scope

S5 = "文件 + 协作完整闭环"。共 7 个工作块：

1. **Asset 上传** — `AssetsTab` 加按钮，multi-select file picker，per-file 进度，串行上传
2. **批量审批** — `/approvals` + `/w/[wsId]/approvals` 加 checkbox + sticky action bar，前端循环 decide
3. **Email 邀请** — `AddMemberModal` 表单从 user_id 改 email，处理 404 / 409 / 403
4. **WS 元信息编辑** — Settings 加 PATCH name/slug 表单
5. **成员管理** — Settings 加成员列表 + 行内 role 切换 + 移除按钮
6. **Agent 编辑回归（#22 收尾）** — `useAgent` 改回真 useQuery，编辑页接 PATCH mutation
7. **#21 兼容层清理** — 删除 `lib/api/agents-encoding.ts` + `AgentWire` 类型分层

### 2.1 Not in scope（明示排除）

- Artifact 排除按钮 → 等 BACKEND_GAPS #28
- WS 软归档 → 等后端
- 非 owner 自离 / "离开工作区"按钮 → 等 BACKEND_GAPS #29
- 拖拽上传 / Cmd+V 粘贴图片 → S6
- 文件预览 / 缩略图 → S6
- 评论 / @人 / 版本管理 → 未来
- 深色主题 / 移动端响应式 → S6
- WS owner 移交 → 永不或 S7+
- `mcp_config` 富 UI 编辑器（保持 textarea JSON）→ S6+
- `AddMemberModal` 的 user_id 旧入口（本次直接移除）

## 3. Architecture & 工程顺序

新分支 `s5-collab-and-uploads` 从 main 切，分支内顺序提交，最后 squash 单 PR 合 main（沿用 S4 #6 模式）。

实现顺序按"风险递增 + 依赖最浅在前"：

1. **#21 清理** — 删 `agents-encoding.ts` + `AgentWire`，统一 `Agent` 类型
2. **#22 收尾** — `useAgent` 改回 useQuery，详情页接 PATCH
3. **成员区 + WS 元信息** — list / role PATCH / DELETE / PATCH workspace 一起做（同一 Settings 页区域）
4. **Email 邀请** — 改造 `AddMemberModal`
5. **Asset 上传** — `AssetsTab` 头部按钮 + 进度面板
6. **批量审批** — 两个 hub 共享 checkbox + sticky bar 抽象

每步开始前**必跑 smoke test**（§9.1）。

## 4. Asset 上传

### 4.1 UI

`components/task-detail/RightTabs/AssetsTab.tsx`：头部加 `<UploadButton projectId={...} />`，原 list 不变。

`components/assets/UploadButton.tsx`（新）：button + 隐藏 `<input type="file" multiple>` + 下方进度面板。

### 4.2 State machine (per file)

```
pending → uploading (0–99%) → done | failed
```

- "已完成" / "失败" 行 3 秒后自动 fade；"失败" 保留 dismiss 按钮
- 选了文件后立刻显示行，state=pending；串行进入 uploading
- 单文件 > 100MB → 直接 `failed`，inline error "文件过大（>100MB）"
- 403（viewer 无权限）→ button 顶层 disabled + tooltip
- 413（后端反悔）→ `failed`，error "文件过大，后端拒绝"
- 网络中断 → `failed`，error "上传失败，请重试"

### 4.3 API

`POST /api/v1/projects/{project_id}/assets`，multipart/form-data：

```ts
const fd = new FormData();
fd.append("file", file);
```

**进度获取走 XHR**（fetch 没有 upload progress 事件）。新建 `lib/api/upload.ts` 封装 `xhrUpload(url, formData, onProgress) → Promise<Asset>`，挂载 session cookie（XHR `withCredentials = true`），是 S5 唯一偏离 `apiFetch` 的地方。

### 4.4 并发 & 缓存

- 串行（一次 1 个）
- 每个文件 done 后 `invalidateQueries(["project-assets", projectId])`
- 后端**无** asset WS 事件（只有 daemon `artifact.added`），所以列表完全靠 invalidate
- 边缘：他人上传的 asset 不会推送给当前用户；要看到必须 refetch（路由切换、tab 切换、或 React Query staleTime 过期）。S5 不引入轮询；如成实际痛点立 BACKEND_GAPS 补 `asset.added` WS 事件

### 4.5 Hooks

- `useUploadAssets(projectId)`（新） — 接受 `File[]`，向外暴露 `{ items: UploadItem[], start(files), dismiss(id) }`

## 5. 批量审批

### 5.1 共享改造

`/approvals`（跨 ws）和 `/w/[wsId]/approvals` 两个 hub 共享同一个列表组件（命名以现状为准）。在该共享组件上加 batch。

新组件：
- `components/approvals/BulkActionBar.tsx` — sticky 顶部，仅 `selectedIds.size > 0` 渲染
- `hooks/useBulkDecide.ts` — 接受 `ids[] + decision`，跑 Promise.all + per-task try/catch

### 5.2 Selection state

- 本地组件 state，结构 `Set<approvalId>`
- 路由切换 / `listData` 变化 / refetch 后清空
- 全选 checkbox 在列表头部，tri-state：空 / indeterminate / 勾选
- "全选" 仅作用于当前可见列表（无分页）

### 5.3 Sticky bar 内容

```
已选 3 条   [批准选中] [拒绝选中]  [取消选择]
```

执行中：

```
处理中 2/3 ...
```

完成后：sticky bar 消失，toast "已批准 N 条，M 条失败"。失败 row：左 border destructive 5 秒；失败的 id 仍保留在 selectedIds 中以便重试。

### 5.4 API 调用

后端无批量 endpoint，前端循环：

```ts
await Promise.all(
  ids.map(async (id) => {
    try {
      await decideOne(id, decision);
      ok.push(id);
    } catch (e) {
      fail.push({ id, error: e });
    } finally {
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }
  })
);
```

完成后 invalidate `["pending-approvals"]`、`["pending-approvals", "count"]`、`["ws-approvals", wsId, status]`。

### 5.5 Race / staleness

批量进行期间 WS 推来新 `approval.requested` → 新行进入列表但不在 selectedIds，互不影响。

### 5.6 部分失败的常见原因

- 410 已过期 / 409 已被他人决策 → 失败 row tooltip 显示具体 message

## 6. Email 邀请 + 成员管理 + WS 元信息

均在 `/w/[wsId]/settings`，三段：

```
[工作区信息]      ← 6.1
[成员]            ← 6.2 / 6.3
[危险区]          ← 归档按钮仍 disabled "即将上线"
```

### 6.1 WS 元信息表单

- 字段：`name`（必填）、`slug`（必填，本地 `^[a-z0-9-]+$` 预校验）
- `defaultValue` 来自 `useWorkspace(wsId)`
- 提交按钮 disabled 直到 dirty
- 提交 → `PATCH /workspaces/{wsId} { name?, slug? }` 仅发改动字段
- onSuccess → `invalidateQueries(["workspaces"])` + `setQueryData(["workspace", wsId], updated)` + toast "已保存"
- 400 slug 冲突 → inline 红字 "该 slug 已被占用"
- 403 → toast "需要 owner 权限"

URL 用 wsId（UUID），改 slug 不影响路由。

### 6.2 成员列表

数据源：`useWorkspaceMembers(wsId)` 新 hook → `GET /workspaces/{wsId}/members` → `WorkspaceMember[]`

行布局：

```
[avatar] 张三 (zhangsan@example.com)        [role ▾]    [移除]
[avatar] 你 (you@example.com)         [owner]                  ← 当前用户
```

字段：`email` / `name` / `avatar_url`（pgtype.Text `{String, Valid}`）/ `role` / `joined_at`。

当前用户判定：`useMe().id === member.user_id`。当前用户行：
- role 列固定文字 + "你" 灰色 chip，不可改
- 移除按钮不渲染

非 owner 视角：role 下拉与移除按钮 disabled + tooltip "需要 owner 权限"。

### 6.3 Role 切换 / 移除成员

**Role**：下拉 onChange 立刻 `PATCH /workspaces/{wsId}/members/{user_id} { role }`，无确认。

- 乐观更新：mutate 前 `setQueryData` 把目标行 role 改掉
- onError 回滚：`setQueryData` 还原
- toast "已更新角色" / "角色更新失败"

**移除**：点击 → ConfirmDialog（复用 `components/brand/confirm-dialog.tsx`）

- title: "移除成员"
- body: "确认将 alice@example.com 从工作区中移除？她将立刻失去访问权限。"
- confirm: "移除"（destructive）
- 确认 → `DELETE /workspaces/{wsId}/members/{user_id}` → invalidate members + toast "已移除"

### 6.4 邀请（AddMemberModal 改造）

S4 modal 的 user_id input 整体替换为 email + role。**保留 modal 容器** 与现有打开入口。

- input type=email，placeholder "alice@example.com"
- role 下拉，默认 "editor"
- 提交 → `POST /workspaces/{wsId}/invitations { email, role }`

响应分支：

| 状态码 | 行为 |
|---|---|
| 204 | close modal + invalidate `["workspace-members", wsId]` + toast "已添加" |
| 403 | toast "需要 owner 权限" |
| 404 | modal 不关闭；inline 红字 "这个 email 还没注册 brainrot。让 ta 先访问下方注册链接后再试。" + "复制注册链接" 按钮（复制 `${window.location.origin}/register`） |
| 409 | modal 不关闭；inline 黄字 "ta 已经是工作区成员了。" |

S4 的 user_id 入口整段移除（包含"你的 user ID + 复制"区块）。

### 6.5 Hooks 清单

新增：
- `useWorkspaceMembers(wsId)` — GET list
- `useUpdateMemberRole(wsId)` — PATCH role mutation（带乐观更新 + 回滚）
- `useRemoveMember(wsId)` — DELETE mutation
- `useUpdateWorkspace(wsId)` — PATCH name/slug mutation
- `useInviteByEmail(wsId)` — POST invitations mutation

复用：
- `useMe()` — 已存在
- `useWorkspace(wsId)` — S4 已存在

## 7. Agent 编辑回归 + #21 清理

### 7.1 #21 清理（删除 agents-encoding 兼容层）

删除 `lib/api/agents-encoding.ts`，连同 `AgentWire` 类型。

改动点（通过 `grep "AgentWire"` / `grep "decodeAgentResponse"` / `grep "encodeAgentInput"` 定位）：

- `lib/api/agents.ts` — `apiFetch<AgentWire>` 全部换为 `apiFetch<Agent>`，去除 decode/encode
- POST/PATCH 直接传 `{ custom_env: {...}, custom_args: [...], mcp_config: {...} }`
- 所有 import `AgentWire` 的文件改回 `Agent`
- `hooks/useWorkspaceAgents.ts` / `useCreateAgent` / `useUpdateAgent` cascading 简化

保持不变：
- `pgtype.Text` 形态字段（`avatar_url`、`model`）仍是 `{ String, Valid }`，#21 explicitly 不动这部分

### 7.2 #22 收尾（agent 编辑回归）

**`hooks/useAgent.ts` 改回真 useQuery**：

```ts
export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => apiFetch<Agent>(`/api/v1/agents/${agentId}`),
    enabled: !!agentId,
  });
}
```

删除 S4 从 `useWorkspaceAgents.find()` 派生的临时实现 + 相关注释。

**详情页**（`app/w/[wsId]/agents/[agentId]/page.tsx` 或等价路径）：

- 摘除"编辑暂未开放"只读 banner
- 表单接 `useUpdateAgent` mutation
- 字段：`name` / `avatar_url` / `description` / `instructions` / `model` / `custom_env` / `custom_args` / `mcp_config`
- **`handle` 字段始终 disabled**（spec 明示不可改）
- 提交按钮 disabled 直到 dirty
- 仅提交 dirty 字段（避免 "全空 → 显式清空" 歧义）

PATCH body 语义（后端约定）：
- 字段省略 / `null` = 保留
- `{}` / `[]` = 显式清空（前端 v1 不暴露此操作）

`useUpdateAgent` onSuccess：
- `setQueryData(["agent", agentId], updatedAgent)`
- `invalidateQueries(["workspace-agents", wsId])`
- toast "已保存"

`useCreateAgent` / `useDeleteAgent`（归档）保持 S4 现状。

### 7.3 此节风险

`AgentWire` 删干净后 TypeScript 编译会到处报错——按报错改即可，跑 `npm run build` 确认无 stray reference。

## 8. 数据流 & 错误处理

### 8.1 React Query keys

| Key | 内容 | Invalidate 时机 |
|---|---|---|
| `["workspaces"]` | ws list | 改 ws name/slug、邀请/移除成员后 |
| `["workspace", wsId]` | 单 ws | PATCH ws 后 setQueryData |
| `["workspace-members", wsId]` | 成员列表 | 邀请、改 role、移除后 |
| `["agent", agentId]` | 单 agent | PATCH agent 后 setQueryData |
| `["workspace-agents", wsId]` | agent list | PATCH agent 后 |
| `["project-assets", projectId]` | asset list | 每个文件 done 后 invalidate |
| `["pending-approvals"]` | 跨 ws hub | 批量 decide 后 |
| `["pending-approvals", "count"]` | bell badge | 批量 decide 后 |
| `["ws-approvals", wsId, status]` | ws scope hub | 批量 decide 后 |

乐观更新带回滚：role PATCH（§6.3）。其他 mutation 走标准 invalidate。

### 8.2 错误反馈统一模式

| 错误源 | 反馈位置 | 形式 |
|---|---|---|
| Form 字段级（slug 冲突 / email 404,409） | Inline 表单下方 | 红字 / 黄字 |
| 权限不足（403） | Toast | "需要 owner / editor 权限" |
| 网络 / 5xx | Toast + console.error | "操作失败，请重试" |
| 批量部分失败 | Toast 聚合 + 失败 row 红边框 | "已批准 N 条，M 条失败" |
| 上传失败（per file） | 进度行 inline | 红字 error |

不在范围：sentry / 上报、retry-with-backoff。

## 9. QA & 验收

### 9.1 Smoke test 协议（钉死的）

每个子任务开始前在 PowerShell 跑一次对应 endpoint，确认实际响应 shape 与 API.md / spec 一致。失败 → 立刻 abort，记到 BACKEND_GAPS，不硬上前端。

| 子任务 | 必查 |
|---|---|
| #21 清理 | GET `/agents/{id}` 实际 `custom_env` 是对象 |
| #22 回归 | PATCH `/agents/{id}` 接受 dirty-only 字段 |
| 成员区 | GET `/workspaces/{ws}/members` 字段、PATCH role 204 |
| WS 元信息 | PATCH `/workspaces/{ws}` slug 冲突 → 400 |
| 邀请 | POST `/invitations` 404 / 409 实际响应体 |
| 上传 | POST `/projects/{pid}/assets` multipart 响应 + Content-Type 容忍 |
| 批量 | POST `/approvals/{id}/decide` 重复 / 过期 返回码 |

### 9.2 QA 流程（沿用 S4）

- 自动：`gstack browse` skill 跑可测读操作 + 简单写操作（创建 ws、邀请测试 user、上传小文件）
- 手动（破坏性 / 多账号）：
  - 多账号邀请流（A 邀请 B，B 登录验证可见 ws）
  - 移除成员后 B 访问 ws 应 403 / redirect
  - 上传接近 100MB 文件
  - 批量审批 50+ 条
  - WS rename 后 sidebar 立即刷新

### 9.3 Definition of Done

S5 视为完成的硬指标：

- [ ] 上传 5 个文件到 asset，列表立即看到 5 条新行
- [ ] `/approvals` 选 3 条批量批准，全部成功，列表减少 3
- [ ] 邀请未注册 email → inline 红字 + 复制链接按钮可点
- [ ] 邀请已注册 email → 成员列表立刻多出该人
- [ ] 改 ws name → sidebar 当前 ws 名 1 秒内刷新
- [ ] role 下拉改为 viewer → 行立即改，refresh 后保持
- [ ] 移除成员走 ConfirmDialog，确认后行消失
- [ ] Agent 详情页可改 name + 保存，list 页该 agent 名同步刷新
- [ ] `agents-encoding.ts` 文件不存在；`grep "AgentWire"` 无结果
- [ ] `npm run build` 通过 + `npm run lint` 无 error

## 10. Backend gap follow-ups

S5 期间新立 / 待立的 BACKEND_GAPS 条目：

- **#28（拟立）**：`PATCH /api/v1/artifacts/{id} { excluded }` 缺接口，需要后端补；前端 artifact "排除"按钮 + "显示已排除" toggle 等此 unblock 后才上
- **#29（拟立）**：非 owner 自离工作区缺接口（当前 `DELETE /workspaces/{ws}/members/{user_id}` 仅 owner 可调），需要后端加 self-removal 语义；前端 Settings 不出"离开工作区"按钮直至 unblock
- **WS 归档**：后端已主动延后，跟踪在 #20 末尾

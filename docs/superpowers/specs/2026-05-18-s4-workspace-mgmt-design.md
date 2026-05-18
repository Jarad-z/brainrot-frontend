# S4 Workspace Management — 多 ws 切换 + Agent CRUD + Runtimes + Settings

> **Date:** 2026-05-18
> **Parent:** S3 approvals hub (PR #2, 待 merge) + S3.1 artifacts/assets (PR #3, 待 rebase merge) + 前置 hotfix PR #4 (user snake_case)。三个 PR 必须按 #4 → #2 → #3 顺序合到 main 后再开 `s4-workspace-mgmt` 分支。
> **In scope:** Sidebar workspace switcher dropdown + 创建 ws modal；跨工作区 bell badge（替换 S3 的"仅当前 ws"行为）+ 新顶层路由 `/approvals`；Agent CRUD（new / edit / archive）含三个 base64 非对称字段处理；`/w/[wsId]/runtimes` 列表 + 签发 install-token modal；`/w/[wsId]/settings` 基本信息 + 加成员 + 我的 user ID + 危险操作占位；ConfirmDialog 基件（首次用于归档 agent）。
> **Not in scope:** 文件上传 UX（asset / artifact）→ S5；审批批量操作 → S5；按 email 邀请成员（无后端，依赖 BACKEND_GAPS #19）→ S5；改 ws name/slug / 移除成员 / 改成员 role / 归档 ws / 列成员（无后端，依赖 BACKEND_GAPS #20）→ S5；取消归档 agent（待验证后端支持）→ 后续；Cmd+K ws 搜索；bell 下拉明细预览 → S5；移动端响应式 → v1 desktop only；深色主题 → S6；E2E 测试框架 → S6；Storybook；agent 模板 / 复制；workspace billing；workspace 硬删（永远不做）；onboarding 页改造 → S5/S6。

---

## 1. Problem

S0-S3 把"登录 + 只读浏览 + 聊天 + 单 ws 审批 hub"做通了，但用户能做的写操作只有"在 task 里发消息 / approve-deny 审批"两件事。M5 之前的两个核心约束让"工作区生态"卡住：

- **多 ws 切换缺失**：Sidebar workspace 切换器从 S1 起就是 disabled 状态（`useWorkspaces()` 接口当时缺失，BACKEND_GAPS #1 后端 2026-05-17 补完）。用户登录后被钉死在 lastWsId 里，无法在多个 ws 间切换，也无法新建 ws。
- **写操作整体缺席**：agent 列表只读（不能新建/编辑/归档）；runtime 列表 sidebar 灯全 disabled（#2 后端 2026-05-17 补完）；install-token 签发完全没入口；workspace settings 页不存在。

此外 S3 留了一个跨 ws 体验缺口（spec Q1 + Q6 留的"全局 count + 顶层 hub" → BACKEND_GAPS #14）：bell badge 只数当前 ws 的 pending。S4 开始多 ws 切换之后这个 UX 必须升级——否则用户切到 ws-A 就看不见 ws-B 的 pending，整个多 ws 体验破产。#14 后端 2026-05-17 已补完，S4 同期消费。

功能验收：用户登录后，能在 sidebar 看到所有自己加入的 ws 并切换；能创建新 ws 并直接进入；能在任一 ws 创建 / 编辑 / 归档 agent；能在 runtimes 页签发一次性安装 token 并看到 daemon 在线状态；能在 settings 加成员（粘 UUID，UX 妥协但闭环）；bell 显示全局 pending 数，点击根据当前路由 scope 跳单 ws 或顶层 hub。视觉验收：与 `ui_design/screens/AgentNew.jsx` / `AgentsList.jsx` / `RuntimesList.jsx` / `WorkspaceSettings.jsx` mockup 对齐。

---

## 2. Approach — decisions

Brainstorming 13 个决策点（Q1–Q13）锁定，按"为什么"一句话归纳：

| # | Topic | Decision | Why |
|---|---|---|---|
| Q1 | ws 切换器形态 | Sidebar dropdown（折叠态） | 类比 Linear/Notion；预期单用户主力 1-2 个 ws；项目树空间不被吃掉；prototype Sidebar 已预留 |
| Q2 | 创建 ws 入口 | Dropdown 底部"+ 新建工作区" → modal | 入口集中（管 ws 心智在一处）；name+slug 两字段不需要独立页；modal 不破坏当前 context |
| Q3 | 跨 ws hub 路由 | 双路由：顶层 `/approvals` + 保留 `/w/[wsId]/approvals`；bell 点击按当前路由 scope 智能跳转 | S3 单 ws 版代码零改动；ws 内体验保持；跨 ws 用户有全局视图。覆盖 S3 spec Q6 留的选项 c |
| Q4 | Agent 字段 base64 非对称处理 | API client 层（`lib/api/agents.ts` encode/decode 边界） | 上层组件/hook 永远拿干净 JS 对象；类型分层 `AgentWire` vs `Agent`；新加表单不会忘 |
| Q5 | 加成员 user 标识符 | S4 用 user_id UUID 输入 + 立 BACKEND_GAPS #19；S5 升级 email 邀请 | 后端无 email lookup 也无 invitation endpoint；S4 范围必须含"加人"否则多 ws 切换无意义；坦诚标注"邀请流即将上线" |
| Q6 | install-token modal 设计 | 单页 modal + 警告 + token 复制 + 命令片段复制 + 绝对失效时间（不倒计时） | 1h TTL 太长不需要倒计时焦虑；90% 用户复制的是命令片段；关闭即清，不二次确认 |
| Q7 | Agent 表单字段呈现 | 全部 textarea + JSON.parse 失焦校验 | S4 范围控制；prototype 走向一致；env/args/mcp_config 结构化 UI 工程量翻倍且无用户研究支撑 |
| Q8 | 归档 vs 删除 | 按钮文案"归档" + 默认隐藏 archived + "显示已归档" toggle | 诚实反映后端语义；用户能回查；不撒谎说"已删除" |
| Q9 | Settings 页范围 | 只读基本信息 + 成员区（无列表）+ 加成员 + 我的 user ID + 危险操作 disabled 占位 | 后端只有 POST members + POST install-tokens 两个写接口；其他操作（改名/移除/改role/归档ws）立 BACKEND_GAPS #20 |
| Q10 | base64 非对称事实核查 | 已确认（sqlc 生成 `[]byte` → Go 默认 base64） | `pkg/db/generated/agents.sql.go:45` `CustomEnv []byte`；handler `writeJSON(w, ag)` 直接吐 → 客户端拿 base64 string；立 BACKEND_GAPS #21 |
| Q11 | 无 GET members 接口时 settings 成员区 | 暂不渲染列表，只放 "+ 添加成员" + 提示"成员列表即将上线" | 不假装有数据；加成员靠 toast 反馈成功；BACKEND_GAPS #20 包含 GET members |
| Q12 | onboarding 页处理 | S4 不动；wsList 空才跳，仍保留"粘 wsId" fallback | sidebar dropdown 已能创建 ws，onboarding 不是主路径；S5/S6 再统一登录引导 |
| Q13 | 二次确认形态（归档） | 新建 `components/ui/ConfirmDialog.tsx`（包 shadcn dialog 基件） | 与 S0-S3 全 shadcn 风格一致；可复用（settings 危险操作以后能用）；window.confirm 丑、inline 倒计时不统一 |

### 状态派生 vs Context state

`WorkspaceProvider` 内部不持有 `currentWsId` state，而是 `currentWsId = useParams().wsId`。这是关键一致性决策——URL 是唯一真实来源，避免 Context state 和 URL 不一致的 bug（浏览器后退键 / 直接粘 URL / 分享链接场景下，state-based Context 会出现"UI 显示 ws-A，但实际拉的是 ws-B 数据"）。

---

## 3. Architecture

### 3.1 整体结构

```
┌────────────────────────────────────────────────────────────┐
│  WorkspaceProvider  (lib/workspace-context.tsx — 新)       │
│  - currentWsId（派生自 useParams）、wsList、switchTo、     │
│    createWorkspace                                          │
│  - 包在 RootLayout，所有页面都能读                          │
└──────────┬─────────────────────────────────┬───────────────┘
           │                                 │
   ┌───────▼────────┐                ┌───────▼───────────┐
   │ Sidebar 切换器 │                │ 跨 ws bell badge  │
   │ + 创建 ws modal│                │ + /approvals 顶层 │
   └────────────────┘                └───────────────────┘

   ┌────────────────┐  ┌────────────────┐  ┌──────────────┐
   │ Agent CRUD     │  │ Runtimes 列表  │  │ WS Settings  │
   │ /agents/[id]   │  │ + Install-Token│  │ + AddMember  │
   │ /agents/new    │  │   modal        │  │ + My user ID │
   └────────────────┘  └────────────────┘  └──────────────┘
```

### 3.2 路由表

| 路由 | 状态 | 说明 |
|---|---|---|
| `/approvals` | 新增 | 跨 ws 顶层 hub（`/me/pending-approvals`） |
| `/w/[wsId]/approvals` | 保留 | 单 ws hub（S3 已做，不改） |
| `/w/[wsId]/agents` | 改 | 加"+ 新建" + "显示已归档" toggle |
| `/w/[wsId]/agents/new` | 新增 | 创建表单 |
| `/w/[wsId]/agents/[agentId]` | 新增 | 编辑 + 归档按钮 |
| `/w/[wsId]/runtimes` | 新增 | daemon 列表 + 签发 token 按钮 |
| `/w/[wsId]/settings` | 新增 | 基本信息 + 成员 + 我的 user ID + 危险占位 |
| Sidebar dropdown | 改 | 解锁 ws 切换器 + 底部 "+ 新建工作区" |

S3 已合的 `/w/[wsId]/approvals` 和 bell badge 仅调整跳转逻辑（视当前路由 scope 决定跳哪个 hub），代码改动最小化。

### 3.3 模块边界

**State / Context**
- `lib/workspace-context.tsx`（新）—— 暴露 `useWorkspaceContext()`：`{ currentWsId, wsList, switchTo(id), createWorkspace(input) }`。包在 RootLayout。`wsList` 来自 `useWorkspaces()` hook。`currentWsId` 从 `useParams().wsId` 派生。

**API client 层**
- `lib/api/workspaces.ts`（扩）—— 加 `createWorkspace` / `addMember` / `issueInstallToken`
- `lib/api/agents.ts`（扩）—— 加 `createAgent` / `updateAgent` / `archiveAgent`；内部 `encodeAgentPayload` / `decodeAgentResponse` 处理 base64 非对称（Q4 决议）
- `lib/api/me.ts`（新）—— `fetchPendingApprovals()` / `fetchPendingApprovalsCount()`（喂给跨 ws bell + 顶层 /approvals）

**Hooks（React Query）**
- `useWorkspaces()` —— 已有，复用
- `useCreateWorkspace()` —— 新 mutation
- `useCreateAgent` / `useUpdateAgent` / `useArchiveAgent` —— 新 mutations
- `useWorkspaceRuntimes(wsId)` —— 新 query（首次拉 + WS `runtime.online/offline` 事件叠加）
- `useIssueInstallToken(wsId)` —— 新 mutation
- `useAddMember(wsId)` —— 新 mutation
- `useGlobalPendingApprovals()` / `useGlobalPendingApprovalsCount()` —— 新 queries（顶层 hub + bell）
- 现有 `useWorkspaceApprovals` 不动

**Components**
- `components/nav/Sidebar.tsx`（改）—— 解锁 dropdown + 集成 CreateWorkspaceModal + bell 智能跳转
- `components/workspace/WorkspaceSwitcher.tsx`（新）—— dropdown 本体
- `components/workspace/CreateWorkspaceModal.tsx`（新）
- `components/workspace/InstallTokenModal.tsx`（新）
- `components/workspace/AddMemberModal.tsx`（新）
- `components/agents/AgentForm.tsx`（新）—— new / edit 共用
- `components/agents/ArchiveAgentButton.tsx`（新，用 ConfirmDialog）
- `components/ui/ConfirmDialog.tsx`（新，包 shadcn dialog）
- `app/approvals/page.tsx`（新）—— 顶层 hub，复用 S3 的 ApprovalCard / Section 组件
- `app/w/[wsId]/agents/new/page.tsx` / `[agentId]/page.tsx`（新）
- `app/w/[wsId]/runtimes/page.tsx`（新）
- `app/w/[wsId]/settings/page.tsx`（新）

### 3.4 边界原则

- **WorkspaceProvider 只做 ws 维度状态**——不管 agent/runtime/approval 这些 ws 内子资源
- **API client 是 base64 唯一边界**——上层组件/hook 永远拿干净 JS 对象，不知道也不关心 wire 格式
- **顶层 vs 单 ws hub 共用组件**——`ApprovalCard` 和 `ApprovalsList` 不变，只是数据源 hook 不同

---

## 4. Data flow（关键路径）

### 4.1 切换工作区

```
用户点 Sidebar dropdown 中 ws-B
  ↓
WorkspaceSwitcher.onSelect(wsId)
  ↓
1) localStorage.setItem('brainrot.lastWsId', wsId)
2) router.push(`/w/${wsId}`)
  ↓
新路由挂载 → useParams().wsId 变 → Context.currentWsId 自动变
```

### 4.2 创建工作区

```
用户点 dropdown 底部"+ 新建工作区"
  → CreateWorkspaceModal 打开 → 填 name + slug
  → useCreateWorkspace.mutate({ name, slug })
  → POST /api/v1/workspaces
  → onSuccess: invalidateQueries(['workspaces']) → close → router.push(`/w/${new.id}`)
```

错误：409 slug 冲突 → slug 字段红框。其他 → toast。

### 4.3 跨 ws bell badge

```
RootLayout 挂载 useGlobalPendingApprovalsCount()
  → 30s 轮询 GET /me/pending-approvals?count_only=1
  → WS 事件 approval.requested / approval.resolved 收到时 invalidate query
  → 返回 { count: N } → Badge 渲染数字
  → 用户点 bell：
      - 路径含 /w/[wsId]/ → router.push(`/w/${wsId}/approvals`)
      - 其他            → router.push('/approvals')
```

Bell 只显示 count，不弹下拉预览（推 S5）。

### 4.4 顶层 /approvals hub

```
/approvals 挂载
  → useGlobalPendingApprovals() → GET /me/pending-approvals
  → 按 ws 分组（一级 group） → 每条 ApprovalCard 加 ws 名 chip
  → approve/deny 复用现有 useResolveApproval
  → onSuccess: invalidate ['me','pending-approvals'] + ['ws',wsId,'approvals']
```

### 4.5 Agent 创建（含 base64 边界）

```
/w/[wsId]/agents/new 表单
  → 用户填字段
  → 三个 textarea 各自 JSON.parse 失焦校验
  → 提交：useCreateAgent.mutate(parsed)
  → lib/api/agents.ts createAgent(input):
      入参已 parsed → 直接 POST raw JSON（后端 POST 就吃这个形态）
  → 后端返回 Agent（custom_env 是 base64 string）
  → decodeAgentResponse(wire) → Agent：
      base64decode(wire.custom_env) → JSON.parse → Record<string,string>
      同理 custom_args / mcp_config
  → onSuccess: invalidate ['ws',wsId,'agents'] → router.push(`/w/${wsId}/agents/${new.id}`)
```

类型分层：
- `AgentWire`（`lib/api/types.ts`）—— 贴近后端，三字段是 `string`（base64）
- `Agent`（`lib/api/types.ts`）—— 解码后形态，三字段是 `Record<string,string>` / `string[]` / `Record<string,any>`

### 4.6 签发 install-token

```
/w/[wsId]/runtimes 页右上"+ 签发安装 Token"按钮
  → useIssueInstallToken(wsId).mutate()
  → POST /workspaces/{wsId}/install-tokens
  → 返回 { token, expires_at }
  → InstallTokenModal 打开，明文显示 token + 命令片段 + 失效时间
  → 用户复制 → 关 modal → modal 局部 state 清空
```

Token **不进** React Query 缓存。明文 secret 只活在 modal 开着期间的局部 state。

### 4.7 添加成员

```
/w/[wsId]/settings → "+ 添加成员"
  → AddMemberModal 打开 → 填 user_id (UUID) + role 下拉
  → useAddMember(wsId).mutate({ userId, role })
  → POST /workspaces/{wsId}/members → 204
  → onSuccess: close modal + toast "已添加"
  (无 GET members → 不刷新列表；BACKEND_GAPS #20 补后再加 invalidate)
```

---

## 5. Error handling / loading / empty state

### 5.1 错误分类

| 档 | HTTP / 类型 | UI 处理 |
|----|------------|---------|
| 字段级 | 400 / 422 + 已知字段 | 表单字段红框 + helper text |
| 业务级 | 403 / 409 / 404 | toast 顶部红条 + 后端 message |
| 网络/未知 | 5xx / fetch fail | toast "网络异常，请稍后重试" + console.error 原始 |

具体映射：

| Mutation | 已知错误 | 处理 |
|---|---|---|
| createWorkspace | 409 slug 冲突 | slug 字段红框 |
| createAgent / updateAgent | 409 handle 冲突；400 invalid runtime_id | handle 字段红框；runtime 下拉重选 |
| archiveAgent | 403 非 owner | toast "仅 owner 可归档" |
| addMember | 404 user_id 不存在；409 已是成员；403 非 owner | UUID 字段红框 / toast |
| issueInstallToken | 403 非 owner | toast |

### 5.2 Loading 策略

- **Query 类**：sidebar dropdown 首次打开 skeleton 3 行；runtimes 表 skeleton；/approvals 复用 S3 loading 态
- **Mutation 类**：按钮 disabled + spinner + 文案 "创建中..." / "归档中..."；modal 不锁，可关闭；mutation 飞行中关 modal 请求继续走完，结果 toast

### 5.3 空状态

| 位置 | 文案 | CTA |
|---|---|---|
| Sidebar dropdown（无 ws） | "还没有工作区" | "+ 新建工作区" |
| `/approvals` 顶层（无 pending） | "全部审批已处理 ✓" | 无 |
| `/w/[wsId]/agents`（无 agent） | "还没有 agent" | "+ 新建 agent" |
| `/w/[wsId]/agents`（全部归档） | "所有 agent 都已归档" | toggle 提示 |
| `/w/[wsId]/runtimes`（无 daemon） | "还没有 daemon 接入" + 解释 | "+ 签发安装 Token" |
| `/w/[wsId]/settings` 成员区 | "成员列表即将上线" + 解释 | "+ 添加成员" |

### 5.4 首次登录无 ws

```
登录成功 → /me → useWorkspaces() 拉列表
  - 非空：localStorage.lastWsId 若仍在列表 → 跳；否则跳列表第一个
  - 为空：跳 `/onboarding`（保留原"粘 wsId" UI，S5/S6 再改造）
```

---

## 6. Testing strategy

### 6.1 三层

| 层 | 工具 | 覆盖什么 |
|---|---|---|
| Unit | Vitest | API client 编/解码、表单 JSON 校验、bell 跳转决策 |
| Hook integration | Vitest + MSW | mutations success/error 路径 + invalidate 正确 |
| Manual QA screenshots | live backend + 截图存 `qa/s4/` | 视觉验收 + 端到端冒烟 |

不做 Playwright / Cypress / Storybook（与 S0-S3 一致）。

### 6.2 Unit 必覆盖

- `encodeAgentPayload`：JS 入参透传不加 base64
- `decodeAgentResponse`：base64 string → JS 对象；空字段（null / `""`）兜底成 `{}` / `[]`
- `decodeAgentResponse` 错误兜底：base64 解出非合法 JSON → 抛明确错
- 表单 JSON 校验 helper：合法 / 空 / 非法 三种返回正确
- `WorkspaceProvider`：`currentWsId` 派生自 `useParams`（mock router）
- Bell 跳转决策：`/w/[wsId]/*` 跳单 ws；其他跳顶层

### 6.3 Hook integration（MSW）

- `useCreateWorkspace`：成功 → invalidate workspaces + 返回新 ws
- `useCreateAgent`：成功 → invalidate agents；409 → 错误透传
- `useArchiveAgent`：成功 → invalidate agents
- `useIssueInstallToken`：成功 → token **不进**缓存（验证缓存查不到）
- `useAddMember`：成功 → 204 解析正确；409 → 错误透传
- `useGlobalPendingApprovalsCount`：WS approval.requested → query 被 invalidate

### 6.4 Manual QA 清单（每条存截图 qa/s4/）

**Sidebar / 切换器**
1. 多 ws 用户打开 dropdown，看到全部 + 当前打勾
2. 单 ws 用户打开 dropdown，1 个 + "+ 新建工作区"
3. 点 "+ 新建" → modal → 合法填 → 跳新 ws 首页
4. slug 冲突 → 字段红框

**跨 ws bell + /approvals**
5. ws-A 2 个 + ws-B 1 个 pending → bell 显 3
6. 在 `/w/[wsA]/projects` 点 bell → 跳 `/w/[wsA]/approvals`
7. 在 `/approvals` 点 bell → 不动
8. /approvals 显示按 ws 分组卡片，每卡 ws chip

**Agent CRUD**
9. /agents/new 填全 → 创建 → 跳详情
10. 三个 JSON textarea 非法 → 红框 + 提交 disabled
11. /agents/[id] 编辑保存 → 列表刷新
12. 归档 → ConfirmDialog → 列表消失 → toggle 显示已归档 → 出现

**Runtimes + Install-Token**
13. /runtimes 在线/离线列表（空环境 → 空状态 + CTA）
14. 签发 token → modal 显示 token + 命令片段 + 失效时间
15. 复制按钮 work，命令片段复制也 work
16. 关 modal 再签 → 新 token，旧不残留

**Settings**
17. /settings 显示基本信息（name / slug / 创建于）
18. "我的 user ID" 显示 + 复制 work
19. 加成员 modal 合法 UUID + role → 成功 toast
20. 加成员非法 UUID → 字段红框
21. 危险操作区显示 disabled 占位

---

## 7. BACKEND_GAPS 新增 + 安全 + 性能

### 7.1 BACKEND_GAPS 增量

| # | 标题 | 优先级 | 说明 |
|---|---|---|---|
| #19 | 缺按 email 邀请成员接口 | S5 阻塞 | `POST /workspaces/{ws}/invitations { email, role }` + 被邀请人 inbox 接受。S4 workaround：手贴 user_id |
| #20 | 工作区成员管理 + 元信息 RESTful 完善 | S5 阻塞 | 缺：`GET /workspaces/{ws}/members`、`PATCH /workspaces/{ws}` 改 name/slug、`PATCH .../members/{user}/role`、`DELETE .../members/{user}`、`POST .../archive`。S4 settings 危险区 disabled |
| #21 | agent 字段读写不对称（GET 返 base64 []byte，POST 收 raw JSON） | 非阻塞 | sqlc 把 jsonb 列生成 `[]byte`，Go 默认 base64 编码；handler 应手动 unmarshal 回写。S4 workaround：前端 `lib/api/agents.ts` 做 decode 边界 |

#18 (promoteQueued) 仍开放，与 S4 无关。

### 7.2 安全注意

| 项 | 风险 | 处理 |
|---|---|---|
| install-token 明文 | 进缓存即泄露 | 不进 React Query；仅 modal 局部 state；关闭即清；console.log 走 `NEXT_PUBLIC_DEBUG_TOKENS=1` 开关 |
| user_id UUID 粘贴 | 用户随便贴 | 后端 owner-only 403 兜底；前端只格式校验 |
| custom_env textarea | API key 浏览器 autofill 抓取 | 关 modal / 离开页面时清空 textarea；不入 React Query 缓存 |
| 跨 ws bell 数据 | localStorage 残留 | 仅在 React Query 内存，会话级 |

### 7.3 性能注意

- `useGlobalPendingApprovalsCount`：30s 轮询 + WS 事件 invalidate（双源防 WS 漏事件）
- `useWorkspaceRuntimes`：首次拉 + WS 事件维护 online/offline，不轮询
- `/approvals` 顶层 hub：典型 < 50 条 pending，不分页
- Sidebar dropdown：假设 < 30 个 ws，不虚拟滚动

---

## 8. Development order

依赖图（PR#4/#2/#3 已合到 main 为前置 T0）：

```
T0  前置：PR#4 → PR#2 → PR#3 合并；基于 main 开 s4-workspace-mgmt 分支
T1  WorkspaceProvider + useCreateWorkspace
T2  Sidebar 解锁 + WorkspaceSwitcher + CreateWorkspaceModal（依赖 T1）
T3  跨 ws bell + /approvals 顶层 hub + bell 智能跳转（依赖 T1）
T4  lib/api/agents.ts base64 边界 + AgentWire/Agent 类型分层
T5  Agent CRUD（/agents/new + /agents/[id] + 归档 + ConfirmDialog 基件 + 显示已归档 toggle）（依赖 T4）
T6  /w/[wsId]/runtimes 页 + InstallTokenModal
T7  /w/[wsId]/settings 页 + AddMemberModal + 我的 user ID + 危险占位
T8  Manual QA 截图 + 更新 BACKEND_GAPS #19/#20/#21 + FRONTEND.md M5 标完成
```

并行机会：T2 与 T3 / T4 独立；T3 与 T4 独立。建议串行执行（subagent-driven，每 T 一 commit）以便审查清晰。

### 8.1 PR 形态

一个 S4 大 PR（branch: `s4-workspace-mgmt`），内部 T1-T8 各一组 commit。与 S3 保持一致风格。

### 8.2 风险点

1. **PR#3 rebase 冲突**：`RightPanel.tsx` approvals hook 名换成 `useTaskApprovalsHistory`，T0 阶段处理
2. **agent base64 假设已实测确认**（Q10 核查 `pkg/db/generated/agents.sql.go:45`），但前端首次踩坑，T4 单测要严
3. **WS 事件 vs 轮询 fallback** 双源 race，T3 写测试覆盖 WS 先到 / 轮询先到两种顺序
4. **install-token 明文不落盘**：T6 必 review 一遍——不 console.log（除 debug 开关）、不入 React Query 缓存、关 modal 清 state

---

## 9. 与其他文档的关系

- FRONTEND.md M5 "agent CRUD、runtime 列表" 段 → S4 完成后 T8 标记完成
- BACKEND_GAPS.md → T8 追加 #19 #20 #21
- API.md "鉴权矩阵" → S4 实现写操作时验证错误码与文档一致
- S3 spec `2026-05-17-s3-approvals-design.md` §10 → 本 spec 即承接其中"跨 ws 全局 count"和"顶层 hub"两项延后项

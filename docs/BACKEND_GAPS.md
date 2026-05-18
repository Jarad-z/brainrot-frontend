# Backend Gaps

> 前端开发期间发现的后端接口缺失 / 不一致 / TODO 清单。
> 每条记录格式：标题、状态、发现日期、影响、当前 workaround、需要后端做什么。

## #1 缺 `GET /api/v1/workspaces`（列我能进的工作区）

- **状态**：✅ 已完成（2026-05-17 验证）— 接口已实现 `internal/handler/workspace.go:26 List`，路由 `cmd/server/router.go:74`。返回 `[]Workspace`（snake_case），按 `updated_at desc`，未成员则返回 `[]`。Live 测试：`GET /api/v1/workspaces` → `200 []` / 含工作区数组。
- **原状态**：缺失
- **发现**：2026-05-16，S1 设计阶段
- **影响**：登录后无法引导用户进入工作区。首屏无法展示"我的工作区"切换器。
- **Workaround（S1）**：`localStorage.brainrot.lastWsId` 缓存 + `/onboarding` 引导页接受用户粘贴 wsId（试探 `GET /workspaces/{wsId}/projects` 验证成员资格）。Sidebar 工作区切换器 disabled。
- **Need**：`GET /api/v1/workspaces` → `Workspace[]`，无分页，按 `updated_at desc`。

## #2 缺 `GET /api/v1/workspaces/{wsId}/runtimes`

- **状态**：✅ 已完成（2026-05-17 验证）— 实现 `internal/handler/workspace.go:58 ListRuntimes`，路由 `cmd/server/router.go:79`。返回 `[]AgentRuntime`（包含 `online`、`last_heartbeat`），非成员 403。Live 测试：`GET /api/v1/workspaces/{ws}/runtimes` → `200 []`（新建工作区无 daemon 在线）。
- **原状态**：缺失（FRONTEND.md §16 已记录）
- **发现**：2026-05-16，S1 设计阶段
- **影响**：runtime 在线集合初始为空，刷新页面后丢失"哪些 daemon 在线"。
- **Workaround（S1）**：Sidebar runtime 灯全部 disabled，不显示。S3 起靠 WS `runtime.online`/`runtime.offline` 事件维护内存集合。
- **Need**：`GET /api/v1/workspaces/{wsId}/runtimes` → `AgentRuntime[]`。

## #3 `User` 返回 PascalCase 与其他 schema 不一致

- **状态**：✅ 已完成（2026-05-17 修复 + 验证）— `internal/service/auth.go:24` 的 `User` struct 已加 snake_case json tag (`id`/`email`/`name`)。Live 测试：`GET /me` → `{"id":"...","email":"...","name":""}`（之前是 `ID`/`Email`/`Name`）。前端 `lib/api/types.ts` 可以把 User 字段改回 snake_case 并去掉 ESLint 白名单。
- **原状态**：不一致（API.md 已写明）
- **发现**：2026-05-16，S1 设计阶段
- **影响**：TS 类型不能统一驼峰化，`User.ID` vs `Workspace.id` 容易写错。
- **Workaround（S1）**：`lib/api/types.ts` 保留 User 字段 PascalCase；ESLint `camelcase` 规则 `properties: never` 放行。
- **Need**：（可选优化）后端 `/me` 改 snake_case 与其他 schema 对齐。

## #4 缺写操作鉴权说明

- **状态**：✅ 已完成 — `docs/API.md` §"鉴权矩阵"（约第 523-549 行）列出了所有写接口的 role 要求（owner / editor / viewer）和失败码（401 / 403）。
- **原状态**：待补文档
- **发现**：2026-05-16，S1 设计阶段
- **影响**：S4 实现 agent CRUD 时不知道 403 vs 401 在哪些路径触发。
- **Workaround（S1）**：S1 不实现写操作；占位按钮 disabled。
- **Need**：API.md 加"鉴权矩阵"小节，每个写接口列出所需 role。

## #5 缺 `GET /api/v1/workspaces/{wsId}` 单个工作区详情

- **状态**：✅ 已完成（2026-05-17 验证）— 实现 `internal/handler/workspace.go:39 Get`，路由 `cmd/server/router.go:76`。Live 测试：`GET /api/v1/workspaces/{ws}` → `{"id":"...","name":"GapTest WS","slug":"...","owner_id":"...","created_at":"...","updated_at":"..."}`。
- **原状态**：缺失
- **发现**：2026-05-16，S1 设计阶段
- **影响**：`/w/[wsId]` 首页无法显示工作区名称。
- **Workaround（S1）**：hero 只显示项目数 "{N} 个项目"，不显示工作区名。
- **Need**：`GET /api/v1/workspaces/{wsId}` → `Workspace`。

## #6 `TaskCard` 响应包含未文档化的 `busy: boolean` 字段

- **状态**：✅ 已完成 — `docs/API.md` 第 452 行 TaskCard schema 已加 `busy: boolean` 字段说明（只在 list 接口返回）。SQL 见 `pkg/db/queries/tasks.sql:14`。Live 测试 list tasks 返回包含 `"busy":false`。
- **原状态**：schema 不一致（API.md 未列出）
- **发现**：2026-05-16，S1 manual QA 阶段
- **影响**：前端 `lib/api/types.ts` 没声明 `busy`，TS 允许（响应是 superset）但读 `busy` 字段时无类型支持。
- **Workaround（S1）**：不读 `busy`；S2 聊天阶段引入时再加入类型。
- **Need**：API.md 在 TaskCard schema 加 `busy: boolean` 字段说明（是否有 active run）。

## #7 `POST /api/v1/auth/login` 返回 200 + 明文 token 而不是 204 + 仅 cookie

- **状态**：✅ 已完成（2026-05-17 验证）— `internal/handler/auth.go:61` 改为 `w.WriteHeader(http.StatusNoContent)`，响应体留空，token 仅通过 `Set-Cookie: brainrot_session=...; HttpOnly` 落地。Live 测试：`POST /api/v1/auth/login` → `204 No Content`，header 含 HttpOnly cookie，body 为空。安全顾虑已解除。
- **原状态**：schema 不一致 + 潜在安全问题（API.md 写 204，HttpOnly cookie-only；实际 200 + `{"token":"..."}` 响应体）
- **发现**：2026-05-16，S1 manual QA 阶段
- **影响**：
  - 前端 `apiFetch<void>` 应当对 204 返回 undefined；现在 200 + JSON 走 `resp.json()` 路径，返回的 token 值被丢弃 —— 工作但语义错。
  - **安全顾虑**：明文 token 出现在响应体里，违背 HttpOnly cookie-only 的设计意图。任何能读 `/login` 响应的中间层（浏览器扩展、devtools、proxy log）都能拿到这个 token。如果后端也把它作为 cookie 设置了（应当如此），那 token 是双发，体内那份是冗余的；如果没设 cookie 而是希望前端自己存，那 HttpOnly 的承诺没兑现。
- **Workaround（S1）**：当前能跑通（cookie 看起来是设上了，因为后续 `/me` 用 cookie 验证通过）。前端忽略响应体 token。
- **Need**：后端确认 token 是否同时通过 `Set-Cookie` 落地。如果是 → 删除响应体的 token（与 API.md 对齐）；如果不是 → 改设 HttpOnly cookie 并删响应体 token。无论哪个分支，API.md 都要更新成实际行为。

## #8 缺 `GET /api/v1/tasks/{taskId}/messages?before=<created_at>&limit=N` 分页

- **状态**：✅ 已完成（2026-05-17 验证）— 实现 `internal/handler/frontend_gaps.go:261 ListTaskMessagesPaged`。当带 `?limit=` 或 `?before=` 时走 cursor-paged 路径，返回 `{messages: Message[], next_cursor: string}`；不带参数时退回全量升序（旧契约）。`before` 是 RFC3339Nano 时间戳。Live 测试：`?limit=10` → `{"messages":[],"next_cursor":""}`；无参数 → `[]`。
- **原状态**：缺失（API.md 标 TODO）
- **发现**：2026-05-16，S2 设计阶段
- **影响**：长任务（>1000 条消息）首次进入会全量拉一次。S2 实测 200 条量级跑得动。
- **Workaround（S2）**：全量拉，react-virtual 惰性渲染。
- **Need**：cursor-based 分页，response 加 `next_cursor` 字段。

## #9 缺 `GET /api/v1/tasks/{taskId}/artifacts`

- **状态**：✅ 已完成（后端 2026-05-17；前端 S3.1 2026-05-18 已接入：`hooks/useTaskArtifacts.ts`、`components/task-detail/RightTabs/ArtifactsTab.tsx`）— 实现 `internal/handler/frontend_gaps.go:31 ListTaskArtifacts`，路由 `cmd/server/router.go:93`。返回 `Artifact[]`，已过滤 `excluded = false`，按 `created_at DESC`。非成员 403。Live 测试：`GET /api/v1/tasks/{id}/artifacts` → `200 []`。
- **原状态**：缺失
- **发现**：2026-05-16，S2 设计阶段
- **影响**：任务详情页右栏"产出"tab 无数据可拉。
- **Workaround（S2）**：右栏 artifacts tab 显示 placeholder（EmptyState "S3 上线后启用"）。
- **Need**：`GET /api/v1/tasks/{taskId}/artifacts` → `Artifact[]`。

## #10 缺 `GET /api/v1/projects/{projectId}/assets`

- **状态**：✅ 已完成（后端 2026-05-17；前端 S3.1 2026-05-18 已接入：`hooks/useProjectAssets.ts`、`components/task-detail/RightTabs/AssetsTab.tsx`）— 实现 `internal/handler/asset.go:14 List`，路由 `cmd/server/router.go:88`。返回 `Asset[]`，按 project 维度。Live 测试：`GET /api/v1/projects/{pid}/assets` → `200 []`。
- **原状态**：缺失
- **发现**：2026-05-16，S2 设计阶段
- **影响**：任务详情页右栏"素材"tab 无数据可拉。
- **Workaround（S2）**：右栏 assets tab 显示 placeholder（EmptyState "S3 上线后启用"）。
- **Need**：`GET /api/v1/projects/{projectId}/assets` → `Asset[]`。

## #11 缺 `GET /api/v1/tasks/{taskId}/approvals`

- **状态**：✅ 已完成（2026-05-17 验证）— 实现 `internal/handler/frontend_gaps.go:77 ListTaskApprovals`，路由 `cmd/server/router.go:94`。返回 `TaskApprovalItem[]`（`ApprovalRequest` + `agent_id` + `agent_handle`，避免 N+1 lookup），按 `created_at DESC`。同时还有 `GET /workspaces/{ws}/approvals?status=` 和 `GET /me/pending-approvals[?count_only=1]` 两个 hub 视图。Live 测试：`GET /api/v1/tasks/{id}/approvals` → `200 []`。
- **原状态**：缺失（S2 实际**未阻塞**，审批历史从 messages filter 派生）
- **发现**：2026-05-16，S2 设计阶段
- **影响**：S3 做跨 task/跨工作区审批 hub 时需要此 endpoint。S2 仅作记录。
- **Workaround（S2）**：`useApprovalsHistory(taskId)` 从 `useTaskMessages(taskId)` 过滤 `permission_request` 类消息。
- **Need**：`GET /api/v1/tasks/{taskId}/approvals` → `ApprovalRequest[]`。

## #12 `permission_request` 消息 payload schema 未明确

- **状态**：✅ 已完成 — `docs/API.md` 第 264 行更新：`permission_request` payload 包含 `approval_id`、`tool_name`、`tool_input`、`expires_at`、`agent_id`、`agent_handle`。WS `approval.requested` 事件 payload 也对齐（第 389 行）。前端可移除 optional 兜底，按 `approval_id` 直接作为 key。
- **原状态**：schema 不完整（API.md 仅列 `tool_use_id` + `tool_name`）
- **发现**：2026-05-16，S2 设计阶段
- **影响**：前端渲染 ApprovalCard 需要 `approval_id`、`tool_input`、`expires_at` 才能完整工作（按钮决策路由、倒计时、命令摘要）。
- **Workaround（S2）**：`lib/parse-message.ts` 把这三个字段标 optional；前端按 `approval_id ?? tool_use_id` 兜底 key。`tool_input` 缺失时显示 "(无参数)"，`expires_at` 缺失时不显示倒计时。
- **Need**：后端确认消息 payload 是否含这三个字段；API.md 更新 `permission_request` 行的 "关键字段" 列。

## #13 `TaskCard` schema 缺 `agents` 字段（任务关联的 agent 列表）

- **状态**：✅ 已完成（2026-05-17 验证）— `pkg/db/queries/tasks.sql:15-22` `ListTaskCardsByProject` 现返回 `agents: uuid[]`（来自 `agent_task_queue` 的 DISTINCT agent_id，无 agent 时返回 `[]`）。`docs/API.md:453` 已写明字段语义。Live 测试 list tasks 返回 `"agents":[]`（新任务无派工记录）。前端可直接照 §"前端 unlock 路径" 的 5 行 snippet 渲染头像组。
- **原状态**：缺失 / 待 mock
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

## #14 跨工作区 pending approvals 聚合（hub + bell badge 全局模式）

- **状态**：✅ 后端已就绪（与 #11 同时落地，2026-05-17）— 后端实现了 `GET /api/v1/me/pending-approvals` 和 `GET /api/v1/me/pending-approvals?count_only=1`，以及 `GET /api/v1/workspaces/{ws_id}/approvals?status=`。S3 前端**未接入**，仍走"当前 ws 内 messages cache 派生"的本地聚合路径，因为 S3 设计阶段决策 Q1=c（仅当前 ws）。S4 接入 workspace switcher 时切到 `/me/pending-approvals?count_only=1` 即可。
- **发现**：2026-05-17，S3 设计阶段（spec 决策 Q1）
- **影响**：S3 阶段 bell badge / hub 仅展示"当前工作区"内的 pending。多 ws 全局视图（S4 workspace switcher）需要这些 endpoint 才能给跨 ws 总数。
- **前端 unlock 路径（S4）**：把 `usePendingApprovalsCount(wsId)` 内部从派生改为 `useQuery(["pending-approvals", "count"], () => apiFetch("/api/v1/me/pending-approvals?count_only=1"))`。hub 页同样接 `GET /me/pending-approvals` 拿到跨 ws 的完整列表，无需逐 task prefetch。
- **Need**：✅ 已满足，无后端工作。S4 实现。

## #18 `promoteQueued` 用错 agent — 排队消息被前一个 agent 接管（正确性 bug）

- **状态**：后端 bug（不是接口缺失，是行为错误）
- **发现**：2026-05-17，S3 后端代码审计
- **影响**：用户发的 "@editor xxx" 在被排队晋升时，实际由 **上一个跑完的 agent**（比如 writer）接管执行。msg.mentions 写的是 editor，但产生回复的是 writer。前端看不出这是 bug，因为 message 流照常更新，只是回复内容/风格"奇怪"——这是个**隐蔽的正确性 bug**。
- **场景复现**：
  1. alice 在任务 X 发 `@writer 写开头` → run-1 (writer, running)
  2. alice 等不及，再发 `@editor 加结尾` → 唯一索引 `idx_task_queue_card_active` 冲突，run 没入队；消息标 `metadata.queued=true`
  3. writer 跑完 run-1，status=done
  4. `internal/service/run.go:101 promoteQueued()` 被调，拿到 msg-2 (queued=true)
  5. ⚠️ `EnqueueTask(AgentID: run.AgentID)` —— 用的是刚跑完那条 run 的 `run.AgentID`（writer），**没解析 msg-2.content 里的 mentions**
  6. 结果：writer 收到 "@editor 加结尾" 的 prompt，由 writer 生成回复
- **根因（精确定位）**：`internal/service/run.go` 第 101-119 行 `promoteQueued`：
  ```go
  func (s *Run) promoteQueued(ctx context.Context, run dbgen.AgentTaskQueue) {
      msg, _ := s.q.NextQueuedMessage(ctx, run.TaskCardID)
      _, err := s.q.EnqueueTask(ctx, dbgen.EnqueueTaskParams{
          AgentID:   run.AgentID,     // ← bug：应当解析 msg.Content 的 mentions
          RuntimeID: run.RuntimeID,   // ← 同样应当查目标 agent 的 runtime
          ...
      })
  }
  ```
- **相关行为细节（一并影响修法）**：
  1. `FinishRun` 只在 `status == "done"` 时调 `promoteQueued`。**run failed / canceled / approval timeout 时排队消息永远不会被晋升**（msg.metadata.queued=true 永久滞留），用户必须重新发消息才能解锁。
  2. `NextQueuedMessage` 用 `ORDER BY created_at LIMIT 1`——FIFO，一次只晋升一条。如果 alice 连排了 3 条，要等 3 个 run 串行跑完。
  3. 同一个任务卡的"活跃 run"由 partial unique index 保证最多 1 行，无法并行。所以"msg-2 mention 多个 agent"时，修复方案要决定：串行排队 vs 全部入队但只能跑一个的 race。
- **修法（建议）**：
  ```go
  func (s *Run) promoteQueued(ctx context.Context, run dbgen.AgentTaskQueue) {
      msg, err := s.q.NextQueuedMessage(ctx, run.TaskCardID)
      if err != nil { return }

      var content struct{ Mentions []string `json:"mentions"` }
      _ = json.Unmarshal(msg.Content, &content)

      // Fallback：消息没 mention（理论上不应该，因为没 mention 就不会入队）
      // 时退回旧行为，仍按上一个 run 的 agent 派工，至少不让消息卡死。
      targets := content.Mentions
      if len(targets) == 0 {
          targets = []string{run.AgentID.String()}
      }

      // 串行入队：第一个 mention 直接派工，剩余的标 queued 等下一轮晋升。
      // 这保留了"task 一次只有 1 个 active run"的产品语义。
      promoted := false
      for _, agentIDStr := range targets {
          agentID, err := uuid.Parse(agentIDStr)
          if err != nil { continue }
          ag, err := s.q.GetAgent(ctx, agentID)
          if err != nil { continue }
          if !promoted {
              triggerID := msg.ID
              _, err := s.q.EnqueueTask(ctx, dbgen.EnqueueTaskParams{
                  WorkspaceID: run.WorkspaceID, TaskCardID: run.TaskCardID,
                  AgentID: agentID, RuntimeID: ag.RuntimeID,
                  TriggerMessageID: &triggerID,
                  AgentSnapshot: marshalAgent(ag),  // 拍当前快照，不复用 run.AgentSnapshot
                  SessionID:    resumeSessionFor(ctx, s.q, run.TaskCardID, agentID),
              })
              if err == nil { promoted = true }
          }
      }
      if promoted {
          _ = s.q.ClearMessageQueued(ctx, msg.ID)
      }
  }
  ```
  顺带修一个连带 bug：`SessionID: run.SessionID` 也错——session 是按 agent 维度的，writer 的 session 不能直接给 editor 用。应当用 `resumeSessionFor(taskCardID, agentID)` 查目标 agent 在该卡上的历史 session。
- **测试覆盖建议**：
  - case A：同 agent 排队（msg-1 @writer, msg-2 @writer）→ 行为不变，writer 接管 msg-2 ✅
  - case B：异 agent 排队（msg-1 @writer, msg-2 @editor）→ 修后由 editor 接管 ✅
  - case C：msg-2 mention 多个 agent（@editor @reviewer）→ editor 先跑，reviewer 仍 queued ✅
  - case D：run-1 failed → msg-2 永远不晋升（current behavior，需另立 gap 讨论是否要在 failed 时也促发晋升）
- **优先级**：高。这是正确性 bug 而非视觉问题；用户会看到 "@editor 帮我写" 但回复是 writer 风格的尴尬场面，且很难 debug（前端日志显示 mention 是 editor，后端 run 显示 agent 是 writer）。

## #19 缺按 email 邀请成员接口

- **状态**：✅ 已完成（2026-05-19，PR https://github.com/Jarad-z/brainrot/pull/2 squash 合并 `58d37cf`）— 实现 `POST /api/v1/workspaces/{ws_id}/invitations { email, role }`（`internal/handler/invitation.go`、`internal/service/workspace.go` `InviteByEmail`）。v1 不引入独立的 pending invite 表，直接按 email 查 `app_user` 加为成员：未注册用户 → 404 `ErrUserNotFound`；重复邀请 → 409 `ErrAlreadyMember`；非 owner → 403。后续若要 pending/accept 流程再单独立项。
- **原状态**：S5 阻塞
- **发现**：2026-05-18，S4 设计阶段
- **影响**：用户无法用 email 把他人加入工作区。必须手贴 UUID。
- **Workaround（S4）**：`/w/[wsId]/settings` "添加成员" 表单接收 user_id UUID；`AddMemberModal` 文案"邀请流即将上线，请粘贴对方的 user ID"；同页面提供"你的 user ID + 复制"让被邀请人取自己的 ID。
- **Need**：`POST /api/v1/workspaces/{ws}/invitations { email, role }` 创建邀请；被邀请人 inbox 接受后入会。
- **前端 unlock 路径**：把 `AddMemberModal` 表单从 user_id 改成 email，提交 `POST /workspaces/{ws}/invitations { email, role }`；处理 404（"对方还没注册，让 ta 先注册"）和 409（"已经是成员了"）。pending/accept 流暂时不存在，邀请即生效。

## #20 工作区成员管理 + 元信息 RESTful 完善

- **状态**：✅ 大部分已完成（2026-05-19，PR #2 `58d37cf`）— 实现 `GET /workspaces/{ws_id}/members`（返回 `[]ListMembersRow` 含 email/name/avatar/role/joined_at）、`PATCH /workspaces/{ws_id}/members/{user_id} { role }`、`DELETE /workspaces/{ws_id}/members/{user_id}` → 204、`PATCH /workspaces/{ws_id} { name?, slug? }`。归档 `POST /workspaces/{ws_id}/archive` **延后**：涉及多处下游过滤（project/runtime list 等），单独立项。
- **原状态**：S5 阻塞
- **发现**：2026-05-18，S4 设计阶段
- **影响**：用户无法看到当前工作区有谁、改 ws 名称/slug、改成员 role、移除成员、归档工作区。
- **Workaround（S4）**：`/w/[wsId]/settings` 成员区不渲染列表，只显示"成员列表即将上线"+ "添加成员"按钮；危险操作区显示 disabled 占位。
- **Need**：
  - ✅ `GET /api/v1/workspaces/{wsId}/members` → `WorkspaceMember[]`
  - ✅ `PATCH /api/v1/workspaces/{wsId} { name?, slug? }`
  - ✅ `PATCH /api/v1/workspaces/{wsId}/members/{user_id} { role }`
  - ✅ `DELETE /api/v1/workspaces/{wsId}/members/{user_id}` → 204
  - ⏸ `POST /api/v1/workspaces/{wsId}/archive` → 软归档延后
- **前端 unlock 路径**：`/w/[wsId]/settings` 成员区改为 list + 行内 role 切换 + 移除按钮；workspace 元信息表单接 PATCH。归档按钮继续 disabled 直到后端补上。

## #21 Agent 字段读写不对称（GET 返 base64 []byte，POST 收 raw JSON）

- **状态**：✅ 已完成（2026-05-19，PR #2 `58d37cf`）— 引入 `AgentView`（`internal/handler/jsonb.go`），handler `List` / `Create` / `Get` / `Patch` 在 `writeJSON` 之前把 `custom_env` / `custom_args` / `mcp_config` 三个 jsonb 列解码成 `map[string]string` / `[]string` / `map[string]any`。前端可以删除 `agents-encoding.ts` + `AgentWire`，统一用 `Agent` 类型。
- **原状态**：非阻塞（已 workaround）
- **发现**：2026-05-18，S4 设计阶段（实测 `pkg/db/generated/agents.sql.go:45` `CustomEnv []byte`）
- **影响**：GET `/api/v1/agents/...` 返回的 `custom_env` / `custom_args` / `mcp_config` 三个字段是 base64 string；POST 收 raw JSON object/array。前端必须分别 encode/decode。
- **根因**：sqlc 把 jsonb 列生成 `[]byte`，Go 默认 `json.Marshal([]byte)` 编码成 base64。handler `writeJSON(w, ag)` 直接吐 `ag` → 客户端拿 base64 string。
- **Workaround（S4）**：`lib/api/agents-encoding.ts` 提供 `decodeAgentResponse` / `encodeAgentInput`；类型分层 `AgentWire`（wire）vs `Agent`（decoded）；`lib/api/agents.ts` 是唯一边界。上层组件/hook 永远拿 `Agent`。
- **Need**：handler 把 `CustomEnv []byte` 在序列化前 `json.Unmarshal` 成 `map[string]string` / `[]string` / `map[string]any` 再 `writeJSON`。修后前端可删除 `agents-encoding.ts` + `AgentWire` 类型。
- **前端 unlock 路径**：删除 `lib/api/agents-encoding.ts`、`AgentWire` 类型分层；`lib/api/agents.ts` 直接 `apiFetch<Agent>` 即可。注意 `pgtype.Text` 字段（`avatar_url`、`model`）仍以 `{String, Valid}` 形态返回，与现有处理一致。

## #22 缺 `GET /api/v1/agents/{id}` 和 `PATCH /api/v1/agents/{id}`

- **状态**：✅ 已完成（2026-05-19，PR #2 `58d37cf`）— 实现 `GET /api/v1/agents/{agent_id}` 和 `PATCH /api/v1/agents/{agent_id}`（`internal/handler/agent.go`，service `Agent.Update`）。PATCH 接受 `{name?, avatar_url?, description?, instructions?, model?, custom_env?, custom_args?, mcp_config?}`，**nil 指针 = 保留原值**，`{}` 或 `[]` = 显式清空，符合 partial-update 语义。响应同 list item，jsonb 字段已解码（见 #21）。注意：`handle` 不能改（保持唯一性约束）。
- **原状态**：发现于 S4 manual QA 2026-05-18
- **影响**：S4 agent 详情/编辑页 (`/w/[wsId]/agents/[agentId]`) 进不去 — 后端返回 405 Method Not Allowed。
- **当前后端实际只有**：
  - `GET /api/v1/workspaces/{ws_id}/agents` — 列表
  - `POST /api/v1/workspaces/{ws_id}/agents` — 创建
  - ✅ `GET /api/v1/agents/{agent_id}` — 单条
  - ✅ `PATCH /api/v1/agents/{agent_id}` — 更新
  - `DELETE /api/v1/agents/{agent_id}` — 归档
- **Workaround（S4）**：`hooks/useAgent.ts` 改为从 `useWorkspaceAgents(wsId)` 列表里 `.find()` 派生；详情页变成只读视图，显式提示"编辑暂未开放"。
- **修后前端动作**：恢复 `lib/api/agents.ts` 里的 `fetchAgent` / `updateAgent` 调用；`hooks/useAgent.ts` 改回 `useQuery`；详情页改回 `useUpdateAgent` mutation。注意 PATCH body 用 `null`/省略来表达"不改"，用 `{}` 来表达"清空"。

## #23 `GET /me/pending-approvals` response 包了 `{count, items}` 而不是裸数组

- **状态**：✅ 已完成（2026-05-19，后端 PR #2 `58d37cf` + 前端 PR https://github.com/Jarad-z/brainrot-frontend/pull/7 `1a7c37c` 已合并）— 后端默认改返回裸 `PendingItem[]`；`?count_only=1` 分支保留 `{count}`（语义不同，故意保持）。前端 `lib/api/me.ts` 同步删除 `ListResponse` 类型 + `r.items` 解包，直接 `apiFetch<PendingApproval[]>`。**部署须协同**：两个 PR 任何一个先单独上线都会让 `/approvals` 页崩。
- **原状态**：发现于 S4 manual QA 2026-05-18
- **影响**：S4 顶层 `/approvals` 页首次实现时按裸数组解析 → 客户端崩溃（`Application error`）。
- **当前后端**：`internal/handler/frontend_gaps.go:245` 返回 `{count: N, items: PendingItem[]}`，count_only=1 时返回 `{count: N}`。
- **Workaround（S4）**：`lib/api/me.ts` 加 `ListResponse` 类型解开 `{items}` 字段返回 `PendingApproval[]`；`PendingApproval` 类型同步对齐后端字段（`project_name` 而非不存在的 `workspace_name`）。
- **Need**：要么 API.md 写清楚 response shape；要么把 list endpoint 改成裸 array（与 ws-scope `/workspaces/{ws}/approvals` 风格对齐）。
- **次要 follow-up（仍待办）**：`PendingItem` 缺 `workspace_name` — 前端要 `useWorkspaces()` 二次查询补 ws 名。本次未一并修，建议下次后端 PR 加上这个字段，前端可以省一次查询。

## #24 `message.content` 和 `message.metadata` 也是 base64 string（同 #21 根因）

- **状态**：✅ 已完成（2026-05-19，PR #2 `58d37cf`）— 引入 `MessageView`（`internal/handler/jsonb.go`），所有读 message 的接口（`MessageHandler.List` / `Append`、`GapHandler.ListTaskMessagesPaged` 的全量与分页两条路径）都在 `writeJSON` 前把 `content` 与 `metadata` 反序列化成 `map[string]any`。前端可以删除任何 base64 解码兜底，直接 `msg.content.text` / `msg.metadata.queued`。
- **原状态**：发现于 2026-05-18 backend smoke test（`fix/cancel-clears-queued-messages` 分支验证）
- **影响**：
  - 前端从 `GET /api/v1/tasks/{taskId}/messages` 拿到的 `content` 字段是 base64 string，不是 `{text, mentions}` 嵌套对象 —— 直接 `msg.content.text` 永远是 `undefined`。
  - `metadata` 同样问题：要判断 `metadata.queued === true` 必须先 base64 解码 + JSON.parse。
- **根因**：跟 #21 一样 —— sqlc 把 `message.content`/`metadata` 两个 jsonb 列生成 `[]byte`，Go 默认 `json.Marshal([]byte)` 编码成 base64。`pkg/db/generated/messages.sql.go:104` `Metadata []byte`，content 同样。
- **复现**：smoke test 里 PowerShell 必须这么解：
  ```powershell
  $bytes = [Convert]::FromBase64String($m.metadata)
  $meta  = [System.Text.Encoding]::UTF8.GetString($bytes)  # "{"queued":true}"
  ```
- **Workaround（任何调用 `/messages` 的前端代码）**：跟 agents-encoding.ts 类似的处理 —— 拿到 wire 后立刻解码 content/metadata 两个字段。建议加 `lib/api/messages-encoding.ts` 复用。
- **Need**：跟 #21 一起修。Handler 在 `writeJSON(w, msgs)` 之前把 `content` 和 `metadata` 两个字段从 `[]byte` 反序列化成结构化对象再吐出。修后影响所有读 message 的接口：`GET /tasks/{id}/messages`、`GET /tasks/{id}/messages?before=...&limit=...`（#8 那个 paged 版本）、`POST /tasks/{id}/messages` 响应里的 `message` 字段。
- **优先级**：高 —— 这是任何聊天 UI 都必须正确读 `text` 字段才能渲染。S2 阶段如果靠 `String.fromCharCode(...atob(b64))` 这种临时拼凑 hacky 解决了，请加 follow-up 用统一 encoding 层。

## #25 `runtime.online` 标志滞后到第一次 heartbeat（~15s），而不是 WS 连上的瞬间

- **状态**：✅ 已完成（2026-05-19，PR #2 `58d37cf`）— daemon WS 连上后服务端立刻 `SetRuntimeOnline(true)`；断开后延迟 1.5s 防抖（短时重连不翻 offline，避免 sweeper 误判 active run 为 `runtime_offline`），用 `Hub.IsConnected` 判断是否被新连接顶替。同时收紧 `MarkRuntimesStale`：`last_heartbeat IS NOT NULL` 守卫避免 WS 刚连上、首次 heartbeat 还没到时被立刻扫成 offline。daemon 端也在 `ctx.Done()` 时主动关 WS（之前要等服务端 30s ping/read deadline）。e2e 新增 `TestDaemon_WSDisconnect_FlipsOfflineImmediately` 覆盖。
- **原状态**：发现于 2026-05-18 backend smoke test
- **影响**：用户启动 daemon 后立刻看 `/workspaces/{ws}/runtimes`，会看到 `online: false`、`last_heartbeat: null`，要等到 ~15 秒后第一次 heartbeat 到达才翻成 `online: true`。Sidebar runtime 灯 / agent 可用性指示会有 15 秒"假离线"窗口。
- **复现**：
  ```
  daemon 启动 → WS 立刻连上（server 日志 daemon ws: connected）
                    ↓
  curl /workspaces/{ws}/runtimes → online: false, last_heartbeat: null
                    ↓ (~15s 后第一次 heartbeat)
  curl /workspaces/{ws}/runtimes → online: true
  ```
- **根因**：`online` 字段由 server 根据 `last_heartbeat` 派生（`heartbeat_interval=15s` 是 daemon.yaml 默认值）。WS connect 这条信号没用于翻转 `online`。
- **Workaround（前端）**：UI 上对新建 daemon 显示 "等待 daemon 上线..." 的过渡态，至少 20s；不要拿首次响应的 `online: false` 直接标红离线。或者前端订阅 WS `runtime.online`/`runtime.offline` 事件（这两个事件应该是 daemon WS 真连上时发的，而不是看 heartbeat）。
- **Need**：server 在 `daemonws.Hub` 接收到 WS connect 时，立刻把对应 runtime 的 `online=true` 写库（或者至少派生时检查 hub 在线状态而非只看 heartbeat）。WS disconnect 时翻 `online=false`。这样 list API 反映的就是即时状态，前端无需 polling 等 heartbeat。
- **优先级**：中 —— 是 UX 顺滑问题，不阻塞功能；但用户每次起 daemon 都会经历这个不必要的"假离线"窗口，体感差。

## #26 缺 `GET /api/v1/tasks/{taskId}/runs` 端点

- **状态**：✅ 已完成（2026-05-19，PR #2 `58d37cf`）— 实现 `GET /api/v1/tasks/{task_id}/runs`（`internal/handler/runs.go`），返回 `RunView[]` 按 `created_at DESC`。⚠️ **不返回 `agent_snapshot` 和 `metadata`**：code review 发现 `agent_snapshot` 内嵌 `CustomEnv`（API key），裸返回会让 workspace viewer 拿到密钥；`RunView` 主动裁掉这两个字段，只暴露 `id` / `workspace_id` / `task_card_id` / `agent_id` / `runtime_id` / `trigger_message_id` / `session_id` / `status` / `error` / `created_at` / `claimed_at` / `started_at` / `finished_at`。
- **原状态**：发现于 2026-05-18 backend smoke test
- **影响**：
  - 前端无法直接列出某张 card 的 run 历史（pending / running / canceled / done / failed 各几条）。
  - 取消 run 后，前端要知道"被取消的那个 run"的 ID + status 翻转，只能从 message 列表里数 `agent`-role 消息推断 —— 而 agent 消息和 run 不是 1:1（real backend 一个 run 会发 5 条不同类型的事件消息）。
  - Cancel 后 UI 想展示"这个 run 已取消"的灰条目，没接口可调。
- **当前后端**：service 层有 `Run.ListByCard`（`internal/service/run.go`），SQL `ListRunsByCard` 也在 `pkg/db/queries/queue.sql:46`，但**没有 HTTP 路由暴露**。`cmd/server/router.go` 里没注册。
- **复现**：smoke test 里我只能从 daemon 日志的 `handleTask: workdir=... run=<uuid>` 行数推断 "daemon 实际 claim 了几个 run"。这对前端不可行。
- **Workaround（前端）**：从 `/messages` 响应里收集 `task_run_id` 字段去重，间接得到 run id 列表 + 推断 run 状态。复杂且脆弱（不同事件类型的消息字段不一致）。或者订阅 WS `run.completed` / `run_canceled` 事件维护本地 run 状态机。
- **Need**：暴露 `GET /api/v1/tasks/{taskId}/runs` → `Run[]`，按 `created_at desc`。每条带 `id` / `agent_id` / `runtime_id` / `status` / `created_at` / `finished_at` / `error`。Handler 直接调已有的 service 方法即可，5 行代码。
- **优先级**：中。S2 如果只用消息流也能凑合；S3+ 有"取消/重跑"等 run 维度操作时刚需。

## #27 `message.text` 字段同时存在裸字段和嵌入 content 两种位置（推测）

- **状态**：✅ 已完成（2026-05-19，随 #24 一起修，PR #2 `58d37cf`）— 选择"修 #24 即可"的最小方案：没有把 `text` 提到顶层裸字段（避免双源），但 `content` 现在是真正的对象，前端可以直接 `msg.content.text`，不需要再 base64 解码。
- **原状态**：2026-05-18 backend smoke test 顺手发现的疑似不一致，未完整核实
- **症状**：smoke test 中 POST `/messages` body 是 `{ content: { text: "@smoker one", mentions: [agentId] } }`，server 端 handler `appendMsgReq.Content.Text` 正确读到。Service 把 `text` 存进 `message.content` 列（`json.Marshal(map[string]any{"text": text})`）。但 list 返回的 `Message` struct 暴露的字段是 `content` (jsonb 编码后)，没有顶层 `text` 字段。如果 S2 前端期待 `msg.text` 直接拿到字符串，会拿到 undefined。
- **影响**：跟 #24 部分重叠 —— 前端要拿 message 文本必须 `JSON.parse(atob(msg.content)).text`，没法 `msg.text`。
- **建议**：后端在 message 序列化时把 `text` 从 content jsonb 里提到顶层（同时保留 content 给以后可能的富格式字段），这样最常见的"读消息文本"操作不用解码 jsonb。或者**至少**把 content 反序列化成对象（即修 #24）。
- **优先级**：低 —— 修 #24 顺带就解决了。这一条主要是提醒前端**不要写 `msg.text`**，统一走 content 字段。

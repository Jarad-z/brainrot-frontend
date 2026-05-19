# S6 — Usability & Completeness 收尾

> 设计日期：2026-05-19。基于 S5 已合并到 main（PR #8）+ 后端 PR #4（#28/#29/#30 全部落地）的状态。

## 1. 目标与边界

S5 完成了「协作 + 上传」。S6 的定位是「日常用起来还差点意思的细节」+「完整闭环的最后几块」。本期不是新功能扩张期，是体验收尾与技术债清理。

**范围（6 个 deliverable）**

- **A** — Artifact 排除按钮（消费后端 #28）
- **B** — 离开工作区按钮（消费后端 #29）
- **D** — 图片 + PDF 首页文件预览（**阻塞**在新立的 BACKEND_GAPS #31）
- **I** — 拖拽上传（整页 DropZone）+ Composer 粘贴截图
- **J** — 删除 `parse-message.ts` / `enrich-message.ts` 里的 base64 兜底（消费后端 #30）
- **K** — Composer mention 序列化双空格修复

**明确不在 S6 范围**

- artifact 排除反悔路径 / "显示已排除" toggle（后端 GET 暂不支持 `?include_excluded=1`）
- 工作区软归档 / "归档工作区" 按钮（后端 ⏸）
- 视频 / 音频 / Office 文档预览
- 拖拽多文件 batch 进度条 / 部分失败 retry
- ConfirmDialog UX 统一规范、复制注册链接反馈时长（K 项的其他两条 nit）
- Composer asset-mention 新节点类型（粘贴截图只插纯文本提示）
- 真实 LLM call 联通（E）
- Cmd+K 全局搜索（F）
- Telemetry / Evaluations（L）
- 深色主题 / 移动端响应式 / WS owner 移交 / i18n / billing

## 2. 执行模型：3 个 PR 串行

| PR | 内容 | 依赖 |
|---|---|---|
| **PR1**（cleanup） | AgentForm runtime fallback + 显式 form errors；`lib/messages.ts` 新增文案；`CLAUDE.md` 入库；`.gitignore` 补 postmortem 排除；`BACKEND_GAPS.md` 追加 #31 | 无 |
| **PR2**（small wins） | A + B + J + K | PR1 已 merge |
| **PR3a**（drag + paste） | I 拖拽 + 粘贴截图 | PR2 已 merge |
| **PR3b**（preview） | D 图片 + PDF 首页预览 | PR3a 已 merge **且** 后端 #31 ready |

PR1 直接在当前 main 工作树落地（uncommitted 改动已经在那里）。PR2 起，**先从干净的 main 切 `.worktrees/s6-...` git worktree**，分支命名 `s6/pr2-small-wins`、`s6/pr3a-drag-paste`、`s6/pr3b-preview`。每个 PR 独立 review、独立 merge。

PR3b 若后端 #31 未在 S6 周期内 ready，则推到 S7，**S6 仍以 PR1 + PR2 + PR3a 收口**。

## 3. PR1 — Pre-S6 cleanup

**已有的 uncommitted 改动**：

- `components/agents/AgentForm.tsx` — runtime 异步到达时的 fallback（避免 select 显示首项但 state 为空导致 submit 静默失败）+ 显式 form-level error 文案
- `lib/messages.ts` — 上一项需要的新文案
- `.gitignore` — 增加 `docs/superpowers/reports/2026-05-19-pr10-revert-postmortem.md` 排除

**新增**：

- `CLAUDE.md` — 项目级 Claude Code 指引，目前是 untracked。入库。
- `docs/BACKEND_GAPS.md` — 追加 **#31 缺 `GET /api/v1/assets/{id}/blob` 与 `GET /api/v1/artifacts/{id}/blob`（raw bytes）**。Auth 同 list 端点（任意 ws 成员）。响应 `Content-Type` 取自 `mime_type` 列。SHOULD 支持 `Range` 请求（PDF 懒加载）。**前端 unlock 路径**：S6 PR3b 文件预览实现依赖。

**手测**：login → 创建 agent → 验证 runtime 默认选中、submit 出错时 form-level error 可见。

## 4. PR2 — A + B + J + K

### 4.1 A — Artifact 排除按钮

**文件触点**

- `components/task-detail/RightTabs/ArtifactsTab.tsx` — 每行 hover 时显示 "排除" 次要按钮（靠右）
- `components/task-detail/RightTabs/ArtifactRow.tsx`（若已拆分）— 按钮 + dialog 触发
- `lib/api/artifacts.ts` — 新增 `setArtifactExcluded(id: string, excluded: boolean): Promise<void>`，`PATCH /api/v1/artifacts/{id} { excluded }` 期望 204
- `hooks/useTaskArtifacts.ts` 旁新增 `useSetArtifactExcluded(taskId: string)` mutation hook
- `lib/messages.ts` — `excludeArtifact`、`excludeArtifactConfirm`、`excludeArtifactFailed`、`excludeArtifactForbidden`

**交互**

- 行 hover 显按钮（视觉静默）
- 点击 → `ConfirmDialog`：「确定要从产出列表里排除 `<filename>` 吗？这条不会再显示出来。」**不**承诺可反悔
- 确认 → mutation → `onSuccess` → `queryClient.invalidateQueries(queryKeys.tasks.artifacts(taskId))` → 行从列表消失
- `onError` 403（viewer）→ toast `excludeArtifactForbidden`；其它 → toast `excludeArtifactFailed`

**测试**

- `lib/api/artifacts.test.ts` — `setArtifactExcluded` 204 / 403 / 网络失败三分支
- `components/task-detail/RightTabs/ArtifactsTab.test.tsx` — 按钮可见 + dialog 流 + 成功后行消失

**手测**：起 daemon 跑一个 task 产 artifact → 排除一行 → 刷新页面验证仍然消失

### 4.2 B — 离开工作区按钮

**文件触点**

- `app/(app)/w/[wsId]/settings/page.tsx` — 危险区新增 "离开工作区" 按钮
- `lib/api/members.ts` — 新增 `leaveWorkspace(wsId: string): Promise<void>`，`DELETE /api/v1/workspaces/{wsId}/members/me` 期望 204
- `hooks/useLeaveWorkspace.ts`（新）— mutation hook
- `lib/messages.ts` — `leaveWorkspace`、`leaveWorkspaceConfirm`、`leaveWorkspaceLastOwner`、`leaveWorkspaceNotMember`、`leaveWorkspaceFailed`

**交互**

- 按钮**始终可点**（任何角色都可见）
- 点击 → `ConfirmDialog`：「确定要离开 `<wsName>` 吗？你将失去对所有项目和产出的访问权限。」
- 确认 → mutation
- `onSuccess` → `queryClient.invalidateQueries(queryKeys.workspaces.list())` + `localStorage.removeItem('brainrot.lastWsId')` + `router.replace('/')`
- `onError`：
  - `status === 409` → **dialog 不关**，把 body 文案换成 `leaveWorkspaceLastOwner`（「你是这个工作区唯一的 owner，先把另一个成员升级为 owner 再离开。」）+ 单 close 按钮（actionable info、不能用 toast）
  - `status === 403` → toast `leaveWorkspaceNotMember` + 直接 `router.replace('/')`（罕见，竞态）
  - 其它 → toast `leaveWorkspaceFailed`

**测试**

- `lib/api/members.test.ts` — `leaveWorkspace` 204 / 409 / 403 三分支
- `app/(app)/w/[wsId]/settings/page.test.tsx` — 409 时 dialog 不关、文案切换

**手测**：viewer 离开 → redirect；末位 owner 离开 → dialog 不关、显示 lastOwner 文案；非末位 owner 离开 → 成功 redirect

### 4.3 J — 删除 base64 兜底

**文件触点**

- `lib/parse-message.ts` — 删除 `coerceContent` 里 `typeof content === 'string'` → base64 decode → `JSON.parse` 分支。保留 "已经是对象就直接用" 的代码路径。
- `lib/chat/enrich-message.ts` — 删除 metadata 上的 base64 字符串兜底
- `lib/api/messages.test.ts` — 检查并删除任何显式断言 "base64 wire 也能正确解" 的 case

**风险**：后端 PR #4 之前的版本会让前端渲染空气泡。决策已选「直接删」，接受这个风险。

**测试**：用对象输入（`{text, mentions}` 直接结构）走 `parseMessageContent` 验证；不再 mock base64 输入。

**手测**：发消息 → chat 渲染正常、无空气泡

### 4.4 K — Composer mention 序列化双空格

**根因**

`components/chat/MentionExtension.ts:71` 选中 mention 后自动插入 `text(" ")` 是为了避免 `@coder你好` 挤一起。但用户通常也会手动敲一个空格，导致文档出现 `mention · text(" ") · text(" 你好")`，ProseMirror 合并相邻 text 后变成 `text("  你好")`，`lib/chat/serialize-editor.ts` 拼接产生 `@coder  你好`（双空格）。

**修法**

- 不动 `MentionExtension.ts`（保留自动空格的 UX 价值）
- 改 `lib/chat/serialize-editor.ts`：拼接结束后，用 `text.replace(/(@[A-Za-z0-9_-]+)  +/g, '$1 ')` 收掉 `@handle` 后紧跟的多空格
- 仅折叠 mention handle 紧后的多空格，不动其他位置的用户多空格

**测试**：`lib/chat/serialize-editor.test.ts`（新建）

- mention + 1 空格 + 文本 → 1 空格
- mention + 2 空格 + 文本 → 1 空格
- mention + 文本无空格 → 无空格（罕见但合法）
- 两个连续 mention（如 `@a @b 你好`）→ 各保留 1 空格
- mention 间无空格（病理）→ 不破坏

**手测**：Composer 输入 `@coder 你好` 发送 → 断点 / network 看 wire payload `text` 字段不带双空格

## 5. PR3a — I 拖拽 + 粘贴截图

### 5.1 DropZoneOverlay（全局）

**新文件**

- `components/upload/DropZoneOverlay.tsx`
- `hooks/useProjectIdFromRoute.ts` — 用 `usePathname()` 解析 `/w/[wsId]/p/[projectId]/...`，返回 `string | null`

**改动**

- `app/(app)/layout.tsx` — 在三栏布局外层挂 `<DropZoneOverlay />`（authenticated 区域才挂；`(public)` 不挂）
- `lib/messages.ts` — `dropZoneTitle`、`dropZoneSubtitle`、`uploadingN`、`uploadedN`、`uploadFailedOne`、`uploadFailedMany`

**行为**

- 事件挂在 `document` 上（`useEffect` + cleanup）
- `dragenter` / `dragover` → `preventDefault()` + `setIsDragOver(true)`；`dragenter`/`dragleave` 用 counter pattern 防抖（子元素切换不误触发 leave）
- `drop` → `preventDefault()` + 从 `e.dataTransfer.files` 拿文件 + 调上传
- **当 `projectId === null`（在 `/approvals`、`/settings`、agent 列表等非 task/project 路由）→ 不渲染 overlay、不调 `preventDefault`、浏览器默认行为接管**
- 当 `e.dataTransfer.types` 不包含 `'Files'` → 不接管（让纯文本/URL 拖拽走默认）

**视觉**

- `isDragOver && projectId !== null` 时全屏 `<div>`，`fixed inset-0 z-50 pointer-events-none`，`bg-paper-1/95`，`border-[3px] border-dashed border-ink-0`，中央大字：
  - 主标题：`dropZoneTitle`「拖拽到任意位置上传」
  - 副标题：`dropZoneSubtitle`「上传到当前项目的素材」
- `pointer-events-none` 是关键——保证 overlay 不抢底层 click，但 document level 的 drop 事件照常收到

**上传**

- 调 `uploadAssets(projectId, files)`（**复用 S5 已有 mutation**，定义在 `hooks/useUploadAssets.ts` 或 `lib/api/upload.ts`）
- 上传期：toast `uploadingN`（「正在上传 N 个文件...」）
- 全部成功：toast `uploadedN` + `queryClient.invalidateQueries(queryKeys.projects.assets(projectId))`
- 部分失败 / 全部失败：分别 toast `uploadFailedOne`，**>3 条失败时 collapse** 成 `uploadFailedMany`（「N/M 上传失败」）

### 5.2 PasteImageExtension（Composer）

**新文件**

- `components/chat/PasteImageExtension.ts` — Tiptap `Extension.create()` + `addProseMirrorPlugins()`
- `lib/upload/screenshot-filename.ts` — 给无原名的剪贴板文件生成 `screenshot-YYYYMMDD-HHmmss.png`

**改动**

- `components/chat/Composer.tsx` — 注册扩展，传入 `projectId` + upload mutation。**Extension 必须收到 `projectId`**，否则不注册插件（防御性，未来 Composer 复用到别处时不会无声跑挂）。
- `lib/messages.ts` — `pasteUploading`、`pasteUploadedOne`、`pasteUploadFailed`、`pasteInsertedHint`

**行为**

- ProseMirror `handlePaste` 钩子：遍历 `event.clipboardData.items`，收集 `kind === 'file' && type.startsWith('image/')` 的 File
- 若无图：`return false`（让默认 paste 处理文本/HTML/其它）
- 若有图：调上层注入的 `onPasteImages(files)` 回调，`return true`（ProseMirror 据此跳过默认 paste，不需要显式 `event.preventDefault()`）
- Composer 实现 `onPasteImages`：
  - 为每个文件生成 filename（剪贴板 File 通常无原名）
  - 调 `uploadAssets(projectId, files)`
  - **不**插入占位 mention（避免发送时引用尚未存在的 asset id）
  - 上传期：在 Composer 上方/下方显示 inline `pasteUploading` 小条
  - 成功：每张图调 `editor.commands.insertContent('已上传 <filename>（见右栏 Assets）\n')` 插入纯文本提示行 + toast `pasteUploadedOne`
  - 失败：toast `pasteUploadFailed`

**不支持的场景（明确）**

- 富文本粘贴（Word 复制带图段落）里的 `<img src="data:...">` 或 `<img src="https://...">` — 走默认 paste（不当截图处理）
- 浏览器 tab 间拖 PDF（`dataTransfer.files` 为空、只有 URL）— S6 不支持，让默认行为接管

### 5.3 测试

- `lib/upload/screenshot-filename.test.ts` — 时间戳格式
- `components/upload/DropZoneOverlay.test.tsx` — 用 `fireEvent` 模拟 `dragenter` / `drop`，断言 `projectId === null` 时不调 `preventDefault`、`projectId !== null` 时调用上传 mutation
- `components/chat/PasteImageExtension.test.ts` — 模拟剪贴板 items（图 / 文本 / 混合），断言 `handlePaste` 返回值与回调调用

**手测**

- 从桌面拖图（PNG/JPG）进 task 页 → toast 上传成功、Assets 列表出现新行
- 从桌面拖图进 `/approvals` 页 → 浏览器默认行为（新 tab 打开图片），无 overlay
- 截图 → Cmd+V 进 Composer → Composer 插入提示行、Assets 列表出现新行
- 拖文本（如从浏览器拖一段链接）进 task 页 → 不触发 overlay
- 拖多文件（3 张图）→ 各自 toast 成功、Assets 列表新增 3 行

## 6. PR3b — D 文件预览（依赖后端 #31）

> 后端 `GET /api/v1/assets/{id}/blob` 与 `GET /api/v1/artifacts/{id}/blob` ready 后启动。

### 6.1 新文件

- `lib/api/blob.ts` — `assetBlobUrl(id: string): string` / `artifactBlobUrl(id: string): string`，返回相对路径 `/api/v1/assets/{id}/blob` 等。**不**fetch + ObjectURL；`<img src>` / `<embed src>` 直接吃后端 URL，HttpOnly cookie 同源自动跟随
- `lib/media/mime.ts` — `isImage(asset)`、`isPdf(asset)`、`isPreviewable(asset)` 纯逻辑工具
- `lib/media/pdf-thumbnail.ts` — `renderPdfFirstPage(blobUrl: string): Promise<string>`（dataURL），内部走 `pdfjs-dist` `getDocument` → `getPage(1)` → `render(canvas)` → `canvas.toDataURL('image/jpeg', 0.6)`
- `lib/media/thumbnail-cache.ts` — sessionStorage 缓存，key = `pdfthumb:<sha256>`，TTL 不设（session 维度足够）
- `components/media/AssetThumbnail.tsx` — 60×60 缩略图组件
- `components/media/MediaPreviewModal.tsx` — 全屏 lightbox

### 6.2 改动

- `components/task-detail/RightTabs/AssetRow.tsx` — 替换文件名图标 → `<AssetThumbnail asset={a} />`；行 click → 打开 modal
- `components/task-detail/RightTabs/ArtifactsTab.tsx`（或 `ArtifactRow.tsx`）— 同上
- `package.json` — 加 `pdfjs-dist` 依赖
- `next.config.ts` — 视 Turbopack/webpack 行为决定是否需要 worker 专项 config（**实现时再定**，spec 不写死）

### 6.3 行为

**图片**

- 缩略图：`<img src={assetBlobUrl(id)} className="w-[60px] h-[60px] object-cover">`
- 大图：modal 内 `<img src={...} className="max-w-full max-h-full">`

**PDF**

- 缩略图：首次渲染时 fetch blob → pdf.js 渲染首页 → toDataURL → sessionStorage 缓存 by `sha256`；再渲染直接命中缓存
- 大图：modal 内 `<embed type="application/pdf" src={...}>`（浏览器原生 viewer）
- pdf.js worker 加载失败 / 字体缺失：缩略图退到通用 PDF 图标，点击仍能开 modal（embed 自己处理）

**其它类型（zip / md / 代码文件等）**：图标 + 不可点击（或点击仅显示 "下载" 按钮）

**MediaPreviewModal**

- 全屏 `fixed inset-0 z-50 bg-black/80`
- 顶栏：关闭按钮（×）+ 文件名 + 大小 + 「在新窗口打开」+ 「下载」
- ESC / 点遮罩关闭
- 同 Assets/Artifacts 列表内的多图：左右键 prev/next
- 不可预览类型：图标 + 「下载」按钮

### 6.4 测试

- `lib/media/mime.test.ts` — 纯逻辑
- `lib/media/thumbnail-cache.test.ts` — sessionStorage stub
- `lib/media/pdf-thumbnail.ts` 在测试时 `vi.mock` 整体替换；jsdom 不跑 worker / canvas
- `components/media/AssetThumbnail.test.tsx` — image 路径 / pdf 缩存命中路径 / fallback 图标路径

**手测**：上传 jpg/png/pdf → 列表里看到缩略图 → 点开 modal → ESC 关 → 左右键切换 → 下载链接可点

### 6.5 风险

- Next 15 + Turbopack 对 pdf.js worker 的支持：如不通则 fallback 到 `dynamic import` + 主线程渲染（性能差但能跑）
- 浏览器 `<embed>` PDF viewer 各浏览器表现不一（Chrome/Edge OK，Safari 部分功能受限）— S6 接受 best-effort

## 7. 全局约束

### 7.1 每个 PR 的 DoD

1. `pnpm typecheck && pnpm lint && pnpm test` 全过
2. `pnpm test:coverage` `lib/**` 80% 阈值不掉
3. **`pnpm dev` 起来、按 PR 章节里的手测脚本在浏览器走一遍**（S5 教训：tsc/lint/build 不能代替浏览器手测）
4. PR 描述列出：改动文件清单、手测脚本、已知未覆盖场景
5. 任何 backend gap 状态变化同步更新 `docs/BACKEND_GAPS.md`

### 7.2 文档更新

- **PR1**：`docs/BACKEND_GAPS.md` 追加 #31
- **PR2**：`docs/BACKEND_GAPS.md` 在 #28 / #29 / #30 「前端 unlock 路径」字段下标注 "已在 S6 实现"
- **PR3a**：`docs/FRONTEND.md` M7 章节追加 "拖拽 + 粘贴截图" 一段
- **PR3b**：`docs/FRONTEND.md` 追加 "文件预览" 一段；`docs/BACKEND_GAPS.md` 在 #31 标注已消费
- **API.md 不主动改**（API.md 是后端契约镜像，等后端实现 #31 后由后端方同步）

### 7.3 失败回退

- PR1 若 hook 失败 → 修底层问题（不绕 `--no-verify`）
- PR2 任何一项失败可单独 revert（A/B/J/K 互相不依赖）
- PR3a 失败 → revert 不影响 PR2
- PR3b 失败 → revert 不影响 PR3a；若后端 #31 整周期未 ready，PR3b 推 S7、S6 仍以 PR1+PR2+PR3a 收口

## 8. 验收清单（spec → 实现 → 完成）

- [ ] **PR1** merged，pre-S6 cleanup 在 main
- [ ] **PR2** merged，A/B/J/K 全部上线
- [ ] **PR3a** merged，拖拽 + 粘贴截图上线
- [ ] **PR3b** merged **或** 推到 S7（视后端 #31 排期）
- [ ] `docs/BACKEND_GAPS.md` 状态同步
- [ ] `docs/FRONTEND.md` 描述同步
- [ ] 全部 PR 通过浏览器手测脚本

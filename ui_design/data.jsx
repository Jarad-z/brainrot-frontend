// ====== Mock data for the prototype ======

const AGENTS = [
  { id: "ag-writer", handle: "writer", name: "Writer", desc: "Drafts copy & docs", color: "oklch(20% 0 0)", online: true, model: "claude-opus-4-7" },
  { id: "ag-coder",  handle: "coder",  name: "Coder",  desc: "Writes & refactors code", color: "oklch(35% 0 0)", online: true, model: "claude-sonnet-4-5" },
  { id: "ag-eng",    handle: "ux",     name: "UX-Eng", desc: "Prototype + design", color: "oklch(55% 0 0)", online: false, model: "claude-opus-4-7" },
  { id: "ag-data",   handle: "data",   name: "Analyst",desc: "SQL + data spelunking", color: "oklch(70% 0 0)",  online: true, model: "claude-sonnet-4-5" },
  { id: "ag-qa",     handle: "qa",     name: "QA",     desc: "Playwright + test plans", color: "oklch(45% 0 0)", online: true, model: "claude-haiku-4-5" },
  { id: "ag-old",   handle: "old-bot", name: "Old Bot", desc: "legacy", color: "oklch(70% 0 0)", online: false, model: "claude-haiku-4-5", archived: true },
];

const USER = { id: "u-me", name: "Alice", handle: "alice", color: "oklch(15% 0 0)" };

const WORKSPACES = [
  { id: "ws-1", slug: "lumen", name: "Lumen Labs", initials: "LL", color: "oklch(15% 0 0)" },
  { id: "ws-2", slug: "neon",  name: "Neon",        initials: "NE", color: "oklch(35% 0 0)" },
];

const PROJECTS = [
  { id: "p-launch", name: "夏季发布", desc: "v2.0 着陆页 + 文案 + 资产", swatch: "green", tasks: 12, open: 5, agents: ["ag-writer", "ag-eng", "ag-coder"] },
  { id: "p-onboard",name: "新手引导重构",  desc: "三步 onboarding，含 a/b 实验", swatch: "blue", tasks: 8, open: 3, agents: ["ag-eng", "ag-writer"] },
  { id: "p-data",   name: "周报数据管线",   desc: "拉数 → 校验 → 周报 markdown",  swatch: "amber", tasks: 6, open: 2, agents: ["ag-data", "ag-qa"] },
  { id: "p-design", name: "设计系统 v3",   desc: "tokens · 组件 · 文档站",      swatch: "violet", tasks: 14, open: 4, agents: ["ag-eng", "ag-coder", "ag-writer"] },
  { id: "p-internal",name: "内部工具维护",  desc: "bug 修 + 后台脚本",            swatch: "pink", tasks: 4, open: 1, agents: ["ag-coder", "ag-qa"] },
  { id: "p-research",name: "用户访谈整理", desc: "20 段录音 → 主题归纳",         swatch: "teal", tasks: 9, open: 3, agents: ["ag-writer", "ag-data"] },
];

const TASKS = [
  {
    id: "t-hero", projectId: "p-launch", title: "首屏 hero 文案 + 视觉",
    summary: "为 v2.0 着陆页起草首屏标题、副标题和 CTA，配两版视觉草图。",
    status: "in_progress", agents: ["ag-writer", "ag-eng"], updated: "14:32",
  },
  {
    id: "t-pricing", projectId: "p-launch", title: "新定价方案落地页",
    summary: "三个 tier，含年付/月付切换；写文案 + 实现交互。",
    status: "in_progress", agents: ["ag-writer", "ag-coder"], updated: "13:50",
  },
  {
    id: "t-faq", projectId: "p-launch", title: "FAQ 折叠组件",
    summary: "15 个常见问题，按主题分组。",
    status: "open", agents: ["ag-writer"], updated: "昨天",
  },
  {
    id: "t-press", projectId: "p-launch", title: "发布通稿草案",
    summary: "目标媒体 5 家，700 字内。",
    status: "open", agents: ["ag-writer"], updated: "昨天",
  },
  {
    id: "t-img", projectId: "p-launch", title: "OG 图 + favicon",
    summary: "OG 1200×630，多语种版本；favicon SVG。",
    status: "blocked", agents: ["ag-eng"], updated: "5/12",
  },
  {
    id: "t-deploy", projectId: "p-launch", title: "上线 checklist",
    summary: "DNS、CDN、回滚预案、监控告警。",
    status: "open", agents: ["ag-coder", "ag-qa"], updated: "5/12",
  },
  {
    id: "t-share", projectId: "p-launch", title: "社交分享卡片",
    summary: "Twitter / LinkedIn / 小红书三套尺寸。",
    status: "done", agents: ["ag-eng"], updated: "5/11",
  },
  {
    id: "t-seo", projectId: "p-launch", title: "SEO meta + sitemap",
    summary: "h1 层级、关键词、结构化数据。",
    status: "done", agents: ["ag-coder"], updated: "5/10",
  },
];

// Encoded structured messages for the active task
const TASK_MESSAGES = {
  "t-hero": [
    {
      id: "m1", role: "user", author: USER, time: "14:30",
      parsed: { type: "user", text: "@writer @ux-eng 帮我做 v2.0 着陆页的首屏。一行 hook + 一行副本 + 一个 CTA。语气年轻、直接，不要营销腔。" }
    },
    {
      id: "m2", role: "assistant", author: AGENTS[0], time: "14:30:08", runId: "a1b2",
      parsed: { type: "thinking", text: "目标受众应该是开发者+设计师双修人群。避免「赋能」「赋予」这种词。试两版：偏直白和偏戏谑。" }
    },
    {
      id: "m3", role: "assistant", author: AGENTS[0], time: "14:30:22", runId: "a1b2",
      parsed: {
        type: "assistant_text",
        text: "两版首屏，挑一版我接着推进：\n\n**版 A · 直白**\n标题：把 AI 当队友，不是工具\n副标：在你的项目里召唤 agent，他们写代码、做事、留产出。\nCTA：开个工作区\n\n**版 B · 戏谑**\n标题：你的下班 agent 已上线\n副标：@他们写、他们改、他们交。你点批准就好。\nCTA：试着 @ 一个"
      }
    },
    {
      id: "m4", role: "assistant", author: AGENTS[0], time: "14:30:24", runId: "a1b2",
      parsed: { type: "tool_use", tool: "Write", tool_use_id: "tu1", input: { file_path: "/launch/hero-copy-v2.md", content_preview: "# v2.0 Hero — 两版草稿…" } }
    },
    {
      id: "m5", role: "assistant", author: AGENTS[0], time: "14:30:24", runId: "a1b2",
      parsed: { type: "tool_result", tool_use_id: "tu1", ok: true, summary: "写入 /launch/hero-copy-v2.md · 1.4 KB" }
    },
    {
      id: "m6", role: "assistant", author: AGENTS[0], time: "14:30:25", runId: "a1b2",
      parsed: { type: "result", durationMs: 17200, tools: 1, status: "done" }
    },
    {
      id: "m7", role: "user", author: USER, time: "14:31",
      parsed: { type: "user", text: "B 版有意思。@ux-eng 你用 B 出一版首屏 mockup，要 chunky 圆角、明亮配色、不要 gradient。" }
    },
    {
      id: "m8", role: "assistant", author: AGENTS[2], time: "14:31:09", runId: "c3d4",
      parsed: { type: "assistant_text", text: "收到。我先建立一个 page 容器和 hero 组件，明亮浅米色背景，主色用一个 pop 绿。" }
    },
    {
      id: "m9", role: "assistant", author: AGENTS[2], time: "14:31:14", runId: "c3d4",
      parsed: {
        type: "tool_use", tool: "Edit", tool_use_id: "tu2",
        input: { file_path: "/web/app/(public)/page.tsx", old_lines: 18, new_lines: 42 }
      }
    },
    {
      id: "m10", role: "assistant", author: AGENTS[2], time: "14:31:15", runId: "c3d4",
      parsed: { type: "tool_result", tool_use_id: "tu2", ok: true, summary: "patched · +24 lines" }
    },
    {
      id: "m11", role: "assistant", author: AGENTS[2], time: "14:31:30", runId: "c3d4",
      parsed: {
        type: "permission_request", tool: "Bash", tool_use_id: "tu3",
        input: { command: "pnpm install lucide-react @radix-ui/react-dialog", cwd: "/web" },
        expiresInSec: 3501,
        note: "安装这两个依赖来支撑 hero 上的图标 + CTA 弹层。"
      }
    },
  ],
  "t-pricing": [
    {
      id: "m1", role: "user", author: USER, time: "13:42",
      parsed: { type: "user", text: "@writer 三档定价：Free / Pro $19 / Team $79。各写 4 条 bullet。" }
    },
    {
      id: "m2", role: "assistant", author: AGENTS[0], time: "13:43:01", runId: "z9", parsed: { type: "assistant_text", text: "好。先给出 bullet，最后给 CTA 文案。" }
    },
    {
      id: "m3", role: "assistant", author: AGENTS[0], time: "13:43:08", runId: "z9", parsed: { type: "result", durationMs: 6300, tools: 0, status: "done" }
    },
  ],
};

// pending approvals across all tasks (incl. cross-project ones)
const APPROVALS = [
  {
    id: "ap1", taskId: "t-hero", project: "夏季发布", taskTitle: "首屏 hero 文案 + 视觉",
    agent: AGENTS[2], tool: "Bash",
    input: { command: "pnpm install lucide-react @radix-ui/react-dialog", cwd: "/web" },
    expiresInSec: 3501,
  },
  {
    id: "ap2", taskId: "t-pricing", project: "夏季发布", taskTitle: "新定价方案落地页",
    agent: AGENTS[1], tool: "Write",
    input: { file_path: "/web/app/pricing/page.tsx", bytes: 4218 },
    expiresInSec: 2110,
  },
  {
    id: "ap3", taskId: "t-deploy", project: "夏季发布", taskTitle: "上线 checklist",
    agent: AGENTS[1], tool: "Bash",
    input: { command: "kubectl apply -f deploy/prod.yaml", cwd: "/infra" },
    expiresInSec: 1850,
  },
];

const MEMBERS = [
  { id: "u-me",   name: "Alice",  handle: "alice",  color: "oklch(15% 0 0)", email: "alice@lumen.dev", role: "owner" },
  { id: "u-bob",  name: "Bob",    handle: "bob",    color: "oklch(40% 0 0)", email: "bob@lumen.dev",   role: "member" },
  { id: "u-carol",name: "Carol",  handle: "carol",  color: "oklch(55% 0 0)", email: "carol@lumen.dev", role: "member" },
];

const RUNTIMES = [
  { id: "rt-1", name: "alice-mbp",     host: "192.168.1.20", os: "darwin", arch: "arm64", capacity: 4, online: true,  lastHeartbeat: Date.now() - 12_000 },
  { id: "rt-2", name: "ci-runner-01",  host: "10.0.0.55",    os: "linux",  arch: "amd64", capacity: 8, online: true,  lastHeartbeat: Date.now() - 4_000 },
  { id: "rt-3", name: "office-imac",   host: null,           os: "darwin", arch: "x86_64",capacity: 2, online: false, lastHeartbeat: Date.now() - 5 * 60_000 },
];

const ARTIFACTS = [
  { id: "art-1", taskId: "t-hero",    filename: "hero-copy-v2.md",        mime: "text/markdown",       sizeBytes: 1432, source: "writer",  created: Date.now() - 25 * 60_000 },
  { id: "art-2", taskId: "t-hero",    filename: "hero-mockup.png",        mime: "image/png",           sizeBytes: 88_120, source: "ux",   created: Date.now() - 20 * 60_000 },
  { id: "art-3", taskId: "t-pricing", filename: "pricing-bullets.md",     mime: "text/markdown",       sizeBytes: 904,  source: "writer",  created: Date.now() - 90 * 60_000 },
];

const ASSETS = [
  { id: "as-1", projectId: "p-launch", filename: "brand-tokens.json", mime: "application/json", sizeBytes: 1180, uploadedBy: "u-me",   created: Date.now() - 2 * 86_400_000 },
  { id: "as-2", projectId: "p-launch", filename: "hero-ref.png",       mime: "image/png",        sizeBytes: 245_900, uploadedBy: "u-bob", created: Date.now() - 86_400_000 },
];

/**
 * Tracks which tasks have a currently-active run; cancel-run targets the most
 * recent entry. Mutated by data.jsx helpers; consumed by TaskDetail.
 * @type {{ [taskId: string]: { runId: string, agentId: string }[] }}
 */
const ACTIVE_RUNS = {
  "t-hero": [{ runId: "c3d4", agentId: "ag-eng" }],
};

/**
 * Generate a one-time install token for the Runtimes flow. Returns a token
 * string and an ISO expiry 1h in the future.
 * @returns {{ token: string, expiresAt: string }}
 */
function installToken() {
  const rnd = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  return {
    token: "bri_" + rnd,
    expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
  };
}

window.MOCK = {
  AGENTS, USER, WORKSPACES, PROJECTS, TASKS, TASK_MESSAGES, APPROVALS,
  MEMBERS, RUNTIMES, ARTIFACTS, ASSETS, ACTIVE_RUNS,
  installToken,
};

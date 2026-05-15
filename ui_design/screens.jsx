// ====== Screens ======

function HeroArrow() {
  // hand-drawn-feel curved arrow that loops down-right and points up-left back at the word
  return (
    <svg className="hero-arrow" viewBox="0 0 160 110" fill="none" aria-hidden>
      <path
        d="M8 12 C 36 4, 78 8, 110 28 C 140 48, 152 78, 120 96"
        stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none"
      />
      <path
        d="M132 86 L120 96 L132 104"
        stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  );
}

function WorkspaceHome({ workspace, projects, onOpenProject, approvals, onOpenTask, onNavigate, onDecideApproval }) {
  const openCount = projects.reduce((s, p) => s + p.open, 0);
  const totalTasks = projects.reduce((s, p) => s + p.tasks, 0);
  const doneCount = totalTasks - openCount;
  const onlineAgents = MOCK.AGENTS.filter(a => a.online).length;
  const aps = approvals || MOCK.APPROVALS;

  return (
    <div className="page home-page">
      <div className="home-grid">
        {/* Row 1, col 1: hero */}
        <div className="hero">
          <div className="hero-eyebrow">
            <span className="dot" />
            <span>工作区 · {workspace.name}</span>
            <span className="sep">·</span>
            <span className="mono">{new Date().toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })} · {new Date().toLocaleDateString("zh-CN", { weekday: "short" })}</span>
          </div>
          <h1 className="hero-title">
            {MOCK.USER.name},<br />
            今天<span className="hero-pop">开干<HeroArrow /></span>
          </h1>
          <div className="hero-sub">
            这周有 <b>{openCount} 个 open</b> 任务等你处理；<b>{onlineAgents} 个 agent</b> 在线、{aps.length} 条审批排着队。
          </div>
          <div className="hero-cta">
            <button className="btn primary big"><Icon name="plus" size={15} stroke={2.5} /> 新建项目</button>
            <button className="btn ghost big"><Icon name="at" size={15} /> 召唤 agent</button>
          </div>
        </div>

        {/* Row 1, col 2: stat 2x2 */}
        <div className="stat-grid">
          <div className="stat-card hot" onClick={() => onNavigate({ name: "approvals" })}>
            <div className="stat-label">今日待审批</div>
            <div className="stat-num">{aps.length}</div>
            <div className="stat-foot">最早 35:09 过期 →</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">open 任务</div>
            <div className="stat-num">{openCount}</div>
            <div className="stat-foot">+3 较上周</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">在线 agent</div>
            <div className="stat-num">{onlineAgents}</div>
            <div className="stat-foot">{MOCK.AGENTS.length - onlineAgents} 离线</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">本周完成</div>
            <div className="stat-num">{doneCount}</div>
            <div className="stat-foot">12 个产出</div>
          </div>
        </div>

        {/* Row 2, col 1: projects */}
        <div className="home-projects">
          <div className="section-head">
            <div className="section-title" style={{ fontSize: 20 }}>项目 <span className="count-pill">{projects.length}</span></div>
            <div className="row" style={{ gap: 8 }}>
              <div className="pills">
                <button className="pill on">最近活跃</button>
                <button className="pill">置顶</button>
                <button className="pill">全部</button>
              </div>
            </div>
          </div>

          <div className="proj-grid-2col">
            {projects.slice(0, 4).map(p => (
              <div key={p.id} className={"proj-card chunky-card swatch-" + p.swatch} onClick={() => onOpenProject(p)}>
                <div className="topstrip tall">
                  <span className="topstrip-tag mono">{p.swatch.toUpperCase()}-{String(projects.indexOf(p) + 1).padStart(2, "0")}</span>
                </div>
                <div className="body">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div className="name">{p.name}</div>
                    <span className="tag mono" style={{ fontSize: 11.5 }}>{p.open}/{p.tasks}</span>
                  </div>
                  <div className="desc">{p.desc}</div>
                  <div className="row" style={{ marginTop: 12, gap: 8 }}>
                    <span className="tag">{p.tasks} 任务</span>
                    <span className="tag">{p.agents.length} agent</span>
                    <span style={{ flex: 1 }} />
                    <div className="avatars">
                      {p.agents.slice(0, 3).map(id => MOCK.AGENTS.find(a => a.id === id)).map(a =>
                        <span key={a.id} className="av" title={a.name}><AgentAvatar agent={a} size={24} /></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {projects.length > 4 && (
            <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => {}}>
              查看其余 {projects.length - 4} 个项目 <Icon name="chevron-right" size={12} stroke={2.5} />
            </button>
          )}
        </div>

        {/* Row 2, col 2: approvals rail */}
        <aside className="home-rail">
          <div className="rail-section">
            <div className="rail-head">
              <span className="rail-dot" />
              <span className="rail-head-title">待审批 · {aps.length} 件</span>
              <span style={{ flex: 1 }} />
              <button className="btn ghost sm" onClick={() => onNavigate({ name: "approvals" })} style={{ padding: "3px 8px", fontSize: 11 }}>全部 →</button>
            </div>
            <div className="rail-list">
              {aps.length === 0 && (
                <div className="rail-empty">
                  <Icon name="check" size={18} stroke={2.5} />
                  <span>全部处理完了</span>
                </div>
              )}
              {aps.slice(0, 3).map((ap, i) => (
                <RailApprovalRow key={ap.id} ap={ap} last={i === Math.min(2, aps.length - 1)}
                  onDecide={(d) => onDecideApproval && onDecideApproval(ap.id, d)}
                  onOpen={() => {
                    const t = MOCK.TASKS.find(x => x.id === ap.taskId);
                    if (t) onOpenTask(t);
                  }} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RailApprovalRow({ ap, last, onDecide, onOpen }) {
  const left = useCountdown(ap.expiresInSec);
  return (
    <div className={"rail-approval-row" + (last ? " last" : "")}>
      <div className="rail-approval-head">
        <span className="rail-approval-tool" onClick={onOpen}>{ap.tool} 请求批准</span>
        <span style={{ flex: 1 }} />
        <span className="rail-approval-cd mono">
          <Icon name="stop" size={11} stroke={2.5} /> {fmtCountdown(left)}
        </span>
      </div>
      <div className="rail-approval-arg mono">{Object.entries(ap.input).map(([k, v]) => typeof v === "string" ? v : `${k}=${v}`).join(" · ")}</div>
      <div className="rail-approval-actions">
        <button className="btn sm" onClick={() => onDecide({ kind: "rejected" })}>拒绝</button>
        <button className="btn primary sm" onClick={() => onDecide({ kind: "approved" })}>批准</button>
      </div>
    </div>
  );
}

function ProjectBoard({ project, tasks, onOpenTask }) {
  const cols = [
    { key: "open", label: "待办" },
    { key: "in_progress", label: "进行中" },
    { key: "blocked", label: "阻塞" },
    { key: "done", label: "完成" },
  ];
  return (
    <div className="page">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>
            <span>项目</span><span>·</span><span>{project.name}</span>
          </div>
          <h1 className="page-title">{project.name}</h1>
          <div className="page-sub">{project.desc}</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn ghost"><Icon name="upload" size={14} /> 上传素材</button>
          <button className="btn primary"><Icon name="plus" size={14} stroke={2.5} /> 新建任务</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div className="search-box" style={{ flex: "0 1 320px" }}>
          <Icon name="search" size={14} /><input placeholder="筛任务、@agent…" />
        </div>
        <span className="tag">全部 {tasks.length}</span>
        {project.agents.map(id => {
          const a = MOCK.AGENTS.find(x => x.id === id);
          return <span key={id} className="tag" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><AgentAvatar agent={a} size={16} online={undefined} />{a.handle}</span>;
        })}
      </div>

      <div className="kanban">
        {cols.map(col => {
          const items = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="kanban-col">
              <div className="kanban-col-head">
                <StatusChip status={col.key} />
                <span className="count-pill">{items.length}</span>
                <button className="kanban-add"><Icon name="plus" size={12} /></button>
              </div>
              <div>
                {items.map(t => (
                  <div key={t.id} className="task-card" onClick={() => onOpenTask(t)}>
                    <div className="title">{t.title}</div>
                    <div className="summary">{t.summary}</div>
                    <div className="agents-row">
                      {t.agents.map(id => {
                        const a = MOCK.AGENTS.find(x => x.id === id);
                        return <span key={id} className="av" title={a.name}><AgentAvatar agent={a} size={22} /></span>;
                      })}
                      <span style={{ flex: 1 }} />
                      <span className="text-muted mono" style={{ fontSize: 11 }}>{t.updated}</span>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div style={{ border: "1.5px dashed var(--border-strong)", borderRadius: 14, padding: 18, color: "var(--faint)", fontSize: 12, fontWeight: 600, textAlign: "center" }}>
                    拖卡到这里
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ====== Task Detail ======
function TaskDetail({ project, task, tasks, onOpenTask, onBack }) {
  const initial = MOCK.TASK_MESSAGES[task.id] || [];
  const [messages, setMessages] = useState(initial);
  const [decisions, setDecisions] = useState({}); // msgId -> {kind, note}
  const [activeTab, setActiveTab] = useState("artifacts");
  const [thinking, setThinking] = useState(false);
  const [queuedMessageIds, setQueuedMessageIds] = useState(new Set());
  const scrollRef = useRef(null);
  const [cancelDisabled, setCancelDisabled] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const { toasts: cancelToasts, push: pushCancelToast } = window.useToast();
  const [activeRunsTick, setActiveRunsTick] = useState(0);
  const bumpActiveRunsTick = () => setActiveRunsTick(t => t + 1);

  useEffect(() => {
    setMessages(MOCK.TASK_MESSAGES[task.id] || []);
    setDecisions({});
  }, [task.id]);

  useEffect(() => {
    // auto-scroll to bottom when messages change
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, thinking]);

  const decide = (msgId, decision) => {
    setDecisions(d => ({ ...d, [msgId]: decision }));
  };

  const activeRuns = MOCK.ACTIVE_RUNS[task.id] || [];
  const hasActiveRun = activeRuns.length > 0;
  // silence unused-var warning; the tick var IS used to drive re-renders by being referenced here
  void activeRunsTick;

  const doCancel = () => {
    if (cancelDisabled) return;
    setCancelDisabled(true);
    const list = MOCK.ACTIVE_RUNS[task.id] || [];
    const removed = list.length > 0 ? list[list.length - 1] : null;
    if (removed) {
      MOCK.ACTIVE_RUNS[task.id] = list.slice(0, -1);
      bumpActiveRunsTick();
    }
    pushCancelToast(removed ? `已取消 run #${removed.runId}` : "运行已结束", "info");
    setConfirmCancelOpen(false);
    setTimeout(() => setCancelDisabled(false), 5000);
  };

  const send = ({ text, mentions }) => {
    const userId = "u" + Date.now();
    // mentions are agent IDs (per API.md and new Composer). Resolve first one.
    const firstAgentId = mentions[0];
    const agent = firstAgentId ? (MOCK.AGENTS.find(a => a.id === firstAgentId) || MOCK.AGENTS[0]) : null;

    // Check if this agent already has an active run on this task → mark queued
    const activeForTask = MOCK.ACTIVE_RUNS[task.id] || [];
    const alreadyActive = agent && activeForTask.some(r => r.agentId === agent.id);

    const userMsg = {
      id: userId,
      role: "user",
      author: MOCK.USER,
      time: new Date().toTimeString().slice(0, 5),
      parsed: { type: "user", text, mentions },
      metadata: alreadyActive ? { queued: true } : undefined,
    };
    setMessages(ms => [...ms, userMsg]);

    if (alreadyActive) {
      setQueuedMessageIds(prev => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
      return; // queued; do not start a new run
    }

    if (agent) {
      // Register active run in mock store
      const runId = Math.random().toString(36).slice(2, 6);
      if (!MOCK.ACTIVE_RUNS[task.id]) MOCK.ACTIVE_RUNS[task.id] = [];
      MOCK.ACTIVE_RUNS[task.id].push({ runId, agentId: agent.id });
      bumpActiveRunsTick();

      setThinking(true);
      setTimeout(() => {
        const reply = {
          id: "a" + Date.now(),
          role: "assistant",
          author: agent,
          time: new Date().toTimeString().slice(0, 5),
          runId,
          parsed: { type: "assistant_text", text: "收到，开始处理。" }
        };
        const result = {
          id: "r" + Date.now(),
          role: "assistant",
          author: agent,
          time: new Date().toTimeString().slice(0, 5),
          parsed: { type: "result", durationMs: 1240, tools: 0, status: "done" }
        };
        setMessages(ms => [...ms, reply, result]);
        // Run completed: remove from ACTIVE_RUNS
        MOCK.ACTIVE_RUNS[task.id] = (MOCK.ACTIVE_RUNS[task.id] || []).filter(r => r.runId !== runId);
        bumpActiveRunsTick();
        setThinking(false);
      }, 1500);
    }
  };

  const activeAgent = thinking ? MOCK.AGENTS[2] : null;
  const taskAgents = task.agents.map(id => MOCK.AGENTS.find(a => a.id === id));

  return (
    <div className="page task">
      <div className="task-layout">
        {/* Left: tasks list */}
        <div className="task-pane">
          <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1.5px solid var(--border)" }}>
            <button className="btn ghost sm" onClick={onBack} style={{ padding: "4px 6px" }}>
              <Icon name="chevron-right" size={12} stroke={2.5} style={{ transform: "scaleX(-1)" }} />
            </button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>{project.name}</div>
              <div className="text-muted" style={{ fontSize: 11 }}>{tasks.length} 个任务</div>
            </div>
            <span style={{ flex: 1 }} />
            <button className="btn ghost sm icon-only" title="新建"><Icon name="plus" size={14} /></button>
          </div>
          <div className="tasks-list">
            {tasks.map(t => (
              <div key={t.id} className="task-row" data-active={t.id === task.id} onClick={() => onOpenTask(t)}>
                <div className="row">
                  <span className="t" style={{ flex: 1 }}>{t.title}</span>
                  <span className="text-muted mono" style={{ fontSize: 11 }}>{t.updated}</span>
                </div>
                <div className="s">{t.summary}</div>
                <div className="b">
                  <StatusChip status={t.status} />
                  {t.agents.map(id => {
                    const a = MOCK.AGENTS.find(x => x.id === id);
                    return <span key={id} title={a.name}><AgentAvatar agent={a} size={18} /></span>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: chat */}
        <div className="task-pane chat">
          <div className="task-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ marginBottom: 6 }}>
                <StatusChip status={task.status} />
                <span className="tag mono" style={{ fontSize: 10.5 }}>WK-{task.id.slice(-4)}</span>
              </div>
              <div className="title">{task.title}</div>
              <div className="sub">{task.summary}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <div className="row">
                {taskAgents.map(a =>
                  <span key={a.id} title={a.name}><AgentAvatar agent={a} size={28} /></span>
                )}
              </div>
              <div className="row" style={{ gap: 6 }}>
                {hasActiveRun && (
                  <button
                    className="btn ghost sm"
                    disabled={cancelDisabled}
                    onClick={() => setConfirmCancelOpen(true)}
                    title={cancelDisabled ? "请等待 5 秒后再试" : "取消当前活跃 run"}
                  >
                    <Icon name="stop" size={12} /> 取消运行
                  </button>
                )}
                <button className="btn ghost sm icon-only"><Icon name="more" size={16} /></button>
              </div>
            </div>
          </div>

          <div className="chat-scroll" ref={scrollRef}>
            {messages.length === 0 ? (
              <Empty glyph="@" title="还没有人发言" sub="发一条带 @agent 的消息，把一个 agent 拽进来。" />
            ) : (
              <MessageList messages={messages} decisions={decisions} onDecide={decide} queuedMessageIds={queuedMessageIds} />
            )}
          </div>

          {thinking && activeAgent && (
            <div className="thinking-bar">
              <span className="pulse" />
              <AgentAvatar agent={activeAgent} size={20} />
              <span><strong>@{activeAgent.handle}</strong> 正在思考…</span>
              <span style={{ flex: 1 }} />
              <span className="kbd">esc 取消</span>
            </div>
          )}

          <div className="composer-wrap">
            <Composer agents={MOCK.AGENTS} onSend={send} />
          </div>
        </div>

        {/* Right: panel */}
        <div className="task-pane last">
          <div className="panel-tabs">
            {[
              { k: "artifacts", l: "产出", n: 2 },
              { k: "assets", l: "素材", n: 1 },
              { k: "approvals", l: "审批", n: 1 },
            ].map(t => (
              <div key={t.k} className="panel-tab" data-active={activeTab === t.k} onClick={() => setActiveTab(t.k)}>
                {t.l}<span className="count">{t.n}</span>
              </div>
            ))}
          </div>
          <div className="panel-content">
            {activeTab === "artifacts" && (
              <>
                <div className="section-head" style={{ marginBottom: 10 }}>
                  <div className="section-title" style={{ fontSize: 12, color: "var(--muted)" }}>本任务产出</div>
                </div>
                <div className="artifact-item">
                  <span className="icn-box"><Icon name="file" size={14} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="name">hero-copy-v2.md</div>
                    <div className="meta">1.4 KB · @writer · 刚刚</div>
                  </div>
                  <button className="btn ghost sm icon-only"><Icon name="pin" size={13} /></button>
                </div>
                <div className="artifact-item">
                  <span className="icn-box" style={{ background: "var(--surface-2)" }}><Icon name="code" size={14} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="name">page.tsx</div>
                    <div className="meta">+24 行 · @ux · 刚刚</div>
                  </div>
                  <button className="btn ghost sm icon-only"><Icon name="more" size={14} /></button>
                </div>
              </>
            )}
            {activeTab === "assets" && (
              <>
                <div className="dropzone">
                  <div className="ic"><Icon name="upload" size={22} /></div>
                  <div style={{ marginTop: 6 }}>拖入文件或粘贴链接</div>
                  <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>图像 · 文档 · 代码 · 音频</div>
                </div>
                <div className="asset-item">
                  <span className="icn-box" style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-2)", border: "1.5px solid var(--border-dark)", display: "grid", placeItems: "center" }}>
                    <Icon name="file" size={14} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>brief-v2.pdf</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>1.2 MB · Alice · 14:25</div>
                  </div>
                </div>
              </>
            )}
            {activeTab === "approvals" && (
              <>
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 10 }}>本任务的审批历史</div>
                <div className="perm-resolved" style={{ background: "var(--surface)" }}>
                  <Icon name="approval" size={14} />
                  <span style={{ flex: 1 }}>Write · hero-copy-v2.md</span>
                  <span className="tag" style={{ background: "var(--ink)", color: "var(--surface)", borderColor: "var(--ink)" }}>已批准</span>
                </div>
                <div className="perm-resolved" style={{ background: "var(--surface)", marginTop: 8 }}>
                  <Icon name="approval" size={14} />
                  <span style={{ flex: 1 }}>Edit · page.tsx</span>
                  <span className="tag" style={{ background: "var(--ink)", color: "var(--surface)", borderColor: "var(--ink)" }}>已批准</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {confirmCancelOpen && (
        <div role="dialog" aria-modal="true" style={{
          position: "fixed", inset: 0, background: "rgba(27,24,32,0.4)",
          display: "grid", placeItems: "center", zIndex: 200,
        }}>
          <div style={{
            background: "var(--paper-0, #fdfaf2)", padding: 24,
            border: "1.5px solid var(--ink-0, #1b1820)", borderRadius: 12,
            maxWidth: 420, boxShadow: "var(--shadow-current, 4px 4px 0 #1b1820)",
          }}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>取消当前运行？</div>
            <div style={{ fontSize: 14, color: "var(--ink-1, #3b3540)", marginBottom: 16, lineHeight: 1.5 }}>
              这只取消当前 run，排队中的同 agent 消息会自动晋升并跑。
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmCancelOpen(false)} style={{
                padding: "6px 14px", border: "1.5px solid var(--ink-0, #1b1820)",
                background: "var(--paper-0, #fdfaf2)", borderRadius: 6, cursor: "pointer",
              }}>不取消</button>
              <button onClick={doCancel} style={{
                padding: "6px 14px", border: "1.5px solid var(--ink-0, #1b1820)",
                background: "var(--state-failed, #c25036)", color: "var(--paper-0, #fdfaf2)",
                borderRadius: 6, cursor: "pointer", fontWeight: 600,
              }}>取消运行</button>
            </div>
          </div>
        </div>
      )}

      {cancelToasts.length > 0 && (
        <div style={{ position: "fixed", right: 24, bottom: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
          {cancelToasts.map(t => (
            <window.ErrorBanner key={t.id} kind="toast" variant={t.variant} message={t.message} />
          ))}
        </div>
      )}
    </div>
  );
}

// ====== Approvals page ======
function ApprovalsPage({ approvals, onDecided, onOpenTask }) {
  const projects = MOCK.PROJECTS;
  return (
    <div className="page">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>全局</div>
          <h1 className="page-title">待审批 <span style={{ color: "var(--approval)" }}>{approvals.length}</span></h1>
          <div className="page-sub">每条都有 1 小时倒计时，到期 run 会失败 — 别让 agent 干等。</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn ghost"><Icon name="check" size={14} /> 全部批准（安全工具）</button>
        </div>
      </div>

      {approvals.length === 0 && (
        <Empty glyph="✓" title="没有待审批" sub="agent 跑工具时如果需要你确认，会出现在这里。" />
      )}

      {approvals.map(ap => (
        <ApprovalRow key={ap.id} ap={ap} onDecided={(d) => onDecided(ap.id, d)} onOpenTask={() => {
          const t = MOCK.TASKS.find(x => x.id === ap.taskId);
          if (t) onOpenTask(t);
        }} />
      ))}
    </div>
  );
}

function ApprovalRow({ ap, onDecided, onOpenTask }) {
  const left = useCountdown(ap.expiresInSec);
  const [note, setNote] = useState("");
  return (
    <div className="approval-row">
      <div className="lhs">
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "var(--ink)", color: "var(--surface)",
          display: "grid", placeItems: "center",
          border: "1.5px solid var(--ink)",
          boxShadow: "0 3px 0 var(--ink)",
          flex: "0 0 44px",
        }}>
          <Icon name="warn" size={20} stroke={2.5} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row" style={{ gap: 8, marginBottom: 2 }}>
            <span className="ctx">{ap.project} · </span>
            <span className="ctx" style={{ cursor: "pointer", textDecoration: "underline dotted" }} onClick={onOpenTask}>{ap.taskTitle}</span>
          </div>
          <div className="name">{ap.tool} 请求批准</div>
          <div className="args">
            {Object.entries(ap.input).map(([k, v], i) => (
              <span key={k}>{i > 0 && <span style={{ color: "var(--faint)" }}> · </span>}<span style={{ color: "var(--muted)" }}>{k}=</span>{String(v)}</span>
            ))}
          </div>
          <div className="row" style={{ marginTop: 8, gap: 6, whiteSpace: "nowrap" }}>
            <AgentAvatar agent={ap.agent} size={20} />
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>@{ap.agent.handle}</span>
            <span style={{ fontSize: 12, color: "var(--faint)" }}>·</span>
            <span style={{ fontSize: 12, color: "var(--ink)", fontWeight: 800, fontFamily: "var(--font-mono)" }}>剩 {fmtCountdown(left)}</span>
          </div>
        </div>
      </div>
      <div className="rhs">
        <input className="perm-note" placeholder="备注（可选）" value={note} onChange={e => setNote(e.target.value)} />
        <button className="btn danger" onClick={() => onDecided({ kind: "rejected", note })}><Icon name="x" size={13} stroke={2.5} /> 拒绝</button>
        <button className="btn primary" onClick={() => onDecided({ kind: "approved", note })}><Icon name="check" size={13} stroke={2.5} /> 批准</button>
      </div>
    </div>
  );
}

function AgentsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>工作区</div>
          <h1 className="page-title">Agent 编队</h1>
          <div className="page-sub">每个 agent 是工作区里的一个 @handle，绑一个 daemon runtime。</div>
        </div>
        <button className="btn primary"><Icon name="plus" size={14} stroke={2.5} /> 新建 agent</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {MOCK.AGENTS.map(a => (
          <div key={a.id} className="card chunky" style={{ padding: 18 }}>
            <div className="row">
              <AgentAvatar agent={a} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{a.name}</div>
                <div className="text-muted mono" style={{ fontSize: 12 }}>@{a.handle}</div>
              </div>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: a.online ? "var(--success)" : "var(--faint)", border: "1.5px solid var(--border-dark)" }} />
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--ink-2)" }}>{a.desc}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className="tag mono" style={{ fontSize: 10.5 }}>{a.model}</span>
              <span className="tag" style={{ fontSize: 10.5 }}>runtime · w-001</span>
              <span className="tag" style={{ fontSize: 10.5 }}>3 工具</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RuntimesPage() {
  const rts = [
    { id: "rt-1", name: "alice-mac", online: true, agents: 3, lastSeen: "刚刚" },
    { id: "rt-2", name: "office-linux", online: true, agents: 2, lastSeen: "刚刚" },
    { id: "rt-3", name: "old-windows", online: false, agents: 0, lastSeen: "3 天前" },
  ];
  return (
    <div className="page">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>工作区</div>
          <h1 className="page-title">Runtimes</h1>
          <div className="page-sub">自托管 daemon。点"签发 token"把它绑到一台新机器。</div>
        </div>
        <button className="btn primary"><Icon name="plus" size={14} stroke={2.5} /> 签发 install token</button>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {rts.map(r => (
          <div key={r.id} className="card chunky" style={{ display: "flex", alignItems: "center", gap: 14, padding: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--surface-2)", border: "1.5px solid var(--border-dark)", display: "grid", placeItems: "center" }}>
              <Icon name="server" size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{r.name}</div>
              <div className="text-muted mono" style={{ fontSize: 12 }}>{r.id} · {r.agents} 个 agent 绑定 · 最后心跳 {r.lastSeen}</div>
            </div>
            <span className="chip" data-status={r.online ? "in_progress" : "done"}>
              <span className="dot" />
              {r.online ? "在线" : "离线"}
            </span>
            <button className="btn ghost sm">配置</button>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { WorkspaceHome, ProjectBoard, TaskDetail, ApprovalsPage, AgentsPage, RuntimesPage });

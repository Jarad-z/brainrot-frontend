// ui_design/screens/TaskDetail.jsx
// Reads: window.React, window.MOCK, window.Icon, window.AgentAvatar, window.StatusChip,
//        window.Empty, window.MessageList, window.Composer, window.useToast, window.ErrorBanner.
// Writes: window.TaskDetail.

const { useState, useEffect, useRef, useMemo } = React;

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

window.TaskDetail = TaskDetail;

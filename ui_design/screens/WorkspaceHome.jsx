// ui_design/screens/WorkspaceHome.jsx
// Reads: window.React, window.MOCK, window.Icon, window.Avatar, window.AgentAvatar, window.StatusChip.
// Writes: window.WorkspaceHome, window.HeroArrow.

const { useState, useEffect, useRef, useMemo } = React;

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

window.WorkspaceHome = WorkspaceHome;
window.HeroArrow = HeroArrow;

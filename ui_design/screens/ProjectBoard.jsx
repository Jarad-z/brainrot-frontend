// ui_design/screens/ProjectBoard.jsx
// Reads: window.React, window.MOCK, window.Icon, window.AgentAvatar, window.StatusChip.
// Writes: window.ProjectBoard.

const { useState, useEffect, useRef, useMemo } = React;

function ProjectBoard({ project, tasks, onOpenTask, activeTab, onTabChange }) {
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

      <div style={{ display: "flex", gap: 16, borderBottom: "1.5px solid var(--hairline)", marginBottom: 16 }}>
        {[
          { key: "tasks", label: "任务" },
          { key: "assets", label: "素材" },
          { key: "artifacts", label: "产物" },
        ].map(t => (
          <a key={t.key} onClick={() => onTabChange && onTabChange(t.key)}
             style={{
               padding: "8px 0", cursor: "pointer",
               borderBottom: (activeTab || "tasks") === t.key ? "2px solid var(--ink-0)" : "2px solid transparent",
               fontWeight: (activeTab || "tasks") === t.key ? 700 : 500,
               color: (activeTab || "tasks") === t.key ? "var(--ink-0)" : "var(--ink-2)",
             }}>
            {t.label}
          </a>
        ))}
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

window.ProjectBoard = ProjectBoard;

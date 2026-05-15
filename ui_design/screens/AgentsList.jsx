// ui_design/screens/AgentsList.jsx
// Reads: window.React, window.MOCK, window.Icon, window.AgentAvatar, window.EmptyState.
// Writes: window.AgentsList.

/**
 * AgentsList screen — shows all workspace agents with search + archive filter.
 * @param {{ onNew: () => void }} props
 */
function AgentsList({ onNew }) {
  const React = window.React;
  const [search, setSearch] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(false);

  const agents = window.MOCK.AGENTS.filter(a => {
    if (!showArchived && a.archived) return false;
    if (search && !a.handle.toLowerCase().includes(search.toLowerCase()) && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (window.MOCK.AGENTS.length === 0) {
    return <window.EmptyState glyph="🤖" title="还没有 agent" description="点右上角新建你的第一个 @handle"
                              action={{ label: "新建 agent", onClick: onNew }} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div style={{ color: "var(--ink-2)", fontSize: "var(--text-xs)", fontWeight: "var(--w-bold)" }}>工作区</div>
          <h1 className="page-title">Agents</h1>
        </div>
        <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "center" }}>
          <input placeholder="搜索 handle / name…" value={search} onChange={(e) => setSearch(e.target.value)}
                 style={{ padding: "6px 12px", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-sm)", minWidth: 240 }} />
          <label style={{ fontSize: "var(--text-sm)", display: "flex", gap: 4, alignItems: "center" }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            显示已归档
          </label>
          <button onClick={onNew} style={{
            padding: "8px 16px", background: "var(--ink-0)", color: "var(--paper-0)",
            border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)", fontWeight: "var(--w-semibold)",
            cursor: "pointer", boxShadow: "var(--shadow-current)",
          }}>+ 新建 agent</button>
        </div>
      </div>
      <div className="card chunky" style={{ padding: 0, marginTop: "var(--sp-4)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--paper-1)", textAlign: "left" }}>
              {["handle", "name", "model", "状态", ""].map(h => (
                <th key={h} style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id} style={{ borderTop: "1px solid var(--hairline)" }}>
                <td style={{ padding: "var(--sp-3) var(--sp-4)", display: "flex", alignItems: "center", gap: 8 }}>
                  <window.AgentAvatar agent={a} size={24} />
                  <span className="mono" style={{ fontWeight: "var(--w-semibold)" }}>@{a.handle}</span>
                </td>
                <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>{a.name}</td>
                <td style={{ padding: "var(--sp-3) var(--sp-4)", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{a.model}</td>
                <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                  {a.archived ? <span style={{ color: "var(--ink-3)" }}>已归档</span> :
                   a.online   ? <span style={{ color: "var(--state-running)" }}>● online</span> :
                                 <span style={{ color: "var(--ink-2)" }}>○ offline</span>}
                </td>
                <td style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "right" }}>
                  <button onClick={() => navigator.clipboard?.writeText(a.handle)} title="复制 handle"
                          style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                    <window.Icon name="more" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.AgentsList = AgentsList;

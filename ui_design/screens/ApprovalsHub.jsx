// ui_design/screens/ApprovalsHub.jsx
// Reads: window.React, window.MOCK, window.ApprovalCard, window.EmptyState.
// Writes: window.ApprovalsHub.

function ApprovalsHub({ approvals, onDecide, onOpenTask }) {
  const React = window.React;
  const [toolFilter, setToolFilter] = React.useState("");
  const [wsFilter, setWsFilter] = React.useState("current");

  const list = (approvals || window.MOCK.APPROVALS)
    .filter(ap => !toolFilter || ap.tool.toLowerCase().includes(toolFilter.toLowerCase()))
    .slice()
    .sort((a, b) => (a.expiresInSec || 0) - (b.expiresInSec || 0));

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, background: "var(--accent)", borderRadius: 999 }} />
            <h1 className="page-title" style={{ margin: 0 }}>待审批 · {list.length} 件</h1>
          </div>
          <div className="page-sub">所有待你决定的工具调用</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={wsFilter} onChange={(e) => setWsFilter(e.target.value)}
                  style={{ padding: "6px 12px", border: "1.5px solid var(--hairline)", borderRadius: 6 }}>
            <option value="current">当前工作区</option>
            <option value="all">全部工作区</option>
          </select>
          <input value={toolFilter} onChange={(e) => setToolFilter(e.target.value)}
                 placeholder="按工具名过滤"
                 style={{ padding: "6px 12px", border: "1.5px solid var(--hairline)", borderRadius: 6, minWidth: 180 }} />
        </div>
      </div>

      {list.length === 0 ? (
        <window.EmptyState glyph="✓" title="全部处理完了" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map(ap => {
            const approval = {
              id: ap.id,
              tool: ap.tool,
              input: ap.input,
              expiresAt: new Date(Date.now() + (ap.expiresInSec || 3600) * 1000).toISOString(),
              status: "pending",
              project: ap.project,
              taskTitle: ap.taskTitle,
              agentHandle: ap.agent && ap.agent.handle,
            };
            return (
              <window.ApprovalCard
                key={ap.id}
                approval={approval}
                mode="hub"
                onDecide={(id, decision, note) => onDecide && onDecide(id, { kind: decision === "denied" ? "rejected" : "approved", note })}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

window.ApprovalsHub = ApprovalsHub;

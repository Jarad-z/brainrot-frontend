// ui_design/screens/ProjectArtifacts.jsx
function ProjectArtifacts({ project }) {
  const React = window.React;
  const { formatBytes, formatRelative } = window.BR_LIB.format;
  const all = window.MOCK.ARTIFACTS; // not project-scoped in mock; show all
  const [preview, setPreview] = React.useState(null);

  if (all.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <window.EmptyState glyph="📦" title="agent 还没产出任何文件" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {all.map(a => (
          <div key={a.id} className="card chunky" style={{ padding: 14, fontSize: 13, cursor: "pointer" }}
               onClick={() => setPreview(a)}>
            <div style={{ fontWeight: 700, marginBottom: 4, wordBreak: "break-all" }}>{a.filename}</div>
            <div style={{ color: "var(--ink-2)", fontSize: 11 }}>{a.mime} · {formatBytes(a.sizeBytes)}</div>
            <div style={{ color: "var(--ink-2)", fontSize: 11, marginTop: 4 }}>{formatRelative(a.created)} · @{a.source}</div>
          </div>
        ))}
      </div>

      {preview && (
        <div role="dialog" style={{
          position: "fixed", inset: 0, background: "rgba(27,24,32,0.4)",
          display: "grid", placeItems: "center", zIndex: 200,
        }} onClick={() => setPreview(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "var(--paper-0)", padding: 24,
            border: "1.5px solid var(--ink-0)", borderRadius: 12,
            maxWidth: 600, maxHeight: "80vh", overflow: "auto",
            boxShadow: "var(--shadow-current)",
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{preview.filename}</div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 16 }}>
              {preview.mime} · {formatBytes(preview.sizeBytes)} · @{preview.source} · {formatRelative(preview.created)}
            </div>
            {preview.mime.startsWith("image/") ? (
              <div style={{ background: "var(--paper-2)", padding: 24, textAlign: "center", borderRadius: 8, color: "var(--ink-2)" }}>
                [图片预览 mock — 真接 API 时显示]
              </div>
            ) : preview.mime.startsWith("text/") ? (
              <pre style={{
                background: "var(--paper-2)", padding: 12, borderRadius: 8,
                fontFamily: "var(--font-mono)", fontSize: 12, whiteSpace: "pre-wrap",
                maxHeight: 400, overflow: "auto",
              }}>{`[文本预览前 100 行 mock]\n\n# ${preview.filename}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.`}</pre>
            ) : (
              <div style={{ background: "var(--paper-2)", padding: 24, borderRadius: 8, color: "var(--ink-2)", fontSize: 13 }}>
                二进制文件 — 仅显示元数据
              </div>
            )}
            <button onClick={() => setPreview(null)} style={{
              marginTop: 16, padding: "6px 14px", background: "var(--ink-0)", color: "var(--paper-0)",
              border: "1.5px solid var(--ink-0)", borderRadius: 6, cursor: "pointer",
            }}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
window.ProjectArtifacts = ProjectArtifacts;

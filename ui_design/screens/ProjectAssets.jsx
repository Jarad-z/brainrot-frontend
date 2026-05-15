// ui_design/screens/ProjectAssets.jsx
function ProjectAssets({ project }) {
  const React = window.React;
  const { formatBytes, formatRelative } = window.BR_LIB.format;
  const [assets, setAssets] = React.useState(
    window.MOCK.ASSETS.filter(a => a.projectId === project.id)
  );
  const [error, setError] = React.useState(null);
  const fileRef = React.useRef(null);

  function onFiles(files) {
    for (const f of files) {
      if (f.size > 100 * 1024 * 1024) {
        setError(`文件过大，最大 100MB（${f.name} 是 ${formatBytes(f.size)}）`);
        return;
      }
    }
    // mock: add to local list
    const fresh = Array.from(files).map((f, i) => ({
      id: "as-new-" + Date.now() + "-" + i,
      projectId: project.id,
      filename: f.name,
      mime: f.type || "application/octet-stream",
      sizeBytes: f.size,
      uploadedBy: window.MOCK.USER.id,
      created: Date.now(),
    }));
    setAssets(a => [...fresh, ...a]);
    setError(null);
  }

  function onDrop(e) {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  }

  if (assets.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        {error && <div style={{ marginBottom: 12 }}><window.ErrorBanner kind="inline" variant="error" message={error} onClose={() => setError(null)} /></div>}
        <window.EmptyState glyph="📎" title="还没有素材" description="拖拽文件到此处，或点击上传"
                           action={{ label: "选择文件", onClick: () => fileRef.current?.click() }} />
        <input ref={fileRef} type="file" multiple style={{ display: "none" }}
               onChange={(e) => onFiles(e.target.files)} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {error && <div style={{ marginBottom: 12 }}><window.ErrorBanner kind="inline" variant="error" message={error} onClose={() => setError(null)} /></div>}
      <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
           style={{
             padding: 24, border: "1.5px dashed var(--hairline)", borderRadius: 12,
             textAlign: "center", marginBottom: 16, cursor: "pointer",
             background: "var(--paper-1)",
           }}
           onClick={() => fileRef.current?.click()}>
        <div style={{ fontSize: 14, color: "var(--ink-2)" }}>拖拽文件到此处，或点击上传（≤100MB）</div>
        <input ref={fileRef} type="file" multiple style={{ display: "none" }}
               onChange={(e) => onFiles(e.target.files)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {assets.map(a => (
          <div key={a.id} className="card chunky" style={{ padding: 14, fontSize: 13 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, wordBreak: "break-all" }}>{a.filename}</div>
            <div style={{ color: "var(--ink-2)", fontSize: 11 }}>{a.mime} · {formatBytes(a.sizeBytes)}</div>
            <div style={{ color: "var(--ink-2)", fontSize: 11, marginTop: 4 }}>{formatRelative(a.created)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
window.ProjectAssets = ProjectAssets;

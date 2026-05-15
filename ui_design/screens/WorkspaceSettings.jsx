// ui_design/screens/WorkspaceSettings.jsx
// Reads: window.React, window.MOCK, window.Avatar, window.ErrorBanner, window.useToast.
// Writes: window.WorkspaceSettings.

function WorkspaceSettings({ ws }) {
  const React = window.React;
  const [tab, setTab] = React.useState("members");
  const [delConfirmOpen, setDelConfirmOpen] = React.useState(null); // "archive" | "delete" | null
  const [confirmSlug, setConfirmSlug] = React.useState("");
  const [slugError, setSlugError] = React.useState(null);
  const { toasts, push: pushToast } = window.useToast();

  function handleConfirm() {
    if (confirmSlug !== ws.slug) {
      setSlugError("工作区 slug 不匹配");
      return;
    }
    pushToast(`Mock：${delConfirmOpen === "archive" ? "归档" : "删除"}工作区 ${ws.name}（原型不提交）`, "warn");
    setDelConfirmOpen(null);
    setConfirmSlug("");
    setSlugError(null);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div style={{ color: "var(--ink-2)", fontSize: 12, fontWeight: 700 }}>工作区</div>
          <h1 className="page-title">设置</h1>
          <div className="page-sub">{ws.name} · {ws.slug}</div>
        </div>
      </div>

      {/* Secondary tabs */}
      <div style={{ display: "flex", gap: 16, borderBottom: "1.5px solid var(--hairline)", marginBottom: 24 }}>
        {[
          { key: "members", label: "成员" },
          { key: "danger", label: "危险区" },
        ].map(t => (
          <a key={t.key} onClick={() => setTab(t.key)}
             style={{
               padding: "8px 0", cursor: "pointer",
               borderBottom: tab === t.key ? "2px solid var(--ink-0)" : "2px solid transparent",
               fontWeight: tab === t.key ? 700 : 500,
               color: tab === t.key ? "var(--ink-0)" : "var(--ink-2)",
             }}>
            {t.label}
          </a>
        ))}
      </div>

      {tab === "members" && (
        <div className="card chunky" style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 16 }}>成员 ({window.MOCK.MEMBERS.length})</div>
          <div style={{ display: "grid", gap: 8 }}>
            {window.MOCK.MEMBERS.map(m => (
              <div key={m.id} className="row" style={{
                padding: 8, borderRadius: 12,
                border: "1.5px solid var(--hairline)", background: "var(--paper-0)",
                gap: 12,
              }}>
                <window.Avatar name={m.name} color={m.color} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</div>
                  <div className="text-muted mono" style={{ fontSize: 11 }}>{m.email}</div>
                </div>
                <select defaultValue={m.role} style={{
                  padding: "4px 8px", border: "1.5px solid var(--hairline)",
                  borderRadius: 6, fontSize: 13, background: "var(--paper-0)",
                }}>
                  <option value="owner">owner</option>
                  <option value="member">member</option>
                </select>
                <button title="移除" style={{
                  padding: "4px 8px", background: "transparent",
                  border: "1.5px solid var(--hairline)", borderRadius: 6, cursor: "pointer",
                }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "danger" && (
        <div className="card chunky" style={{ padding: 22, border: "1.5px solid var(--state-failed)" }}>
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 16, color: "var(--state-failed)" }}>危险区</div>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, border: "1.5px solid var(--hairline)", borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>归档工作区</div>
                <div style={{ fontSize: 12, color: "var(--ink-2)" }}>所有成员只读访问，可恢复。</div>
              </div>
              <button onClick={() => setDelConfirmOpen("archive")} style={{
                padding: "6px 14px", background: "var(--paper-0)", color: "var(--ink-0)",
                border: "1.5px solid var(--ink-0)", borderRadius: 6, cursor: "pointer", fontWeight: 600,
              }}>归档</button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, border: "1.5px solid var(--state-failed)", borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--state-failed)" }}>删除工作区</div>
                <div style={{ fontSize: 12, color: "var(--ink-2)" }}>不可恢复。所有项目、任务、审批都会丢失。</div>
              </div>
              <button onClick={() => setDelConfirmOpen("delete")} style={{
                padding: "6px 14px", background: "var(--state-failed)", color: "var(--paper-0)",
                border: "1.5px solid var(--state-failed)", borderRadius: 6, cursor: "pointer", fontWeight: 600,
              }}>删除</button>
            </div>
          </div>
        </div>
      )}

      {delConfirmOpen && (
        <div role="dialog" style={{
          position: "fixed", inset: 0, background: "rgba(27,24,32,0.4)",
          display: "grid", placeItems: "center", zIndex: 200,
        }}>
          <div style={{
            background: "var(--paper-0)", padding: 24,
            border: "1.5px solid var(--state-failed)", borderRadius: 12,
            maxWidth: 460, boxShadow: "var(--shadow-current)",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>确认{delConfirmOpen === "archive" ? "归档" : "删除"}工作区</div>
            <div style={{ fontSize: 13, color: "var(--ink-1)" }}>请输入工作区 slug <code style={{ fontFamily: "var(--font-mono)", padding: "1px 6px", background: "var(--paper-2)", borderRadius: 4 }}>{ws.slug}</code> 以确认。</div>
            <input value={confirmSlug} onChange={(e) => { setConfirmSlug(e.target.value); setSlugError(null); }}
                   placeholder={ws.slug}
                   style={{ padding: "8px 12px", border: "1.5px solid var(--hairline)", borderRadius: 6, fontFamily: "var(--font-mono)" }} />
            {slugError && <window.ErrorBanner kind="inline" variant="error" message={slugError} onClose={() => setSlugError(null)} />}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setDelConfirmOpen(null); setConfirmSlug(""); setSlugError(null); }} style={{
                padding: "6px 14px", border: "1.5px solid var(--ink-0)", background: "var(--paper-0)",
                borderRadius: 6, cursor: "pointer",
              }}>取消</button>
              <button onClick={handleConfirm} disabled={confirmSlug !== ws.slug} style={{
                padding: "6px 14px", border: "1.5px solid var(--state-failed)",
                background: confirmSlug === ws.slug ? "var(--state-failed)" : "var(--ink-3)",
                color: "var(--paper-0)", borderRadius: 6,
                cursor: confirmSlug === ws.slug ? "pointer" : "not-allowed", fontWeight: 600,
              }}>{delConfirmOpen === "archive" ? "归档" : "删除"}</button>
            </div>
          </div>
        </div>
      )}

      {toasts.length > 0 && (
        <div style={{ position: "fixed", right: 24, bottom: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
          {toasts.map(t => <window.ErrorBanner key={t.id} kind="toast" variant={t.variant} message={t.message} />)}
        </div>
      )}
    </div>
  );
}

window.WorkspaceSettings = WorkspaceSettings;

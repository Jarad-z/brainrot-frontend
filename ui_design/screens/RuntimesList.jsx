// screens/RuntimesList.jsx
// Reads:  window.React, window.MOCK (RUNTIMES, installToken), window.BR_LIB (format.formatRelative, countdown.useCountdown), window.EmptyState, window.ErrorBanner, window.InstallTokenModal
// Writes: window.RuntimesList, window.InstallTokenModal

/**
 * RuntimesList — table of registered daemon runtimes with install-token CTA.
 * @returns {JSX.Element}
 */
function RuntimesList() {
  const React = window.React;
  const { formatRelative } = window.BR_LIB.format;
  const [modal, setModal] = React.useState(null); // null | { token, expiresAt }
  const [pending, setPending] = React.useState([]); // pending runtime rows

  /** Issue a new install token and open the modal. */
  function issueToken() {
    const t = window.MOCK.installToken();
    setModal(t);
  }

  /** Close modal and add a pending placeholder row. */
  function close() {
    setModal(prev => {
      if (prev) setPending(p => [...p, { id: "pending-" + Date.now(), name: "(pending)", token: prev.token }]);
      return null;
    });
  }

  /**
   * Copy text to clipboard (silent fallback when unsupported).
   * @param {string} text
   */
  function copy(text) {
    navigator.clipboard?.writeText(text);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ flex: 1 }}><h1 className="page-title">Runtimes</h1></div>
        <button onClick={issueToken} style={{
          padding: "8px 16px", background: "var(--ink-0)", color: "var(--paper-0)",
          border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)", fontWeight: "var(--w-semibold)",
          cursor: "pointer", boxShadow: "var(--shadow-current)",
        }}>+ 签发 install token</button>
      </div>

      {window.MOCK.RUNTIMES.length === 0 && pending.length === 0 ? (
        <window.EmptyState glyph="🛰" title="还没有 daemon" description="先签发一个 install token" />
      ) : (
        <div className="card chunky" style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--paper-1)" }}>
                {["name", "host", "os/arch", "capacity", "状态", "最后心跳"].map(h =>
                  <th key={h} style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left", fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {window.MOCK.RUNTIMES.map(r => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--hairline)" }}>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>{r.name}</td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)", fontFamily: "var(--font-mono)" }}>{r.host || "—"}</td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)", fontFamily: "var(--font-mono)" }}>{r.os}/{r.arch}</td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>{r.capacity}</td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                    {r.online ? <span style={{ color: "var(--state-running)" }}>● online</span>
                              : <span style={{ color: "var(--ink-3)", borderBottom: "1.5px dashed var(--ink-3)" }}>○ offline</span>}
                  </td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>
                    {formatRelative(r.lastHeartbeat)}
                  </td>
                </tr>
              ))}
              {pending.map(p => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--hairline)", border: "1.5px dashed var(--ink-3)" }}>
                  <td colSpan={6} style={{ padding: "var(--sp-3) var(--sp-4)", color: "var(--ink-2)", fontStyle: "italic" }}>
                    pending — 等待 daemon 用 token <span className="mono">{p.token}</span> 上线
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <window.InstallTokenModal token={modal.token} expiresAt={modal.expiresAt} onCopy={copy} onClose={close} />}
    </div>
  );
}

/**
 * InstallTokenModal — one-time display of a newly-issued install token.
 * @param {{ token: string, expiresAt: number, onCopy: (text: string) => void, onClose: () => void }} props
 * @returns {JSX.Element}
 */
function InstallTokenModal({ token, expiresAt, onCopy, onClose }) {
  const { useCountdown } = window.BR_LIB.countdown;
  const { label, urgent } = useCountdown(expiresAt);
  const cmd = `daemon --register --token=${token}`;

  return (
    <div role="dialog" style={{
      position: "fixed", inset: 0, background: "rgba(27,24,32,0.4)",
      display: "grid", placeItems: "center", zIndex: 300,
    }}>
      <div style={{
        background: "var(--paper-0)", padding: "var(--sp-6)",
        border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-md)",
        maxWidth: 560, boxShadow: "var(--shadow-current)",
        display: "flex", flexDirection: "column", gap: "var(--sp-4)",
      }}>
        <div style={{ fontWeight: "var(--w-bold)", fontSize: "var(--text-lg)" }}>签发 install token</div>
        <window.ErrorBanner kind="inline" variant="warn" message="此 token 只展示一次，关闭后无法找回" />
        <div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)", marginBottom: 4 }}>token</div>
          <div style={{
            padding: "var(--sp-3) var(--sp-4)", background: "var(--paper-2)",
            border: "1.5px solid var(--hairline)", borderRadius: "var(--r-sm)",
            fontFamily: "var(--font-mono)", fontSize: "var(--text-base)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>{token}</span>
            <button onClick={() => onCopy(token)} style={{ background: "var(--ink-0)", color: "var(--paper-0)", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}>复制</button>
          </div>
          <div style={{ marginTop: 4, fontSize: "var(--text-xs)", color: urgent ? "var(--countdown-urgent)" : "var(--ink-2)" }}>
            过期：{label}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)", marginBottom: 4 }}>命令</div>
          <div style={{
            padding: "var(--sp-3) var(--sp-4)", background: "var(--ink-0)", color: "var(--paper-0)",
            borderRadius: "var(--r-sm)", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
          }}>
            <span style={{ wordBreak: "break-all" }}>{cmd}</span>
            <button onClick={() => onCopy(cmd)} style={{ background: "var(--paper-0)", color: "var(--ink-0)", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}>复制</button>
          </div>
        </div>
        <button onClick={onClose} style={{
          alignSelf: "flex-end", padding: "8px 16px",
          background: "var(--paper-0)", border: "1.5px solid var(--ink-0)",
          borderRadius: "var(--r-sm)", cursor: "pointer", fontWeight: "var(--w-semibold)",
        }}>关闭</button>
      </div>
    </div>
  );
}

window.RuntimesList = RuntimesList;
window.InstallTokenModal = InstallTokenModal;

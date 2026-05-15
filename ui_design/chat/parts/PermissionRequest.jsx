// ui_design/chat/parts/PermissionRequest.jsx
// Reads: window.React, window.Icon, window.useCountdown, window.fmtCountdown
// Writes: window.PermissionRequest, window.PermBlock

const { useState } = React;

function PermissionRequest({ msg, decision, onDecide }) {
  const left = useCountdown(msg.parsed.expiresInSec);
  const [note, setNote] = useState("");
  if (decision) {
    return (
      <div className={"perm-resolved " + decision.kind}>
        <Icon name={decision.kind === "approved" ? "check" : "x"} size={14} stroke={2.5} />
        <span>{decision.kind === "approved" ? "已批准" : "已拒绝"} · {msg.parsed.tool}</span>
        {decision.note && <span style={{ color: "var(--muted)", fontWeight: 500 }}>「{decision.note}」</span>}
      </div>
    );
  }
  return (
    <div className="perm-card">
      <div className="perm-head">
        <Icon name="warn" size={16} stroke={2.5} />
        <span>{msg.parsed.tool} 请求批准</span>
        <span className="countdown">{fmtCountdown(left)}</span>
      </div>
      <div className="perm-body">
        {msg.parsed.note && (
          <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 10 }}>{msg.parsed.note}</div>
        )}
        <div className="perm-args">
          {Object.entries(msg.parsed.input).map(([k, v]) => (
            <div key={k}><span className="k">{k}</span><span className="v">{String(v)}</span></div>
          ))}
        </div>
        <textarea
          className="perm-note"
          placeholder="可选备注（会进入审批历史）…"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <div className="perm-actions">
          <button className="btn primary" onClick={() => onDecide({ kind: "approved", note })}>
            <Icon name="check" size={14} stroke={2.5} /> 批准
          </button>
          <button className="btn" onClick={() => onDecide({ kind: "approved", note, edited: true })}>
            批准并修改
          </button>
          <button className="btn danger" onClick={() => onDecide({ kind: "rejected", note })}>
            <Icon name="x" size={14} stroke={2.5} /> 拒绝
          </button>
        </div>
      </div>
    </div>
  );
}

function PermBlock({ msg, decision, onDecide }) {
  return (
    <div className="chat-msg" style={{ marginTop: -10 }}>
      <div className="av" style={{ visibility: "hidden" }} />
      <div className="body">
        <PermissionRequest msg={msg} decision={decision} onDecide={onDecide} />
      </div>
    </div>
  );
}

window.PermissionRequest = PermissionRequest;
window.PermBlock = PermBlock;

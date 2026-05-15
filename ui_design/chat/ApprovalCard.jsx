// ui_design/chat/ApprovalCard.jsx
// Reads: window.React, window.Icon, window.BR_LIB.countdown.
// Writes: window.ApprovalCard.

/**
 * @typedef {Object} ApprovalLite
 * @property {string} id
 * @property {string} tool                tool_name (e.g. "Bash", "Write")
 * @property {{ command?: string, file_path?: string }} input
 * @property {string} expiresAt           ISO timestamp
 * @property {"pending"|"approved"|"denied"|"approved_with_edits"|"timeout"} [status]
 * @property {string} [agentHandle]
 * @property {string} [project]
 * @property {string} [taskTitle]
 *
 * @typedef {Object} ApprovalCardProps
 * @property {ApprovalLite} approval
 * @property {"inline"|"hub"} mode
 * @property {(id: string, decision: "approved"|"denied"|"approved_with_edits", note?: string) => void} onDecide
 */

/**
 * Shared approval surface used in chat and on /approvals.
 * @param {ApprovalCardProps} props
 */
function ApprovalCard({ approval, mode, onDecide }) {
  const React = window.React;
  const { useCountdown } = window.BR_LIB.countdown;
  const { label, urgent, expired } = useCountdown(approval.expiresAt);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [note, setNote] = React.useState("");

  const decided = approval.status && approval.status !== "pending";
  const buttonsDisabled = expired || decided;

  function decide(d) {
    if (buttonsDisabled) return;
    onDecide(approval.id, d, note.trim() || undefined);
  }

  // Decided / timeout collapsed render
  if (decided || (expired && approval.status === "pending")) {
    const labelMap = {
      approved: "已批准",
      denied: "已拒绝",
      approved_with_edits: "已批准（带修改）",
      timeout: "已超时",
    };
    const status = decided ? approval.status : "timeout";
    return (
      <div style={{
        padding: "var(--sp-3) var(--sp-4)", background: "var(--paper-1)",
        border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)",
        opacity: status === "timeout" ? 0.6 : 1,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: "var(--text-sm)",
      }}>
        <span><strong>{approval.tool}</strong> · {labelMap[status] || status}</span>
        <span style={{ color: "var(--ink-2)" }}>{label !== "已超时" && !decided ? label : ""}</span>
      </div>
    );
  }

  // Pending
  return (
    <div style={{
      background: "var(--paper-0)",
      border: "1.5px solid var(--ink-0)",
      borderRadius: "var(--r-md)",
      overflow: "hidden",
      boxShadow: "var(--shadow-current)",
    }}>
      {/* header: ink-0 bar with diagonal stripe right side */}
      <div style={{
        background: "var(--role-approval-bg)", color: "var(--role-approval-fg)",
        padding: "var(--sp-2) var(--sp-4)", display: "flex", alignItems: "center",
        justifyContent: "space-between",
        backgroundImage: `linear-gradient(90deg, var(--ink-0) 60%, transparent 60%), repeating-linear-gradient(45deg, var(--ink-0) 0 6px, var(--ink-1) 6px 12px)`,
      }}>
        <span style={{ fontWeight: "var(--w-bold)" }}>{approval.tool} 请求批准</span>
        <span className="mono" style={{
          fontSize: "var(--text-xs)",
          color: urgent ? "var(--countdown-urgent)" : "var(--paper-0)",
          fontWeight: urgent ? "var(--w-bold)" : "var(--w-regular)",
          animation: urgent ? "blink 1s steps(2, start) infinite" : "none",
        }}>{label}</span>
      </div>
      <div style={{ padding: "var(--sp-4)", display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
        {mode === "hub" && (approval.project || approval.taskTitle) && (
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>
            {approval.project} · {approval.taskTitle}
          </div>
        )}
        <pre className="mono" style={{
          margin: 0, padding: "var(--sp-2) var(--sp-3)",
          background: "var(--paper-1)", borderRadius: "var(--r-sm)",
          fontSize: "var(--text-xs)", whiteSpace: "pre-wrap", wordBreak: "break-all",
        }}>{approval.input.command || approval.input.file_path || JSON.stringify(approval.input)}</pre>
        {noteOpen && (
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={256}
                    placeholder="备注（可选，≤256 字）"
                    style={{
                      border: "1.5px solid var(--hairline)", borderRadius: "var(--r-sm)",
                      padding: "var(--sp-2)", fontSize: "var(--text-sm)", fontFamily: "inherit",
                      resize: "vertical", minHeight: 60,
                    }} />
        )}
        <div style={{ display: "flex", gap: "var(--sp-2)", justifyContent: "flex-end" }}>
          <button disabled={buttonsDisabled}
                  onClick={() => { setNoteOpen(true); decide("denied"); }}
                  style={{
                    padding: "6px 14px",
                    background: "var(--paper-0)", color: "var(--ink-0)",
                    border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)",
                    fontWeight: "var(--w-semibold)", cursor: buttonsDisabled ? "not-allowed" : "pointer",
                    opacity: buttonsDisabled ? 0.5 : 1,
                  }}>拒绝</button>
          <button disabled={buttonsDisabled}
                  onClick={() => decide("approved")}
                  style={{
                    padding: "6px 14px",
                    background: "var(--ink-0)", color: "var(--paper-0)",
                    border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)",
                    fontWeight: "var(--w-semibold)", cursor: buttonsDisabled ? "not-allowed" : "pointer",
                    boxShadow: buttonsDisabled ? "none" : "var(--shadow-current)",
                    opacity: buttonsDisabled ? 0.5 : 1,
                  }}>批准</button>
        </div>
      </div>
    </div>
  );
}

window.ApprovalCard = ApprovalCard;

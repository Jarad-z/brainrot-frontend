// ui_design/chat/parts/PermissionRequest.jsx
// Reads: window.React, window.ApprovalCard.
// Writes: window.PermissionRequest, window.PermBlock.

/**
 * Thin adapter that maps the legacy mock message shape to ApprovalLite
 * and delegates rendering to the shared ApprovalCard component.
 *
 * Legacy decision shape received from screens.jsx:
 *   approved:            { kind: "approved", note }
 *   approved with edits: { kind: "approved", note, edited: true }
 *   rejected:            { kind: "rejected", note }
 *
 * ApprovalCard callback signature: (id, decision, note)
 *   where decision is "approved" | "denied" | "approved_with_edits"
 *
 * @param {{ msg: object, decision: object|null, onDecide: function }} props
 */
function PermissionRequest({ msg, decision, onDecide }) {
  const parsed = msg.parsed || {};
  const expiresAt = parsed.expiresAt
    || (parsed.expiresInSec
        ? new Date(Date.now() + parsed.expiresInSec * 1000).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString());

  // Map legacy decision → ApprovalLite status
  let status = "pending";
  if (decision) {
    if (decision.kind === "approved" && decision.edited) {
      status = "approved_with_edits";
    } else if (decision.kind === "approved") {
      status = "approved";
    } else {
      // legacy "rejected" → new "denied"
      status = "denied";
    }
  }

  const approval = {
    id: msg.id,
    tool: parsed.tool,
    input: parsed.input || {},
    expiresAt,
    status,
  };

  function handleDecide(_id, kind, note) {
    if (!onDecide) return;
    // Translate new decision token back to legacy shape
    if (kind === "approved_with_edits") {
      onDecide({ kind: "approved", note, edited: true });
    } else if (kind === "denied") {
      onDecide({ kind: "rejected", note });
    } else {
      onDecide({ kind, note });
    }
  }

  return <window.ApprovalCard approval={approval} mode="inline" onDecide={handleDecide} />;
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

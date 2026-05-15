// ui_design/chat/parts/ToolResult.jsx
function ToolResult({ msg, pairing }) {
  const isOrphan = pairing && pairing.orphan === true;
  if (!isOrphan) {
    // Non-orphan results are nested inside their tool_use card (rendered by ToolBlock)
    return null;
  }
  // Orphan: render a yellow-edged warning card
  const summary = (msg.parsed && (msg.parsed.summary || msg.parsed.content)) || "(empty)";
  return (
    <div style={{
      border: "1.5px solid #d9b766",
      background: "#f7e7c4",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 13,
      color: "var(--ink-0, #1b1820)",
      margin: "4px 0",
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>未配对的工具结果</div>
      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: "var(--ink-2, #6f6878)" }}>
        tool_use_id: {msg.parsed?.tool_use_id || "(none)"}
      </div>
      <div style={{ marginTop: 4 }}>{String(summary).slice(0, 200)}</div>
    </div>
  );
}
window.ToolResult = ToolResult;

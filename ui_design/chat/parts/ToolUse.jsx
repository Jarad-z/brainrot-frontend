// ui_design/chat/parts/ToolUse.jsx
// Reads: window.React, window.Icon
// Writes: window.ToolUse, window.ToolBlock

const { useState } = React;

function ToolUse({ msg, result, pairing }) {
  const [open, setOpen] = useState(true);
  const inp = msg.parsed.input || {};
  return (
    <div className="tool-card">
      <div className="tool-head" onClick={() => setOpen(o => !o)}>
        <span className="icn-box"><Icon name="code" size={13} stroke={2.5} /></span>
        <span>{msg.parsed.tool}</span>
        {inp.file_path && <span style={{ color: "var(--muted)", fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: 12 }}>· {inp.file_path}</span>}
        <span className="chevron"><Icon name={open ? "chevron" : "chevron-right"} size={14} /></span>
      </div>
      {open && (
        <div className="tool-body">
          {Object.entries(inp).map(([k, v]) => (
            <div className="kv" key={k}>
              <span className="k">{k}:</span>
              <span style={{ wordBreak: "break-all" }}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      )}
      {result && (
        <div className={"tool-result " + (result.parsed.ok ? "ok" : "err")}>
          <Icon name={result.parsed.ok ? "check" : "x"} size={13} stroke={2.5} />
          <span>{result.parsed.summary}</span>
        </div>
      )}
    </div>
  );
}

// Renders an assistant "card-only" item (tool_use bundled with its result) under previous header
function ToolBlock({ useMsg, resultMsg }) {
  return (
    <div className="chat-msg" style={{ marginTop: -10 }}>
      <div className="av" style={{ visibility: "hidden" }} />
      <div className="body">
        <ToolUse msg={useMsg} result={resultMsg} />
      </div>
    </div>
  );
}

window.ToolUse = ToolUse;
window.ToolBlock = ToolBlock;

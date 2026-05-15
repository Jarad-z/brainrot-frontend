// ui_design/chat/parts/Thinking.jsx
// Reads: window.React, window.Icon
// Writes: window.ThinkingBlock

const { useState } = React;

function ThinkingBlock({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"thinking-card" + (open ? " expanded" : "")} onClick={() => setOpen(o => !o)}>
      <Icon name="spark" size={14} />
      <span className="label">思考</span>
      {open
        ? <span style={{ flex: 1 }}>{text}</span>
        : <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>}
      <Icon name={open ? "chevron" : "chevron-right"} size={14} />
    </div>
  );
}

window.ThinkingBlock = ThinkingBlock;

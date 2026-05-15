// ui_design/chat/MentionList.jsx
// Reads: window.React, window.Icon, window.Avatar, window.BR_LIB.keyboard.
// Writes: window.MentionList.

const { cycle, ARROW_UP, ARROW_DOWN, ENTER, TAB, ESC } = window.BR_LIB.keyboard;

/**
 * Keyboard-driven dropdown for @mention candidates.
 *
 * @param {{
 *   candidates: ReadonlyArray<{ id: string, handle: string, name: string, color?: string }>,
 *   highlight: number,
 *   onPick: (agent: object) => void,
 *   onClose: () => void,
 *   anchorRect: { left: number, top: number, bottom: number },
 * }} props
 */
function MentionList({ candidates, highlight, onPick, onClose, anchorRect }) {
  const wrapRef = window.React.useRef(null);
  window.React.useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  if (!candidates) return null;

  const style = {
    position: "fixed",
    left: anchorRect.left,
    top: anchorRect.bottom + 4,
    minWidth: 240,
    background: "var(--paper-0)",
    border: "1.5px solid var(--ink-0)",
    borderRadius: "var(--r-md)",
    boxShadow: "var(--shadow-current)",
    zIndex: 100,
    overflow: "hidden",
  };

  if (candidates.length === 0) {
    return (
      <div ref={wrapRef} style={style}>
        <div style={{ padding: "var(--sp-3) var(--sp-4)", color: "var(--ink-2)", fontSize: "var(--text-sm)" }}>
          未找到 agent，请检查 handle
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} role="listbox" aria-label="agent mention candidates" style={style}>
      {candidates.map((a, i) => (
        <div key={a.id} role="option" aria-selected={i === highlight}
             onMouseDown={(e) => { e.preventDefault(); onPick(a); }}
             style={{
               display: "flex", alignItems: "center", gap: "var(--sp-3)",
               padding: "8px 12px", cursor: "pointer",
               background: i === highlight ? "var(--paper-2)" : "transparent",
             }}>
          <window.Avatar name={a.name} color={a.color} size={24} radius={6} />
          <span style={{ fontWeight: "var(--w-semibold)" }}>@{a.handle}</span>
          <span style={{ color: "var(--ink-2)", fontSize: "var(--text-xs)" }}>{a.name}</span>
        </div>
      ))}
    </div>
  );
}

window.MentionList = MentionList;

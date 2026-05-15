// ui_design/chat/Composer.jsx
// Reads: window.React, window.Icon, window.MentionList, window.BR_LIB.{mention,keyboard}.
// Writes: window.Composer.

const { activePrefix, filterCandidates, parseSubmit } = window.BR_LIB.mention;
const KB = window.BR_LIB.keyboard;

/**
 * @param {{
 *   agents: ReadonlyArray<{id:string, handle:string, name:string, color?:string, archived?:boolean}>,
 *   onSend: (payload: { text: string, mentions: string[] }) => void,
 *   placeholder?: string,
 * }} props
 */
function Composer({ agents, onSend, placeholder }) {
  const React = window.React;
  const ref = React.useRef(null);
  const [text, setText] = React.useState("");
  const [caret, setCaret] = React.useState(0);
  const [highlight, setHighlight] = React.useState(0);
  const [placedMentions, setPlacedMentions] = React.useState([]);

  const prefix = activePrefix(text, caret);
  const popoverOpen = prefix !== null;
  const candidates = popoverOpen ? filterCandidates(prefix, agents) : [];

  // Keep highlight in range
  React.useEffect(() => {
    if (highlight >= candidates.length) setHighlight(0);
  }, [candidates.length, highlight]);

  // Anchor rect for popover
  const [anchorRect, setAnchorRect] = React.useState({ left: 0, top: 0, bottom: 0 });
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setAnchorRect({ left: r.left + 24, top: r.top, bottom: r.bottom });
  }, [text, popoverOpen]);

  function pick(agent) {
    // replace prefix-and-@ with `@<handle> `
    const before = text.slice(0, caret);
    const atIdx = before.lastIndexOf("@");
    const after = text.slice(caret);
    const newText = text.slice(0, atIdx) + "@" + agent.handle + " " + after;
    const newCaret = atIdx + agent.handle.length + 2;
    setText(newText);
    setCaret(newCaret);
    setPlacedMentions(m => [...m, { id: agent.id, handle: agent.handle }]);
    requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.focus();
        ref.current.setSelectionRange(newCaret, newCaret);
      }
    });
  }

  function onKeyDown(e) {
    if (popoverOpen) {
      if (e.key === KB.ARROW_DOWN) { e.preventDefault(); setHighlight(h => KB.cycle(h, +1, candidates.length)); return; }
      if (e.key === KB.ARROW_UP)   { e.preventDefault(); setHighlight(h => KB.cycle(h, -1, candidates.length)); return; }
      if (e.key === KB.ENTER || e.key === KB.TAB) {
        if (candidates.length > 0) { e.preventDefault(); pick(candidates[highlight]); return; }
      }
      if (e.key === KB.ESC) { e.preventDefault(); setCaret(c => c); return; }
    }
    if (KB.isSubmitChord(e)) {
      e.preventDefault();
      send();
    }
  }

  function onInput(e) {
    setText(e.target.value);
    setCaret(e.target.selectionStart);
  }
  function onSelect(e) {
    setCaret(e.target.selectionStart);
  }

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const payload = parseSubmit(trimmed, placedMentions);
    onSend(payload);
    setText("");
    setCaret(0);
    setPlacedMentions([]);
  }

  return (
    <div className="composer" style={{
      display: "flex", flexDirection: "column", gap: "var(--sp-2)",
      padding: "var(--sp-3)",
      border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)",
      background: "var(--paper-0)",
    }}>
      <textarea
        ref={ref}
        value={text}
        onChange={onInput}
        onKeyDown={onKeyDown}
        onSelect={onSelect}
        placeholder={placeholder || "输入消息，@ 一个 agent；Ctrl+Enter 发送"}
        rows={3}
        style={{
          font: "inherit", border: "none", outline: "none", background: "transparent",
          resize: "vertical", minHeight: 60, fontSize: "var(--text-base)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>Ctrl+Enter 发送</span>
        <button
          onClick={send}
          disabled={!text.trim()}
          style={{
            padding: "6px 14px",
            background: text.trim() ? "var(--ink-0)" : "var(--ink-3)",
            color: "var(--paper-0)", border: "1.5px solid var(--ink-0)",
            borderRadius: "var(--r-sm)", fontWeight: "var(--w-semibold)",
            fontSize: "var(--text-sm)", cursor: text.trim() ? "pointer" : "not-allowed",
            boxShadow: "var(--shadow-current)",
          }}>
          发送
        </button>
      </div>
      {popoverOpen && (
        <window.MentionList
          candidates={candidates}
          highlight={highlight}
          onPick={pick}
          onClose={() => { /* prefix flips to null when user moves caret; nothing to do */ }}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}

window.Composer = Composer;

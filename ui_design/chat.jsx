// ====== Chat / Message rendering ======
// Sub-components live in chat/parts/*.jsx (loaded before this file).
// This file only contains MessageList (dispatcher) and Composer.

function MessageList({ messages, decisions, onDecide }) {
  // pair tool_use ↔ tool_result by tool_use_id
  const resultByUse = useMemo(() => {
    const m = {};
    messages.forEach(x => {
      if (x.parsed.type === "tool_result") m[x.parsed.tool_use_id] = x;
    });
    return m;
  }, [messages]);

  return (
    <>
      {messages.map((msg) => {
        const t = msg.parsed.type;
        if (t === "user") return <window.UserMessage key={msg.id} msg={msg} />;
        if (t === "assistant_text" || t === "thinking") return <window.AssistantMessage key={msg.id} msg={msg} />;
        if (t === "tool_use") return <window.ToolBlock key={msg.id} useMsg={msg} resultMsg={resultByUse[msg.parsed.tool_use_id]} />;
        if (t === "tool_result") return null;
        if (t === "permission_request") return <window.PermBlock key={msg.id} msg={msg} decision={decisions[msg.id]} onDecide={(d) => onDecide(msg.id, d)} />;
        if (t === "result") return <window.ResultBanner key={msg.id} msg={msg} />;
        if (t === "system") return <window.SystemLine key={msg.id} text={msg.parsed.text} />;
        return null;
      })}
    </>
  );
}

// ====== Composer with @mention pop ======
function Composer({ agents, onSend }) {
  const [text, setText] = useState("@ux ");
  const [showPop, setShowPop] = useState(false);
  const [filter, setFilter] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef(null);

  // detect @ trigger
  useEffect(() => {
    const m = text.match(/@([a-z0-9_-]*)$/i);
    if (m) { setShowPop(true); setFilter(m[1].toLowerCase()); setActiveIdx(0); }
    else setShowPop(false);
  }, [text]);

  const filtered = useMemo(() => {
    if (!filter) return agents;
    return agents.filter(a => a.handle.toLowerCase().startsWith(filter) || a.name.toLowerCase().startsWith(filter));
  }, [filter, agents]);

  const insertMention = (a) => {
    const newText = text.replace(/@([a-z0-9_-]*)$/i, `@${a.handle} `);
    setText(newText);
    setShowPop(false);
    setTimeout(() => ref.current?.focus(), 0);
  };

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    const mentions = [...t.matchAll(/@([a-z0-9_-]+)/gi)].map(m => m[1]);
    onSend({ text: t, mentions });
    setText("");
  };

  const onKey = (e) => {
    if (showPop && filtered.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => (i + 1) % filtered.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => (i - 1 + filtered.length) % filtered.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(filtered[activeIdx]); return; }
      if (e.key === "Escape") { setShowPop(false); return; }
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="composer">
      {showPop && filtered.length > 0 && (
        <div className="mention-pop">
          <div className="mention-pop-head">召唤 agent</div>
          {filtered.map((a, i) => (
            <div key={a.id} className="item" data-active={i === activeIdx}
                 onMouseEnter={() => setActiveIdx(i)} onClick={() => insertMention(a)}>
              <AgentAvatar agent={a} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="name">{a.name} <span className="handle">@{a.handle}</span></div>
                <div className="desc">{a.desc}</div>
              </div>
              {a.online && <span style={{ width: 7, height: 7, borderRadius: 2, background: "var(--success)", border: "1px solid var(--border-dark)" }} />}
            </div>
          ))}
        </div>
      )}
      <textarea
        ref={ref}
        className="composer-input"
        placeholder="发消息… 用 @ 召唤一个 agent · Ctrl+Enter 发送"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKey}
      />
      <div className="composer-actions">
        <div className="left">
          <button className="btn ghost sm" title="附件"><Icon name="paperclip" size={14} /> 附件</button>
          <button className="btn ghost sm" title="@" onClick={() => setText(t => t + (t.endsWith(" ") || !t ? "" : " ") + "@")}>
            <Icon name="at" size={14} /> 召唤 agent
          </button>
        </div>
        <div className="right">
          <span className="kbd">⌘</span><span className="kbd">↵</span>
          <button className="btn primary" onClick={submit}>
            <Icon name="send" size={13} stroke={2.5} /> 发送
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MessageList, Composer });

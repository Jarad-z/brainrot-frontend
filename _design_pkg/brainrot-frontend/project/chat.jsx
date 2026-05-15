// ====== Chat / Message rendering ======

// Highlights @mentions in plain text by wrapping in pill spans
function MentionedText({ text }) {
  const parts = text.split(/(@[a-z][a-z0-9_-]*)/gi);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("@")) {
          return <span key={i} className="mention-pill"><Icon name="at" size={11} stroke={2.5} />{p.slice(1)}</span>;
        }
        // preserve newlines and basic **bold**
        return p.split("\n").flatMap((line, li) => {
          const segs = line.split(/(\*\*[^*]+\*\*)/g).map((seg, si) => {
            if (seg.startsWith("**")) return <strong key={si}>{seg.slice(2, -2)}</strong>;
            return <React.Fragment key={si}>{seg}</React.Fragment>;
          });
          return li === 0
            ? <React.Fragment key={`${i}-${li}`}>{segs}</React.Fragment>
            : [<br key={`br-${i}-${li}`} />, <React.Fragment key={`${i}-${li}`}>{segs}</React.Fragment>];
        });
      })}
    </>
  );
}

function UserMessage({ msg }) {
  return (
    <div className="chat-msg">
      <div className="av"><Avatar name={msg.author.name} color={msg.author.color} size={36} /></div>
      <div className="body">
        <div className="chat-meta">
          <span className="name">{msg.author.name}</span>
          <span className="handle">@{msg.author.handle}</span>
          <span className="time">· {msg.time}</span>
        </div>
        <div className="bubble user">
          <MentionedText text={msg.parsed.text} />
        </div>
      </div>
    </div>
  );
}

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

function CodeBlock({ children }) {
  return (
    <pre><code dangerouslySetInnerHTML={{ __html:
      String(children)
        .replace(/(\bconst\b|\blet\b|\bfunction\b|\breturn\b|\bif\b|\belse\b|\bimport\b|\bfrom\b|\bexport\b|\bawait\b|\basync\b)/g, '<span class="kw">$1</span>')
        .replace(/("[^"]*"|'[^']*')/g, '<span class="str">$1</span>')
        .replace(/(\/\/[^\n]*)/g, '<span class="cm">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="num">$1</span>')
    }} /></pre>
  );
}

function AssistantText({ msg }) {
  const text = msg.parsed.text;
  // Split into paragraphs / code blocks
  const blocks = text.split(/```([\s\S]*?)```/g);
  return (
    <div className="bubble agent">
      {blocks.map((b, i) => {
        if (i % 2 === 1) {
          const firstLine = b.split("\n")[0];
          const body = b.slice(firstLine.length + 1);
          return <CodeBlock key={i}>{body || b}</CodeBlock>;
        }
        return <div key={i}><MentionedText text={b} /></div>;
      })}
    </div>
  );
}

function ToolUse({ msg, result }) {
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

function AssistantMessage({ msg, runMessages, decisionFor, onDecide }) {
  const t = msg.parsed.type;
  if (t === "tool_use") {
    // result is matched at the parent level — we render the use card only
    return null; // rendered via pair
  }
  if (t === "tool_result") return null;
  if (t === "permission_request") return null;
  return (
    <div className="chat-msg">
      <div className="av"><AgentAvatar agent={msg.author} size={36} /></div>
      <div className="body">
        <div className="chat-meta">
          <span className="name">{msg.author.name}</span>
          <span className="handle">@{msg.author.handle}</span>
          <span className="time">· {msg.time}</span>
          {msg.runId && <span className="tag mono" style={{ marginLeft: 4 }}>run#{msg.runId}</span>}
        </div>
        {t === "assistant_text" && <AssistantText msg={msg} />}
        {t === "thinking" && <ThinkingBlock text={msg.parsed.text} />}
      </div>
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

function ResultLine({ msg }) {
  const secs = (msg.parsed.durationMs / 1000).toFixed(1);
  return (
    <div className="result-line">
      <span className="ok-dot" />
      完成 · {secs}s · 用了 {msg.parsed.tools} 个工具
    </div>
  );
}

function SystemLine({ text }) {
  return <div className="sys-line">{text}</div>;
}

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
        if (t === "user") return <UserMessage key={msg.id} msg={msg} />;
        if (t === "assistant_text" || t === "thinking") return <AssistantMessage key={msg.id} msg={msg} />;
        if (t === "tool_use") return <ToolBlock key={msg.id} useMsg={msg} resultMsg={resultByUse[msg.parsed.tool_use_id]} />;
        if (t === "tool_result") return null;
        if (t === "permission_request") return <PermBlock key={msg.id} msg={msg} decision={decisions[msg.id]} onDecide={(d) => onDecide(msg.id, d)} />;
        if (t === "result") return <ResultLine key={msg.id} msg={msg} />;
        if (t === "system") return <SystemLine key={msg.id} text={msg.parsed.text} />;
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

// ui_design/chat/parts/AssistantText.jsx
// Reads: window.React, window.Icon, window.AgentAvatar, window.MentionedText, window.ThinkingBlock
// Writes: window.CodeBlock, window.AssistantText, window.AssistantMessage

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
        return <div key={i}><window.MentionedText text={b} /></div>;
      })}
    </div>
  );
}

function AssistantMessage({ msg }) {
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
        {t === "thinking" && <window.ThinkingBlock text={msg.parsed.text} />}
      </div>
    </div>
  );
}

window.CodeBlock = CodeBlock;
window.AssistantText = AssistantText;
window.AssistantMessage = AssistantMessage;

// ui_design/chat/parts/UserMessage.jsx
// Reads: window.React, window.Icon, window.Avatar
// Writes: window.MentionedText, window.UserMessage

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

function UserMessage({ msg, pairing }) {
  return (
    <div className="chat-msg">
      <div className="av"><Avatar name={msg.author.name} color={msg.author.color} size={36} /></div>
      <div className="body">
        <div className="chat-meta">
          <span className="name">{msg.author.name}</span>
          <span className="handle">@{msg.author.handle}</span>
          <span className="time">· {msg.time}</span>
          {pairing && pairing.queued && (
            <span style={{
              marginLeft: 8, padding: "1px 8px", fontSize: 11,
              color: "var(--ink-2, #6f6878)",
              border: "1.5px dashed var(--ink-2, #6f6878)",
              borderRadius: 999,
            }} title="等待 agent 完成当前 run 后自动触发">排队中</span>
          )}
        </div>
        <div className="bubble user">
          <MentionedText text={msg.parsed.text} />
        </div>
      </div>
    </div>
  );
}

window.MentionedText = MentionedText;
window.UserMessage = UserMessage;

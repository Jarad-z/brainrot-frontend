// ui_design/chat/MessageList.jsx
// Reads: window.React, window.MessageItem, window.UserMessage, window.AssistantMessage,
//        window.ToolBlock, window.PermBlock, window.ResultBanner, window.SystemLine,
//        window.ToolUse, window.ToolResult.
// Writes: window.MessageList, window.__pairToolMessages (for tests/debug).

/**
 * Build a pairing index: for every tool_result, find its matching tool_use by
 * `tool_use_id`. Returns:
 *   - useToResult: Map<use_id, result_msg>
 *   - consumed: Set<result_msg.id> (results nested under their use)
 *   - orphanResults: Set<result_msg.id> (results without a matching use)
 *
 * @param {ReadonlyArray<{id: string, parsed: any}>} messages
 */
function pairToolMessages(messages) {
  const useToResult = new Map();
  const consumed = new Set();
  const orphanResults = new Set();

  for (const m of messages) {
    const p = m.parsed;
    if (!p) continue;
    if (p.type === "tool_result") {
      const id = p.tool_use_id;
      const matched = messages.find(x => x.parsed && x.parsed.type === "tool_use" && x.parsed.tool_use_id === id);
      if (matched) {
        useToResult.set(id, m);
        consumed.add(m.id);
      } else {
        orphanResults.add(m.id);
      }
    }
  }
  return { useToResult, consumed, orphanResults };
}

/**
 * @param {{
 *   messages: ReadonlyArray<{id: string, parsed: any}>,
 *   queuedMessageIds?: Set<string>,
 *   decisions?: Record<string, object>,
 *   onDecide?: (msgId: string, decision: object) => void,
 * }} props
 */
function MessageList({ messages, queuedMessageIds, decisions, onDecide }) {
  const { useToResult, consumed, orphanResults } = React.useMemo(
    () => pairToolMessages(messages),
    [messages]
  );

  return (
    <>
      {messages.map(msg => {
        // Results nested under their use are NOT rendered standalone here
        if (consumed.has(msg.id)) return null;

        const p = msg.parsed;
        const type = p && p.type;

        // tool_use renders with its result nested (preserves existing ToolBlock behavior)
        if (type === "tool_use") {
          const result = useToResult.get(p.tool_use_id);
          return (
            <div key={msg.id} className="tool-pair">
              <window.ToolBlock useMsg={msg} resultMsg={result} />
              {!result && (
                <div className="tool-running" style={{
                  marginLeft: 48, fontSize: 12, color: "var(--ink-2, #6f6878)",
                  padding: "4px 0",
                }}>
                  <span style={{
                    display: "inline-block", width: 32, height: 8,
                    background: "repeating-linear-gradient(90deg, var(--ink-2, #6f6878) 0 4px, transparent 4px 8px)",
                    marginRight: 8, verticalAlign: "middle",
                  }} />
                  正在运行…
                </div>
              )}
            </div>
          );
        }

        const queued = queuedMessageIds && queuedMessageIds.has(msg.id);
        const pairing = {
          orphan: orphanResults.has(msg.id),
          queued: !!queued,
        };

        // PermissionRequest needs decision + onDecide
        if (type === "permission_request") {
          return (
            <window.MessageItem
              key={msg.id}
              msg={msg}
              pairing={pairing}
              decision={decisions && decisions[msg.id]}
              onDecide={(d) => onDecide && onDecide(msg.id, d)}
            />
          );
        }

        return <window.MessageItem key={msg.id} msg={msg} pairing={pairing} />;
      })}
    </>
  );
}

window.MessageList = MessageList;
window.__pairToolMessages = pairToolMessages;

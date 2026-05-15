// ui_design/chat/MessageItem.jsx
// Reads: all window.<part> components. Writes: window.MessageItem.

const PART_MAP = {
  user:               () => window.UserMessage,
  assistant_text:     () => window.AssistantMessage,  // wraps with avatar+meta
  thinking:           () => window.AssistantMessage,  // also flows through AssistantMessage
  tool_use:           () => window.ToolBlock,         // no-avatar wrapper
  tool_result:        () => window.ToolResult,
  permission_request: () => window.PermBlock,
  result:             () => window.ResultBanner,
  system:             () => window.SystemLine,
};

/**
 * Dispatch a parsed message to its rendering component.
 *
 * @param {{ msg: object, pairing?: { hasResult?: boolean, paired?: boolean, orphan?: boolean, queued?: boolean }, onDecide?: Function, decision?: object }} props
 */
function MessageItem({ msg, pairing, ...rest }) {
  const type = msg.parsed && msg.parsed.type ? msg.parsed.type : "user";
  const Comp = (PART_MAP[type] && PART_MAP[type]()) || window.SystemLine;
  if (!Comp) {
    return <window.SystemLine text={"未知消息类型: " + type} />;
  }
  // SystemLine takes `text` prop; the rest take `msg`.
  if (type === "system") {
    return <Comp text={(msg.parsed && msg.parsed.text) || ""} />;
  }
  return <Comp msg={msg} pairing={pairing} {...rest} />;
}

window.MessageItem = MessageItem;

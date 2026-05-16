import type { ClientMessage } from "@/lib/api/types";

interface SystemLineProps {
  msg: ClientMessage;
}

export function SystemLine({ msg }: SystemLineProps) {
  const text = msg.parsed.type === "system" ? msg.parsed.payload : "";
  return <div className="text-xs text-ink-2 text-center py-1">{text}</div>;
}

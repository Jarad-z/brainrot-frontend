import type { Runtime } from "@/lib/api/types";
import { messages } from "@/lib/messages";

interface RuntimeRowProps {
  runtime: Runtime;
}

export function RuntimeRow({ runtime }: RuntimeRowProps) {
  const m = messages.runtimes;
  return (
    <li className="border-[1.5px] border-hairline rounded-md p-3 bg-paper-0 flex items-center gap-4">
      <span
        className={
          runtime.online
            ? "inline-block w-2 h-2 rounded-full bg-state-approved"
            : "inline-block w-2 h-2 rounded-full bg-ink-3"
        }
        aria-label={runtime.online ? m.online : m.offline}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{runtime.host}</div>
        <div className="text-xs text-ink-2 truncate">
          {runtime.online ? m.online : m.offline}
          {runtime.last_heartbeat ? ` · ${m.lastHeartbeat} ${runtime.last_heartbeat}` : ""}
        </div>
      </div>
      <div className="text-xs text-ink-2">
        {m.capacity}: {runtime.capacity}
      </div>
    </li>
  );
}

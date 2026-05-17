import type { ClientMessage } from "@/lib/api/types";

interface ResultBannerProps {
  msg: ClientMessage;
}

export function ResultBanner({ msg }: ResultBannerProps) {
  if (msg.parsed.type !== "result") return null;
  const secs = (msg.parsed.payload.duration_ms / 1000).toFixed(1);
  return (
    <div className="flex items-center justify-center gap-2 my-3 py-2 border-t-[1.5px] border-b-[1.5px] border-hairline text-xs text-ink-2">
      <span className="w-1.5 h-1.5 rounded-full bg-status-done" />
      完成 · {secs}s
    </div>
  );
}

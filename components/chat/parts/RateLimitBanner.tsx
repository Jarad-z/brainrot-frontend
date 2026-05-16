import type { ClientMessage } from "@/lib/api/types";

interface RateLimitBannerProps {
  msg: ClientMessage;
}

export function RateLimitBanner({ msg }: RateLimitBannerProps) {
  if (msg.parsed.type !== "rate_limit_event") return null;
  return (
    <div className="my-2 px-3 py-2 border-[1.5px] border-state-failed bg-state-failed/10 text-state-failed text-xs">
      速率限制，{msg.parsed.payload.retry_in_seconds}s 后重试
    </div>
  );
}

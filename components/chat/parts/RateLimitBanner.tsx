import type { ClientMessage } from "@/lib/api/types";

interface RateLimitBannerProps {
  msg: ClientMessage;
}

interface RateLimitPayload {
  retry_in_seconds?: number;
  rate_limit_info?: {
    status?: string;
    resetsAt?: number;
    rateLimitType?: string;
  };
}

function formatWait(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)} 分钟`;
  return `${Math.round(sec / 3600)} 小时`;
}

export function RateLimitBanner({ msg }: RateLimitBannerProps) {
  if (msg.parsed.type !== "rate_limit_event") return null;
  const payload = msg.parsed.payload as RateLimitPayload;
  const info = payload.rate_limit_info;
  // Claude periodically emits rate_limit_event with status="allowed" as a
  // quota heartbeat — not an actual throttle. Only surface real throttles.
  if (info && info.status === "allowed") return null;

  let wait = "";
  if (typeof payload.retry_in_seconds === "number") {
    wait = `，${formatWait(payload.retry_in_seconds)} 后重试`;
  } else if (info?.resetsAt) {
    const sec = Math.max(0, info.resetsAt - Math.floor(Date.now() / 1000));
    wait = `，${formatWait(sec)} 后重置`;
  }

  return (
    <div className="my-2 px-3 py-2 border-[1.5px] border-state-failed bg-state-failed/10 text-state-failed text-xs">
      速率限制{wait}
    </div>
  );
}

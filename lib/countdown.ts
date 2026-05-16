import { useEffect, useState } from "react";

export const URGENT_MS = 10 * 60 * 1000;

export interface CountdownState {
  remainingMs: number;
  label: string;
  urgent: boolean;
  expired: boolean;
}

export function computeCountdown(expiresAt: string | number, nowMs: number): CountdownState {
  const exp = typeof expiresAt === "number" ? expiresAt : Date.parse(expiresAt);
  const remaining = Math.max(0, exp - nowMs);
  const expired = remaining === 0;
  const urgent = !expired && remaining <= URGENT_MS;
  const totalSec = Math.floor(remaining / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const label = expired ? "已超时" : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return { remainingMs: remaining, label, urgent, expired };
}

export function useCountdown(expiresAt: string | number): CountdownState {
  const [, force] = useState(0);
  useEffect(() => {
    let raf = 0;
    let lastSec = -1;
    const tick = () => {
      const state = computeCountdown(expiresAt, Date.now());
      const sec = Math.floor(state.remainingMs / 1000);
      if (sec !== lastSec) {
        lastSec = sec;
        force((x) => x + 1);
      }
      if (!state.expired) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [expiresAt]);
  return computeCountdown(expiresAt, Date.now());
}

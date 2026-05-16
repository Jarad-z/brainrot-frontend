"use client";
import { useEffect, useState } from "react";

interface CountdownState {
  label: string;
  urgent: boolean;
  expired: boolean;
}

const URGENT_MS = 5 * 60 * 1000;

export function useCountdown(expiresAt: string | undefined): CountdownState {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!expiresAt) return { label: "—", urgent: false, expired: false };
  const target = Date.parse(expiresAt);
  const diff = target - now;
  if (diff <= 0) return { label: "已超时", urgent: false, expired: true };
  const totalSec = Math.floor(diff / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return {
    label: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    urgent: diff <= URGENT_MS,
    expired: false,
  };
}

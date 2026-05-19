"use client";

import { usePathname } from "next/navigation";

const RE = /^\/w\/[^/]+\/p\/([^/]+)(?:\/|$)/;

export function useProjectIdFromRoute(): string | null {
  const pathname = usePathname();
  if (!pathname) return null;
  const m = pathname.match(RE);
  return m?.[1] ?? null;
}

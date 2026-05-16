"use client";

import { cn } from "@/lib/utils";

export interface BrandMarkProps {
  logo: string;
  size?: number;
  className?: string;
}

export function BrandMark({ logo, size = 36, className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "grid place-items-center bg-accent text-accent-fg font-bold rounded-lg",
        "border-[1.5px] border-ink-0 shadow-[var(--shadow-current)]",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
    >
      {logo}
    </span>
  );
}

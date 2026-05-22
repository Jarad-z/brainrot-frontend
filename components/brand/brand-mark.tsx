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
      data-brand="mark"
      className={cn(
        "brand-mark grid place-items-center bg-accent text-accent-fg font-bold rounded-[10px]",
        "shadow-[var(--shadow-1)]",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.46) }}
    >
      {/* Letter is hidden under y2k via CSS, replaced by gradient orb */}
      <span className="brand-mark__letter">{logo}</span>
    </span>
  );
}

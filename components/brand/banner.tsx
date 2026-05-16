"use client";

import { cn } from "@/lib/utils";

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Banner({ className, children, ...rest }: BannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "bg-ink-0 text-paper-0 text-xs font-bold tracking-[0.02em]",
        "px-3 py-1.5 text-center border-b-[1.5px] border-ink-0",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

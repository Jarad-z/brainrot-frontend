"use client";

import { cn } from "@/lib/utils";

export interface CrumbProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Crumb({ className, children, ...rest }: CrumbProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-[13px] text-ink-2 font-semibold whitespace-nowrap overflow-hidden min-w-0",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CrumbSegProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
}

export function CrumbSeg({ active, className, ...rest }: CrumbSegProps) {
  return (
    <span
      className={cn(
        "cursor-pointer py-0.5 truncate",
        active ? "text-ink-0 font-bold" : "text-ink-2 hover:text-ink-0",
        className,
      )}
      {...rest}
    />
  );
}

export function CrumbSep() {
  return <span className="text-ink-3 shrink-0">/</span>;
}

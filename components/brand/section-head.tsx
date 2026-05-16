"use client";

import { cn } from "@/lib/utils";

export interface SectionHeadProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  count?: number;
}

export function SectionHead({
  title,
  count,
  children,
  className,
  ...rest
}: SectionHeadProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2.5 mb-3.5 flex-wrap",
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-2 font-extrabold text-sm whitespace-nowrap">
        <span className="font-tight">{title}</span>
        {count !== undefined && (
          <span className="px-[7px] py-[1.5px] rounded-md bg-paper-2 text-ink-2 text-[11px] font-bold border-[1.5px] border-hairline">
            {count}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  foot?: string;
  hot?: boolean;
}

export function StatCard({
  label,
  value,
  foot,
  hot: _hot,
  className,
  ...rest
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden flex flex-col justify-between",
        "rounded-xl border border-hairline p-4",
        "bg-bg-secondary text-ink-0",
        "aspect-[1/0.78] min-w-0",
        className,
      )}
      {...rest}
    >
      <div className="text-[11px] font-medium text-ink-2 whitespace-nowrap">
        {label}
      </div>
      <div
        className={cn(
          "stat-num font-medium my-1",
          value === "—" ? "text-[28px] text-ink-3" : "text-[40px]",
        )}
      >
        {value}
      </div>
      {foot && (
        <div className="text-[12px] text-ink-2">
          {foot}
        </div>
      )}
    </div>
  );
}

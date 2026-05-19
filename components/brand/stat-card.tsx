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
  hot,
  className,
  ...rest
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden flex flex-col justify-between",
        "rounded-2xl border-[1.5px] border-ink-0 shadow-[var(--shadow-current)] p-4",
        hot ? "bg-accent text-accent-fg stat-hot-stripe" : "bg-paper-0 text-ink-0",
        "aspect-[1/0.78] min-w-0",
        className,
      )}
      {...rest}
    >
      {hot && <span className="stat-hot-stripe-after" />}
      <div
        className={cn(
          "font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] whitespace-nowrap",
          hot ? "text-accent-fg/85" : "text-ink-2",
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "stat-num text-[44px] font-extrabold my-1.5",
          // Dimmed when value is a placeholder dash — keeps the empty
          // dashboard from reading as broken/dead.
          value === "—" && (hot ? "opacity-60" : "text-ink-3"),
        )}
      >
        {value}
      </div>
      {foot && (
        <div
          className={cn(
            "font-mono text-[11px] font-semibold",
            hot ? "text-accent-honey" : "text-ink-2",
          )}
        >
          {foot}
        </div>
      )}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

export interface WsSwitcherProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  meta?: string;
  avatar: string;
}

export function WsSwitcher({
  name,
  meta,
  avatar,
  className,
  ...rest
}: WsSwitcherProps) {
  return (
    <button
      type="button"
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left",
        "bg-paper-2 border-[1.5px] border-hairline hover:border-ink-1 transition-colors",
        "overflow-hidden",
        className,
      )}
      {...rest}
    >
      <span className="grid place-items-center w-[26px] h-[26px] bg-accent text-accent-fg font-bold text-xs rounded-md border-[1.25px] border-ink-0 shrink-0">
        {avatar}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-bold text-ink-0 truncate">
          {name}
        </span>
        {meta && (
          <span className="block text-[10.5px] font-medium text-ink-2 truncate">
            {meta}
          </span>
        )}
      </span>
    </button>
  );
}

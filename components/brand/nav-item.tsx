"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface NavItemProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  disabled?: boolean;
  count?: number;
  icon?: React.ReactNode;
}

export const NavItem = forwardRef<HTMLDivElement, NavItemProps>(
  ({ active, disabled, count, icon, children, className, ...rest }, ref) => (
    <div
      ref={ref}
      data-active={active || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        "group relative mx-2.5 my-0.5 pl-4 pr-3 py-2 rounded-lg flex items-center gap-2.5",
        "text-[13.5px] font-semibold text-ink-1 cursor-pointer select-none whitespace-nowrap",
        "border-[1.5px] border-transparent transition-colors",
        active && "bg-paper-2 text-ink-0 border-hairline",
        !active && !disabled && "hover:bg-paper-2",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-1 top-2 bottom-2 rounded-sm bg-accent transition-[width,opacity]",
          active ? "w-[3px] opacity-100" : "w-0 opacity-0 group-hover:w-[2px] group-hover:opacity-70",
        )}
      />
      {icon && (
        <span className="shrink-0 w-[18px] h-[18px] text-ink-1">{icon}</span>
      )}
      <span className="flex-1 min-w-0 truncate">{children}</span>
      {count !== undefined && count > 0 && (
        <span className="shrink-0 px-[7px] py-[1px] rounded-md bg-accent text-accent-fg text-[11px] font-bold border-[1px] border-ink-0">
          {count}
        </span>
      )}
    </div>
  ),
);
NavItem.displayName = "NavItem";

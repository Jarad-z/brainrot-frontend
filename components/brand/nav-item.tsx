"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type NavSwatch = "bondi" | "tangerine" | "grape" | "lime" | "strawberry" | "teal";

export interface NavItemProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  disabled?: boolean;
  count?: number;
  icon?: React.ReactNode;
  /** Candy-orb color shown in front of the label under the y2k theme.
   *  Invisible in aero theme so existing layouts are unchanged. */
  swatch?: NavSwatch;
}

export const NavItem = forwardRef<HTMLDivElement, NavItemProps>(
  ({ active, disabled, count, icon, swatch, children, className, ...rest }, ref) => (
    <div
      ref={ref}
      data-active={active || undefined}
      data-disabled={disabled || undefined}
      data-nav-swatch={swatch}
      className={cn(
        "nav-item group relative mx-2 my-0.5 px-3 py-1.5 rounded-md flex items-center gap-2.5",
        "text-[13px] font-medium text-ink-1 cursor-pointer select-none whitespace-nowrap",
        "transition-all border border-transparent",
        active && "aero-active text-white font-semibold",
        !active && !disabled && "hover:bg-white/50 hover:border-white/55 hover:text-ink-0",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...rest}
    >
      {icon && (
        <span className="shrink-0 w-[16px] h-[16px]">{icon}</span>
      )}
      <span className="flex-1 min-w-0 truncate">{children}</span>
      {count !== undefined && count > 0 && (
        <span className="shrink-0 px-1.5 text-[11px] font-semibold rounded-full bg-accent text-accent-fg">
          {count}
        </span>
      )}
    </div>
  ),
);
NavItem.displayName = "NavItem";

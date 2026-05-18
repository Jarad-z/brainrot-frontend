"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  badge?: number | string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ badge, className, children, ...rest }, ref) => {
    const badgeText =
      typeof badge === "number"
        ? badge > 0
          ? String(badge)
          : undefined
        : badge && badge.length > 0
          ? badge
          : undefined;
    return (
      <button
        ref={ref}
        className={cn(
          "relative w-9 h-9 grid place-items-center rounded-md",
          "bg-paper-0 border-[1.5px] border-hairline text-ink-2",
          "hover:border-ink-1 active:translate-y-px",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        {...rest}
      >
        {children}
        {badgeText !== undefined && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[5px] rounded-full bg-accent text-accent-fg text-[10px] font-bold grid place-items-center border-[1.5px] border-paper-0">
            {badgeText}
          </span>
        )}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";

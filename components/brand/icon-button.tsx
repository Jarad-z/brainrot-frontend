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
          "relative w-8 h-8 grid place-items-center rounded-full text-ink-1",
          "transition-all active:translate-y-px",
          "hover:brightness-110 hover:text-ink-0",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.30) 50%, rgba(220,235,250,0.28) 100%)",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(30,72,119,0.10), 0 1px 2px rgba(30,72,119,0.08)",
        }}
        {...rest}
      >
        {children}
        {badgeText !== undefined && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-[4px] rounded-full text-white text-[10px] font-bold grid place-items-center"
            style={{
              background:
                "linear-gradient(180deg, #f3a76b 0%, #e07c3f 50%, #c4571e 100%)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 2px rgba(196,87,30,0.4)",
              textShadow: "0 -1px 0 rgba(150,55,15,0.4)",
            }}
          >
            {badgeText}
          </span>
        )}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";

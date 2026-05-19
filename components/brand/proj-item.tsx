"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type SwatchName = "green" | "blue" | "pink" | "amber" | "violet" | "teal";

const swatchClass: Record<SwatchName, string> = {
  green: "topstrip-green",
  blue: "topstrip-blue",
  pink: "topstrip-pink",
  amber: "topstrip-amber",
  violet: "topstrip-violet",
  teal: "topstrip-teal",
};

export interface ProjItemProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  disabled?: boolean;
  count?: number;
  swatch?: SwatchName;
}

export const ProjItem = forwardRef<HTMLDivElement, ProjItemProps>(
  (
    { active, disabled, count, swatch, children, className, ...rest },
    ref,
  ) => (
    <div
      ref={ref}
      data-active={active || undefined}
      className={cn(
        "mx-2.5 my-0.5 px-3 py-[7px] rounded-lg flex items-center gap-2.5",
        "text-[13px] text-ink-1 cursor-pointer border-[1.5px] border-transparent",
        active && "bg-paper-2 text-ink-0 font-bold border-hairline",
        !active && !disabled && "hover:bg-paper-2",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...rest}
    >
      {swatch && (
        <span
          className={cn(
            "shrink-0 w-[14px] h-[14px] rounded-[5px] border-[1.25px] border-ink-0 bg-paper-0",
            swatchClass[swatch],
          )}
        />
      )}
      <span className="flex-1 min-w-0 truncate">{children}</span>
      {count !== undefined && count > 0 && (
        <span className="shrink-0 text-[11px] text-ink-2 font-bold">{count}</span>
      )}
    </div>
  ),
);
ProjItem.displayName = "ProjItem";

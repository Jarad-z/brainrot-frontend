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

/** Left-rail color stripe — replaces the legacy 14x14 square swatch.
 *  Same six-color taxonomy as kanban topstrips so a project reads
 *  consistently across sidebar + board + chips. */
const railClass: Record<SwatchName, string> = {
  green: "bg-[var(--swatch-green-stripe)]",
  blue: "bg-[var(--swatch-blue-stripe)]",
  pink: "bg-[var(--swatch-pink-stripe)]",
  amber: "bg-[var(--swatch-amber-stripe)]",
  violet: "bg-[var(--swatch-violet-stripe)]",
  teal: "bg-[var(--swatch-teal-stripe)]",
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
      data-swatch={swatch}
      className={cn(
        "group relative mx-2.5 my-0.5 pl-4 pr-3 py-[7px] rounded-lg flex items-center gap-2.5",
        "text-[13px] text-ink-1 cursor-pointer border-[1.5px] border-transparent",
        "transition-colors",
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
            "absolute left-1 top-1 bottom-1 rounded-sm",
            "transition-[width] duration-0 [transition-timing-function:steps(1,end)]",
            railClass[swatch],
            active ? "w-[5px]" : "w-[3px] group-hover:w-[5px]",
          )}
          aria-hidden
        />
      )}
      {/* Keep the old square swatch as a legacy fallback when callers
        * forget to pass `swatch` — shouldn't trigger in practice. */}
      {!swatch && (
        <span className="shrink-0 w-[14px] h-[14px] rounded-[5px] border-[1.25px] border-ink-0 bg-paper-0" />
      )}
      <span className="flex-1 min-w-0 truncate">{children}</span>
      {count !== undefined && count > 0 && (
        <span className="shrink-0 text-[11px] text-ink-2 font-bold">{count}</span>
      )}
    </div>
  ),
);
ProjItem.displayName = "ProjItem";

/** Map a swatch name to its three-stop palette tokens. Useful when a
 *  consumer (kanban list header, chips) wants the border or text tone
 *  instead of the loud stripe color. */
export const swatchTokens: Record<
  SwatchName,
  { stripe: string; border: string; text: string }
> = {
  green: {
    stripe: "var(--swatch-green-stripe)",
    border: "var(--swatch-green-border)",
    text: "var(--swatch-green-text)",
  },
  blue: {
    stripe: "var(--swatch-blue-stripe)",
    border: "var(--swatch-blue-border)",
    text: "var(--swatch-blue-text)",
  },
  pink: {
    stripe: "var(--swatch-pink-stripe)",
    border: "var(--swatch-pink-border)",
    text: "var(--swatch-pink-text)",
  },
  amber: {
    stripe: "var(--swatch-amber-stripe)",
    border: "var(--swatch-amber-border)",
    text: "var(--swatch-amber-text)",
  },
  violet: {
    stripe: "var(--swatch-violet-stripe)",
    border: "var(--swatch-violet-border)",
    text: "var(--swatch-violet-text)",
  },
  teal: {
    stripe: "var(--swatch-teal-stripe)",
    border: "var(--swatch-teal-border)",
    text: "var(--swatch-teal-text)",
  },
};

// Re-export for callers that need topstrip class names directly
// (e.g. ProjTopstrip).
export { swatchClass as topstripClass };

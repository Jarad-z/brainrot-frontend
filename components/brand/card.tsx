"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  chunky?: boolean;
  /** Adds hover-lift transition. Pair with chunky for the strongest
   *  visual feedback. Pure CSS, no JS handlers. */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ chunky, interactive, className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-paper-0 border-2 rounded-lg p-6",
        chunky
          ? "border-ink-0 shadow-[var(--shadow-current)]"
          : "border-ink-0 shadow-[3px_3px_0_var(--ink-0)]",
        interactive && [
          "card-lift hover:border-ink-0",
          chunky
            ? "hover:shadow-[var(--shadow-pixel-md)] hover:-translate-y-[3px]"
            : "hover:shadow-[var(--shadow-pixel-sm)] hover:-translate-y-[2px]",
        ],
        className,
      )}
      {...rest}
    />
  ),
);
Card.displayName = "Card";

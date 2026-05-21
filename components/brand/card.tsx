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
        "bg-bg-primary rounded-xl p-6",
        chunky
          ? "border border-hairline"
          : "border border-hairline",
        interactive && [
          "card-lift cursor-pointer",
          "hover:border-ink-0/30 hover:-translate-y-[2px]",
        ],
        className,
      )}
      {...rest}
    />
  ),
);
Card.displayName = "Card";

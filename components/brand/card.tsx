"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  chunky?: boolean;
  /** Adds hover-lift transition. */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ chunky, interactive, className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        "aero-glass rounded-xl p-6",
        chunky && "p-8",
        interactive && "card-lift cursor-pointer hover:card-lift-hover",
        className,
      )}
      {...rest}
    />
  ),
);
Card.displayName = "Card";

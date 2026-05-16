"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  chunky?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ chunky, className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-paper-0 border-[1.5px] rounded-xl p-5",
        chunky
          ? "border-ink-0 shadow-[var(--shadow-current)]"
          : "border-hairline shadow-[3px_3px_0_var(--ink-0)]",
        className,
      )}
      {...rest}
    />
  ),
);
Card.displayName = "Card";

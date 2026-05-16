"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center gap-2 rounded-md text-sm font-bold whitespace-nowrap " +
  "border-[1.5px] transition-transform " +
  "active:translate-y-[var(--depth)] active:shadow-none " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary:
    "bg-ink-0 text-paper-0 border-ink-0 shadow-[var(--shadow-current)] hover:brightness-95",
  ghost: "bg-transparent text-ink-0 border-hairline hover:bg-paper-2",
  danger:
    "bg-paper-0 text-ink-0 border-ink-0 shadow-[var(--shadow-current)] hover:bg-paper-2",
} as const;

const sizes = {
  default: "px-3.5 py-2.5",
  sm: "px-2.5 py-1.5 text-xs",
  big: "px-5 py-3 text-base rounded-full border-[1.75px]",
  icon: "p-0 w-9 h-9 justify-center",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  ),
);
Button.displayName = "Button";

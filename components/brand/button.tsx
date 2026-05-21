"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap " +
  "border btn-spring transition-colors " +
  "active:scale-[0.97] " +
  "disabled:opacity-40 disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-0 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-1 " +
  "[&_svg]:size-4 [&_svg]:shrink-0";

const variants = {
  primary:
    "bg-bg-surface-action text-text-surface-action border-bg-surface-action hover:opacity-90",
  ghost:
    "bg-transparent text-ink-0 border-hairline hover:bg-bg-secondary hover:border-ink-0/20",
  danger:
    "bg-transparent text-danger border-danger hover:bg-danger/5",
} as const;

const sizes = {
  default: "px-3.5 py-2",
  sm: "px-2.5 py-1.5 text-xs",
  big: "px-5 py-2.5 text-base",
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

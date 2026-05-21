"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center gap-2 rounded-lg text-sm font-semibold whitespace-nowrap " +
  "transition-all active:translate-y-px " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "[&_svg]:size-4 [&_svg]:shrink-0";

const variants = {
  // Aero glass button — three-band gradient + mirror line + double stroke
  primary: "aero-button hover:aero-button-hover active:aero-button-active",
  // Subtle glass button (frosted white, dark text)
  ghost:
    "bg-white/50 hover:bg-white/70 backdrop-blur-md text-ink-0 border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(30,72,119,0.08),0_1px_2px_rgba(30,72,119,0.06)]",
  // Danger
  danger:
    "bg-white/55 hover:bg-white/75 backdrop-blur-md text-danger border border-[color-mix(in_srgb,var(--danger)_35%,white)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
} as const;

const sizes = {
  default: "px-3.5 py-1.5",
  sm: "px-2.5 py-1 text-xs",
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

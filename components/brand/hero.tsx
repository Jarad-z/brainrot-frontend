"use client";

import { cn } from "@/lib/utils";

export type HeroEyebrowProps = React.HTMLAttributes<HTMLDivElement>;

export function HeroEyebrow({ className, children, ...rest }: HeroEyebrowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 mb-3 flex-wrap",
        "font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2 font-semibold",
        "[&_.dot]:w-[7px] [&_.dot]:h-[7px] [&_.dot]:bg-state-running [&_.dot]:rounded-full [&_.dot]:border-[1.25px] [&_.dot]:border-ink-0",
        "[&_.sep]:text-ink-3",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export type HeroTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export function HeroTitle({ className, children, ...rest }: HeroTitleProps) {
  return (
    <h1
      className={cn(
        "text-[22px] font-medium mb-1 text-ink-0 leading-snug",
        className,
      )}
      {...rest}
    >
      {children}
    </h1>
  );
}

export type HeroPopProps = React.HTMLAttributes<HTMLSpanElement>;

export function HeroPop({ className, children, ...rest }: HeroPopProps) {
  return (
    <span
      className={cn("relative inline-block pr-[0.05em] text-ink-0", className)}
      {...rest}
    >
      {children}
    </span>
  );
}

export type HeroSubProps = React.HTMLAttributes<HTMLParagraphElement>;

export function HeroSub({ className, children, ...rest }: HeroSubProps) {
  return (
    <p
      className={cn(
        "text-sm text-ink-2 leading-[1.6] mb-4",
        className,
      )}
      {...rest}
    >
      {children}
    </p>
  );
}

/** @deprecated Decorative arrow removed in redesign. Keep for backwards compat. */
export function HeroArrow() {
  return null;
}

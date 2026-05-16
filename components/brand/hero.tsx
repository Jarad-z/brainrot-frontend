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
        "text-[clamp(56px,7.6vw,96px)] font-extrabold mb-4 text-ink-0",
        "hero-title",
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
      className={cn("relative inline-block pr-[0.05em] text-accent", className)}
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
        "text-[16.5px] text-ink-1 max-w-[56ch] leading-[1.55] mb-5 font-medium",
        className,
      )}
      {...rest}
    >
      {children}
    </p>
  );
}

export function HeroArrow() {
  return (
    <svg
      viewBox="0 0 110 78"
      className="absolute -bottom-10 -right-20 w-[110px] h-[78px] text-ink-0 rotate-[8deg] pointer-events-none hidden xl:block"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 70 C 40 30, 60 20, 100 25" />
      <path d="M88 12 L100 25 L92 38" />
    </svg>
  );
}

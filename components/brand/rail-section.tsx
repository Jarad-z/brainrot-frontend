"use client";

import { cn } from "@/lib/utils";

export interface RailSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export function RailSection({ className, children, ...rest }: RailSectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl bg-paper-0",
        "border-[1.5px] border-ink-0 shadow-[var(--shadow-current)]",
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  );
}

export interface RailHeadProps extends React.HTMLAttributes<HTMLDivElement> {
  dot?: boolean;
}

export function RailHead({ dot, className, children, ...rest }: RailHeadProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-3 bg-paper-0",
        className,
      )}
      {...rest}
    >
      {dot && (
        <span className="w-2.5 h-2.5 rounded-full bg-accent border-[1.5px] border-ink-0 shrink-0" />
      )}
      <span className="font-extrabold text-[15px] whitespace-nowrap">
        {children}
      </span>
    </div>
  );
}

export interface RailEmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function RailEmpty({ className, children, ...rest }: RailEmptyProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-4 py-6 text-sm font-bold text-ink-2",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

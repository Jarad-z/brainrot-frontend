"use client";

import { cn } from "@/lib/utils";

export type RailSectionProps = React.HTMLAttributes<HTMLDivElement>;

export function RailSection({ className, children, ...rest }: RailSectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl bg-bg-primary",
        "border border-hairline",
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
        <span className="w-1.5 h-1.5 rounded-full bg-state-running shrink-0" />
      )}
      <span className="text-[13px] font-medium text-ink-0 whitespace-nowrap">
        {children}
      </span>
    </div>
  );
}

export type RailEmptyProps = React.HTMLAttributes<HTMLDivElement>;

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

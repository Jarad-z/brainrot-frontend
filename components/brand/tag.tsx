"use client";

import { cn } from "@/lib/utils";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function Tag({ className, ...rest }: TagProps) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-sm text-xs font-bold",
        "bg-paper-2 text-ink-2 border-[1.25px] border-hairline whitespace-nowrap",
        className,
      )}
      {...rest}
    />
  );
}

export interface PillsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Pills({ className, ...rest }: PillsProps) {
  return (
    <div
      className={cn(
        "inline-flex p-[3px] gap-0.5 rounded-full bg-paper-2 border-[1.5px] border-hairline",
        className,
      )}
      {...rest}
    />
  );
}

export interface PillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Pill({ active, className, ...rest }: PillProps) {
  return (
    <button
      className={cn(
        "px-3 py-1 rounded-full text-xs font-bold border-0 transition-colors",
        active
          ? "bg-ink-0 text-paper-0"
          : "bg-transparent text-ink-2 hover:text-ink-0",
        className,
      )}
      {...rest}
    />
  );
}

"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "block w-full rounded-lg bg-paper-0 text-ink-0 text-sm " +
  "border border-hairline " +
  "px-3 py-2 " +
  "transition-shadow transition-colors " +
  "outline-none focus:border-accent/60 focus:shadow-[var(--focus-ring)] " +
  "aria-[invalid=true]:border-state-failed aria-[invalid=true]:shadow-[0_0_0_3px_rgb(220_38_38_/0.15)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-paper-1 " +
  "placeholder:text-ink-3";

export const Input = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cn(inputBase, className)} {...rest} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={cn(inputBase, "resize-y min-h-[44px]", className)}
    {...rest}
  />
));
Textarea.displayName = "Textarea";

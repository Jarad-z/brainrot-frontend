"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "block w-full rounded-md bg-paper-0 text-ink-0 text-sm " +
  "border-[1.5px] border-hairline " +
  "px-3 py-2 " +
  "outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 " +
  "aria-[invalid=true]:border-state-failed " +
  "disabled:opacity-50 disabled:cursor-not-allowed " +
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

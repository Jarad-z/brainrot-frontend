"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Dropdown = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;
export const DropdownPortal = DropdownPrimitive.Portal;

export const DropdownContent = forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 6, ...rest }, ref) => (
  <DropdownPortal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[180px] bg-paper-0 border-[1.5px] border-ink-0 rounded-xl",
        "shadow-[var(--shadow-current)] p-1.5",
        className,
      )}
      {...rest}
    />
  </DropdownPortal>
));
DropdownContent.displayName = "DropdownContent";

export const DropdownItem = forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item>
>(({ className, ...rest }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      "px-3 py-2 rounded-md text-sm text-ink-0 cursor-pointer outline-none",
      "data-[highlighted]:bg-paper-2 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
      className,
    )}
    {...rest}
  />
));
DropdownItem.displayName = "DropdownItem";

export const DropdownSeparator = forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({ className, ...rest }, ref) => (
  <DropdownPrimitive.Separator
    ref={ref}
    className={cn("h-px bg-hairline my-1", className)}
    {...rest}
  />
));
DropdownSeparator.displayName = "DropdownSeparator";

"use client";

import { cn } from "@/lib/utils";
import type { SwatchName } from "./proj-item";

const swatchClass: Record<SwatchName, string> = {
  green: "topstrip-green",
  blue: "topstrip-blue",
  pink: "topstrip-pink",
  amber: "topstrip-amber",
  violet: "topstrip-violet",
  teal: "topstrip-teal",
};

export interface ProjTopstripProps extends React.HTMLAttributes<HTMLDivElement> {
  swatch: SwatchName;
}

export function ProjTopstrip({
  swatch,
  className,
  ...rest
}: ProjTopstripProps) {
  return (
    <div
      className={cn(
        "h-[72px] relative bg-paper-0 border-b-[1.5px] border-ink-0",
        swatchClass[swatch],
        className,
      )}
      {...rest}
    />
  );
}

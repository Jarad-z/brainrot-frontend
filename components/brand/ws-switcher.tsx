"use client";

import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WsSwitcherProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  meta?: string;
  avatar: string;
}

/**
 * Workspace switcher chip. Aero glass styling — half-opaque, thin
 * white edge, three-band gradient like a Vista taskbar group button.
 * Small footprint, no chunky border, no opaque white slab.
 */
export function WsSwitcher({
  name,
  meta,
  avatar,
  className,
  ...rest
}: WsSwitcherProps) {
  return (
    <button
      type="button"
      className={cn(
        "group w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left",
        "transition-all overflow-hidden",
        "hover:brightness-105",
        className,
      )}
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.28) 50%, rgba(220,235,250,0.28) 100%)",
        border: "1px solid rgba(255,255,255,0.55)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(30,72,119,0.10), 0 1px 2px rgba(30,72,119,0.08)",
      }}
      {...rest}
    >
      <span
        className="grid place-items-center w-[22px] h-[22px] text-white font-bold text-[10px] rounded shrink-0"
        style={{
          background:
            "linear-gradient(180deg, #b8dcf0 0%, #7fc3f2 49%, #3d8fd4 51%, #1e4877 100%)",
          border: "1px solid rgba(30,72,119,0.55)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(30,72,119,0.4)",
          textShadow: "0 -1px 0 rgba(30,72,119,0.4)",
        }}
      >
        {avatar}
      </span>
      <span className="flex-1 min-w-0 leading-tight">
        <span className="block text-[12.5px] font-semibold text-ink-0 truncate">
          {name}
        </span>
        {meta && (
          <span className="block text-[10px] text-ink-2 truncate">{meta}</span>
        )}
      </span>
      <ChevronsUpDown
        className="w-3 h-3 text-ink-2 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
        aria-hidden
      />
    </button>
  );
}

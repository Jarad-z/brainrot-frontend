"use client";

import type { ReactNode } from "react";

interface AgentFormSectionProps {
  title: string;
  /** Initial open/closed state. Browsers persist `open` across renders, so once
   *  the user toggles it, our prop no longer drives it — which is what we want. */
  defaultOpen?: boolean;
  /** Optional short label rendered next to the title (e.g. an item count). */
  badge?: string | number;
  /** Optional one-line description rendered under the title when expanded. */
  hint?: string;
  /** Rendered ABOVE the body — used to surface trust/safety warnings (e.g. hooks). */
  warning?: ReactNode;
  children: ReactNode;
}

/**
 * A native <details>/<summary> wrapper styled to match the brainrot aesthetic.
 * Using <details> instead of an aria-controlled accordion gives us free
 * keyboard support, browser-persisted open state, and screen-reader semantics
 * with zero state bookkeeping in React.
 */
export function AgentFormSection({
  title,
  defaultOpen = false,
  badge,
  hint,
  warning,
  children,
}: AgentFormSectionProps) {
  return (
    <details
      open={defaultOpen}
      className="group border-[1.5px] border-hairline rounded-sm bg-paper-0"
    >
      <summary
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none text-sm font-semibold text-ink-1 list-none [&::-webkit-details-marker]:hidden hover:bg-paper-1"
      >
        <span
          aria-hidden
          className="inline-block w-3 text-center transition-transform group-open:rotate-90"
        >
          ›
        </span>
        <span className="flex-1">{title}</span>
        {badge !== undefined && badge !== "" && badge !== 0 ? (
          <span className="text-xs font-mono text-ink-2 rounded-sm px-1.5 py-0.5 bg-paper-1">
            {badge}
          </span>
        ) : null}
      </summary>
      <div className="px-3 pb-3 pt-1 border-t-[1.5px] border-hairline flex flex-col gap-3">
        {hint ? <p className="text-xs text-ink-2">{hint}</p> : null}
        {warning}
        {children}
      </div>
    </details>
  );
}

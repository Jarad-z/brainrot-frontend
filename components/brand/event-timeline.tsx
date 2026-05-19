"use client";

import { cn } from "@/lib/utils";

export interface EventTimelineProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Skip the left rail (use when nesting inside an already-railed
   *  container). */
  bare?: boolean;
}

/** Visual wrapper for the task-detail chat / event stream. Adds a
 *  centered vertical rail so messages, tool calls, and run boundaries
 *  read as one chronological column instead of unrelated bubbles.
 *
 *  Pure presentation — does NOT touch MessageView, Composer, or any
 *  business logic. Drop existing children inside. */
export function EventTimeline({
  bare,
  className,
  children,
  ...rest
}: EventTimelineProps) {
  return (
    <div
      className={cn("relative", !bare && "pl-6", className)}
      {...rest}
    >
      {!bare && (
        <span
          aria-hidden
          className="absolute left-[14px] top-2 bottom-2 w-[1.5px] bg-hairline"
        />
      )}
      {children}
    </div>
  );
}

export interface EventTimelineStampProps {
  /** Visible time label, e.g. "14:32". */
  label: string;
  /** Use the accent color for important boundaries (run start, error). */
  emphasis?: boolean;
}

/** Optional inline timestamp pill that sits on the rail. Consumers can
 *  drop one at the top of each message / event for clear chronology. */
export function EventTimelineStamp({
  label,
  emphasis,
}: EventTimelineStampProps) {
  return (
    <div className="relative -ml-6 mb-1 flex items-center gap-2">
      <span
        aria-hidden
        className={cn(
          "shrink-0 w-3 h-3 rounded-full border-[1.5px] z-10",
          emphasis
            ? "bg-accent border-ink-0"
            : "bg-paper-0 border-hairline",
        )}
      />
      <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-2 font-bold">
        {label}
      </span>
    </div>
  );
}

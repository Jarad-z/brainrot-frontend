"use client";

import { cn } from "@/lib/utils";
import { Card } from "./card";

export interface AgentCardProps {
  handle: string;
  name: string;
  model: string;
  online?: boolean;
  description?: string;
  /** Single-character avatar glyph (e.g. "W" for @writer). */
  avatarGlyph?: string;
  /** Display name of the user who published this agent. Shown as "by <name>" to
   *  surface ownership in a multi-user workspace. */
  ownerName?: string | null;
  /** True if the agent runs on the signed-in user's device. Gates edit/archive UI. */
  isMine?: boolean;
  onClick?: () => void;
  className?: string;
}

/** Agent profile card — replaces the management-table row in the
 *  Agents page so each agent reads like a team member, not a DB row. */
export function AgentCard({
  handle,
  name,
  model,
  online,
  description,
  avatarGlyph,
  ownerName,
  isMine,
  onClick,
  className,
}: AgentCardProps) {
  return (
    <Card
      chunky
      interactive
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 cursor-pointer p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className={cn(
            "shrink-0 w-12 h-12 rounded-lg border-[1.5px] border-ink-0",
            "flex items-center justify-center text-xl font-extrabold",
            "bg-paper-2 text-ink-0",
          )}
        >
          {avatarGlyph ?? handle.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm text-ink-0 font-bold truncate">
            @{handle}
          </div>
          <div className="text-base font-semibold text-ink-0 truncate">
            {name}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase",
            online ? "text-state-running" : "text-ink-3",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              online
                ? "bg-state-running animate-status-pulse"
                : "border-[1.25px] border-ink-3",
            )}
          />
          {online ? "online" : "offline"}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs gap-2">
        <span className="font-mono text-ink-2 truncate">{model}</span>
        {ownerName && (
          <span className="font-mono text-[11px] text-ink-3 shrink-0">
            by {ownerName}
            {isMine && (
              <span className="ml-1.5 px-1 py-0.5 rounded-sm bg-accent-moss/15 text-accent-moss font-bold">
                you
              </span>
            )}
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-ink-1 line-clamp-2 m-0">{description}</p>
      )}
    </Card>
  );
}

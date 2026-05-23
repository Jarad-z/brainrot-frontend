"use client";

import { cn } from "@/lib/utils";
import { Card } from "./card";

export interface RuntimeCardProps {
  /** Display name for the device — usually the owning user's name with a fallback to host. */
  name: string;
  /** Owner email (shown small under name; helps disambiguate when two members share a name). */
  ownerEmail?: string | null;
  host?: string | null;
  osArch?: string;
  capacity?: number;
  online?: boolean;
  /** True if the runtime's user_id matches the signed-in user. Renders a "you" badge. */
  isMine?: boolean;
  /** Human-friendly relative time, e.g. "2 minutes ago". */
  lastHeartbeat?: string;
  onClick?: () => void;
  className?: string;
}

/** Runtime machine card — replaces a table row with an ops-dashboard
 *  style tile. Includes a pulsing heartbeat dot for online runtimes. */
export function RuntimeCard({
  name,
  ownerEmail,
  host,
  osArch,
  capacity,
  online,
  isMine,
  lastHeartbeat,
  onClick,
  className,
}: RuntimeCardProps) {
  return (
    <Card
      chunky
      interactive
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 cursor-pointer p-4 min-h-[140px]",
        isMine && "ring-2 ring-accent-moss/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-mono text-[13px] text-ink-0 font-bold truncate">
              {name}
            </div>
            {isMine && (
              <span className="shrink-0 inline-flex items-center font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-accent-moss/15 text-accent-moss">
                you
              </span>
            )}
          </div>
          {ownerEmail && (
            <div className="font-mono text-[11px] text-ink-3 mt-0.5 truncate">
              {ownerEmail}
            </div>
          )}
          {host && (
            <div className="font-mono text-[11px] text-ink-2 mt-0.5 truncate">
              {host}
            </div>
          )}
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
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3 mb-0.5">
            os/arch
          </div>
          <div className="font-mono text-ink-1">{osArch ?? "—"}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3 mb-0.5">
            capacity
          </div>
          <div className="font-mono text-ink-1">{capacity ?? "—"}</div>
        </div>
      </div>
      {lastHeartbeat && (
        <div className="font-mono text-[11px] text-ink-2 mt-auto">
          ♥ {lastHeartbeat}
        </div>
      )}
    </Card>
  );
}

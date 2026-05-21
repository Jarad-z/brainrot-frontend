"use client";

import { cn } from "@/lib/utils";

/** Deterministic agent color from handle — muted palette so colors read as
 *  identity markers, not status signals. */
const AGENT_COLORS = [
  "#534AB7", // soft violet (writer)
  "#2E7D8C", // teal
  "#4A7A3A", // moss green
  "#8C5A2E", // warm brown
  "#6B3B8C", // plum
  "#2E5C8C", // navy
];

export function agentColor(handle: string): string {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) {
    hash = (hash * 31 + handle.charCodeAt(i)) | 0;
  }
  return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length]!;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export interface AvatarProps {
  name: string;
  color?: string;
  size?: number;
  online?: boolean;
  radius?: number;
  className?: string;
}

export function Avatar({
  name,
  color = "var(--ink-2)",
  size = 36,
  online,
  radius = 12,
  className,
}: AvatarProps) {
  return (
    <span
      className={cn("relative inline-block align-middle", className)}
      style={{ width: size, height: size }}
    >
      <span
        className="grid place-items-center font-medium text-paper-0"
        style={{
          width: size,
          height: size,
          background: color,
          borderRadius: radius,
          fontSize: Math.round(size * 0.36),
        }}
      >
        {initials(name)}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            "absolute -right-[3px] -bottom-[3px] w-[11px] h-[11px] rounded-full border-2 border-paper-0",
            online ? "bg-ink-0" : "bg-paper-0 border-ink-0",
          )}
        />
      )}
    </span>
  );
}

export interface AgentAvatarProps {
  agent: { name: string; color?: string; online?: boolean };
  size?: number;
  online?: boolean;
}

export function AgentAvatar({ agent, size = 32, online }: AgentAvatarProps) {
  return (
    <Avatar
      name={agent.name}
      color={agent.color}
      size={size}
      online={online ?? agent.online}
      radius={Math.round(size * 0.28)}
    />
  );
}

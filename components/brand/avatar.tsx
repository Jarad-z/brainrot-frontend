"use client";

import { cn } from "@/lib/utils";

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
        className="grid place-items-center font-bold text-paper-0 border-[1.5px] border-ink-0 shadow-[2px_2px_0_var(--ink-0)]"
        style={{
          width: size,
          height: size,
          background: color,
          borderRadius: radius,
          fontSize: Math.round(size * 0.34),
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

import Link from "next/link";
import type { PublicAgentView } from "@/lib/api/types";
import { PluginCapabilitiesSummary } from "./PluginCapabilitiesSummary";

interface AgentMarketplaceCardProps {
  agent: PublicAgentView;
  variant?: "compact" | "full";
}

export function AgentMarketplaceCard({
  agent,
  variant = "compact",
}: AgentMarketplaceCardProps) {
  const initials = agent.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="y2k-card y2k-marketplace-tile flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div
          data-y2k-avatar="true"
          className="h-11 w-11 flex items-center justify-center text-sm shrink-0 overflow-hidden"
        >
          {agent.avatar_url ? (
            <img
              src={agent.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials || "?"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/marketplace/${agent.id}`}
            className="text-[14px] font-bold text-[var(--y2k-fb-blue-deep)] hover:underline"
          >
            @{agent.handle}
          </Link>
          <div className="text-[12px] text-[#4a5b80] truncate">{agent.name}</div>
        </div>
        <div className="y2k-chip shrink-0">
          {agent.install_count} install{agent.install_count === 1 ? "" : "s"}
        </div>
      </div>
      {agent.description && (
        <p
          className={`text-[13px] text-[#2c3e5a] whitespace-pre-wrap m-0 ${
            variant === "compact" ? "line-clamp-2" : ""
          }`}
        >
          {agent.description}
        </p>
      )}
      <PluginCapabilitiesSummary
        skills={agent.skills}
        commands={agent.commands}
        subagents={agent.subagents}
        hooksCount={agent.hooks_count}
        mcpServers={agent.mcp_servers}
        variant={variant}
      />
      <div className="flex items-center justify-between text-[11px] text-[#6c8acd] font-mono">
        <span>by {agent.publisher_name}</span>
        {agent.published_at && (
          <span>{new Date(agent.published_at).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}

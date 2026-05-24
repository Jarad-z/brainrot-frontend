import Link from "next/link";
import type { PublicAgentView } from "@/lib/api/types";

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
    <div className="rounded border border-line bg-paper-0 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-hairline flex items-center justify-center text-sm font-medium shrink-0 overflow-hidden">
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
            className="text-sm font-semibold text-ink-0 hover:underline"
          >
            @{agent.handle}
          </Link>
          <div className="text-xs text-ink-2 truncate">{agent.name}</div>
        </div>
        <div className="text-xs text-ink-2 shrink-0">
          {agent.install_count} install{agent.install_count === 1 ? "" : "s"}
        </div>
      </div>
      {agent.description && (
        <p
          className={`text-sm text-ink-1 whitespace-pre-wrap ${
            variant === "compact" ? "line-clamp-2" : ""
          }`}
        >
          {agent.description}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-ink-2">
        <span>by {agent.publisher_name}</span>
        {agent.published_at && (
          <span>{new Date(agent.published_at).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}

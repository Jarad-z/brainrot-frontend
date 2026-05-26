"use client";

import Link from "next/link";
import type { PluginView } from "@/lib/api/types";

interface PluginMarketplaceCardProps {
  plugin: PluginView;
  /** Compact = grid card. Full = detail page (no link, no hover). */
  variant?: "compact" | "full";
}

/**
 * Renders a single marketplace plugin card. Compact variant wraps in a
 * <Link> so the whole card is clickable into the detail page; full variant
 * is content-only and composed by the detail page itself.
 *
 * Styling mirrors AgentMarketplaceCard so the marketplace grid looks
 * uniform after swapping tabs.
 */
export function PluginMarketplaceCard({
  plugin,
  variant = "compact",
}: PluginMarketplaceCardProps) {
  const body = (
    <div className="flex flex-col gap-2 p-4 border-[1.5px] border-line bg-paper-0 rounded-sm hover:bg-paper-1 transition-colors">
      <div className="flex items-baseline justify-between gap-2 min-w-0">
        <h3 className="text-sm font-bold text-ink-0 m-0 truncate">
          {plugin.name}
        </h3>
        {plugin.latest_version ? (
          <span className="text-xs text-ink-2 shrink-0 tabular-nums">
            v{plugin.latest_version}
          </span>
        ) : null}
      </div>
      <p
        className={
          variant === "full"
            ? "text-sm text-ink-1 m-0 whitespace-pre-wrap"
            : "text-xs text-ink-2 m-0 line-clamp-3"
        }
      >
        {plugin.description || "No description provided."}
      </p>
      {plugin.published_at ? (
        <p className="text-[10px] text-ink-2 m-0 tabular-nums">
          published {new Date(plugin.published_at).toLocaleDateString()}
        </p>
      ) : null}
    </div>
  );

  if (variant === "full") return body;
  return (
    <Link href={`/marketplace/plugins/${plugin.id}`} className="no-underline">
      {body}
    </Link>
  );
}

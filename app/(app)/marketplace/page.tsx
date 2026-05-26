"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { searchMarketplaceAgents } from "@/lib/api/marketplace";
import { searchMarketplacePlugins } from "@/lib/api/plugins";
import { queryKeys } from "@/lib/api/keys";
import { AgentMarketplaceCard } from "@/components/agent/AgentMarketplaceCard";
import { PluginMarketplaceCard } from "@/components/plugin/PluginMarketplaceCard";

type MarketplaceTab = "agents" | "plugins";

function isTab(v: string | null): v is MarketplaceTab {
  return v === "agents" || v === "plugins";
}

export default function MarketplacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: MarketplaceTab = isTab(tabParam) ? tabParam : "agents";

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  // Debounce search input (300ms).
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Reset search when switching tabs so the placeholder makes sense for the
  // new entity. Without this you'd carry over a half-typed agent handle into
  // a plugin-name search and confuse yourself.
  useEffect(() => {
    setSearch("");
    setDebounced("");
  }, [tab]);

  const agentsQ = useQuery({
    queryKey: queryKeys.marketplace.search(debounced),
    queryFn: () => searchMarketplaceAgents({ q: debounced, limit: 50 }),
    enabled: tab === "agents",
  });

  const pluginsQ = useQuery({
    queryKey: queryKeys.plugins.marketplace(debounced),
    queryFn: () => searchMarketplacePlugins({ q: debounced, limit: 50 }),
    enabled: tab === "plugins",
  });

  const switchTab = (next: MarketplaceTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "agents") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const q = params.toString();
    router.replace(`/marketplace${q ? "?" + q : ""}`);
  };

  return (
    <div className="y2k-page flex flex-col gap-5 p-6 max-w-5xl mx-auto">
      <header className="flex flex-col gap-1.5">
        <h1 className="y2k-hero">Marketplace</h1>
        <p className="y2k-hero-sub">
          {tab === "agents"
            ? "browse public agents shared by other users · install one to your workspace to @-call it"
            : "browse plugins (skill / command / sub-agent / hook bundles) · install one to overlay it onto any of your agents"}
        </p>
      </header>

      <nav className="flex gap-1 border-b-[1.5px] border-line">
        {(["agents", "plugins"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={
                "px-4 py-2 text-sm font-semibold capitalize border-b-2 -mb-[1.5px] transition-colors " +
                (active
                  ? "border-ink-0 text-ink-0"
                  : "border-transparent text-ink-2 hover:text-ink-0")
              }
              aria-current={active ? "page" : undefined}
            >
              {t}
            </button>
          );
        })}
      </nav>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={
          tab === "agents"
            ? "Search by handle, name, or description…"
            : "Search by plugin name or description…"
        }
        className="y2k-input"
        autoFocus
      />

      {tab === "agents" ? (
        agentsQ.isLoading ? (
          <div className="py-6 text-sm text-[#2c3e5a]">Loading…</div>
        ) : agentsQ.isError ? (
          <div className="py-6 text-sm text-[var(--y2k-strawberry-deep)]">
            Failed to load marketplace.
          </div>
        ) : (agentsQ.data ?? []).length === 0 ? (
          <div className="py-6 text-sm text-[#2c3e5a]">
            {debounced
              ? `No public agents match “${debounced}”.`
              : "No public agents yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(agentsQ.data ?? []).map((a) => (
              <AgentMarketplaceCard key={a.id} agent={a} variant="compact" />
            ))}
          </div>
        )
      ) : pluginsQ.isLoading ? (
        <div className="py-6 text-sm text-[#2c3e5a]">Loading…</div>
      ) : pluginsQ.isError ? (
        <div className="py-6 text-sm text-[var(--y2k-strawberry-deep)]">
          Failed to load marketplace.
        </div>
      ) : (pluginsQ.data ?? []).length === 0 ? (
        <div className="py-6 text-sm text-[#2c3e5a]">
          {debounced
            ? `No public plugins match “${debounced}”.`
            : "No public plugins yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(pluginsQ.data ?? []).map((p) => (
            <PluginMarketplaceCard key={p.id} plugin={p} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}

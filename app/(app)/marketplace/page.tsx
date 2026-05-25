"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchMarketplaceAgents } from "@/lib/api/marketplace";
import { queryKeys } from "@/lib/api/keys";
import { AgentMarketplaceCard } from "@/components/agent/AgentMarketplaceCard";

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  // Debounce search input (300ms).
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const agents = useQuery({
    queryKey: queryKeys.marketplace.search(debounced),
    queryFn: () => searchMarketplaceAgents({ q: debounced, limit: 50 }),
  });

  const items = agents.data ?? [];

  return (
    <div className="y2k-page flex flex-col gap-5 p-6 max-w-5xl mx-auto">
      <header className="flex flex-col gap-1.5">
        <h1 className="y2k-hero">Agent marketplace</h1>
        <p className="y2k-hero-sub">
          browse public agents shared by other users · install one to your
          workspace to @-call it
        </p>
      </header>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by handle, name, or description…"
        className="y2k-input"
        autoFocus
      />
      {agents.isLoading ? (
        <div className="py-6 text-sm text-[#2c3e5a]">Loading…</div>
      ) : agents.isError ? (
        <div className="py-6 text-sm text-[var(--y2k-strawberry-deep)]">
          Failed to load marketplace.
        </div>
      ) : items.length === 0 ? (
        <div className="py-6 text-sm text-[#2c3e5a]">
          {debounced
            ? `No public agents match “${debounced}”.`
            : "No public agents yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((a) => (
            <AgentMarketplaceCard key={a.id} agent={a} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}

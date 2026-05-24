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
    <div className="flex flex-col gap-4 p-6 max-w-5xl mx-auto">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Agent marketplace</h1>
        <p className="text-sm text-ink-2">
          Browse public agents shared by other users. Install one to your
          workspace to @-call it — the task will run on the publisher&apos;s
          daemon.
        </p>
      </header>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by handle, name, or description…"
        className="rounded border border-line px-3 py-2 text-sm bg-paper-0"
        autoFocus
      />
      {agents.isLoading ? (
        <div className="py-6 text-sm text-ink-2">Loading…</div>
      ) : agents.isError ? (
        <div className="py-6 text-sm text-state-failed">
          Failed to load marketplace.
        </div>
      ) : items.length === 0 ? (
        <div className="py-6 text-sm text-ink-2">
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

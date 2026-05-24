"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getMarketplaceAgent } from "@/lib/api/marketplace";
import { queryKeys } from "@/lib/api/keys";
import { AgentMarketplaceCard } from "@/components/agent/AgentMarketplaceCard";
import { InstallAgentDialog } from "@/components/agent/InstallAgentDialog";

export default function MarketplaceAgentPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [installOpen, setInstallOpen] = useState(false);

  const agentQ = useQuery({
    queryKey: queryKeys.marketplace.agent(agentId),
    queryFn: () => getMarketplaceAgent(agentId),
    enabled: !!agentId,
  });

  if (agentQ.isLoading) {
    return <div className="p-6 text-sm text-ink-2">Loading…</div>;
  }
  if (agentQ.isError || !agentQ.data) {
    return (
      <div className="p-6 text-sm text-ink-2">
        Agent not found or no longer published.
      </div>
    );
  }

  const a = agentQ.data;
  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <AgentMarketplaceCard agent={a} variant="full" />
      <div>
        <button
          onClick={() => setInstallOpen(true)}
          className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
        >
          Install to workspace
        </button>
      </div>
      <InstallAgentDialog
        agent={a}
        open={installOpen}
        onOpenChange={setInstallOpen}
      />
    </div>
  );
}

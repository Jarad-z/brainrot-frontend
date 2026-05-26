"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPlugin } from "@/lib/api/plugins";
import { queryKeys } from "@/lib/api/keys";
import { PluginMarketplaceCard } from "@/components/plugin/PluginMarketplaceCard";
import { InstallPluginDialog } from "@/components/plugin/InstallPluginDialog";

export default function MarketplacePluginPage() {
  const { pluginId } = useParams<{ pluginId: string }>();
  const [installOpen, setInstallOpen] = useState(false);

  const pluginQ = useQuery({
    queryKey: queryKeys.plugins.detail(pluginId),
    queryFn: () => getPlugin(pluginId),
    enabled: !!pluginId,
  });

  if (pluginQ.isLoading) {
    return <div className="p-6 text-sm text-ink-2">Loading…</div>;
  }
  if (pluginQ.isError || !pluginQ.data) {
    return (
      <div className="p-6 text-sm text-ink-2">
        Plugin not found or no longer published.
      </div>
    );
  }

  const p = pluginQ.data;
  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <PluginMarketplaceCard plugin={p} variant="full" />
      <div>
        <button
          onClick={() => setInstallOpen(true)}
          className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
        >
          Install to workspace
        </button>
      </div>
      <InstallPluginDialog
        plugin={p}
        open={installOpen}
        onOpenChange={setInstallOpen}
      />
    </div>
  );
}

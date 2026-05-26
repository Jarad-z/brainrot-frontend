"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  listWorkspacePlugins,
  publishPlugin,
  unpublishPlugin,
} from "@/lib/api/plugins";
import { queryKeys } from "@/lib/api/keys";
import { ApiError } from "@/lib/api/client";
import type { PluginView } from "@/lib/api/types";

export default function WorkspacePluginsPage() {
  const { wsId } = useParams<{ wsId: string }>();
  const pluginsQ = useQuery({
    queryKey: queryKeys.plugins.ownedBy(wsId),
    queryFn: () => listWorkspacePlugins(wsId),
  });

  const plugins = pluginsQ.data ?? [];

  return (
    <main className="p-6 max-w-5xl mx-auto flex flex-col gap-5">
      <header className="flex flex-col gap-1.5">
        <h1 className="y2k-hero">Workspace plugins</h1>
        <p className="y2k-hero-sub">
          plugins authored by this workspace · use the{" "}
          <code>brainrot</code> CLI to push new versions
        </p>
      </header>

      <section className="border-[1.5px] border-hairline rounded-md p-4 bg-paper-1">
        <h2 className="text-sm font-bold text-ink-0 m-0 mb-2">Push new plugin</h2>
        <p className="text-xs text-ink-2 m-0 mb-2">
          Plugins are uploaded as zip bundles via the CLI:
        </p>
        <pre className="text-xs font-mono bg-paper-0 border border-line rounded p-2 m-0 overflow-x-auto">
{`brainrot auth login              # one-time PAT setup
brainrot plugin init ./my-plugin
brainrot plugin push ./my-plugin --workspace ${wsId}
brainrot plugin publish <plugin-id>`}
        </pre>
      </section>

      {pluginsQ.isLoading ? (
        <p className="text-sm text-ink-2 italic">Loading…</p>
      ) : pluginsQ.isError ? (
        <p className="text-sm text-state-failed">Failed to load plugins.</p>
      ) : plugins.length === 0 ? (
        <p className="text-sm text-ink-2 italic">
          No plugins yet in this workspace. Push one with the CLI above.
        </p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs text-ink-2 border-b-[1.5px] border-line">
              <th className="py-2 px-2 font-semibold">Name</th>
              <th className="py-2 px-2 font-semibold">Latest version</th>
              <th className="py-2 px-2 font-semibold">Visibility</th>
              <th className="py-2 px-2 font-semibold">Created</th>
              <th className="py-2 px-2 font-semibold w-1"></th>
            </tr>
          </thead>
          <tbody>
            {plugins.map((p) => (
              <PluginRow key={p.id} plugin={p} wsId={wsId} />
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

interface PluginRowProps {
  plugin: PluginView;
  wsId: string;
}

function PluginRow({ plugin, wsId }: PluginRowProps) {
  const qc = useQueryClient();
  const isPublic = plugin.visibility === "public";

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.plugins.ownedBy(wsId) });
    qc.invalidateQueries({ queryKey: queryKeys.plugins.detail(plugin.id) });
    qc.invalidateQueries({ queryKey: queryKeys.plugins.marketplace("") });
  };

  const publishMu = useMutation({
    mutationFn: () => publishPlugin(plugin.id),
    onSuccess: invalidate,
  });
  const unpublishMu = useMutation({
    mutationFn: () => unpublishPlugin(plugin.id),
    onSuccess: invalidate,
  });

  const toggling = publishMu.isPending || unpublishMu.isPending;

  return (
    <tr className="border-b border-line">
      <td className="py-2 px-2">
        <div className="font-semibold text-ink-0">{plugin.name}</div>
        {plugin.description ? (
          <div className="text-xs text-ink-2 truncate max-w-md">
            {plugin.description}
          </div>
        ) : null}
      </td>
      <td className="py-2 px-2 text-xs text-ink-2 tabular-nums">
        {plugin.latest_version || "—"}
      </td>
      <td className="py-2 px-2">
        <span
          className={
            "px-1.5 py-0.5 text-xs rounded-sm border-[1.5px] " +
            (isPublic
              ? "border-ink-0 text-ink-0"
              : "border-line text-ink-2")
          }
        >
          {plugin.visibility}
        </span>
      </td>
      <td className="py-2 px-2 text-xs text-ink-2 tabular-nums">
        {new Date(plugin.created_at).toLocaleDateString()}
      </td>
      <td className="py-2 px-2">
        {isPublic ? (
          <button
            type="button"
            onClick={() => unpublishMu.mutate()}
            disabled={toggling}
            className="px-2 py-1 border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold text-xs disabled:opacity-60"
            title={errMsg(unpublishMu.error)}
          >
            {unpublishMu.isPending ? "Unpublishing…" : "Unpublish"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => publishMu.mutate()}
            disabled={toggling || !plugin.latest_version_id}
            className="px-2 py-1 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-xs disabled:opacity-60"
            title={
              !plugin.latest_version_id
                ? "Push a version first"
                : errMsg(publishMu.error)
            }
          >
            {publishMu.isPending ? "Publishing…" : "Publish"}
          </button>
        )}
      </td>
    </tr>
  );
}

function errMsg(err: unknown): string | undefined {
  if (err instanceof ApiError) return err.body || err.message;
  if (err instanceof Error) return err.message;
  return undefined;
}

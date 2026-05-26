"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import {
  attachPlugin,
  detachPlugin,
  listAgentPlugins,
  listWorkspacePluginInstalls,
  setAgentPluginEnabled,
} from "@/lib/api/plugins";
import { ApiError } from "@/lib/api/client";

interface AgentPluginsPanelProps {
  /** The agent we're attaching plugins to. */
  agentId: string;
  /** The workspace that owns the agent — also where its plugin installs live. */
  wsId: string;
}

/**
 * Manage plugins attached to an agent (overlay on top of the agent's intrinsic
 * skills/commands/subagents/hooks). Renders below the AgentForm on the agent
 * detail page; the page already gates this component behind `isMine && !archived`,
 * so we don't re-check ownership here.
 *
 * UX:
 *   - Top section: list of currently attached plugins. Each row has an enable
 *     toggle and a Detach button.
 *   - Bottom section: dropdown of workspace-installed plugins NOT yet attached,
 *     plus an "Attach" button.
 *
 * v1 doesn't render version pins / mismatch warnings — keeps the surface tight.
 * Installing new plugins into the workspace is done from the marketplace page.
 */
export function AgentPluginsPanel({ agentId, wsId }: AgentPluginsPanelProps) {
  const qc = useQueryClient();
  const [selectedInstallId, setSelectedInstallId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const attachedQ = useQuery({
    queryKey: queryKeys.plugins.agentAttachments(agentId),
    queryFn: () => listAgentPlugins(agentId),
  });

  const installsQ = useQuery({
    queryKey: queryKeys.plugins.workspaceInstalls(wsId),
    queryFn: () => listWorkspacePluginInstalls(wsId),
  });

  const attached = attachedQ.data ?? [];
  const installs = installsQ.data ?? [];

  // Installs in this ws that are NOT yet attached to this agent. The user
  // picks from this list in the attach dropdown.
  const unattachedInstalls = useMemo(() => {
    const attachedIds = new Set(attached.map((a) => a.plugin_install_id));
    return installs.filter((i) => !attachedIds.has(i.id));
  }, [attached, installs]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: queryKeys.plugins.agentAttachments(agentId) });
    qc.invalidateQueries({ queryKey: queryKeys.plugins.workspaceInstalls(wsId) });
  };

  const attachMu = useMutation({
    mutationFn: (installId: string) => attachPlugin(agentId, installId),
    onSuccess: () => {
      invalidateAll();
      setSelectedInstallId("");
    },
    onError: (err: unknown) => setError(errorMessageFor(err)),
  });

  const detachMu = useMutation({
    mutationFn: (installId: string) => detachPlugin(agentId, installId),
    onSuccess: invalidateAll,
    onError: (err: unknown) => setError(errorMessageFor(err)),
  });

  const enableMu = useMutation({
    mutationFn: ({ installId, enabled }: { installId: string; enabled: boolean }) =>
      setAgentPluginEnabled(agentId, installId, enabled),
    onSuccess: invalidateAll,
    onError: (err: unknown) => setError(errorMessageFor(err)),
  });

  return (
    <section className="mt-6 border-[1.5px] border-hairline rounded-md p-4 bg-paper-1">
      <h2 className="text-sm font-bold text-ink-0 m-0 mb-2">Plugins</h2>
      <p className="text-xs text-ink-2 m-0 mb-3">
        Plugins overlay extra skills / commands / sub-agents / hooks on top of
        this agent's own. They take effect on the next task run.
      </p>

      {/* Attached list */}
      {attachedQ.isLoading ? (
        <p className="text-xs text-ink-2 italic">Loading…</p>
      ) : attached.length === 0 ? (
        <p className="text-xs text-ink-2 italic m-0 mb-3">No plugins attached.</p>
      ) : (
        <ul className="flex flex-col gap-2 mb-4 list-none p-0 m-0">
          {attached.map((a) => (
            <li
              key={a.plugin_install_id}
              className="border-[1.5px] border-line rounded-sm bg-paper-0 px-3 py-2 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-0 m-0 truncate">
                  {a.plugin_name}
                </p>
                {a.plugin_description ? (
                  <p className="text-xs text-ink-2 m-0 truncate">
                    {a.plugin_description}
                  </p>
                ) : null}
              </div>
              <label className="flex items-center gap-1 text-xs text-ink-2 select-none">
                <input
                  type="checkbox"
                  checked={a.enabled}
                  onChange={(e) => {
                    setError(null);
                    enableMu.mutate({
                      installId: a.plugin_install_id,
                      enabled: e.target.checked,
                    });
                  }}
                  disabled={enableMu.isPending}
                />
                enabled
              </label>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  detachMu.mutate(a.plugin_install_id);
                }}
                disabled={detachMu.isPending}
                className="px-2 py-1 border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold text-xs disabled:opacity-60"
              >
                {detachMu.isPending && detachMu.variables === a.plugin_install_id
                  ? "Detaching…"
                  : "Detach"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Attach dropdown */}
      {installsQ.isLoading ? null : unattachedInstalls.length === 0 ? (
        <p className="text-xs text-ink-2 italic m-0">
          No more plugins available to attach.{" "}
          <a
            href={`/w/${wsId}/plugins`}
            className="underline text-ink-0"
          >
            Manage workspace plugins
          </a>{" "}
          or{" "}
          <a href="/marketplace?tab=plugins" className="underline text-ink-0">
            install one from the marketplace
          </a>
          .
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (!selectedInstallId) return;
            attachMu.mutate(selectedInstallId);
          }}
          className="flex gap-2 items-stretch"
        >
          <select
            value={selectedInstallId}
            onChange={(e) => setSelectedInstallId(e.target.value)}
            className="flex-1 border-[1.5px] border-line rounded-sm bg-paper-0 px-3 py-1.5 text-sm"
            disabled={attachMu.isPending}
          >
            <option value="">— Attach a plugin —</option>
            {unattachedInstalls.map((i) => (
              <option key={i.id} value={i.id}>
                {i.plugin_name}
                {i.plugin_description ? ` — ${i.plugin_description}` : ""}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!selectedInstallId || attachMu.isPending}
            className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
          >
            {attachMu.isPending ? "Attaching…" : "Attach"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-2 text-xs text-state-failed m-0">{error}</p>
      )}
    </section>
  );
}

function errorMessageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) {
      return "Only the agent owner can attach plugins.";
    }
    if (err.status === 400) {
      return "Plugin must be installed in this workspace before attaching.";
    }
    return err.body || err.message;
  }
  if (err instanceof Error) return err.message;
  return "Operation failed";
}

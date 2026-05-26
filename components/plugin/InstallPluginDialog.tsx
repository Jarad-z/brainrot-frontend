"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { installPlugin } from "@/lib/api/plugins";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import type { PluginView } from "@/lib/api/types";

interface InstallPluginDialogProps {
  plugin: PluginView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstalled?: () => void;
}

/**
 * Install dialog for marketplace plugins. Asks which workspace to install
 * into; everything else (pinned version, alias) is v1-out-of-scope. After
 * a successful install the user navigates to that workspace's agent page
 * to attach the plugin to a specific agent.
 *
 * Modeled on InstallAgentDialog so the UX of "install to workspace" is the
 * same between the two marketplace entities.
 */
export function InstallPluginDialog({
  plugin,
  open,
  onOpenChange,
  onInstalled,
}: InstallPluginDialogProps) {
  const qc = useQueryClient();
  const [wsId, setWsId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const wsQ = useQuery({
    queryKey: queryKeys.workspaces.list(),
    queryFn: fetchWorkspaces,
    enabled: open,
  });
  const workspaces = wsQ.data ?? [];

  useEffect(() => {
    if (open && !wsId && workspaces[0]) {
      setWsId(workspaces[0].id);
    }
  }, [open, workspaces, wsId]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setWsId("");
    }
  }, [open]);

  const mu = useMutation({
    mutationFn: () => installPlugin(wsId, plugin.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plugins.workspaceInstalls(wsId) });
      qc.invalidateQueries({ queryKey: queryKeys.plugins.detail(plugin.id) });
      onInstalled?.();
      onOpenChange(false);
    },
    onError: (err: unknown) => setError(errorMessageFor(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Install {plugin.name}</DialogTitle>
        {wsQ.isLoading ? (
          <div className="py-6 text-sm text-ink-2">Loading workspaces…</div>
        ) : wsQ.isError ? (
          <div className="py-6 text-sm text-state-failed">
            Failed to load workspaces.
          </div>
        ) : workspaces.length === 0 ? (
          <div className="py-6 text-sm text-ink-2">
            You need to belong to at least one workspace as owner or editor to
            install plugins.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!wsId || mu.isPending) return;
              setError(null);
              mu.mutate();
            }}
            className="flex flex-col gap-4 mt-3"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-2">Install to workspace</span>
              <select
                value={wsId}
                onChange={(e) => setWsId(e.target.value)}
                className="rounded border border-line px-3 py-2 text-sm bg-paper-0"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-ink-2 m-0">
              After installing, open any agent you own in this workspace and
              attach the plugin from its Plugins section.
            </p>
            {error && <div className="text-xs text-state-failed">{error}</div>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
                onClick={() => onOpenChange(false)}
                disabled={mu.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
                disabled={mu.isPending || !wsId}
              >
                {mu.isPending ? "Installing…" : "Install"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function errorMessageFor(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body ?? "";
    if (body.includes("already installed")) {
      return "This plugin is already installed in that workspace.";
    }
    if (err.status === 403) {
      return "You don't have permission to install plugins in that workspace.";
    }
    if (body.includes("not published")) {
      return "This plugin is no longer published.";
    }
    return body || err.message;
  }
  if (err instanceof Error) return err.message;
  return "Install failed";
}

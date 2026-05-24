"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { installAgent } from "@/lib/api/marketplace";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import type { PublicAgentView } from "@/lib/api/types";

interface InstallAgentDialogProps {
  agent: PublicAgentView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstalled?: () => void;
}

export function InstallAgentDialog({
  agent,
  open,
  onOpenChange,
  onInstalled,
}: InstallAgentDialogProps) {
  const qc = useQueryClient();
  const [wsId, setWsId] = useState<string>("");
  const [alias, setAlias] = useState<string>(agent.handle);
  const [error, setError] = useState<string | null>(null);

  // Workspaces list. Note: the API returns the caller's workspaces but does
  // not include a per-ws role on this shape (see lib/api/types.ts::Workspace).
  // We show all of them and let the backend's 403 surface as an inline error
  // for viewer-only memberships.
  const wsQ = useQuery({
    queryKey: queryKeys.workspaces.list(),
    queryFn: fetchWorkspaces,
    enabled: open,
  });
  const workspaces = wsQ.data ?? [];

  // Default workspace selection when dialog opens / list arrives.
  useEffect(() => {
    if (open && !wsId && workspaces[0]) {
      setWsId(workspaces[0].id);
    }
  }, [open, workspaces, wsId]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setAlias(agent.handle);
      setError(null);
      setWsId("");
    }
  }, [open, agent.handle]);

  const mu = useMutation({
    mutationFn: () =>
      installAgent(
        wsId,
        agent.id,
        alias !== agent.handle ? alias : undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.installs.workspace(wsId) });
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.agents(wsId) });
      qc.invalidateQueries({ queryKey: queryKeys.marketplace.agent(agent.id) });
      onInstalled?.();
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      setError(errorMessageFor(err));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Install @{agent.handle}</DialogTitle>
        {wsQ.isLoading ? (
          <div className="py-6 text-sm text-ink-2">Loading workspaces…</div>
        ) : wsQ.isError ? (
          <div className="py-6 text-sm text-state-failed">
            Failed to load workspaces.
          </div>
        ) : workspaces.length === 0 ? (
          <div className="py-6 text-sm text-ink-2">
            You need to belong to at least one workspace as owner or editor to
            install agents.
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
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-2">
                Handle in that workspace{" "}
                <span className="text-ink-2">
                  (default <code>{agent.handle}</code>; change to avoid
                  conflicts)
                </span>
              </span>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder={agent.handle}
                className="rounded border border-line px-3 py-2 text-sm bg-paper-0"
                pattern="^[a-z0-9][a-z0-9_-]{0,31}$"
                required
              />
            </label>
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
                disabled={mu.isPending || !alias.trim() || !wsId}
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
    if (body.includes("handle_conflict")) {
      return "That handle already exists in this workspace. Pick a different alias.";
    }
    if (body.includes("already_installed")) {
      return "This agent is already installed in that workspace.";
    }
    if (body.includes("forbidden") || err.status === 403) {
      return "You don't have permission to install agents in that workspace.";
    }
    if (body.includes("not_public")) {
      return "This agent is no longer published.";
    }
    return body || err.message;
  }
  if (err instanceof Error) return err.message;
  return "Install failed";
}

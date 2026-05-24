"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { publishAgent, unpublishAgent } from "@/lib/api/marketplace";
import { queryKeys } from "@/lib/api/keys";
import { ApiError } from "@/lib/api/client";
import type { AgentRefView } from "@/lib/api/types";

interface PublishAgentToggleProps {
  agent: AgentRefView;
}

/**
 * Marketplace publish/unpublish toggle for an agent's detail page.
 *
 * Renders only for own (non-installed) agents — installed refs never need a
 * publish toggle. When public, surfaces the install count; when private, opens
 * an inline description editor before publishing.
 */
export function PublishAgentToggle({ agent }: PublishAgentToggleProps) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState(agent.description ?? "");
  const [error, setError] = useState<string | null>(null);

  // Installed refs never publish — the source agent owner controls publishing.
  if (agent.is_installed) return null;

  const isPublic = agent.visibility === "public";

  const publishMu = useMutation({
    mutationFn: () =>
      publishAgent(agent.id, description.trim() ? description.trim() : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.detail(agent.id) });
      qc.invalidateQueries({
        queryKey: queryKeys.workspaces.agents(agent.workspace_id),
      });
      qc.invalidateQueries({ queryKey: queryKeys.marketplace.agent(agent.id) });
      setShowForm(false);
    },
    onError: (err: unknown) => setError(errorMessageFor(err)),
  });

  const unpublishMu = useMutation({
    mutationFn: () => unpublishAgent(agent.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.detail(agent.id) });
      qc.invalidateQueries({
        queryKey: queryKeys.workspaces.agents(agent.workspace_id),
      });
      qc.invalidateQueries({ queryKey: queryKeys.marketplace.agent(agent.id) });
    },
    onError: (err: unknown) => setError(errorMessageFor(err)),
  });

  return (
    <section className="mt-6 border-[1.5px] border-hairline rounded-md p-4 bg-paper-1">
      <h2 className="text-sm font-bold text-ink-0 m-0 mb-2">Marketplace</h2>
      <p className="text-xs text-ink-2 m-0 mb-3">
        {isPublic ? (
          <>
            状态：<span className="font-semibold text-ink-0">Public</span> — 可被其它工作区安装。
          </>
        ) : (
          <>
            状态：<span className="font-semibold text-ink-0">Private</span> — 仅本工作区可见。
          </>
        )}
      </p>

      {isPublic ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            unpublishMu.mutate();
          }}
          disabled={unpublishMu.isPending}
          className="px-3 py-1.5 border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold text-sm disabled:opacity-60"
        >
          {unpublishMu.isPending ? "Unpublishing…" : "Unpublish"}
        </button>
      ) : showForm ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            publishMu.mutate();
          }}
          className="flex flex-col gap-2"
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink-2">
              Description (optional — shown on the marketplace listing)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded border border-line px-3 py-2 text-sm bg-paper-0"
              placeholder="What does this agent do?"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              disabled={publishMu.isPending}
              className="px-3 py-1.5 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={publishMu.isPending}
              className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
            >
              {publishMu.isPending ? "Publishing…" : "Publish"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowForm(true);
          }}
          className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
        >
          Publish to marketplace
        </button>
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
      return "Only the agent owner can publish.";
    }
    return err.body || err.message;
  }
  if (err instanceof Error) return err.message;
  return "Operation failed";
}

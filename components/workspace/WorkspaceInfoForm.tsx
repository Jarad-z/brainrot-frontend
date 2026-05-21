"use client";

import { useEffect, useState } from "react";
import { useUpdateWorkspace } from "@/hooks/useUpdateWorkspace";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";
import type { Workspace } from "@/lib/api/types";
import { Input } from "@/components/brand/input";
import { Button } from "@/components/brand/button";

interface Props {
  workspace: Workspace;
}

const SLUG_RE = /^[a-z0-9-]+$/;

export function WorkspaceInfoForm({ workspace }: Props) {
  const m = messages.settings;
  const mutation = useUpdateWorkspace(workspace.id);
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [error, setError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    setName(workspace.name);
    setSlug(workspace.slug);
    // Reset state only on identity change (new workspace). Avoiding deps on
    // name/slug prevents background refetches (or other-tab saves) from
    // discarding the user's in-progress edits.
  }, [workspace.id]);

  const dirty = name !== workspace.name || slug !== workspace.slug;
  const slugValid = SLUG_RE.test(slug);
  const canSubmit = dirty && name.length > 0 && slugValid && !mutation.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const patch: { name?: string; slug?: string } = {};
    if (name !== workspace.name) patch.name = name;
    if (slug !== workspace.slug) patch.slug = slug;
    try {
      await mutation.mutateAsync(patch);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) setError(m.slugConflict);
        else if (err.status === 403) setError(m.permissionOwner);
        else setError(err.body || err.message);
      } else {
        setError((err as Error).message);
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 max-w-md">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.nameLabel}</span>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-1">{m.slugLabel}</span>
        <Input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="font-mono"
        />
        <span className="text-xs text-ink-2">{m.slugHelp}</span>
      </label>
      {error && <p className="text-xs text-state-failed">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="default" disabled={!canSubmit}>
          {mutation.isPending ? m.saving : m.save}
        </Button>
        {savedToast && <span className="text-xs text-ink-2">{m.saved}</span>}
      </div>
    </form>
  );
}

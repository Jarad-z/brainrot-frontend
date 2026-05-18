"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateWorkspace } from "@/hooks/useCreateWorkspace";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

interface CreateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function CreateWorkspaceModal({ open, onOpenChange }: CreateWorkspaceModalProps) {
  const router = useRouter();
  const m = messages.createWs;
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const mutation = useCreateWorkspace();

  const canSubmit =
    name.trim().length > 0 && SLUG_RE.test(slug) && !mutation.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSlugError(null);
    try {
      const ws = await mutation.mutateAsync({ name: name.trim(), slug });
      setName("");
      setSlug("");
      onOpenChange(false);
      router.push(`/w/${ws.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSlugError(m.slugConflict);
      } else {
        setSlugError((err as Error).message ?? "unknown error");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{m.title}</DialogTitle>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-1">{m.nameLabel}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={m.namePlaceholder}
              className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-1">{m.slugLabel}</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugError(null);
              }}
              placeholder={m.slugPlaceholder}
              className={
                slugError
                  ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm"
                  : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
              }
            />
            {slugError ? (
              <span className="text-xs text-state-failed">{slugError}</span>
            ) : (
              <span className="text-xs text-ink-2">{m.slugHelp}</span>
            )}
          </label>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
            >
              {m.cancel}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
            >
              {mutation.isPending ? m.creating : m.cta}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

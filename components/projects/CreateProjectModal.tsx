"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCreateProject } from "@/hooks/useCreateProject";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wsId: string;
}

export function CreateProjectModal({ open, onOpenChange, wsId }: CreateProjectModalProps) {
  const router = useRouter();
  const m = messages.createProject;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useCreateProject(wsId);

  const canSubmit = name.trim().length > 0 && !mutation.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const project = await mutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      onOpenChange(false);
      router.push(`/w/${wsId}/p/${project.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError(m.forbidden);
      } else {
        setError((err as Error).message ?? "unknown error");
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
            <span className="text-xs font-semibold text-ink-1">{m.descLabel}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={m.descPlaceholder}
              rows={3}
              className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm resize-y"
            />
          </label>
          {error ? <span className="text-xs text-state-failed">{error}</span> : null}
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

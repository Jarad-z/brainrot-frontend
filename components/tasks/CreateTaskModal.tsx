"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCreateTask } from "@/hooks/useCreateTask";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wsId: string;
  projectId: string;
}

export function CreateTaskModal({
  open,
  onOpenChange,
  wsId,
  projectId,
}: CreateTaskModalProps) {
  const router = useRouter();
  const m = messages.createTask;
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useCreateTask(projectId);

  const canSubmit = title.trim().length > 0 && !mutation.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const task = await mutation.mutateAsync({
        title: title.trim(),
        summary: summary.trim() || undefined,
      });
      setTitle("");
      setSummary("");
      onOpenChange(false);
      router.push(`/w/${wsId}/p/${projectId}/t/${task.id}`);
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
            <span className="text-xs font-semibold text-ink-1">{m.titleLabel}</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={m.titlePlaceholder}
              className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-1">{m.summaryLabel}</span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={m.summaryPlaceholder}
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

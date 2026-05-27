"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/brand/dialog";
import { Input, Textarea } from "@/components/brand/input";
import { Button } from "@/components/brand/button";
import { useUpdateTaskMeta } from "@/hooks/useUpdateTaskMeta";
import type { TaskCard } from "@/lib/api/types";

interface RenameTaskDialogProps {
  task: TaskCard;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameTaskDialog({
  task,
  projectId,
  open,
  onOpenChange,
}: RenameTaskDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [summary, setSummary] = useState(task.summary);
  const [error, setError] = useState<string | null>(null);
  const updateMeta = useUpdateTaskMeta(projectId);

  // Reset form whenever a new task is opened.
  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setSummary(task.summary);
      setError(null);
    }
  }, [open, task.id, task.title, task.summary]);

  const titleChanged = title !== task.title;
  const summaryChanged = summary !== task.summary;
  const dirty = titleChanged || summaryChanged;
  const titleEmpty = title.trim() === "";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) {
      onOpenChange(false);
      return;
    }
    if (titleEmpty) {
      setError("Title cannot be empty.");
      return;
    }
    updateMeta.mutate(
      {
        taskId: task.id,
        ...(titleChanged ? { title } : {}),
        ...(summaryChanged ? { summary } : {}),
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Edit task</DialogTitle>
        <DialogDescription>
          Rename this task or update its summary. Changes propagate to every
          open client subscribed to this project.
        </DialogDescription>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink-2">Title</span>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={titleEmpty}
              placeholder="Task title"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink-2">Summary</span>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Optional summary"
            />
          </label>
          {error && (
            <p className="text-sm text-state-failed" role="alert">
              {error}
            </p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={updateMeta.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!dirty || titleEmpty || updateMeta.isPending}
            >
              {updateMeta.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

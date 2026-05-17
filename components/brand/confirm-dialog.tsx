"use client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  knownIssueNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  knownIssueNote,
  confirmLabel = "确认",
  cancelLabel = "取消",
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
        {knownIssueNote && (
          <p className="text-xs text-ink-2 italic mt-3 border-l-2 border-hairline pl-3">
            {knownIssueNote}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={
              destructive
                ? "px-3 py-1.5 bg-state-failed text-paper-0 border-[1.5px] border-state-failed rounded-sm font-semibold text-sm"
                : "px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm shadow-[var(--shadow-current)]"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

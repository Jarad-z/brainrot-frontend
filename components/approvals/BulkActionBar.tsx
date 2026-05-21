"use client";

import { messages } from "@/lib/messages";
import type { BulkProgress } from "@/hooks/useBulkDecide";

interface BulkActionBarProps {
  count: number;
  progress: BulkProgress | null;
  onApprove: () => void;
  onDeny: () => void;
  onClear: () => void;
}

export function BulkActionBar({ count, progress, onApprove, onDeny, onClear }: BulkActionBarProps) {
  const m = messages.bulkApprovals;
  const busy = progress !== null;
  if (count === 0 && !busy) return null;

  return (
    <div className="sticky top-0 z-10 -mx-6 mb-3 px-6 py-2.5 bg-paper-0/85 backdrop-blur-md border-b border-hairline flex items-center justify-between shadow-[var(--shadow-1)]">
      {busy && progress ? (
        <span className="text-sm font-mono text-ink-2">
          {m.processing(progress.done, progress.total)}
        </span>
      ) : (
        <>
          <span className="text-sm font-semibold text-ink-0">{m.selected(count)}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onApprove}
              className="px-3 py-1.5 bg-accent text-accent-fg rounded-lg font-semibold text-xs hover:opacity-90 shadow-[var(--shadow-1)] transition-opacity"
            >
              {m.approve}
            </button>
            <button
              type="button"
              onClick={onDeny}
              className="px-3 py-1.5 border border-hairline rounded-lg font-medium text-xs text-ink-1 hover:bg-paper-1 transition-colors"
            >
              {m.deny}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1.5 text-xs text-ink-2 hover:text-ink-1 transition-colors"
            >
              {m.clear}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

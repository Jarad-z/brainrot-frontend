"use client";

import { messages } from "@/lib/messages";
import type { BulkProgress } from "@/hooks/useBulkDecide";

interface Props {
  count: number;
  progress: BulkProgress | null;
  onApprove: () => void;
  onDeny: () => void;
  onClear: () => void;
}

export function BulkActionBar({ count, progress, onApprove, onDeny, onClear }: Props) {
  const m = messages.bulkApprovals;
  const busy = progress !== null;
  if (count === 0 && !busy) return null;

  return (
    <div className="sticky top-0 z-10 -mx-6 mb-3 px-6 py-2 bg-paper-1 border-b-[1.5px] border-ink-0 flex items-center justify-between shadow-[var(--shadow-current)]">
      {busy && progress ? (
        <span className="text-sm font-mono text-ink-2">
          {m.processing(progress.done, progress.total)}
        </span>
      ) : (
        <>
          <span className="text-sm font-semibold">{m.selected(count)}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onApprove}
              className="px-3 py-1 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-xs"
            >
              {m.approve}
            </button>
            <button
              type="button"
              onClick={onDeny}
              className="px-3 py-1 border-[1.5px] border-ink-0 rounded-sm font-semibold text-xs"
            >
              {m.deny}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1 text-xs text-ink-2"
            >
              {m.clear}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useBulkDecide } from "@/hooks/useBulkDecide";
import { BulkActionBar } from "./BulkActionBar";
import { messages } from "@/lib/messages";
import type { ApprovalDecision } from "@/lib/api/types";

export interface BulkApprovalsListProps<T extends { id: string }> {
  items: T[];
  renderRow: (item: T, opts: { selected: boolean; onToggle: () => void }) => React.ReactNode;
  onResult?: (result: { ok: string[]; fail: { id: string; error: string }[] }) => void;
}

export function BulkApprovalsList<T extends { id: string }>({
  items,
  renderRow,
  onResult,
}: BulkApprovalsListProps<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { run, progress } = useBulkDecide();
  const m = messages.bulkApprovals;

  const allIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);
  useEffect(() => {
    setSelected((prev) => {
      const next = new Set<string>();
      for (const id of prev) if (allIds.has(id)) next.add(id);
      return next;
    });
  }, [allIds]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id)),
    );
  }

  async function submit(decision: ApprovalDecision) {
    if (progress !== null) return;
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const result = await run(ids, decision);
    onResult?.(result);
    setSelected(new Set(result.fail.map((f) => f.id)));
  }

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="flex flex-col">
      <BulkActionBar
        count={selected.size}
        progress={progress}
        onApprove={() => submit("approved")}
        onDeny={() => submit("denied")}
        onClear={() => setSelected(new Set())}
      />
      {items.length > 0 && (
        <label className="flex items-center gap-2 px-1 py-1 text-xs text-ink-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleAll}
          />
          {m.selectAll}
        </label>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => toggle(item.id)}
              className="mt-3"
            />
            <div className="flex-1 min-w-0">
              {renderRow(item, {
                selected: selected.has(item.id),
                onToggle: () => toggle(item.id),
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

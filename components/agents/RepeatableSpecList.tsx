"use client";

import type { SkillSpec } from "@/lib/api/types";

interface RepeatableSpecListProps {
  /** Display label shown in error messages and the "add" button (e.g. "skill"). */
  itemLabel: string;
  items: SkillSpec[];
  onChange: (next: SkillSpec[]) => void;
  /** Hard cap matching the server-side limit. Defaults to 20 to mirror service caps. */
  maxItems?: number;
  /** Optional per-row content-area placeholder (e.g. "# /review\n…"). */
  contentPlaceholder?: string;
  /** Optional helper text rendered when the list is empty. */
  emptyHint?: string;
}

// Mirrors service-layer name regex ^[a-z][a-z0-9_-]{0,63}$ so users get
// inline feedback before submitting; the server is authoritative.
const NAME_RE = /^[a-z][a-z0-9_-]{0,63}$/;

/**
 * Generic editor for the shared {name, description, content} shape used by
 * skills / commands / subagents. Maintains its own row keys via array index;
 * since the parent owns the items array, this stays a controlled component.
 */
export function RepeatableSpecList({
  itemLabel,
  items,
  onChange,
  maxItems = 20,
  contentPlaceholder,
  emptyHint,
}: RepeatableSpecListProps) {
  function updateAt(i: number, patch: Partial<SkillSpec>) {
    const next = items.slice();
    next[i] = { ...next[i], ...patch } as SkillSpec;
    onChange(next);
  }

  function removeAt(i: number) {
    const next = items.slice();
    next.splice(i, 1);
    onChange(next);
  }

  function addOne() {
    if (items.length >= maxItems) return;
    onChange([...items, { name: "", description: "", content: "" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && emptyHint ? (
        <p className="text-xs text-ink-2 italic">{emptyHint}</p>
      ) : null}
      {items.map((it, i) => {
        const nameInvalid = it.name !== "" && !NAME_RE.test(it.name);
        return (
          <div
            key={i}
            className="flex flex-col gap-2 p-3 border-[1.5px] border-hairline rounded-sm bg-paper-1"
          >
            <div className="flex items-center gap-2">
              <input
                aria-label={`${itemLabel} ${i + 1} name`}
                type="text"
                value={it.name}
                onChange={(e) => updateAt(i, { name: e.target.value })}
                placeholder="name (a-z, 0-9, _ -)"
                className={
                  nameInvalid
                    ? "flex-1 px-2 py-1 border-[1.5px] border-state-failed rounded-sm text-sm font-mono"
                    : "flex-1 px-2 py-1 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
                }
              />
              <button
                type="button"
                aria-label={`Remove ${itemLabel} ${i + 1}`}
                onClick={() => removeAt(i)}
                className="px-2 py-1 text-xs text-ink-2 hover:text-state-failed border-[1.5px] border-hairline rounded-sm"
              >
                删除
              </button>
            </div>
            {nameInvalid ? (
              <span className="text-xs text-state-failed">
                小写字母开头，允许 a-z 0-9 _ -，最长 64
              </span>
            ) : null}
            <input
              aria-label={`${itemLabel} ${i + 1} description`}
              type="text"
              value={it.description ?? ""}
              onChange={(e) => updateAt(i, { description: e.target.value })}
              placeholder="description (optional)"
              className="px-2 py-1 border-[1.5px] border-hairline rounded-sm text-sm"
            />
            <textarea
              aria-label={`${itemLabel} ${i + 1} content`}
              value={it.content}
              onChange={(e) => updateAt(i, { content: e.target.value })}
              rows={5}
              placeholder={contentPlaceholder}
              className="px-2 py-1 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
            />
          </div>
        );
      })}
      <button
        type="button"
        onClick={addOne}
        disabled={items.length >= maxItems}
        className="self-start px-3 py-1.5 text-sm border-[1.5px] border-hairline rounded-sm hover:bg-paper-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        + 新增 {itemLabel}
        {items.length > 0 ? ` (${items.length}/${maxItems})` : ""}
      </button>
    </div>
  );
}

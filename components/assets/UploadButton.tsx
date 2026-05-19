"use client";

import { useRef } from "react";
import { useUploadAssets } from "@/hooks/useUploadAssets";
import { formatBytes } from "@/lib/format";
import { messages } from "@/lib/messages";

interface Props {
  projectId: string;
}

export function UploadButton({ projectId }: Props) {
  const m = messages.assets;
  const inputRef = useRef<HTMLInputElement>(null);
  const { items, start, dismiss } = useUploadAssets(projectId);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    void start(files);
  }

  return (
    <div className="flex flex-col gap-2 p-2 border-b-[1.5px] border-hairline">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-1">素材</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-2 py-1 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-xs"
        >
          {m.uploadCta}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={onPick}
          className="hidden"
          aria-label={m.selectFiles}
        />
      </div>
      {items.length > 0 && (
        <ul className="flex flex-col gap-1">
          {items.map((it) => (
            <li
              key={it.id}
              className={
                it.status === "failed"
                  ? "flex items-center gap-2 px-2 py-1 text-xs border-[1.5px] border-state-failed rounded-sm"
                  : "flex items-center gap-2 px-2 py-1 text-xs border-[1.5px] border-hairline rounded-sm"
              }
            >
              <span className="flex-1 truncate font-mono" title={it.filename}>
                {it.filename}
              </span>
              <span className="text-ink-2 shrink-0">{formatBytes(it.size)}</span>
              {it.status === "pending" && <span className="text-ink-2">{m.pending}</span>}
              {it.status === "uploading" && (
                <span className="text-ink-2 font-mono">
                  {Math.round((it.loaded / Math.max(it.size, 1)) * 100)}%
                </span>
              )}
              {it.status === "done" && <span className="text-ink-2">{m.done}</span>}
              {it.status === "failed" && (
                <>
                  <span className="text-state-failed">{it.error ?? m.failed}</span>
                  <button
                    type="button"
                    onClick={() => dismiss(it.id)}
                    className="ml-1 text-ink-2"
                    aria-label={m.dismiss}
                  >
                    ×
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

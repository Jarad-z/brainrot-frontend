"use client";

import { useState, useRef, useEffect } from "react";
import { WsSwitcher } from "@/components/brand/ws-switcher";
import { useWorkspaceContext } from "@/lib/workspace-context";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { messages } from "@/lib/messages";

function avatarFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export function WorkspaceSwitcherDropdown() {
  const { currentWsId, wsList, switchTo } = useWorkspaceContext();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = wsList.find((w) => w.id === currentWsId) ?? wsList[0];
  const label = current?.name ?? messages.shell.wsListEmpty;
  const meta = current?.slug;
  const avatar = current ? avatarFromName(current.name) : "·";

  return (
    <div
      className="relative"
      ref={wrapperRef}
      onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
    >
      <WsSwitcher
        name={label}
        meta={meta}
        avatar={avatar}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      />
      {open ? (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-30 bg-paper-0 border-[1.5px] border-hairline rounded-md shadow-lg max-h-72 overflow-y-auto"
          role="listbox"
          aria-label="Available workspaces"
        >
          {wsList.length === 0 ? (
            <p className="px-3 py-2 text-xs text-ink-2">{messages.shell.wsListEmpty}</p>
          ) : (
            wsList.map((ws) => (
              <button
                key={ws.id}
                type="button"
                role="option"
                aria-selected={ws.id === currentWsId}
                onClick={() => {
                  setOpen(false);
                  if (ws.id !== currentWsId) switchTo(ws.id);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-paper-2 flex items-center gap-2"
              >
                <span className="flex-1 truncate">{ws.name}</span>
                {ws.id === currentWsId ? <span aria-hidden>✓</span> : null}
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setCreateOpen(true);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold border-t-[1.5px] border-hairline hover:bg-paper-2"
          >
            + 新建工作区
          </button>
        </div>
      ) : null}
      <CreateWorkspaceModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

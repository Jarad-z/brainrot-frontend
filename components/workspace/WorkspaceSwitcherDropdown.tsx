"use client";

import { useState } from "react";
import { WsSwitcher } from "@/components/brand/ws-switcher";
import { useWorkspaceContext } from "@/lib/workspace-context";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { messages } from "@/lib/messages";

function avatarFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  if (parts.length === 0 || first === "" || first === undefined) return "?";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const second = parts[1];
  if (second === undefined) return first.slice(0, 2).toUpperCase();
  return ((first[0] ?? "") + (second[0] ?? "")).toUpperCase();
}

export function WorkspaceSwitcherDropdown() {
  const { currentWsId, wsList, switchTo } = useWorkspaceContext();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const current = wsList.find((w) => w.id === currentWsId) ?? wsList[0];
  const label = current?.name ?? messages.shell.wsListEmpty;
  const meta = current?.slug;
  const avatar = current ? avatarFromName(current.name) : "·";

  return (
    <div className="relative">
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
          onBlur={() => setOpen(false)}
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

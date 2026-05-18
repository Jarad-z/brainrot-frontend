"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { messages } from "@/lib/messages";

export default function AgentsListPage() {
  const { wsId } = useParams<{ wsId: string }>();
  const { data: agents = [], isLoading } = useWorkspaceAgents(wsId);
  const [showArchived, setShowArchived] = useState(false);

  const visible = showArchived ? agents : agents.filter((a) => !a.archived);

  return (
    <main className="p-6 overflow-y-auto h-full">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">{messages.agents.listTitle}</h1>
        <div className="flex items-center gap-3">
          <label className="text-xs flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            {messages.agents.showArchived}
          </label>
          <Link
            href={`/w/${wsId}/agents/new`}
            className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
          >
            {messages.agents.newCta}
          </Link>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-ink-2">加载中…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-ink-2">
          {agents.length === 0
            ? messages.agents.emptyTitle
            : messages.agents.emptyAllArchived}
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visible.map((a) => (
            <li key={a.id}>
              <Link
                href={`/w/${wsId}/agents/${a.id}`}
                className={
                  a.archived
                    ? "block border-[1.5px] border-hairline rounded-md p-3 bg-paper-2 opacity-70"
                    : "block border-[1.5px] border-hairline rounded-md p-3 bg-paper-0 hover:border-ink-1"
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">@{a.handle}</span>
                  {a.archived ? (
                    <span className="text-xs px-1.5 py-0.5 bg-paper-1 border border-hairline rounded">
                      {messages.agents.archivedBadge}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-ink-2 mt-1 truncate">{a.name}</div>
                <div className="text-xs text-ink-3 mt-1">{a.model}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

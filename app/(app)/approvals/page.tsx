"use client";

import { useGlobalPendingApprovals } from "@/hooks/useGlobalPendingApprovals";
import type { PendingApproval } from "@/lib/api/types";

function groupByWorkspace(items: PendingApproval[]): Map<string, { name: string; items: PendingApproval[] }> {
  const out = new Map<string, { name: string; items: PendingApproval[] }>();
  for (const it of items) {
    const cur = out.get(it.workspace_id);
    if (cur) cur.items.push(it);
    else out.set(it.workspace_id, { name: it.workspace_name, items: [it] });
  }
  return out;
}

export default function TopLevelApprovalsPage() {
  const { data = [], isLoading, isError } = useGlobalPendingApprovals();

  if (isLoading) {
    return <main className="p-6 text-sm text-ink-2">加载中…</main>;
  }
  if (isError) {
    return <main className="p-6 text-sm text-state-failed">加载失败，请刷新重试</main>;
  }
  if (data.length === 0) {
    return (
      <main className="p-6 text-sm text-ink-2">
        全部审批已处理 ✓
      </main>
    );
  }

  const groups = groupByWorkspace(data);

  return (
    <main className="p-6 flex flex-col gap-6 overflow-y-auto h-full">
      <h1 className="text-lg font-bold">跨工作区待审批</h1>
      {Array.from(groups.entries()).map(([wsId, group]) => (
        <section key={wsId} className="flex flex-col gap-2">
          <header className="flex items-center gap-2">
            <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-paper-2 border border-hairline rounded">
              {group.name}
            </span>
            <span className="text-xs text-ink-2">{group.items.length} 项</span>
          </header>
          <ul className="flex flex-col gap-2">
            {group.items.map((it) => (
              <li
                key={it.id}
                className="border-[1.5px] border-hairline rounded-md p-3 text-sm bg-paper-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{it.tool_name}</span>
                  <span className="text-xs text-ink-2">@{it.agent_handle}</span>
                </div>
                <div className="text-xs text-ink-2 mt-1">{it.task_title}</div>
                <a
                  href={`/w/${it.workspace_id}/approvals`}
                  className="inline-block mt-2 text-xs font-semibold text-ink-0 underline"
                >
                  在工作区中处理 →
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

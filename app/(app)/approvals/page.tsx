"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGlobalPendingApprovals } from "@/hooks/useGlobalPendingApprovals";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { BulkApprovalsList } from "@/components/approvals/BulkApprovalsList";
import { messages } from "@/lib/messages";
import type { PendingApproval } from "@/lib/api/types";

function groupByWorkspace(
  items: PendingApproval[],
  wsNameById: Map<string, string>,
): Map<string, { name: string; items: PendingApproval[] }> {
  const out = new Map<string, { name: string; items: PendingApproval[] }>();
  for (const it of items) {
    const cur = out.get(it.workspace_id);
    if (cur) cur.items.push(it);
    else {
      const name = wsNameById.get(it.workspace_id) ?? it.project_name;
      out.set(it.workspace_id, { name, items: [it] });
    }
  }
  return out;
}

export default function TopLevelApprovalsPage() {
  const { data = [], isLoading, isError } = useGlobalPendingApprovals();
  const { data: wsList = [] } = useWorkspaces();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

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

  const wsNameById = new Map(wsList.map((w) => [w.id, w.name]));
  const groups = groupByWorkspace(data, wsNameById);

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
          <BulkApprovalsList
            items={group.items}
            renderRow={(it) => (
              <div className="border-[1.5px] border-hairline rounded-md p-3 text-sm bg-paper-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{it.tool_name}</span>
                  <span className="text-xs text-ink-2">@{it.agent_handle}</span>
                </div>
                <div className="text-xs text-ink-2 mt-1">{it.task_title}</div>
                <Link
                  href={`/w/${it.workspace_id}/approvals`}
                  className="inline-block mt-2 text-xs font-semibold text-ink-0 underline"
                >
                  在工作区中处理 →
                </Link>
              </div>
            )}
            onResult={(r) => {
              if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
              setToast(messages.bulkApprovals.summarySimple(r.ok.length, r.fail.length));
              toastTimerRef.current = setTimeout(() => setToast(null), 3000);
            }}
          />
        </section>
      ))}
      {toast && (
        <div className="fixed bottom-4 right-4 px-3 py-2 bg-ink-0 text-paper-0 rounded-sm text-sm shadow-[var(--shadow-current)]">
          {toast}
        </div>
      )}
    </main>
  );
}

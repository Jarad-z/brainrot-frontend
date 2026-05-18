"use client";
import { useTaskApprovalsHistory } from "@/hooks/useTaskApprovalsHistory";
import { ApprovalHistoryRow } from "./ApprovalHistoryRow";

interface ApprovalsTabProps {
  taskId: string;
}

export function ApprovalsTab({ taskId }: ApprovalsTabProps) {
  const { data, isLoading } = useTaskApprovalsHistory(taskId);
  if (isLoading) {
    return <div className="text-center text-xs text-ink-2 py-8">加载中…</div>;
  }
  const records = data ?? [];
  if (records.length === 0) {
    return <div className="text-center text-xs text-ink-2 py-8">暂无审批历史</div>;
  }
  return (
    <ul className="flex flex-col">
      {records.map((r) => (
        <ApprovalHistoryRow key={r.id} record={r} />
      ))}
    </ul>
  );
}

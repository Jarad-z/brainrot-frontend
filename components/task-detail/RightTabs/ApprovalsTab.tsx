"use client";
import { useApprovalsHistory } from "@/hooks/useApprovalsHistory";
import { ApprovalHistoryRow } from "./ApprovalHistoryRow";

interface ApprovalsTabProps {
  taskId: string;
}

export function ApprovalsTab({ taskId }: ApprovalsTabProps) {
  const approvals = useApprovalsHistory(taskId);
  if (approvals.length === 0) {
    return <div className="text-center text-xs text-ink-2 py-8">暂无审批历史</div>;
  }
  return (
    <ul className="flex flex-col">
      {approvals.map((m) => (
        <ApprovalHistoryRow key={m.id} message={m} />
      ))}
    </ul>
  );
}

import { StatusChip } from "@/components/brand/status-chip";
import type { TaskStatus } from "@/lib/api/types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return <StatusChip status={status} />;
}

"use client";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/brand/icon-button";
import { usePendingApprovalsCount } from "@/hooks/usePendingApprovalsCount";

interface NotificationBellProps {
  wsId: string;
}

function badgeFromCount(n: number): number | string | undefined {
  if (n <= 0) return undefined;
  if (n > 99) return "99+";
  return n;
}

export function NotificationBell({ wsId }: NotificationBellProps) {
  const router = useRouter();
  const count = usePendingApprovalsCount(wsId);
  const badge = badgeFromCount(count);

  return (
    <IconButton
      aria-label="通知"
      onClick={() => router.push(`/w/${wsId}/approvals`)}
      badge={badge}
      title={count > 0 ? `${count} 件待审批` : "暂无待审批"}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </svg>
    </IconButton>
  );
}

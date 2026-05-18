"use client";
import { useRouter, usePathname } from "next/navigation";
import { IconButton } from "@/components/brand/icon-button";
import { useGlobalPendingApprovalsCount } from "@/hooks/useGlobalPendingApprovalsCount";

function badgeFromCount(n: number): number | string | undefined {
  if (n <= 0) return undefined;
  if (n > 99) return "99+";
  return n;
}

const WS_ROUTE = /^\/w\/([^/]+)/;

export function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { data: count = 0 } = useGlobalPendingApprovalsCount();
  const badge = badgeFromCount(count);

  const onClick = () => {
    const m = pathname.match(WS_ROUTE);
    if (m) router.push(`/w/${m[1]}/approvals`);
    else router.push("/approvals");
  };

  return (
    <IconButton
      aria-label="通知"
      onClick={onClick}
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

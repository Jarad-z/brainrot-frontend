"use client";

import { OfflineBanner } from "@/components/common/OfflineBanner";
import { Sidebar } from "./Sidebar";
import { Breadcrumb } from "./Breadcrumb";
import { AccountMenu } from "./AccountMenu";
import type { User } from "@/lib/api/types";

interface ThreeColumnShellProps {
  user: User;
  children: React.ReactNode;
}

export function ThreeColumnShell({ user, children }: ThreeColumnShellProps) {
  return (
    <div className="min-h-screen bg-paper-1 flex flex-col">
      <OfflineBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-hairline bg-paper-0 px-6 flex items-center justify-between shrink-0">
            <Breadcrumb />
            <AccountMenu user={user} />
          </header>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}

"use client";

import { OfflineBanner } from "@/components/common/OfflineBanner";
import { Sidebar } from "./Sidebar";
import { Breadcrumb } from "./Breadcrumb";
import { AccountMenu } from "./AccountMenu";
import { Input } from "@/components/brand/input";
import { NotificationBell } from "@/components/layout/NotificationBell";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/brand/tooltip";
import type { User } from "@/lib/api/types";

interface ThreeColumnShellProps {
  user: User;
  children: React.ReactNode;
}

export function ThreeColumnShell({ user, children }: ThreeColumnShellProps) {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-paper-1 flex flex-col">
        <OfflineBanner />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 border-b-[1.5px] border-hairline bg-paper-0 px-5 flex items-center gap-3.5 shrink-0">
              <Breadcrumb />
              <div className="flex-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Input
                      placeholder="搜任务、消息、@agent..."
                      disabled
                      className="w-[280px]"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>S3 上线后启用</TooltipContent>
              </Tooltip>
              <NotificationBell />
              <AccountMenu user={user} />
            </header>
            <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

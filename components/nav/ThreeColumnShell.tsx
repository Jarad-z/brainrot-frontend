"use client";

import { OfflineBanner } from "@/components/common/OfflineBanner";
import { Sidebar } from "./Sidebar";
import { Breadcrumb } from "./Breadcrumb";
import { AccountMenu } from "./AccountMenu";
import { Input } from "@/components/brand/input";
import { IconButton } from "@/components/brand/icon-button";
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
                <TooltipContent>S2 上线后启用</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <IconButton disabled aria-label="通知">
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
                  </span>
                </TooltipTrigger>
                <TooltipContent>S3 上线后启用</TooltipContent>
              </Tooltip>
              <AccountMenu user={user} />
            </header>
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

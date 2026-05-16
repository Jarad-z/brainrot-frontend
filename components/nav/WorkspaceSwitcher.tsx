"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { messages } from "@/lib/messages";

export function WorkspaceSwitcher() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled
            className="w-full text-left px-3 py-2 border border-hairline rounded-md text-sm text-ink-2 opacity-60 cursor-not-allowed bg-paper-0"
          >
            工作区 ▼
          </button>
        </TooltipTrigger>
        <TooltipContent>{messages.shell.wsListDisabled}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

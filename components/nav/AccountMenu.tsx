"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { auth } from "@/lib/api/auth";
import { useAppStore } from "@/lib/store";
import { messages } from "@/lib/messages";
import type { User } from "@/lib/api/types";

interface AccountMenuProps {
  user: User;
}

export function AccountMenu({ user }: AccountMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const initial = (user.Name?.[0] ?? user.Email[0] ?? "?").toUpperCase();

  async function onLogout() {
    try {
      await auth.logout();
    } catch {
      // ignore; we proceed to clean local state regardless
    }
    queryClient.clear();
    useAppStore.getState().reset();
    router.replace("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <Avatar className="h-8 w-8 bg-ink-0 text-paper-0">
            <AvatarFallback className="bg-ink-0 text-paper-0 text-sm font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs text-ink-2">{user.Email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>{messages.shell.logout}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

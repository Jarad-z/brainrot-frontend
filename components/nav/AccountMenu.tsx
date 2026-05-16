"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/api/auth";
import { useAppStore } from "@/lib/store";
import { messages } from "@/lib/messages";
import { Avatar } from "@/components/brand/avatar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/brand/dropdown";
import type { User } from "@/lib/api/types";

interface AccountMenuProps {
  user: User;
}

export function AccountMenu({ user }: AccountMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function onLogout() {
    try {
      await auth.logout();
    } catch {
      // ignore; proceed to clean local state regardless
    }
    queryClient.clear();
    useAppStore.getState().reset();
    router.replace("/login");
  }

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Avatar name={user.Name || user.Email} size={36} />
        </button>
      </DropdownTrigger>
      <DropdownContent align="end">
        <div className="px-3 py-2 text-xs text-ink-2 font-mono">
          {user.Email}
        </div>
        <DropdownSeparator />
        <DropdownItem onSelect={onLogout}>
          {messages.shell.logout}
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

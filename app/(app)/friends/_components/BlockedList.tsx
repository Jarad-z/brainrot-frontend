"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import { listBlocked, unblockUser } from "@/lib/api/friends";
import { UserAvatarChip } from "@/components/user/UserAvatarChip";

export function BlockedList() {
  const qc = useQueryClient();
  const blocked = useQuery({ queryKey: queryKeys.friends.blocked(), queryFn: listBlocked });

  const unblockMu = useMutation({
    mutationFn: (id: string) => unblockUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.friends.blocked() }),
  });

  if (blocked.isLoading) return <div className="py-6 text-sm text-ink-2">Loading…</div>;
  if ((blocked.data ?? []).length === 0) {
    return <div className="py-6 text-sm text-ink-2">No blocked users.</div>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {blocked.data!.map((u) => (
        <li
          key={u.id}
          className="flex items-center justify-between gap-3 rounded border border-line px-3 py-2"
        >
          <UserAvatarChip user={u} />
          <button
            type="button"
            onClick={() => unblockMu.mutate(u.id)}
            className="rounded border border-line px-2 py-1 text-xs"
            disabled={unblockMu.isPending}
          >
            Unblock
          </button>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import { listFriendRequests, decideFriendRequest } from "@/lib/api/friends";
import { useBadges } from "@/lib/stores/badges";
import { UserAvatarChip } from "@/components/user/UserAvatarChip";

export function RequestsList() {
  const qc = useQueryClient();
  const reqs = useQuery({ queryKey: queryKeys.friends.requests(), queryFn: listFriendRequests });

  const decideMu = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "decline" }) =>
      decideFriendRequest(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.friends.requests() });
      qc.invalidateQueries({ queryKey: queryKeys.friends.list() });
      useBadges.getState().decFriendRequests();
    },
  });

  if (reqs.isLoading) return <div className="py-6 text-sm text-ink-2">Loading…</div>;
  if ((reqs.data ?? []).length === 0) {
    return <div className="py-6 text-sm text-ink-2">No pending requests.</div>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {reqs.data!.map((u) => (
        <li
          key={u.id}
          className="flex items-center justify-between gap-3 rounded border border-line px-3 py-2"
        >
          <UserAvatarChip user={u} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => decideMu.mutate({ id: u.id, action: "accept" })}
              className="rounded bg-ink-0 px-2 py-1 text-xs text-paper-0"
              disabled={decideMu.isPending}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => decideMu.mutate({ id: u.id, action: "decline" })}
              className="rounded border border-line px-2 py-1 text-xs"
              disabled={decideMu.isPending}
            >
              Decline
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

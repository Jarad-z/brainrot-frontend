"use client";

import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import { listFriends, removeFriend, blockUser } from "@/lib/api/friends";
import { UserAvatarChip } from "@/components/user/UserAvatarChip";

export function FriendsList() {
  const qc = useQueryClient();
  const friends = useQuery({ queryKey: queryKeys.friends.list(), queryFn: listFriends });

  const removeMu = useMutation({
    mutationFn: (id: string) => removeFriend(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.friends.list() }),
  });
  const blockMu = useMutation({
    mutationFn: (id: string) => blockUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.friends.list() });
      qc.invalidateQueries({ queryKey: queryKeys.friends.blocked() });
    },
  });

  if (friends.isLoading) return <div className="py-6 text-sm text-ink-2">Loading…</div>;
  if ((friends.data ?? []).length === 0) {
    return (
      <div className="py-6 text-sm text-ink-2">
        No friends yet. Use “Add by email” to send a request.
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3 list-none p-0 m-0">
      {friends.data!.map((f) => (
        <li
          key={f.id}
          className="y2k-card flex items-center justify-between gap-3"
        >
          <UserAvatarChip user={f} y2k />
          <div className="flex items-center gap-2">
            <Link href={`/messages?to=${f.id}`} className="y2k-btn y2k-btn-primary">
              Message
            </Link>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Remove ${f.name} from friends? DM history will be preserved.`)) {
                  removeMu.mutate(f.id);
                }
              }}
              className="y2k-btn y2k-btn-ghost"
              disabled={removeMu.isPending}
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Block ${f.name}? They won't be able to contact you.`)) {
                  blockMu.mutate(f.id);
                }
              }}
              className="y2k-btn y2k-btn-danger"
              disabled={blockMu.isPending}
            >
              Block
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

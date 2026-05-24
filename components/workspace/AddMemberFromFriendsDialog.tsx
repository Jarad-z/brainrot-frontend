"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { queryKeys } from "@/lib/api/keys";
import { listFriends } from "@/lib/api/friends";
import { listWorkspaceMembers } from "@/lib/api/members";
import { createInvitation } from "@/lib/api/invitations";
import { ApiError } from "@/lib/api/client";
import type { UserSummary, WorkspaceRole } from "@/lib/api/types";

interface AddMemberFromFriendsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wsId: string;
}

const ROLES: WorkspaceRole[] = ["owner", "editor", "viewer"];

export function AddMemberFromFriendsDialog({
  open,
  onOpenChange,
  wsId,
}: AddMemberFromFriendsDialogProps) {
  const qc = useQueryClient();
  const [role, setRole] = useState<WorkspaceRole>("editor");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [perRowError, setPerRowError] = useState<Record<string, string>>({});

  const friends = useQuery({
    queryKey: queryKeys.friends.list(),
    queryFn: listFriends,
  });
  const members = useQuery({
    queryKey: queryKeys.workspaces.members(wsId),
    queryFn: () => listWorkspaceMembers(wsId),
  });
  const memberIds = new Set((members.data ?? []).map((mem) => mem.user_id));
  const eligible = (friends.data ?? []).filter((f) => !memberIds.has(f.id));

  const mutation = useMutation({
    mutationFn: async () => {
      const errors: Record<string, string> = {};
      for (const id of selected) {
        try {
          await createInvitation(wsId, id, role);
        } catch (err) {
          errors[id] = errorMessageFor(err);
        }
      }
      return errors;
    },
    onSuccess: (errors) => {
      qc.invalidateQueries({ queryKey: queryKeys.invitations.workspace(wsId) });
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.members(wsId) });
      setPerRowError(errors);
      if (Object.keys(errors).length === 0) {
        setSelected(new Set());
        onOpenChange(false);
      }
    },
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setPerRowError((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelected(new Set());
      setPerRowError({});
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>Add members</DialogTitle>
        {friends.isLoading ? (
          <div className="py-6 text-center text-sm text-ink-2">
            Loading friends…
          </div>
        ) : friends.isError ? (
          <div className="py-6 text-center text-sm text-state-failed">
            Failed to load friends.
          </div>
        ) : eligible.length === 0 ? (
          <div className="py-6 text-center text-sm text-ink-2">
            {friends.data && friends.data.length === 0 ? (
              <>
                You have no friends yet.{" "}
                <Link href="/friends" className="text-ink-0 underline">
                  Add some at /friends
                </Link>
              </>
            ) : (
              "All your friends are already members of this workspace."
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selected.size === 0 || mutation.isPending) return;
              mutation.mutate();
            }}
            className="flex flex-col gap-4 mt-3"
          >
            <ul className="flex flex-col gap-1 max-h-72 overflow-y-auto">
              {eligible.map((f) => (
                <FriendRow
                  key={f.id}
                  friend={f}
                  checked={selected.has(f.id)}
                  onToggle={() => toggle(f.id)}
                  error={perRowError[f.id]}
                />
              ))}
            </ul>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-xs font-semibold text-ink-1">Role:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as WorkspaceRole)}
                className="px-2 py-1 border-[1.5px] border-hairline rounded-sm text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                disabled={mutation.isPending}
                className="px-3 py-1.5 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selected.size === 0 || mutation.isPending}
                className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
              >
                {mutation.isPending ? "Inviting…" : `Invite ${selected.size}`}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface FriendRowProps {
  friend: UserSummary;
  checked: boolean;
  onToggle: () => void;
  error?: string;
}

function FriendRow({ friend, checked, onToggle, error }: FriendRowProps) {
  const initials = friend.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <li>
      <label className="flex items-center gap-3 px-2 py-2 rounded hover:bg-paper-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-4 w-4"
        />
        <div className="h-7 w-7 rounded-full bg-hairline flex items-center justify-center text-xs font-medium overflow-hidden">
          {friend.avatar_url ? (
            <img
              src={friend.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials || "?"}</span>
          )}
        </div>
        <div className="flex flex-col leading-tight flex-1 min-w-0">
          <span className="text-sm font-medium truncate">{friend.name}</span>
          <span className="text-xs text-ink-2 truncate">{friend.email}</span>
        </div>
        {error && (
          <span className="text-xs text-state-failed shrink-0">{error}</span>
        )}
      </label>
    </li>
  );
}

function errorMessageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409) {
      if (err.body.includes("already_member")) return "already a member";
      if (err.body.includes("invitation_exists")) return "already invited";
      if (err.body.includes("invitee_blocked_inviter"))
        return "user declined invites";
      return err.body || "conflict";
    }
    if (err.status === 403) return "not friends anymore";
    if (err.status === 404) return "user not found";
    return err.body || err.message;
  }
  if (err instanceof Error) return err.message;
  return "unknown error";
}

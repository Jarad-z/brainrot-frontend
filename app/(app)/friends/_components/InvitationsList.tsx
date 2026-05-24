"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import { listIncomingInvitations, decideInvitation } from "@/lib/api/invitations";
import { useBadges } from "@/lib/stores/badges";

export function InvitationsList() {
  const qc = useQueryClient();
  const invs = useQuery({
    queryKey: queryKeys.invitations.incoming(),
    queryFn: listIncomingInvitations,
  });

  const decideMu = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "decline" }) =>
      decideInvitation(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.invitations.incoming() });
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
      useBadges.getState().decWorkspaceInvitations();
    },
  });

  if (invs.isLoading) return <div className="py-6 text-sm text-ink-2">Loading…</div>;
  if ((invs.data ?? []).length === 0) {
    return <div className="py-6 text-sm text-ink-2">No workspace invitations.</div>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {invs.data!.map((inv) => (
        <li
          key={inv.id}
          className="flex items-center justify-between gap-3 rounded border border-line px-3 py-3"
        >
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium">{inv.workspace_name}</span>
            <span className="text-xs text-ink-2">
              Invited by {inv.inviter_name} as {inv.role}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => decideMu.mutate({ id: inv.id, action: "accept" })}
              className="rounded bg-ink-0 px-2 py-1 text-xs text-paper-0"
              disabled={decideMu.isPending}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => decideMu.mutate({ id: inv.id, action: "decline" })}
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

"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listFriendRequests } from "@/lib/api/friends";
import { listIncomingInvitations } from "@/lib/api/invitations";
import { listConversations } from "@/lib/api/conversations";
import { useBadges } from "@/lib/stores/badges";
import { queryKeys } from "@/lib/api/keys";

/**
 * Seeds the badges zustand store with initial counts on app boot.
 *
 * Mount inside the `(app)` route group only — all three fetches require an
 * authenticated session. WS handlers in `lib/ws/handlers.ts` keep the store in
 * sync afterwards; this component only handles the initial state.
 *
 * React Query caches these results, so re-mounts (e.g. on route change inside
 * `(app)`) won't refetch unless data goes stale.
 */
export function BadgeSeeder(): null {
  const reqs = useQuery({
    queryKey: queryKeys.friends.requests(),
    queryFn: listFriendRequests,
  });
  const invs = useQuery({
    queryKey: queryKeys.invitations.incoming(),
    queryFn: listIncomingInvitations,
  });
  const convs = useQuery({
    queryKey: queryKeys.conversations.list(),
    queryFn: listConversations,
  });

  useEffect(() => {
    if (reqs.data && invs.data && convs.data) {
      const dm: Record<string, number> = {};
      for (const c of convs.data) {
        if (c.unread_count > 0) dm[c.id] = c.unread_count;
      }
      useBadges.getState().seed({
        friendRequests: reqs.data.length,
        workspaceInvitations: invs.data.length,
        dm,
      });
    }
  }, [reqs.data, invs.data, convs.data]);

  return null;
}

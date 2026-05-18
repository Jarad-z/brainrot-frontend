"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteByEmail } from "@/lib/api/members";
import { queryKeys } from "@/lib/api/keys";
import type { InviteInput } from "@/lib/api/types";

export function useInviteByEmail(wsId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, InviteInput>({
    mutationFn: (input) => inviteByEmail(wsId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.members(wsId) });
    },
  });
}

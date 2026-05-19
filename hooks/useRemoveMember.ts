"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeMember } from "@/lib/api/members";
import { queryKeys } from "@/lib/api/keys";

export function useRemoveMember(wsId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (userId) => removeMember(wsId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.members(wsId) });
    },
  });
}

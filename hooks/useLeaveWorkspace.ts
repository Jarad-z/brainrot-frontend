"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveWorkspace } from "@/lib/api/members";
import { queryKeys } from "@/lib/api/keys";

export function useLeaveWorkspace(wsId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => leaveWorkspace(wsId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.detail(wsId) });
    },
  });
}

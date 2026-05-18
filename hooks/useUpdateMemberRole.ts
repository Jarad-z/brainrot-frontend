"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMemberRole } from "@/lib/api/members";
import { queryKeys } from "@/lib/api/keys";
import type { WorkspaceMember, WorkspaceRole } from "@/lib/api/types";

interface Variables {
  userId: string;
  role: WorkspaceRole;
}

export function useUpdateMemberRole(wsId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, Variables, { prev: WorkspaceMember[] | undefined }>({
    mutationFn: ({ userId, role }) => updateMemberRole(wsId, userId, role),
    onMutate: async ({ userId, role }) => {
      const key = queryKeys.workspaces.members(wsId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WorkspaceMember[]>(key);
      if (prev) {
        qc.setQueryData<WorkspaceMember[]>(
          key,
          prev.map((m) => (m.user_id === userId ? { ...m, role } : m)),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(queryKeys.workspaces.members(wsId), ctx.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.members(wsId) });
    },
  });
}

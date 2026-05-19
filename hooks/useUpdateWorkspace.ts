"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWorkspace } from "@/lib/api/members";
import { queryKeys } from "@/lib/api/keys";
import type { UpdateWorkspaceInput, Workspace } from "@/lib/api/types";

export function useUpdateWorkspace(wsId: string) {
  const qc = useQueryClient();
  return useMutation<Workspace, Error, UpdateWorkspaceInput>({
    mutationFn: (input) => updateWorkspace(wsId, input),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.workspaces.detail(wsId), updated);
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
    },
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkspace } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/api/keys";
import type { CreateWorkspaceInput, Workspace } from "@/lib/api/types";

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation<Workspace, Error, CreateWorkspaceInput>({
    mutationFn: createWorkspace,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
    },
  });
}

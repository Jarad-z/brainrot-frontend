"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";
import type { CreateProjectInput, Project } from "@/lib/api/types";

export function useCreateProject(wsId: string) {
  const qc = useQueryClient();
  return useMutation<Project, Error, CreateProjectInput>({
    mutationFn: (input) => projectsApi.create(wsId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.projects(wsId) });
    },
  });
}

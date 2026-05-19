"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setArtifactExcluded } from "@/lib/api/artifacts";
import { queryKeys } from "@/lib/api/keys";

interface Vars {
  artifactId: string;
  excluded: boolean;
}

export function useSetArtifactExcluded(taskId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, Vars>({
    mutationFn: ({ artifactId, excluded }) =>
      setArtifactExcluded(artifactId, excluded),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.artifacts(taskId) });
    },
  });
}

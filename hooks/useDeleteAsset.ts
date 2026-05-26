"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAsset } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";

export function useDeleteAsset(projectId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (assetId) => deleteAsset(projectId, assetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.assets(projectId) });
    },
  });
}

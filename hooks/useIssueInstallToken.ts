"use client";

import { useMutation } from "@tanstack/react-query";
import { issueInstallToken } from "@/lib/api/runtimes";
import type { InstallToken } from "@/lib/api/types";

export function useIssueInstallToken(wsId: string) {
  return useMutation<InstallToken, Error, void>({
    mutationFn: () => issueInstallToken(wsId),
    // Intentionally NO onSuccess that caches; the secret should not enter React Query state.
  });
}

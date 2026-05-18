"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPendingApprovalsCount } from "@/lib/api/me";
import { queryKeys } from "@/lib/api/keys";

export function useGlobalPendingApprovalsCount() {
  return useQuery({
    queryKey: queryKeys.me.pendingApprovalsCount(),
    queryFn: fetchPendingApprovalsCount,
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

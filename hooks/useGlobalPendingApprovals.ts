"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPendingApprovals } from "@/lib/api/me";
import { queryKeys } from "@/lib/api/keys";

export function useGlobalPendingApprovals() {
  return useQuery({
    queryKey: queryKeys.me.pendingApprovals(),
    queryFn: fetchPendingApprovals,
    staleTime: 0,
  });
}

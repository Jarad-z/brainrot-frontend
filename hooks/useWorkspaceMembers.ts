"use client";

import { useQuery } from "@tanstack/react-query";
import { listWorkspaceMembers } from "@/lib/api/members";
import { queryKeys } from "@/lib/api/keys";

export function useWorkspaceMembers(wsId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.members(wsId),
    queryFn: () => listWorkspaceMembers(wsId),
    enabled: !!wsId,
  });
}

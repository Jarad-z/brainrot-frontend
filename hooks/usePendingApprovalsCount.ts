"use client";
import { useWorkspacePendingApprovals } from "./useWorkspacePendingApprovals";

export function usePendingApprovalsCount(wsId: string): number {
  return useWorkspacePendingApprovals(wsId).length;
}

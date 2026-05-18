import { apiFetch } from "./client";
import type { PendingApproval } from "./types";

interface CountResponse {
  count: number;
}

export async function fetchPendingApprovalsCount(): Promise<number> {
  const r = await apiFetch<CountResponse>("/api/v1/me/pending-approvals?count_only=1");
  return r.count;
}

export async function fetchPendingApprovals(): Promise<PendingApproval[]> {
  return apiFetch<PendingApproval[]>("/api/v1/me/pending-approvals");
}

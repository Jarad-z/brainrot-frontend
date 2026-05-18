import { apiFetch } from "./client";
import type { PendingApproval } from "./types";

interface CountResponse {
  count: number;
}

interface ListResponse {
  count: number;
  items: PendingApproval[];
}

export async function fetchPendingApprovalsCount(): Promise<number> {
  const r = await apiFetch<CountResponse>("/api/v1/me/pending-approvals?count_only=1");
  return r.count;
}

export async function fetchPendingApprovals(): Promise<PendingApproval[]> {
  const r = await apiFetch<ListResponse>("/api/v1/me/pending-approvals");
  return r.items;
}

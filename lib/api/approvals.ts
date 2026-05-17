import { apiFetch, ApiError } from "./client";
import type { ApprovalDecision, ApprovalRequest } from "./types";

export interface DecideInput {
  decision: ApprovalDecision;
  note?: string;
}

export async function decideApproval(
  approvalId: string,
  input: DecideInput,
): Promise<ApprovalRequest> {
  return apiFetch<ApprovalRequest>(`/api/v1/approvals/${approvalId}/decide`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Fetch approvals for a task. Returns null on 404 so callers can fall back to
 * a derive-from-messages path while BACKEND_GAPS #11 is still open.
 */
export async function fetchTaskApprovals(
  taskId: string,
): Promise<ApprovalRequest[] | null> {
  try {
    return await apiFetch<ApprovalRequest[]>(`/api/v1/tasks/${taskId}/approvals`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

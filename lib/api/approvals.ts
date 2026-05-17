import { apiFetch } from "./client";
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

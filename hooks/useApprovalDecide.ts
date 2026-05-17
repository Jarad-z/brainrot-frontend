"use client";
import { useMutation } from "@tanstack/react-query";
import { decideApproval, type DecideInput } from "@/lib/api/approvals";
import { useChatUIStore } from "@/lib/store/chat-ui";

export function useApprovalDecide() {
  const recordDecision = useChatUIStore((s) => s.recordDecision);
  const clearDecision = useChatUIStore((s) => s.clearDecision);
  return useMutation({
    mutationFn: ({ approvalId, input }: { approvalId: string; input: DecideInput }) =>
      decideApproval(approvalId, input),
    onMutate: ({ approvalId, input }) => {
      recordDecision(approvalId, { decision: input.decision, note: input.note, at: Date.now() });
      return { approvalId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.approvalId) clearDecision(ctx.approvalId);
    },
  });
}

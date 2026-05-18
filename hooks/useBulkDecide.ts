"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { decideApproval } from "@/lib/api/approvals";
import { queryKeys } from "@/lib/api/keys";
import type { ApprovalDecision } from "@/lib/api/types";

export interface BulkProgress {
  done: number;
  total: number;
}

export interface BulkResult {
  ok: string[];
  fail: { id: string; error: string }[];
}

export function useBulkDecide() {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<BulkProgress | null>(null);

  const run = useCallback(
    async (ids: string[], decision: ApprovalDecision): Promise<BulkResult> => {
      const total = ids.length;
      setProgress({ done: 0, total });
      const ok: string[] = [];
      const fail: { id: string; error: string }[] = [];
      await Promise.all(
        ids.map(async (id) => {
          try {
            await decideApproval(id, { decision });
            ok.push(id);
          } catch (e) {
            fail.push({ id, error: (e as Error).message });
          } finally {
            setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
          }
        }),
      );
      qc.invalidateQueries({ queryKey: queryKeys.me.pendingApprovals() });
      qc.invalidateQueries({ queryKey: queryKeys.me.pendingApprovalsCount() });
      setProgress(null);
      return { ok, fail };
    },
    [qc],
  );

  return { run, progress };
}
